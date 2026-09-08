import OpenAI from "openai"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { modelForTier } from "@/lib/ai/model-router"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const JUAN_EMAIL = "juan@n3uralia.com"
const STALE_AFTER_MS = 20 * 60 * 60 * 1000

type Source = { title: string; url: string }
type ProjectRow = {
  id: string
  product_key: string
  product_name: string
  title: string
  outcome: string
  status: string
  evidence_snapshot: Record<string, unknown> | null
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY missing" }, { status: 503 })
  }

  const admin = createAdminClient()
  const { data: users, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError) return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 })
  const juan = users.users.find((user) => user.email?.trim().toLowerCase() === JUAN_EMAIL)
  if (!juan) return NextResponse.json({ ok: false, error: "Target user not found" }, { status: 404 })

  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("id,product_key,product_name,title,outcome,status,evidence_snapshot")
    .eq("user_id", juan.id)
    .neq("status", "rejected")
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const rows = (data ?? []) as ProjectRow[]
  const target = rows
    .map((row) => ({ row, generatedAt: radarGeneratedAt(row.evidence_snapshot) }))
    .filter(({ generatedAt }) => !generatedAt || Date.now() - generatedAt > STALE_AFTER_MS)
    .sort((a, b) => (a.generatedAt ?? 0) - (b.generatedAt ?? 0))[0]?.row

  if (!target) return NextResponse.json({ ok: true, refreshed: false, reason: "all_project_radars_fresh" })

  const snapshot = { ...(target.evidence_snapshot ?? {}) }
  const previousRadar = isRecord(snapshot.rnd_radar) ? snapshot.rnd_radar : null
  const repoActivity = isRecord(snapshot.repo_activity) ? snapshot.repo_activity : {}
  const subsectionResearch = isRecord(snapshot.subsection_research) ? snapshot.subsection_research : {}
  const context = {
    key: target.product_key,
    name: target.product_name,
    direction: target.title,
    intendedOutcome: target.outcome,
    humanStatus: target.status,
    repo: stringOrNull(repoActivity.repoFullName) ?? stringOrNull(snapshot.repo),
    activeResearchTopics: Array.isArray(subsectionResearch.topics)
      ? subsectionResearch.topics.filter((item): item is string => typeof item === "string").slice(0, 12)
      : [],
  }
  const query = `Latest AI, agentic systems, multimodal, retrieval, MCP, automation, evaluation and domain-specific technical documentation applicable to ${target.product_name}: ${target.title}`

  const model = process.env.OPENAI_ASSISTANT_MODEL || modelForTier("terra")
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search" }],
    input: [
      "Actúa como radar senior de I+D aplicado para N3uralia.",
      "Busca únicamente novedades técnicas que puedan aplicarse de forma concreta a este proyecto. Prioriza documentación oficial, repositorios oficiales, arXiv/papers, especificaciones y benchmarks reproducibles.",
      "Devuelve máximo 5 hallazgos. Para cada hallazgo explica: fuente observada, mecanismo técnico, aplicación concreta al proyecto, beneficio esperado y experimento/validación requerida.",
      "No uses actividad GitHub interna ni capacidad N3uralia como evidencia externa. El contexto interno sólo sirve para evaluar aplicabilidad.",
      "No cambies score, conviction, confidence, estado humano ni lifecycle. Esta capa es una proyección neutral de I+D con conviction_delta=0.",
      `Contexto interno: ${JSON.stringify(context)}`,
      `Consulta: ${query}`,
    ].join("\n\n"),
  })

  const generatedAt = new Date().toISOString()
  const currentText = response.output_text?.trim() || "Sin hallazgos utilizables en esta pasada."
  const currentSources = extractSources(response.output)
  const previousText = previousRadar ? stringOrNull(previousRadar.text) : null
  const previousGeneratedAt = previousRadar ? stringOrNull(previousRadar.generated_at) : null
  const previousSources = previousRadar ? normalizeSources(previousRadar.sources) : []
  const sourceDelta = compareSources(previousSources, currentSources)
  const deltaSummary = previousText && previousGeneratedAt
    ? await summarizeDelta(client, model, target.product_name, previousText, currentText, sourceDelta)
    : null

  const rndRadar = {
    generated_at: generatedAt,
    query,
    text: currentText,
    sources: currentSources,
    conviction_delta: 0,
    decision_boundary: "Radar de I+D derivado. No modifica evidencia de mercado, score, conviction, lifecycle ni decisiones humanas.",
    model: response.model,
    delta: previousText && previousGeneratedAt ? {
      previous_generated_at: previousGeneratedAt,
      summary: deltaSummary,
      new_sources: sourceDelta.newSources,
      removed_sources: sourceDelta.removedSources,
      retained_source_count: sourceDelta.retainedCount,
      source_set_changed: sourceDelta.newSources.length > 0 || sourceDelta.removedSources.length > 0,
      conviction_delta: 0,
      decision_boundary: "Comparación derivada entre dos lecturas de I+D. No modifica score, conviction ni decisiones humanas.",
    } : null,
  }

  const { error: updateError } = await admin
    .from("intelligence_product_evolution_recommendations")
    .update({ evidence_snapshot: { ...snapshot, rnd_radar: rndRadar } })
    .eq("id", target.id)
  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    refreshed: true,
    productKey: target.product_key,
    generatedAt,
    sources: rndRadar.sources.length,
    newSources: sourceDelta.newSources.length,
    hasPriorPass: Boolean(previousText && previousGeneratedAt),
    convictionDelta: 0,
  })
}

async function summarizeDelta(
  client: OpenAI,
  model: string,
  productName: string,
  previousText: string,
  currentText: string,
  sourceDelta: { newSources: Source[]; removedSources: Source[]; retainedCount: number },
) {
  const response = await client.responses.create({
    model,
    input: [
      `Compara dos lecturas sucesivas del Radar I+D de ${productName}.`,
      "No investigues nada adicional y no inventes cambios. Usa sólo los dos textos y el delta de fuentes entregado.",
      "Resume en máximo 3 viñetas únicamente cambios técnicos materiales para implementación. Si no hay cambios materiales, responde exactamente: Sin cambios materiales detectados.",
      "No conviertas novedades técnicas en evidencia de mercado ni cambies conviction, score o decisiones humanas.",
      `Fuentes nuevas: ${JSON.stringify(sourceDelta.newSources)}`,
      `Fuentes que ya no aparecen: ${JSON.stringify(sourceDelta.removedSources)}`,
      `Lectura anterior:\n${previousText.slice(0, 18000)}`,
      `Lectura actual:\n${currentText.slice(0, 18000)}`,
    ].join("\n\n"),
  })
  return response.output_text?.trim() || "Sin cambios materiales detectados."
}

function radarGeneratedAt(snapshot: Record<string, unknown> | null) {
  if (!isRecord(snapshot) || !isRecord(snapshot.rnd_radar)) return null
  const raw = stringOrNull(snapshot.rnd_radar.generated_at)
  if (!raw) return null
  const timestamp = Date.parse(raw)
  return Number.isFinite(timestamp) ? timestamp : null
}

function compareSources(previousSources: Source[], currentSources: Source[]) {
  const previousByUrl = new Map(previousSources.map((source) => [canonicalUrl(source.url), source]))
  const currentByUrl = new Map(currentSources.map((source) => [canonicalUrl(source.url), source]))
  const newSources = currentSources.filter((source) => !previousByUrl.has(canonicalUrl(source.url)))
  const removedSources = previousSources.filter((source) => !currentByUrl.has(canonicalUrl(source.url)))
  const retainedCount = currentSources.filter((source) => previousByUrl.has(canonicalUrl(source.url))).length
  return { newSources, removedSources, retainedCount }
}

function normalizeSources(value: unknown): Source[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((source) => {
    if (!isRecord(source)) return []
    const title = stringOrNull(source.title)
    const url = stringOrNull(source.url)
    return title && url ? [{ title, url }] : []
  }).slice(0, 12)
}

function canonicalUrl(raw: string) {
  try {
    const url = new URL(raw)
    for (const key of Array.from(url.searchParams.keys())) {
      if (key.startsWith("utm_") || key === "ref" || key === "source") url.searchParams.delete(key)
    }
    url.hash = ""
    return url.toString().replace(/\/$/, "")
  } catch {
    return raw.trim()
  }
}

function extractSources(output: unknown): Source[] {
  if (!Array.isArray(output)) return []
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const item of output) {
    if (!isRecord(item) || item.type !== "message" || !Array.isArray(item.content)) continue
    for (const content of item.content) {
      if (!isRecord(content) || content.type !== "output_text" || !Array.isArray(content.annotations)) continue
      for (const annotation of content.annotations) {
        if (!isRecord(annotation) || annotation.type !== "url_citation") continue
        const url = stringOrNull(annotation.url)
        if (!url) continue
        const key = canonicalUrl(url)
        if (seen.has(key)) continue
        seen.add(key)
        sources.push({ title: stringOrNull(annotation.title) ?? safeHostname(url), url })
      }
    }
  }
  return sources.slice(0, 12)
}

function safeHostname(url: string) {
  try { return new URL(url).hostname } catch { return "Fuente" }
}
function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
