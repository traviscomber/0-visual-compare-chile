import { createAdminClient } from "@/lib/supabase/admin"
import { JuanProjectDocumentationResearchClient } from "@/components/app/juan-project-documentation-research-client"

type ProductRow = {
  product_key: string
  product_name: string
  title: string
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  evidence_snapshot: Record<string, unknown> | null
}

type Source = { title?: string; url?: string }
type RadarDelta = {
  previous_generated_at?: string
  summary?: string
  new_sources?: Source[]
  removed_sources?: Source[]
  retained_source_count?: number
  source_set_changed?: boolean
  conviction_delta?: number
  decision_boundary?: string
}
type Radar = {
  generated_at?: string
  query?: string
  text?: string
  sources?: Source[]
  conviction_delta?: number
  decision_boundary?: string
  delta?: RadarDelta | null
}

type NormalizedRadar = {
  generatedAt: string
  query: string
  text: string
  sources: Array<{ title: string; url: string }>
  convictionDelta: 0 | null
  decisionBoundary: string
  delta: {
    previousGeneratedAt: string
    summary: string
    newSources: Array<{ title: string; url: string }>
    removedSources: Array<{ title: string; url: string }>
    retainedSourceCount: number
    sourceSetChanged: boolean
    convictionDelta: 0 | null
    decisionBoundary: string
  } | null
}

export async function JuanProjectDocumentationResearch({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("product_key,product_name,title,status,evidence_snapshot")
    .eq("user_id", userId)
    .neq("status", "rejected")
    .order("score", { ascending: false })

  const products = (error ? [] : data ?? []) as ProductRow[]
  if (!products.length) return null

  return <JuanProjectDocumentationResearchClient
    projects={products.map((product) => ({
      key: product.product_key,
      name: product.product_name,
      direction: product.title,
      status: product.status,
      radar: normalizeRadar(product.evidence_snapshot),
    }))}
  />
}

function normalizeRadar(snapshot: Record<string, unknown> | null): NormalizedRadar | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null
  const radar = snapshot.rnd_radar as Radar | undefined
  if (!radar || typeof radar !== "object" || !radar.generated_at || !radar.text) return null
  return {
    generatedAt: radar.generated_at,
    query: radar.query ?? "Radar automático de I+D",
    text: radar.text,
    sources: normalizeSources(radar.sources),
    convictionDelta: radar.conviction_delta === 0 ? 0 : null,
    decisionBoundary: radar.decision_boundary ?? "Radar de I+D derivado. No modifica decisiones ni score.",
    delta: normalizeDelta(radar.delta),
  }
}

function normalizeDelta(delta: RadarDelta | null | undefined): NormalizedRadar["delta"] {
  if (!delta?.previous_generated_at || !delta.summary) return null
  return {
    previousGeneratedAt: delta.previous_generated_at,
    summary: delta.summary,
    newSources: normalizeSources(delta.new_sources),
    removedSources: normalizeSources(delta.removed_sources),
    retainedSourceCount: typeof delta.retained_source_count === "number" ? delta.retained_source_count : 0,
    sourceSetChanged: delta.source_set_changed === true,
    convictionDelta: delta.conviction_delta === 0 ? 0 : null,
    decisionBoundary: delta.decision_boundary ?? "Comparación derivada entre dos lecturas de I+D. No modifica decisiones ni score.",
  }
}

function normalizeSources(sources: Source[] | undefined) {
  return Array.isArray(sources)
    ? sources.flatMap((source) => source?.title && source?.url ? [{ title: source.title, url: source.url }] : []).slice(0, 12)
    : []
}
