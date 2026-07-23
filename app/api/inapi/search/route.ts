import { NextResponse } from "next/server"
import { searchInapi, type InapiMatchMode, type InapiSearchType } from "@/lib/inapi/client"
import { PRIVATE_NO_STORE_HEADERS, requireUser } from "@/lib/auth/server"
import type { Marca } from "@/types/marca"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_TYPES = new Set<InapiSearchType>(["nombre", "solicitante", "clase", "clase_niza", "solicitud", "registro"])
const ALLOWED_MATCH_MODES = new Set<InapiMatchMode>(["1", "2", "3", "4"])
const MAX_QUERY_LENGTH = 120
const MAX_RESULTS = 250

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const startedAt = Date.now()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const rawType = (searchParams.get("type") ?? "nombre") as InapiSearchType
  const rawMatchMode = (searchParams.get("match") ?? "2") as InapiMatchMode

  const validationError = validateSearch(query, rawType, rawMatchMode)
  if (validationError) return validationError

  try {
    const allResults = (await searchInapi({ query, type: rawType, matchMode: rawMatchMode })).map(normalizeInapiStatus)
    const results = allResults.slice(0, MAX_RESULTS)
    const durationMs = Date.now() - startedAt

    await recordSearch({
      supabase: auth.supabase,
      userId: auth.user.id,
      query,
      type: rawType,
      matchMode: rawMatchMode,
      resultsCount: allResults.length,
      durationMs,
      status: "success",
      metadata: { truncated: allResults.length > MAX_RESULTS, returned_count: results.length },
    })

    return NextResponse.json(
      {
        results,
        total: allResults.length,
        returned: results.length,
        truncated: allResults.length > MAX_RESULTS,
        source: "inapi-live",
        cached: false,
        query,
        type: rawType,
        matchMode: rawMatchMode,
        durationMs,
        generatedAt: new Date().toISOString(),
      },
      { headers: PRIVATE_NO_STORE_HEADERS },
    )
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const errorCode = classifyError(error)

    await recordSearch({
      supabase: auth.supabase,
      userId: auth.user.id,
      query,
      type: rawType,
      matchMode: rawMatchMode,
      resultsCount: 0,
      durationMs,
      status: "failed",
      errorCode,
      metadata: {},
    })

    console.error("[inapi/search] error", {
      userId: auth.user.id,
      type: rawType,
      matchMode: rawMatchMode,
      errorCode,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        error: "INAPI no respondió correctamente. Intenta nuevamente más tarde.",
        code: errorCode,
        source: "inapi-live",
      },
      { status: 502, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }
}

function validateSearch(query: string, type: InapiSearchType, matchMode: InapiMatchMode) {
  if (!query) {
    return NextResponse.json({ error: "Debes ingresar un término de búsqueda.", code: "MISSING_QUERY" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `La consulta no puede superar ${MAX_QUERY_LENGTH} caracteres.`, code: "QUERY_TOO_LONG" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: "Tipo de consulta INAPI inválido.", code: "INVALID_TYPE" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!ALLOWED_MATCH_MODES.has(matchMode)) {
    return NextResponse.json({ error: "Modo de coincidencia inválido.", code: "INVALID_MATCH_MODE" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if ((type === "solicitud" || type === "registro" || type === "clase" || type === "clase_niza") && !/^\d+$/.test(query)) {
    return NextResponse.json({ error: "Este tipo de consulta acepta únicamente números.", code: "NUMERIC_QUERY_REQUIRED" }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  return null
}

async function recordSearch({
  supabase,
  userId,
  query,
  type,
  matchMode,
  resultsCount,
  durationMs,
  status,
  errorCode,
  metadata,
}: {
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>
  userId: string
  query: string
  type: InapiSearchType
  matchMode: InapiMatchMode
  resultsCount: number
  durationMs: number
  status: "success" | "failed"
  errorCode?: string
  metadata: Record<string, unknown>
}) {
  const { error } = await supabase.from("search_history").insert({
    user_id: userId,
    query,
    search_type: type,
    results_count: resultsCount,
    source: "inapi-live",
    match_mode: matchMode,
    status,
    duration_ms: durationMs,
    error_code: errorCode ?? null,
    cached: false,
    metadata,
  })

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
  const original = normalizeStatusText(String(marca.metadata?.estadoOriginal ?? marca.estado ?? ""))
  if (["REGISTRADA", "CONCEDIDA"].includes(original)) return { ...marca, estado: "Registrada" }
  if (["EN TRAMITE", "PENDIENTE", "SOLICITADA"].includes(original)) return { ...marca, estado: "Pendiente" }
  if (["CADUCADO", "CADUCADA", "CANCELADO", "CANCELADA", "ANULADO", "ANULADA", "ABANDONADO", "ABANDONADA", "EXPIRADO", "EXPIRADA", "NO VIGENTE", "TENIDA POR NO PRESENTADA", "DESISTIDA"].includes(original)) return { ...marca, estado: "No Vigente" as Marca["estado"] }
  if (["DENEGADA", "RECHAZADA"].includes(original)) return { ...marca, estado: "Denegada" }
  return marca
}

function normalizeStatusText(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}
