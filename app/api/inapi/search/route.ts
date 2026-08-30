import { NextResponse } from "next/server"
import { searchInapi, type InapiMatchMode, type InapiSearchType } from "@/lib/inapi/client"
import { searchInapiLocal, shouldVerifyInapiLive } from "@/lib/inapi/local-search"
import { PRIVATE_NO_STORE_HEADERS, requireUser } from "@/lib/auth/server"
import { FREE_MONTHLY_RESEARCH_LIMIT, getFreeResearchQuota, isFreeAccessUser } from "@/lib/free-research-quota"
import type { Marca } from "@/types/marca"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_TYPES = new Set<InapiSearchType>(["nombre", "solicitante", "clase", "clase_niza", "solicitud", "registro"])
const ALLOWED_MATCH_MODES = new Set<InapiMatchMode>(["1", "2", "3", "4"])
const MAX_QUERY_LENGTH = 120
const MAX_RESULTS = 250
const FREE_PREVIEW_RESULT_LIMIT = 5

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const freeAccess = isFreeAccessUser(auth.user)
  if (freeAccess) {
    const quota = await getFreeResearchQuota(auth.user.id)
    if (!quota.ok) {
      return NextResponse.json(
        { error: "No pudimos verificar tu cupo gratuito. Intenta nuevamente en unos minutos.", code: "FREE_QUOTA_UNAVAILABLE" },
        { status: 503, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Ya usaste tus ${FREE_MONTHLY_RESEARCH_LIMIT} vistas preliminares de este mes.`,
          code: "FREE_MONTHLY_LIMIT",
          limit: FREE_MONTHLY_RESEARCH_LIMIT,
          resetAt: quota.resetsAt,
        },
        { status: 429, headers: PRIVATE_NO_STORE_HEADERS },
      )
    }
  }

  const startedAt = Date.now()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const rawType = (searchParams.get("type") ?? "nombre") as InapiSearchType
  const rawMatchMode = (searchParams.get("match") ?? "2") as InapiMatchMode

  const validationError = validateSearch(query, rawType, rawMatchMode)
  if (validationError) return validationError

  if (freeAccess && rawType !== "nombre") {
    return NextResponse.json(
      { error: "La cuenta gratuita incluye únicamente vista preliminar por nombre de marca.", code: "FREE_PREVIEW_ONLY" },
      { status: 403, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  if (rawType === "nombre") {
    try {
      const niza = searchParams.getAll("niza").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean)
      const local = await searchInapiLocal(query, niza, Math.min(MAX_RESULTS, 50))
      const verifyLive = shouldVerifyInapiLive(local)
      let liveResults: Marca[] | null = null
      let liveError: string | null = null

      if (verifyLive) {
        try {
          liveResults = (await searchInapi({ query, type: rawType, matchMode: rawMatchMode })).map(normalizeInapiStatus)
        } catch (error) {
          liveError = classifyError(error)
        }
      }

      const durationMs = Date.now() - startedAt
      const source = liveResults ? "inapi-local+live" : "inapi-local"
      const results = liveResults ?? local.hits.map(localHitToMarca)

      await recordSearch({
        supabase: auth.supabase,
        userId: auth.user.id,
        query,
        type: rawType,
        matchMode: rawMatchMode,
        resultsCount: results.length,
        durationMs,
        status: "success",
        metadata: {
          source,
          local_count: local.hits.length,
          live_verified: Boolean(liveResults),
          live_error: liveError,
          freshness: local.freshness,
          access_tier: freeAccess ? "free-preview" : "full",
        },
      })

      if (freeAccess) {
        return NextResponse.json({
          results: results.slice(0, FREE_PREVIEW_RESULT_LIMIT).map(toFreePreviewHit),
          total: results.length,
          returned: Math.min(results.length, FREE_PREVIEW_RESULT_LIMIT),
          hiddenResults: Math.max(results.length - FREE_PREVIEW_RESULT_LIMIT, 0),
          preview: true,
          accessTier: "free",
          source: "INAPI",
          query,
          type: rawType,
          durationMs,
          generatedAt: new Date().toISOString(),
        }, { headers: PRIVATE_NO_STORE_HEADERS })
      }

      return NextResponse.json({
        results: results.slice(0, MAX_RESULTS),
        total: results.length,
        returned: Math.min(results.length, MAX_RESULTS),
        truncated: results.length > MAX_RESULTS,
        source,
        liveVerified: Boolean(liveResults),
        liveVerificationError: liveError,
        freshness: local.freshness,
        query,
        type: rawType,
        matchMode: rawMatchMode,
        durationMs,
        generatedAt: new Date().toISOString(),
      }, { headers: PRIVATE_NO_STORE_HEADERS })
    } catch (localError) {
      console.error("[inapi/search] local layer failed, falling back live", localError)
    }
  }

  try {
    const allResults = (await searchInapi({ query, type: rawType, matchMode: rawMatchMode })).map(normalizeInapiStatus)
    const results = allResults.slice(0, MAX_RESULTS)
    const durationMs = Date.now() - startedAt

    await recordSearch({ supabase: auth.supabase, userId: auth.user.id, query, type: rawType, matchMode: rawMatchMode,
      resultsCount: allResults.length, durationMs, status: "success", metadata: { source: "inapi-live", truncated: allResults.length > MAX_RESULTS, access_tier: freeAccess ? "free-preview" : "full" } })

    if (freeAccess) {
      return NextResponse.json({
        results: allResults.slice(0, FREE_PREVIEW_RESULT_LIMIT).map(toFreePreviewHit),
        total: allResults.length,
        returned: Math.min(allResults.length, FREE_PREVIEW_RESULT_LIMIT),
        hiddenResults: Math.max(allResults.length - FREE_PREVIEW_RESULT_LIMIT, 0),
        preview: true,
        accessTier: "free",
        source: "INAPI",
        query,
        type: rawType,
        durationMs,
        generatedAt: new Date().toISOString(),
      }, { headers: PRIVATE_NO_STORE_HEADERS })
    }

    return NextResponse.json({ results, total: allResults.length, returned: results.length, truncated: allResults.length > MAX_RESULTS,
      source: "inapi-live", query, type: rawType, matchMode: rawMatchMode, durationMs, generatedAt: new Date().toISOString() },
      { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const errorCode = classifyError(error)
    await recordSearch({ supabase: auth.supabase, userId: auth.user.id, query, type: rawType, matchMode: rawMatchMode,
      resultsCount: 0, durationMs, status: "failed", errorCode, metadata: { access_tier: freeAccess ? "free-preview" : "full" } })
    return NextResponse.json({ error: "INAPI no respondió correctamente. Intenta nuevamente más tarde.", code: errorCode, source: "inapi-live" },
      { status: 502, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

function toFreePreviewHit(marca: Marca) {
  return {
    id: marca.id,
    nombre: marca.nombre,
    estado: marca.estado,
    niza: marca.niza,
  }
}

function localHitToMarca(hit: Awaited<ReturnType<typeof searchInapiLocal>>["hits"][number]): Marca {
  return {
    id: hit.sourceRecordId ?? hit.id,
    nombre: hit.nombre,
    solicitante: hit.solicitante ?? "",
    numeroRegistro: hit.numeroRegistro ?? "",
    estado: normalizeCanonicalStatus(hit.estado),
    fecha: hit.fechaPresentacion ?? hit.fechaRegistro ?? "",
    niza: hit.niza,
    viena: [],
    pais: "CL",
    metadata: {
      numSolicitud: hit.numeroSolicitud,
      source: "inapi-local",
      sourceUrl: hit.sourceUrl,
      lastSyncedAt: hit.lastSyncedAt,
      nameSimilarity: hit.nameSimilarity,
      classOverlap: hit.classOverlap,
      relevanceScore: hit.relevanceScore,
    },
  }
}

function normalizeCanonicalStatus(value: string | null): Marca["estado"] {
  const normalized = normalizeStatusText(value ?? "")
  if (["REGISTRADA", "CONCEDIDA"].includes(normalized)) return "Registrada"
  if (["EN TRAMITE", "PENDIENTE", "SOLICITADA"].includes(normalized)) return "Pendiente"
  if (["DENEGADA", "RECHAZADA"].includes(normalized)) return "Denegada"
  return "No Vigente" as Marca["estado"]
}

function validateSearch(query: string, type: InapiSearchType, matchMode: InapiMatchMode) {
  if (!query) return NextResponse.json({ error: "Debes ingresar un término de búsqueda.", code: "MISSING_QUERY" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  if (query.length > MAX_QUERY_LENGTH) return NextResponse.json({ error: `La consulta no puede superar ${MAX_QUERY_LENGTH} caracteres.`, code: "QUERY_TOO_LONG" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  if (!ALLOWED_TYPES.has(type)) return NextResponse.json({ error: "Tipo de consulta INAPI inválido.", code: "INVALID_TYPE" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  if (!ALLOWED_MATCH_MODES.has(matchMode)) return NextResponse.json({ error: "Modo de coincidencia inválido.", code: "INVALID_MATCH_MODE" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  if ((type === "solicitud" || type === "registro" || type === "clase" || type === "clase_niza") && !/^\d+$/.test(query))
    return NextResponse.json({ error: "Este tipo de consulta acepta únicamente números.", code: "NUMERIC_QUERY_REQUIRED" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  return null
}

async function recordSearch({ supabase, userId, query, type, matchMode, resultsCount, durationMs, status, errorCode, metadata }: {
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>
  userId: string; query: string; type: InapiSearchType; matchMode: InapiMatchMode; resultsCount: number; durationMs: number
  status: "success" | "failed"; errorCode?: string; metadata: Record<string, unknown>
}) {
  const { error } = await supabase.from("search_history").insert({ user_id: userId, query, search_type: type, results_count: resultsCount,
    source: String(metadata.source ?? "inapi-live"), match_mode: matchMode, status, duration_ms: durationMs, error_code: errorCode ?? null,
    cached: String(metadata.source ?? "").startsWith("inapi-local"), metadata })
  if (error) console.error("[inapi/search] history insert error", error.message)
}

function classifyError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  if (message.includes("429") || message.includes("rate")) return "INAPI_RATE_LIMITED"
  if (message.includes("captcha") || message.includes("403")) return "INAPI_BLOCKED"
  if (message.includes("timeout") || message.includes("timed out")) return "INAPI_TIMEOUT"
  return "INAPI_UNAVAILABLE"
}

function normalizeInapiStatus(marca: Marca): Marca {
  return { ...marca, estado: normalizeCanonicalStatus(String(marca.metadata?.estadoOriginal ?? marca.estado ?? "")) }
}

function normalizeStatusText(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}
