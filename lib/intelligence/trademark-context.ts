import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type TrademarkOwnerSummary = {
  owner: null | {
    name: string
    rut: string | null
    identity_confidence: number
    identity_status: string
  }
  portfolio: {
    total: number
    registered: number
    pending: number
  }
  warning: string | null
}

export type TrademarkFamilyContext = {
  owner: null | {
    entity_id: string
    name: string
    rut: string | null
    confidence: number
    metadata: Record<string, unknown>
  }
  family_count: number
  family: Array<{
    entity_id: string
    name: string
    status: string | null
    numero_registro: string | null
    numero_solicitud: string | null
    relationship: "owns" | "applied_for"
  }>
}

export type TrademarkIntelligenceContext = {
  owner: TrademarkOwnerSummary
  family: TrademarkFamilyContext
  precedents: Array<{
    decision_entity_id: string
    name: string
    relevance_score: number
    matching_signals: Record<string, unknown>
    explanation: string | null
    metadata: Record<string, unknown>
  }>
}

export async function getTrademarkIntelligenceContext(trademarkRecordId: string): Promise<TrademarkIntelligenceContext> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error("UNAUTHENTICATED")

  const admin = createAdminClient()
  const [ownerResult, familyResult, intelligenceResult] = await Promise.all([
    admin.rpc("get_trademark_owner_summary", { p_trademark_record_id: trademarkRecordId }),
    admin.rpc("get_trademark_family_context", { p_trademark_record_id: trademarkRecordId }),
    admin.rpc("get_trademark_intelligence_context", { p_trademark_record_id: trademarkRecordId }),
  ])

  const error = ownerResult.error ?? familyResult.error ?? intelligenceResult.error
  if (error) throw new Error(`INTELLIGENCE_CONTEXT_FAILED:${error.message}`)

  const owner = (ownerResult.data ?? { owner: null, portfolio: { total: 0, registered: 0, pending: 0 }, warning: null }) as TrademarkOwnerSummary
  const family = (familyResult.data ?? { owner: null, family_count: 0, family: [] }) as TrademarkFamilyContext
  const intelligence = (intelligenceResult.data ?? { precedents: [] }) as { precedents?: TrademarkIntelligenceContext["precedents"] }

  return {
    owner,
    family,
    precedents: intelligence.precedents ?? [],
  }
}
