import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { collapseSnifaRegulatoryEvents } from "@/lib/intelligence/snifa-regulatory-timeline"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RegulatoryTimeline = {
  canonicalCompanyName: string | null
  expediente: string
  milestones: Array<{
    id: string
    label: string
    title: string
    detail: string | null
    occurredAt: string | null
    href: string | null
    relevance: "alta" | "media" | "baja"
  }>
}

type CommonSignal = {
  key: string
  watchKey: string
  type: "brand" | "patent" | "technology"
  watchQuery: string
  source: string
  title: string
  detail: string | null
  occurredAt: string | null
  firstSeenAt: string
  relevance: "alta" | "media" | "baja"
  isNew: boolean
  href: string
  timeline?: RegulatoryTimeline | null
}

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const [brandWatchesResult, patentWatchesResult, technologyWatchesResult, brandEventsResult, patentEventsResult, technologyEventsResult] = await Promise.all([
    auth.supabase.from("trademark_watches").select("id,query,is_active,last_reviewed_at").eq("user_id", auth.user.id),
    auth.supabase.from("patent_watches").select("id,query,is_active,source_type,source_status").eq("user_id", auth.user.id),
    auth.supabase.from("intelligence_watches").select("id,query,is_active,last_reviewed_at").eq("user_id", auth.user.id),
    auth.supabase.from("trademark_watch_signal_events").select("id,watch_id,source,mark_name,applicant_name,application_number,event_date,source_url,relevance,reason,first_seen_at").eq("user_id", auth.user.id).order("first_seen_at", { ascending: false }).limit(150),
    auth.supabase.from("patent_alert_events").select("id,watch_id,title,application_number,applicants,ipc_codes,filing_date,detected_at,read_at,source_key,source_url,source_date").eq("user_id", auth.user.id).order("detected_at", { ascending: false }).limit(150),
    auth.supabase.from("intelligence_watch_events").select("id,watch_id,source_key,event_type,title,summary,source_url,occurred_at,relevance,first_seen_at,payload").eq("user_id", auth.user.id).order("first_seen_at", { ascending: false }).limit(150),
  ])

  const failed = [brandWatchesResult.error, patentWatchesResult.error, technologyWatchesResult.error, brandEventsResult.error, patentEventsResult.error, technologyEventsResult.error].find(Boolean)
  if (failed) {
    console.error("[common-watch-signals:get]", failed)
    return NextResponse.json({ error: "No pudimos construir el inbox completo de vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const brandWatches = new Map((brandWatchesResult.data ?? []).map(item => [item.id, item]))
  const patentWatches = new Map((patentWatchesResult.data ?? []).map(item => [item.id, item]))
  const technologyWatches = new Map((technologyWatchesResult.data ?? []).map(item => [item.id, item]))
  const technologyEvents = collapseSnifaRegulatoryEvents((technologyEventsResult.data ?? []).map(row => ({ ...row, relevance: row.relevance ?? null })))

  const signals: CommonSignal[] = [
    ...(brandEventsResult.data ?? []).flatMap(row => {
      const watch = brandWatches.get(row.watch_id)
      if (!watch?.is_active) return []
      const isNew = Boolean(watch.last_reviewed_at && Date.parse(row.first_seen_at) > Date.parse(watch.last_reviewed_at))
      return [{ key: `brand:${row.id}`, watchKey: `brand:${row.watch_id}`, type: "brand" as const, watchQuery: watch.query, source: row.source, title: row.mark_name, detail: row.reason || row.applicant_name || row.application_number, occurredAt: row.event_date, firstSeenAt: row.first_seen_at, relevance: normalizeRelevance(row.relevance), isNew, href: row.source_url || "/monitorear" }]
    }),
    ...(patentEventsResult.data ?? []).flatMap(row => {
      const watch = patentWatches.get(row.watch_id)
      if (!watch?.is_active) return []
      const isWipo = row.source_key === "wipo_patentscope_rss"
      return [{
        key: `patent:${row.id}`,
        watchKey: `patent:${row.watch_id}`,
        type: "patent" as const,
        watchQuery: watch.query,
        source: isWipo ? "WIPO · PATENTSCOPE RSS" : "INAPI · Patentes",
        title: row.title,
        detail: [row.applicants, row.application_number ? `${isWipo ? "Publicación" : "Solicitud"} ${row.application_number}` : null, Array.isArray(row.ipc_codes) && row.ipc_codes.length ? `IPC ${row.ipc_codes.slice(0, 4).join(", ")}` : null].filter(Boolean).join(" · ") || null,
        occurredAt: row.source_date || row.filing_date,
        firstSeenAt: row.detected_at,
        relevance: "media" as const,
        isNew: !row.read_at,
        href: row.source_url || (isWipo ? "/patentes/wipo" : "/patentes"),
      }]
    }),
    ...technologyEvents.flatMap(row => {
      const watch = technologyWatches.get(row.watch_id)
      if (!watch?.is_active) return []
      const isNew = Boolean(watch.last_reviewed_at && Date.parse(row.first_seen_at) > Date.parse(watch.last_reviewed_at))
      return [{
        key: `technology:${row.id}`,
        watchKey: `technology:${row.watch_id}`,
        type: "technology" as const,
        watchQuery: watch.query,
        source: row.timeline ? "SMA · línea regulatoria" : row.source_key,
        title: row.title,
        detail: row.summary || row.event_type,
        occurredAt: row.occurred_at,
        firstSeenAt: row.first_seen_at,
        relevance: normalizeRelevance(row.relevance),
        isNew,
        href: row.source_url || "/monitorear/estrategico",
        timeline: row.timeline ? {
          canonicalCompanyName: row.timeline.canonicalCompanyName,
          expediente: row.timeline.expediente,
          milestones: row.timeline.milestones.map(item => ({
            id: item.id,
            label: item.label,
            title: item.title,
            detail: item.detail,
            occurredAt: item.occurredAt,
            href: item.href,
            relevance: item.relevance,
          })),
        } : null,
      }]
    }),
  ].sort((a, b) => Number(b.isNew) - Number(a.isNew) || relevanceRank(b.relevance) - relevanceRank(a.relevance) || Date.parse(b.firstSeenAt) - Date.parse(a.firstSeenAt))

  const newSignals = signals.filter(item => item.isNew)
  return NextResponse.json({ signals, summary: { new: newSignals.length, high: newSignals.filter(item => item.relevance === "alta").length, total: signals.length, brand: signals.filter(item => item.type === "brand").length, patent: signals.filter(item => item.type === "patent").length, technology: signals.filter(item => item.type === "technology").length } }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const reviewedAt = new Date().toISOString()
  const [brandResult, technologyResult, patentResult] = await Promise.all([
    auth.supabase.from("trademark_watches").update({ last_reviewed_at: reviewedAt }).eq("user_id", auth.user.id).eq("is_active", true),
    auth.supabase.from("intelligence_watches").update({ last_reviewed_at: reviewedAt, updated_at: reviewedAt }).eq("user_id", auth.user.id).eq("is_active", true),
    auth.supabase.from("patent_alert_events").update({ read_at: reviewedAt }).eq("user_id", auth.user.id).is("read_at", null),
  ])
  const failed = [brandResult.error, technologyResult.error, patentResult.error].find(Boolean)
  if (failed) { console.error("[common-watch-signals:review]", failed); return NextResponse.json({ error: "No pudimos registrar la revisión completa." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS }) }
  return NextResponse.json({ ok: true, reviewedAt }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function normalizeRelevance(value: string | null): "alta" | "media" | "baja" { if (value === "alta" || value === "baja") return value; return "media" }
function relevanceRank(value: CommonSignal["relevance"]) { return value === "alta" ? 3 : value === "media" ? 2 : 1 }
