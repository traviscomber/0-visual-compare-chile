import { createAdminClient } from "@/lib/supabase/admin"
import { JuanProjectDocumentationResearchClient } from "@/components/app/juan-project-documentation-research-client"

type ProductRow = {
  product_key: string
  product_name: string
  title: string
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  evidence_snapshot: Record<string, unknown> | null
}

type Radar = {
  generated_at?: string
  query?: string
  text?: string
  sources?: Array<{ title?: string; url?: string }>
  conviction_delta?: number
  decision_boundary?: string
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

function normalizeRadar(snapshot: Record<string, unknown> | null) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null
  const radar = snapshot.rnd_radar as Radar | undefined
  if (!radar || typeof radar !== "object" || !radar.generated_at || !radar.text) return null
  return {
    generatedAt: radar.generated_at,
    query: radar.query ?? "Radar automático de I+D",
    text: radar.text,
    sources: Array.isArray(radar.sources)
      ? radar.sources.flatMap((source) => source?.title && source?.url ? [{ title: source.title, url: source.url }] : []).slice(0, 12)
      : [],
    convictionDelta: radar.conviction_delta === 0 ? 0 : null,
    decisionBoundary: radar.decision_boundary ?? "Radar de I+D derivado. No modifica decisiones ni score.",
  }
}
