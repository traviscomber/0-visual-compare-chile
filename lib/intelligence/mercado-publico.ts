import crypto from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"

const API_BASE = "https://api.mercadopublico.cl/servicios/v1/publico"
const TIMEOUT_MS = 8000

export type PublicActivitySummary = {
  available: boolean
  configured: boolean
  supplierMatched: boolean
  supplierName: string | null
  supplierCode: string | null
  ordersToday: number
  tendersToday: number
  storedEvidence: number
  lastObservedAt: string | null
}

export async function getOwnerPublicActivity(rut: string): Promise<PublicActivitySummary> {
  const normalizedRut = normalizeRut(rut)
  const admin = createAdminClient()
  const stored = await loadStored(admin, normalizedRut)
  const ticket = String(process.env.CHILECOMPRA_TICKET ?? "").trim()

  if (!ticket) {
    return {
      available: stored.count > 0,
      configured: false,
      supplierMatched: stored.supplierMatched,
      supplierName: stored.supplierName,
      supplierCode: stored.supplierCode,
      ordersToday: 0,
      tendersToday: 0,
      storedEvidence: stored.count,
      lastObservedAt: stored.lastObservedAt,
    }
  }

  try {
    const supplierPayload = await fetchJson(`${API_BASE}/Empresas/BuscarProveedor?rutempresaproveedor=${encodeURIComponent(formatRutForApi(normalizedRut))}&ticket=${encodeURIComponent(ticket)}`)
    const supplier = parseSupplier(supplierPayload)
    if (!supplier?.code) {
      return {
        available: stored.count > 0,
        configured: true,
        supplierMatched: false,
        supplierName: null,
        supplierCode: null,
        ordersToday: 0,
        tendersToday: 0,
        storedEvidence: stored.count,
        lastObservedAt: stored.lastObservedAt,
      }
    }

    const supplierEntityId = await ensureSupplierEntity(admin, normalizedRut, supplier.code, supplier.name)
    await linkVerifiedCompany(admin, normalizedRut, supplierEntityId)

    const today = formatApiDate(new Date())
    const [ordersPayload, tendersPayload] = await Promise.all([
      fetchJson(`${API_BASE}/ordenesdecompra.json?fecha=${today}&CodigoProveedor=${encodeURIComponent(supplier.code)}&ticket=${encodeURIComponent(ticket)}`),
      fetchJson(`${API_BASE}/licitaciones.json?fecha=${today}&CodigoProveedor=${encodeURIComponent(supplier.code)}&ticket=${encodeURIComponent(ticket)}`),
    ])
    const orders = extractListado(ordersPayload)
    const tenders = extractListado(tendersPayload)

    for (const [kind, rows] of [["order", orders], ["tender", tenders]] as const) {
      for (const row of rows) await persistActivity(admin, supplierEntityId, normalizedRut, supplier.code, supplier.name, today, kind, row)
    }

    const refreshed = await loadStored(admin, normalizedRut)
    return {
      available: true,
      configured: true,
      supplierMatched: true,
      supplierName: supplier.name,
      supplierCode: supplier.code,
      ordersToday: orders.length,
      tendersToday: tenders.length,
      storedEvidence: refreshed.count,
      lastObservedAt: refreshed.lastObservedAt,
    }
  } catch (error) {
    console.warn("[mercado-publico] activity refresh failed", error)
    return {
      available: stored.count > 0,
      configured: true,
      supplierMatched: stored.supplierMatched,
      supplierName: stored.supplierName,
      supplierCode: stored.supplierCode,
      ordersToday: 0,
      tendersToday: 0,
      storedEvidence: stored.count,
      lastObservedAt: stored.lastObservedAt,
    }
  }
}

async function loadStored(admin: ReturnType<typeof createAdminClient>, rut: string) {
  const { data: supplier } = await admin
    .from("intelligence_entities")
    .select("id,canonical_name,metadata")
    .eq("entity_type", "procurement_supplier")
    .eq("rut", rut)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!supplier) return { count: 0, lastObservedAt: null as string | null, supplierMatched: false, supplierName: null as string | null, supplierCode: null as string | null }

  const { data: links } = await admin
    .from("intelligence_entity_evidence")
    .select("evidence_id")
    .eq("entity_id", supplier.id)

  const ids = (links ?? []).map(item => item.evidence_id)
  if (!ids.length) {
    return {
      count: 0,
      lastObservedAt: null,
      supplierMatched: true,
      supplierName: supplier.canonical_name,
      supplierCode: String((supplier.metadata as Record<string, unknown> | null)?.supplier_code ?? "") || null,
    }
  }

  const { data: evidence } = await admin
    .from("intelligence_evidence")
    .select("id,observed_at")
    .in("id", ids)
    .eq("evidence_type", "procurement_activity")
    .order("observed_at", { ascending: false })

  return {
    count: evidence?.length ?? 0,
    lastObservedAt: evidence?.[0]?.observed_at ?? null,
    supplierMatched: true,
    supplierName: supplier.canonical_name,
    supplierCode: String((supplier.metadata as Record<string, unknown> | null)?.supplier_code ?? "") || null,
  }
}

async function ensureSupplierEntity(admin: ReturnType<typeof createAdminClient>, rut: string, code: string, name: string | null) {
  const externalKey = `mercadopublico:supplier:${code}`
  const { data: existing } = await admin.from("intelligence_entities").select("id").eq("external_key", externalKey).maybeSingle()
  if (existing?.id) {
    await admin.from("intelligence_entities").update({ canonical_name: name || rut, rut, last_seen_at: new Date().toISOString(), metadata: { supplier_code: code, source: "mercado_publico" } }).eq("id", existing.id)
    return existing.id as string
  }

  const { data, error } = await admin.from("intelligence_entities").insert({
    entity_type: "procurement_supplier",
    canonical_name: name || rut,
    normalized_name: normalizeName(name || rut),
    rut,
    country: "CL",
    external_key: externalKey,
    metadata: { supplier_code: code, source: "mercado_publico" },
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  }).select("id").single()
  if (error || !data?.id) throw error ?? new Error("No pudimos crear el proveedor Mercado Público")
  return data.id as string
}

async function linkVerifiedCompany(admin: ReturnType<typeof createAdminClient>, rut: string, supplierEntityId: string) {
  const { data: company } = await admin.from("intelligence_entities").select("id").eq("entity_type", "company").eq("rut", rut).limit(1).maybeSingle()
  if (!company?.id) return
  const { data: existing } = await admin.from("intelligence_relationships").select("id").eq("from_entity_id", company.id).eq("to_entity_id", supplierEntityId).eq("relationship_type", "same_rut").maybeSingle()
  if (existing?.id) return
  await admin.from("intelligence_relationships").insert({ from_entity_id: company.id, to_entity_id: supplierEntityId, relationship_type: "same_rut", confidence: 1, is_derived: false, metadata: { basis: "RUT verificado en RES y Mercado Público" } })
}

async function persistActivity(admin: ReturnType<typeof createAdminClient>, supplierEntityId: string, rut: string, supplierCode: string, supplierName: string | null, observedDate: string, kind: "order" | "tender", row: Record<string, unknown>) {
  const { data: source } = await admin.from("intelligence_sources").select("id").eq("source_key", "mercado_publico").maybeSingle()
  if (!source?.id) return

  const externalId = firstText(row, ["Codigo", "Código", "codigo", "Code", "code"]) || crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex").slice(0, 24)
  const sourceRecordId = `${kind}:${externalId}`
  const title = firstText(row, ["Nombre", "nombre", "Name", "Descripcion", "Descripción"]) || `${kind === "order" ? "Orden de compra" : "Licitación"} ${externalId}`
  const payload = { kind, supplierCode, rut, observedDate, row }
  const contentHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")

  const { data: existing } = await admin.from("intelligence_evidence").select("id").eq("source_id", source.id).eq("source_record_id", sourceRecordId).eq("evidence_type", "procurement_activity").maybeSingle()
  let evidenceId = existing?.id as string | undefined

  if (evidenceId) {
    await admin.from("intelligence_evidence").update({ title, summary: `Actividad pública de ${supplierName || rut} en Mercado Público`, payload, content_hash: contentHash, observed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", evidenceId)
  } else {
    const { data, error } = await admin.from("intelligence_evidence").insert({ source_id: source.id, source_record_id: sourceRecordId, evidence_type: "procurement_activity", title, summary: `Actividad pública de ${supplierName || rut} en Mercado Público`, source_url: "https://www.mercadopublico.cl/", occurred_at: new Date().toISOString(), content_hash: contentHash, payload, confidence: "official" }).select("id").single()
    if (error || !data?.id) return
    evidenceId = data.id as string
  }

  const { data: link } = await admin.from("intelligence_entity_evidence").select("entity_id").eq("entity_id", supplierEntityId).eq("evidence_id", evidenceId).eq("role", "supplier").maybeSingle()
  if (!link) await admin.from("intelligence_entity_evidence").insert({ entity_id: supplierEntityId, evidence_id: evidenceId, role: "supplier" })
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "N3uralia-Intelligence/1.0" }, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`Mercado Público respondió ${response.status}`)
  return await response.json() as unknown
}

function parseSupplier(payload: unknown) {
  const rows = extractListado(payload)
  const row = rows[0] ?? (typeof payload === "object" && payload ? payload as Record<string, unknown> : {})
  const code = firstText(row, ["CodigoEmpresa", "CódigoEmpresa", "Codigo", "codigo", "Code"])
  const name = firstText(row, ["NombreEmpresa", "Nombre", "nombre", "Name"])
  return code ? { code, name } : null
}

function extractListado(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(item => item && typeof item === "object") as Record<string, unknown>[]
  if (!payload || typeof payload !== "object") return []
  const record = payload as Record<string, unknown>
  for (const key of ["Listado", "listado", "ListadoEmpresas", "ListadoProveedores"]) {
    const value = record[key]
    if (Array.isArray(value)) return value.filter(item => item && typeof item === "object") as Record<string, unknown>[]
  }
  return []
}

function firstText(object: Record<string, unknown>, keys: string[]) { for (const key of keys) { const value = object[key]; if (value !== undefined && value !== null && String(value).trim()) return String(value).trim() } return null }
function normalizeRut(value: string) { const compact = value.toUpperCase().replace(/[^0-9K]/g, ""); return compact.length > 1 ? `${compact.slice(0, -1)}-${compact.slice(-1)}` : value }
function formatRutForApi(value: string) { const [body, dv] = value.split("-"); const reversed = body.split("").reverse(); const groups: string[] = []; for (let i = 0; i < reversed.length; i += 3) groups.push(reversed.slice(i, i + 3).reverse().join("")); return `${groups.reverse().join(".")}-${dv.toLowerCase()}` }
function formatApiDate(date: Date) { return `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}` }
function normalizeName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ") }
