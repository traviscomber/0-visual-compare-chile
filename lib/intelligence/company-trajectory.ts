import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { buildCompanyTrajectory, type TrajectoryActivity } from "@/lib/intelligence/company-trajectory-rules"

export async function buildCompanyTrajectoryAnalysis(admin: SupabaseClient, identityId: string) {
  const { data: identity, error: identityError } = await admin
    .from("intelligence_company_identities")
    .select("id,canonical_name,country,resolution_confidence")
    .eq("id", identityId)
    .maybeSingle()

  if (identityError) throw new Error(`No pudimos cargar la identidad: ${identityError.message}`)
  if (!identity) throw new Error("La identidad corporativa no existe.")

  const cutoff = new Date(Date.now() - 360 * 86_400_000).toISOString().slice(0, 10)
  const [activityResult, graphResult] = await Promise.all([
    admin
      .from("intelligence_company_ip_activity")
      .select("entity_type,filing_date,classification_codes")
      .eq("identity_id", identityId)
      .gte("filing_date", cutoff)
      .order("filing_date", { ascending: false })
      .limit(4000),
    admin.rpc("get_company_graph_v2", { p_identity_id: identityId }),
  ])

  if (activityResult.error) throw new Error(`No pudimos construir la trayectoria: ${activityResult.error.message}`)
  if (graphResult.error) throw new Error(`No pudimos cargar el grafo corporativo: ${graphResult.error.message}`)

  const activities: TrajectoryActivity[] = (activityResult.data ?? []).map(row => ({
    entity_type: row.entity_type === "patent" ? "patent" : "trademark",
    filing_date: row.filing_date ? String(row.filing_date) : null,
    classification_codes: Array.isArray(row.classification_codes) ? row.classification_codes.map(String) : [],
  }))

  return {
    generated_at: new Date().toISOString(),
    identity: {
      id: String(identity.id),
      canonical_name: String(identity.canonical_name),
      country: identity.country ? String(identity.country) : null,
      resolution_confidence: Number(identity.resolution_confidence ?? 0),
    },
    trajectory: buildCompanyTrajectory(String(identity.canonical_name), activities),
    graph: graphResult.data ?? null,
  }
}
