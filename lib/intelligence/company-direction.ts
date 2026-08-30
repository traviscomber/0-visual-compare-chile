import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { countOpenAlexWorks, searchOpenAlexWorks } from "@/lib/intelligence/openalex"
import { searchCrossrefWorks } from "@/lib/intelligence/crossref"
import { searchGdeltNews } from "@/lib/intelligence/gdelt"

export type CompanyIdentityCandidate = {
  id: string
  resolution_key: string
  identity_key: string
  canonical_name: string
  country: string | null
  resolution_confidence: number
  similarity_score: number
  activity_12m: number
}

export type CompanyIpActivity = {
  id: string
  entity_type: "patent" | "trademark"
  source_record_id: string
  applicant_raw: string
  title: string
  filing_date: string | null
  status: string | null
  classification_codes: string[]
  source_url: string | null
}

export type ClassificationMovement = {
  code: string
  current: number
  previous: number
  delta: number
}

export type CompanyDirectionResult = {
  query: string
  generated_at: string
  selected: CompanyIdentityCandidate | null
  candidates: CompanyIdentityCandidate[]
  aliases: string[]
  window: {
    current_start: string
    current_end: string
    previous_start: string
    previous_end: string
    days: number
  }
  metrics: {
    current_total: number
    previous_total: number
    delta: number
    delta_pct: number | null
    current_patents: number
    previous_patents: number
    current_trademarks: number
    previous_trademarks: number
  }
  new_ipc: ClassificationMovement[]
  new_niza: ClassificationMovement[]
  rising_ipc: ClassificationMovement[]
  rising_niza: ClassificationMovement[]
  direction: {
    headline: string
    observed_fact: string
    interpretation: string
    why_it_matters: string
    confidence: number
    evidence_level: "alta" | "media" | "baja"
    guardrail: string
  } | null
  recent_evidence: CompanyIpActivity[]
  external: {
    openalex_current: number | null
    openalex_previous: number | null
    publications: Array<{ source: string; title: string; date: string | null; url: string }>
    news: Array<{ source: string; title: string; date: string | null; url: string }>
    errors: string[]
  }
}

type CandidateRow = {
  id: string
  resolution_key: string
  identity_key: string
  canonical_name: string
  country: string | null
  resolution_confidence: number | string
  similarity_score: number | string
  activity_12m: number | string
}

type ActivityRow = {
  id: string
  entity_type: string
  source_record_id: string
  applicant_raw: string
  title: string
  filing_date: string | null
  status: string | null
  classification_codes: string[] | null
  source_url: string | null
}

const WINDOW_DAYS = 180

export async function buildCompanyDirection(
  admin: SupabaseClient,
  query: string,
  selectedIdentityId?: string | null,
): Promise<CompanyDirectionResult> {
  const now = new Date()
  const currentStart = addDays(now, -WINDOW_DAYS + 1)
  const previousEnd = addDays(currentStart, -1)
  const previousStart = addDays(currentStart, -WINDOW_DAYS)

  const { data: candidateRows, error: candidateError } = await admin.rpc("search_company_identities", {
    p_query: query,
    p_limit: 8,
  })
  if (candidateError) throw new Error(`No pudimos resolver la empresa: ${candidateError.message}`)

  const candidates = ((candidateRows ?? []) as CandidateRow[]).map(toCandidate)
  let selected = selectedIdentityId ? candidates.find(item => item.id === selectedIdentityId) ?? null : candidates[0] ?? null

  if (selectedIdentityId && !selected) {
    const { data, error } = await admin
      .from("intelligence_company_identities")
      .select("id,resolution_key,identity_key,canonical_name,country,resolution_confidence,metadata")
      .eq("id", selectedIdentityId)
      .maybeSingle()
    if (error) throw new Error(`No pudimos cargar la identidad seleccionada: ${error.message}`)
    if (data) {
      selected = {
        id: String(data.id),
        resolution_key: String(data.resolution_key),
        identity_key: String(data.identity_key),
        canonical_name: String(data.canonical_name),
        country: data.country ? String(data.country) : null,
        resolution_confidence: Number(data.resolution_confidence ?? 0),
        similarity_score: 1,
        activity_12m: Number((data.metadata as Record<string, unknown> | null)?.activity_12m ?? 0),
      }
      if (!candidates.some(item => item.id === selected?.id)) candidates.unshift(selected)
    }
  }

  const base: CompanyDirectionResult = {
    query,
    generated_at: now.toISOString(),
    selected,
    candidates,
    aliases: [],
    window: {
      current_start: dateOnly(currentStart),
      current_end: dateOnly(now),
      previous_start: dateOnly(previousStart),
      previous_end: dateOnly(previousEnd),
      days: WINDOW_DAYS,
    },
    metrics: {
      current_total: 0,
      previous_total: 0,
      delta: 0,
      delta_pct: null,
      current_patents: 0,
      previous_patents: 0,
      current_trademarks: 0,
      previous_trademarks: 0,
    },
    new_ipc: [],
    new_niza: [],
    rising_ipc: [],
    rising_niza: [],
    direction: null,
    recent_evidence: [],
    external: { openalex_current: null, openalex_previous: null, publications: [], news: [], errors: [] },
  }

  if (!selected) return base

  const [activityResult, aliasResult] = await Promise.all([
    admin
      .from("intelligence_company_ip_activity")
      .select("id,entity_type,source_record_id,applicant_raw,title,filing_date,status,classification_codes,source_url")
      .eq("identity_id", selected.id)
      .gte("filing_date", dateOnly(previousStart))
      .order("filing_date", { ascending: false })
      .limit(1500),
    admin
      .from("intelligence_company_aliases")
      .select("raw_name")
      .eq("identity_id", selected.id)
      .order("confidence", { ascending: false })
      .limit(30),
  ])

  if (activityResult.error) throw new Error(`No pudimos comparar el portafolio: ${activityResult.error.message}`)
  if (aliasResult.error) throw new Error(`No pudimos cargar los alias del titular: ${aliasResult.error.message}`)

  const activities = ((activityResult.data ?? []) as ActivityRow[]).map(toActivity)
  const current = activities.filter(item => isOnOrAfter(item.filing_date, currentStart))
  const previous = activities.filter(item => isBetween(item.filing_date, previousStart, previousEnd))

  const currentPatents = current.filter(item => item.entity_type === "patent")
  const previousPatents = previous.filter(item => item.entity_type === "patent")
  const currentTrademarks = current.filter(item => item.entity_type === "trademark")
  const previousTrademarks = previous.filter(item => item.entity_type === "trademark")

  const ipc = classificationMovements(currentPatents, previousPatents)
  const niza = classificationMovements(currentTrademarks, previousTrademarks)
  const delta = current.length - previous.length

  base.aliases = [...new Set((aliasResult.data ?? []).map(row => String(row.raw_name)).filter(Boolean))]
  base.metrics = {
    current_total: current.length,
    previous_total: previous.length,
    delta,
    delta_pct: previous.length ? Math.round((delta / previous.length) * 100) : current.length ? 100 : null,
    current_patents: currentPatents.length,
    previous_patents: previousPatents.length,
    current_trademarks: currentTrademarks.length,
    previous_trademarks: previousTrademarks.length,
  }
  base.new_ipc = ipc.filter(item => item.previous === 0 && item.current > 0).slice(0, 8)
  base.new_niza = niza.filter(item => item.previous === 0 && item.current > 0).slice(0, 8)
  base.rising_ipc = ipc.filter(item => item.delta > 0).slice(0, 8)
  base.rising_niza = niza.filter(item => item.delta > 0).slice(0, 8)
  base.recent_evidence = current.slice(0, 12)
  base.direction = buildDirectionNarrative(selected, base.metrics, base.new_ipc, base.new_niza)

  const externalQuery = selected.canonical_name.replace(/^\([A-Z]{2}\)\s*/, "").trim()
  const externalStart = currentStart
  const newsStart = addDays(now, -90)
  const externalSettled = await Promise.allSettled([
    countOpenAlexWorks(externalQuery, externalStart, now),
    countOpenAlexWorks(externalQuery, previousStart, previousEnd),
    searchOpenAlexWorks(externalQuery, externalStart, now, 4),
    searchCrossrefWorks(externalQuery, externalStart, now, 4),
    searchGdeltNews(externalQuery, newsStart, now, 5),
  ])

  const errors: string[] = []
  const currentOpenAlex = settledValue<number>(externalSettled[0], errors, "OpenAlex actual")
  const previousOpenAlex = settledValue<number>(externalSettled[1], errors, "OpenAlex previo")
  const openAlexWorks = settledValue<Awaited<ReturnType<typeof searchOpenAlexWorks>>>(externalSettled[2], errors, "OpenAlex publicaciones") ?? []
  const crossrefWorks = settledValue<Awaited<ReturnType<typeof searchCrossrefWorks>>>(externalSettled[3], errors, "Crossref") ?? []
  const gdeltNews = settledValue<Awaited<ReturnType<typeof searchGdeltNews>>>(externalSettled[4], errors, "GDELT") ?? []

  base.external = {
    openalex_current: currentOpenAlex,
    openalex_previous: previousOpenAlex,
    publications: dedupeExternal([
      ...openAlexWorks.map(item => ({ source: "OpenAlex", title: item.title, date: item.date, url: item.url })),
      ...crossrefWorks.map(item => ({ source: "Crossref", title: item.title, date: item.date, url: item.url })),
    ]).slice(0, 6),
    news: gdeltNews.map(item => ({ source: "GDELT", title: item.title, date: item.date, url: item.url })).slice(0, 5),
    errors,
  }

  return base
}

function buildDirectionNarrative(
  selected: CompanyIdentityCandidate,
  metrics: CompanyDirectionResult["metrics"],
  newIpc: ClassificationMovement[],
  newNiza: ClassificationMovement[],
) {
  const evidence = metrics.current_total + metrics.previous_total
  if (!evidence) return null

  const tech = newIpc.slice(0, 3).map(item => item.code)
  const commercial = newNiza.slice(0, 3).map(item => item.code)
  const acceleration = metrics.current_total >= metrics.previous_total + 3 && metrics.current_total >= Math.max(4, metrics.previous_total * 1.5)
  const contraction = metrics.previous_total >= metrics.current_total + 3 && metrics.previous_total >= Math.max(4, metrics.current_total * 1.5)

  let headline = `${selected.canonical_name}: actividad de protección estable respecto del semestre anterior`
  let interpretation = "La composición del portafolio observado no muestra, por ahora, un cambio suficientemente grande para hablar de aceleración o contracción."
  if (acceleration) {
    headline = `${selected.canonical_name}: mayor intensidad de protección en los últimos seis meses`
    interpretation = "La actividad observada aumentó de forma material frente a los seis meses anteriores. Es consistente con un refuerzo de protección, pero no demuestra por sí sola intención estratégica."
  } else if (contraction) {
    headline = `${selected.canonical_name}: menor intensidad de nuevas presentaciones`
    interpretation = "VIDENTIA observa menos actividad de presentación que en el semestre anterior. Esto puede responder a ciclo de portafolio, priorización o simplemente calendario; requiere contexto adicional."
  }

  if (tech.length || commercial.length) {
    const parts = [
      tech.length ? `IPC ${tech.join(", ")}` : null,
      commercial.length ? `Niza ${commercial.join(", ")}` : null,
    ].filter(Boolean)
    interpretation += ` Además aparecen áreas que no estaban presentes en la ventana anterior: ${parts.join(" y ")}.`
  }

  const confidence = clamp(
    48
      + Math.min(18, evidence * 2)
      + (metrics.previous_total > 0 ? 8 : 0)
      + (newIpc.length ? 8 : 0)
      + (newNiza.length ? 6 : 0),
    45,
    92,
  )

  return {
    headline,
    observed_fact: `VIDENTIA comparó ${metrics.current_total} expedientes de los últimos 180 días con ${metrics.previous_total} del período de 180 días inmediatamente anterior: ${metrics.current_patents} patentes y ${metrics.current_trademarks} marcas en la ventana actual.`,
    interpretation,
    why_it_matters: tech.length
      ? `Las nuevas clases técnicas permiten detectar dónde está apareciendo protección que no era visible seis meses atrás y priorizar vigilancia, libertad de operación o análisis competitivo.`
      : commercial.length
        ? `Las nuevas clases marcarias permiten identificar áreas comerciales que aparecen en el portafolio reciente y contrastarlas con patentes, noticias y actividad de mercado.`
        : `La comparación semestral entrega una línea base cuantitativa para distinguir movimientos reales de variaciones aisladas expediente por expediente.`,
    confidence,
    evidence_level: confidence >= 78 ? "alta" as const : confidence >= 62 ? "media" as const : "baja" as const,
    guardrail: "La comparación describe actividad de propiedad intelectual observada. No prueba por sí sola intención, inversión, lanzamiento ni estrategia corporativa.",
  }
}

function classificationMovements(current: CompanyIpActivity[], previous: CompanyIpActivity[]) {
  const currentCounts = countCodes(current)
  const previousCounts = countCodes(previous)
  const codes = new Set([...currentCounts.keys(), ...previousCounts.keys()])
  return [...codes].map(code => {
    const currentValue = currentCounts.get(code) ?? 0
    const previousValue = previousCounts.get(code) ?? 0
    return { code, current: currentValue, previous: previousValue, delta: currentValue - previousValue }
  }).sort((a, b) => b.delta - a.delta || b.current - a.current || a.code.localeCompare(b.code))
}

function countCodes(items: CompanyIpActivity[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const code of new Set(item.classification_codes.map(normalizeClassification).filter(Boolean))) {
      counts.set(code, (counts.get(code) ?? 0) + 1)
    }
  }
  return counts
}

function normalizeClassification(value: string) {
  const code = String(value ?? "").toUpperCase().replace(/\s+/g, "").trim()
  if (!code) return ""
  const ipc = code.match(/^([A-HY]\d{2}[A-Z])/)
  if (ipc) return ipc[1]
  const niza = code.match(/^(?:0?([1-9])|([1-3]\d)|4[0-5])$/)
  if (niza) return String(Number(code))
  return code.slice(0, 12)
}

function toCandidate(row: CandidateRow): CompanyIdentityCandidate {
  return {
    id: String(row.id),
    resolution_key: String(row.resolution_key),
    identity_key: String(row.identity_key),
    canonical_name: String(row.canonical_name),
    country: row.country ? String(row.country) : null,
    resolution_confidence: Number(row.resolution_confidence ?? 0),
    similarity_score: Number(row.similarity_score ?? 0),
    activity_12m: Number(row.activity_12m ?? 0),
  }
}

function toActivity(row: ActivityRow): CompanyIpActivity {
  return {
    id: String(row.id),
    entity_type: row.entity_type === "patent" ? "patent" : "trademark",
    source_record_id: String(row.source_record_id),
    applicant_raw: String(row.applicant_raw),
    title: String(row.title),
    filing_date: row.filing_date ? String(row.filing_date) : null,
    status: row.status ? String(row.status) : null,
    classification_codes: Array.isArray(row.classification_codes) ? row.classification_codes.map(String) : [],
    source_url: row.source_url ? String(row.source_url) : null,
  }
}

function isOnOrAfter(value: string | null, start: Date) {
  if (!value) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.getTime() >= start.getTime()
}

function isBetween(value: string | null, start: Date, end: Date) {
  if (!value) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.getTime() >= start.getTime() && parsed.getTime() <= end.getTime() + 86_399_999
}

function settledValue<T>(result: PromiseSettledResult<T>, errors: string[], label: string): T | null {
  if (result.status === "fulfilled") return result.value
  errors.push(`${label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`)
  return null
}

function dedupeExternal<T extends { url: string }>(items: T[]) {
  return [...new Map(items.map(item => [item.url, item])).values()]
}

function addDays(value: Date, days: number) { return new Date(value.getTime() + days * 86_400_000) }
function dateOnly(value: Date) { return value.toISOString().slice(0, 10) }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Math.round(value))) }
