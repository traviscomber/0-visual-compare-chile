import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"
import {
  IntelligenceCircuitOpenError,
  failIntelligenceIngestion,
  finishIntelligenceIngestion,
  startIntelligenceIngestion,
} from "@/lib/intelligence/ingestion-observability"

const TDPI_HOME = "https://www.tdpi.cl/"
const VALIDATION_INTERVAL_MS = 6 * 24 * 60 * 60 * 1000
const MAX_DAILY_STATE_AGE_HOURS = 9 * 24
const MAX_HTML_BYTES = 2 * 1024 * 1024

type ValidationResult = {
  ok: boolean
  skipped: boolean
  latestDailyStateDate: string | null
  ageHours: number | null
  error: string | null
}

export async function ensureTdpiSourceValidation(admin: SupabaseClient): Promise<ValidationResult> {
  const { data: source, error: sourceError } = await admin
    .from("intelligence_sources")
    .select("id")
    .eq("source_key", "tdpi")
    .single()

  if (sourceError || !source?.id) {
    return { ok: false, skipped: false, latestDailyStateDate: null, ageHours: null, error: sourceError?.message ?? "TDPI source is not registered" }
  }

  const { data: state, error: stateError } = await admin
    .from("intelligence_source_state")
    .select("last_success_at")
    .eq("source_id", source.id)
    .maybeSingle()

  if (stateError) {
    return { ok: false, skipped: false, latestDailyStateDate: null, ageHours: null, error: stateError.message }
  }

  const lastSuccessAt = state?.last_success_at ? Date.parse(String(state.last_success_at)) : Number.NaN
  if (Number.isFinite(lastSuccessAt) && Date.now() - lastSuccessAt < VALIDATION_INTERVAL_MS) {
    return { ok: true, skipped: true, latestDailyStateDate: null, ageHours: null, error: null }
  }

  let run: Awaited<ReturnType<typeof startIntelligenceIngestion>> | null = null
  try {
    run = await startIntelligenceIngestion(admin, {
      sourceKey: "tdpi",
      runType: "reconcile",
      scope: {
        trigger: "intelligence-health-cron",
        pipeline: "tdpi-source-validation",
        validationOnly: true,
        authoritativeUrl: TDPI_HOME,
      },
    })

    const validation = await validateTdpiHomepage()
    await finishIntelligenceIngestion(admin, {
      runId: run.runId,
      sourceId: run.sourceId,
      fetched: 1,
      inserted: 0,
      updated: 0,
      rejected: 0,
      metadata: {
        validationOnly: true,
        pipeline: "tdpi-source-validation",
        authoritativeUrl: TDPI_HOME,
        latestDailyStateDate: validation.latestDailyStateDate,
        ageHours: validation.ageHours,
        decisionIngestion: "manual_reviewed",
      },
    })

    return { ok: true, skipped: false, latestDailyStateDate: validation.latestDailyStateDate, ageHours: validation.ageHours, error: null }
  } catch (error) {
    if (run) {
      await failIntelligenceIngestion(admin, {
        runId: run.runId,
        sourceId: run.sourceId,
        error,
        metadata: { validationOnly: true, pipeline: "tdpi-source-validation", authoritativeUrl: TDPI_HOME },
      })
    }
    const message = error instanceof Error ? error.message : String(error)
    if (!(error instanceof IntelligenceCircuitOpenError)) console.warn("[tdpi-source-validation]", message)
    return { ok: false, skipped: false, latestDailyStateDate: null, ageHours: null, error: message }
  }
}

export async function validateTdpiHomepage(reference = new Date()) {
  const response = await fetchWithRetry(TDPI_HOME, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 (+source availability validation; no case scraping)",
    },
  }, { attempts: 3, baseDelayMs: 600, timeoutMs: 12_000 })

  if (!response.ok) throw new Error(`TDPI homepage responded ${response.status}`)
  const finalUrl = new URL(response.url || TDPI_HOME)
  if (!new Set(["tdpi.cl", "www.tdpi.cl"]).has(finalUrl.hostname.toLowerCase())) {
    throw new Error(`TDPI homepage redirected to unexpected host ${finalUrl.hostname}`)
  }

  const html = await response.text()
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new Error("TDPI homepage exceeded validation size limit")
  if (!/Tribunal de Propiedad Industrial/i.test(html) || !/Estado Diario/i.test(html)) {
    throw new Error("TDPI homepage no longer exposes the expected public source markers")
  }

  const latestDailyState = extractLatestDailyStateDate(html)
  if (!latestDailyState) throw new Error("TDPI homepage exposes Estado Diario but no dated publication could be verified")

  const ageHours = Math.max(0, (reference.getTime() - latestDailyState.getTime()) / 3_600_000)
  if (ageHours > MAX_DAILY_STATE_AGE_HOURS) {
    throw new Error(`TDPI Estado Diario is older than the 9-day source SLA (${Math.round(ageHours)}h)`)
  }

  return {
    latestDailyStateDate: latestDailyState.toISOString().slice(0, 10),
    ageHours: Math.round(ageHours * 10) / 10,
  }
}

export function extractLatestDailyStateDate(html: string): Date | null {
  const lower = html.toLowerCase()
  const start = lower.indexOf("estado diario")
  if (start < 0) return null
  const nextSection = lower.indexOf("ingresos", start + 12)
  const segment = html.slice(start, nextSection > start ? nextSection : Math.min(html.length, start + 30_000))
  const matches = [...segment.matchAll(/\b(\d{2})-(\d{2})-(\d{4})\b/g)]
  const dates = matches
    .map(match => parseCalendarDate(match[1], match[2], match[3]))
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.getTime() - a.getTime())
  return dates[0] ?? null
}

function parseCalendarDate(day: string, month: string, year: string) {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  const value = new Date(Date.UTC(y, m - 1, d))
  if (value.getUTCFullYear() !== y || value.getUTCMonth() !== m - 1 || value.getUTCDate() !== d) return null
  return value
}
