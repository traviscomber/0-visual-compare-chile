import "server-only"
import { getOwnerPublicActivity } from "@/lib/intelligence/mercado-publico"
import { createAdminClient } from "@/lib/supabase/admin"

export type ProcurementCompanySignal = {
  signal_key: string
  source_key: "mercado_publico"
  event_type: "procurement_activity"
  title: string
  summary: string | null
  source_url: string | null
  occurred_at: string | null
  relevance: "alta" | "media" | "baja"
  payload: Record<string, unknown>
}

type AdminClient = ReturnType<typeof createAdminClient>
type WatchLike = {
  query: string
  watch_type: string
  metadata?: unknown
}

export async function scanMercadoPublicoCompanyWatch(admin: AdminClient, watch: WatchLike): Promise<ProcurementCompanySignal[]> {
  if (!isCompanyWatch(watch) || !hasMercadoPublicoCredentials()) return []

  const normalizedQuery = normalizeName(watch.query)
  if (!normalizedQuery) return []

  const { data: candidates, error: companyError } = await admin
    .from("intelligence_entities")
    .select("id,canonical_name,rut,normalized_name")
    .eq("entity_type", "company")
    .eq("normalized_name", normalizedQuery)
    .not("rut", "is", null)
    .limit(2)

  if (companyError) throw companyError
  if (!candidates || candidates.length !== 1) return []

  const company = candidates[0]
  const rut = String(company.rut || "").trim()
  if (!rut) return []

  const activity = await getOwnerPublicActivity(rut)
  if (!activity.supplierMatched || !activity.supplierCode) return []

  const { data: supplier, error: supplierError } = await admin
    .from("intelligence_entities")
    .select("id,canonical_name,rut,metadata")
    .eq("entity_type", "procurement_supplier")
    .eq("rut", rut)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (supplierError) throw supplierError
  if (!supplier?.id) return []

  const { data: links, error: linksError } = await admin
    .from("intelligence_entity_evidence")
    .select("evidence_id")
    .eq("entity_id", supplier.id)
    .eq("role", "supplier")

  if (linksError) throw linksError
  const evidenceIds = (links ?? []).map(row => row.evidence_id).filter(Boolean)
  if (!evidenceIds.length) return []

  const { data: evidence, error: evidenceError } = await admin
    .from("intelligence_evidence")
    .select("id,source_record_id,title,summary,source_url,occurred_at,observed_at,payload")
    .in("id", evidenceIds)
    .eq("evidence_type", "procurement_activity")
    .order("observed_at", { ascending: false })
    .limit(12)

  if (evidenceError) throw evidenceError

  return (evidence ?? []).map(row => ({
    signal_key: `mercado_publico:procurement_activity:${row.source_record_id || row.id}`,
    source_key: "mercado_publico" as const,
    event_type: "procurement_activity" as const,
    title: row.title || `Actividad pública de ${company.canonical_name}`,
    summary: row.summary || `Mercado Público registra actividad asociada al RUT verificado ${rut}.`,
    source_url: row.source_url || "https://www.mercadopublico.cl/",
    occurred_at: row.occurred_at || row.observed_at,
    relevance: "alta" as const,
    payload: {
      official_source: true,
      source_record_id: row.source_record_id,
      canonical_company_id: company.id,
      canonical_company_name: company.canonical_name,
      verified_rut: rut,
      supplier_code: activity.supplierCode,
      supplier_name: activity.supplierName,
      watch_match_basis: "exact_canonical_name_plus_verified_rut",
      procurement: row.payload,
      search_scope: "chile",
    },
  }))
}

function isCompanyWatch(watch: WatchLike) {
  if (watch.metadata && typeof watch.metadata === "object" && !Array.isArray(watch.metadata)) {
    const external = (watch.metadata as Record<string, unknown>).external_watch_type
    if (external === "company" || external === "competitor") return true
    if (typeof external === "string") return false
  }
  return watch.watch_type === "company" || watch.watch_type === "competitor"
}

function hasMercadoPublicoCredentials() {
  return Boolean(String(process.env.CHILECOMPRA_TICKET ?? "").trim())
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
