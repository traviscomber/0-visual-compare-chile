import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { searchSeaSeiaProjects } from "@/lib/intelligence/sea-seia"
import { persistIntelligenceWatchEvents } from "@/lib/intelligence/watch-event-writer"

const WATCH_LIMIT = 50
const PROJECT_LIMIT = 12

type Watch = {
  id: string
  user_id: string
  watch_type: string
  query: string
  is_active: boolean
}

export type SeaSeiaWatchSummary = {
  watchesScanned: number
  candidates: number
  persisted: number
  generatedAt: string
}

export async function scanSeaSeiaCompanyWatches(admin: SupabaseClient, now = new Date()): Promise<SeaSeiaWatchSummary> {
  const generatedAt = now.toISOString()
  const { data, error } = await admin
    .from("intelligence_watches")
    .select("id,user_id,watch_type,query,is_active")
    .eq("is_active", true)
    .in("watch_type", ["company", "competitor"])
    .order("updated_at", { ascending: false })
    .limit(WATCH_LIMIT)

  if (error) throw new Error(`Could not load SEA/SEIA watches: ${error.message}`)
  const watches = (data ?? []) as Watch[]
  let candidates = 0
  let persisted = 0

  for (const watch of watches) {
    const projects = await safeSearch(watch.query)
    candidates += projects.length
    if (!projects.length) continue

    const rows = projects.map(project => {
      const holderExact = includesNormalized(project.holder, watch.query)
      const nameMatch = includesNormalized(project.name, watch.query)
      const relevance = holderExact ? "alta" : nameMatch ? "media" : "baja"
      return {
        user_id: watch.user_id,
        watch_id: watch.id,
        signal_key: `sea_seia:project:${project.sourceRecordId}`,
        source_key: "sea_seia",
        event_type: "environmental_project",
        title: project.name,
        summary: [
          project.holder ? `Titular: ${project.holder}` : null,
          project.status,
          project.region,
          project.investmentUsdMillions === null ? null : `Inversión: US$ ${project.investmentUsdMillions.toLocaleString("es-CL")} MM`,
        ].filter(Boolean).join(" · ") || "Proyecto registrado en el SEIA.",
        source_url: project.sourceUrl,
        occurred_at: project.presentationDate,
        relevance,
        payload: {
          official_source: true,
          role: "company_trajectory_signal",
          source_record_id: project.sourceRecordId,
          holder: project.holder,
          workflow: project.workflow,
          region: project.region,
          commune: project.commune,
          typology: project.typology,
          entry_reason: project.entryReason,
          investment_usd_millions: project.investmentUsdMillions,
          presentation_date: project.presentationDate,
          project_status: project.status,
          current_activity: project.currentActivity,
          matched_query: project.matchedQuery,
          matched_field: project.matchedField,
          search_scope: "chile",
          evidence_policy: "Official SEA/SEIA project record; project presence is an environmental-regulatory signal, not a conclusion about approval or company performance.",
        },
        last_seen_at: generatedAt,
        updated_at: generatedAt,
      }
    })

    const result = await persistIntelligenceWatchEvents(admin, rows)
    persisted += result.persisted
  }

  return { watchesScanned: watches.length, candidates, persisted, generatedAt }
}

async function safeSearch(query: string) {
  try {
    return await searchSeaSeiaProjects(query, PROJECT_LIMIT)
  } catch (error) {
    console.warn("[sea-seia/watch] source unavailable", { query, error: error instanceof Error ? error.message : String(error) })
    return []
  }
}

function includesNormalized(value: string | null, query: string) {
  const haystack = normalize(value ?? "")
  const needle = normalize(query)
  return Boolean(needle && haystack.includes(needle))
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}
