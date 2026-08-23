type CkanRecord = Record<string, unknown>

type CkanResource = {
  id?: string
  name?: string
  format?: string
  datastore_active?: boolean
  last_modified?: string | null
}

type PackageShowResponse = {
  success?: boolean
  result?: { resources?: CkanResource[] }
}

type DatastoreSearchResponse = {
  success?: boolean
  result?: { records?: CkanRecord[] }
}

export type ResIdentityMatch = {
  rut: string
  legalName: string
  resourceId: string
  resourceName: string | null
  sourceUrl: string
  raw: CkanRecord
}

const DATASET_ID = "363edd60-4919-4ff1-b85f-f8e14d61285a"
const CKAN_BASE = "https://datos.gob.cl/es/api/3/action"
const RESOURCE_PAGE_BASE = "https://datos.gob.cl/dataset/registro-de-empresas-y-sociedades/resource"

export async function resolveCompanyInRes(name: string): Promise<ResIdentityMatch | null> {
  const target = normalizeLegalName(name)
  if (target.length < 3) return null

  const resources = await loadResources()
  for (const resource of resources) {
    if (!resource.id) continue
    const match = await searchResource(resource, name, target)
    if (match) return match
  }

  return null
}

async function loadResources(): Promise<CkanResource[]> {
  const url = `${CKAN_BASE}/package_show?id=${encodeURIComponent(DATASET_ID)}`
  const response = await fetch(url, { next: { revalidate: 6 * 60 * 60 }, signal: AbortSignal.timeout(7000) })
  if (!response.ok) throw new Error(`RES package_show ${response.status}`)

  const payload = await response.json() as PackageShowResponse
  const resources = payload.result?.resources ?? []

  return resources
    .filter(item => item.id && item.datastore_active && String(item.format ?? "").toLowerCase() === "csv")
    .sort((a, b) => resourceYear(b) - resourceYear(a))
    .slice(0, 14)
}

async function searchResource(resource: CkanResource, query: string, target: string): Promise<ResIdentityMatch | null> {
  const params = new URLSearchParams({ resource_id: String(resource.id), q: query, limit: "20" })
  const response = await fetch(`${CKAN_BASE}/datastore_search?${params.toString()}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) return null

  const payload = await response.json() as DatastoreSearchResponse
  const candidates = (payload.result?.records ?? [])
    .map(record => toCandidate(record))
    .filter((candidate): candidate is { rut: string; legalName: string; raw: CkanRecord } => Boolean(candidate))
    .filter(candidate => normalizeLegalName(candidate.legalName) === target)

  const uniqueByRut = new Map(candidates.map(candidate => [normalizeRut(candidate.rut), candidate]))
  if (uniqueByRut.size !== 1) return null

  const candidate = [...uniqueByRut.values()][0]
  return {
    rut: normalizeRut(candidate.rut),
    legalName: candidate.legalName.trim(),
    resourceId: String(resource.id),
    resourceName: resource.name ?? null,
    sourceUrl: `${RESOURCE_PAGE_BASE}/${resource.id}`,
    raw: candidate.raw,
  }
}

function toCandidate(record: CkanRecord) {
  let rut: string | null = null
  let legalName: string | null = null

  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) continue
    const normalizedKey = normalizeKey(key)
    const text = String(value).trim()
    if (!text) continue

    if (!rut && (normalizedKey === "rut" || normalizedKey.includes("rut"))) {
      const parsed = normalizeRut(text)
      if (/^[0-9]{7,8}-?[0-9K]$/i.test(parsed)) rut = parsed
    }

    if (!legalName && (
      normalizedKey.includes("razonsocial") ||
      normalizedKey.includes("nombresociedad") ||
      normalizedKey.includes("nombreempresa") ||
      normalizedKey === "nombre"
    )) {
      legalName = text
    }
  }

  return rut && legalName ? { rut, legalName, raw: record } : null
}

function resourceYear(resource: CkanResource) {
  const haystack = `${resource.name ?? ""} ${resource.last_modified ?? ""}`
  const years = [...haystack.matchAll(/20\d{2}/g)].map(match => Number(match[0]))
  return years.length ? Math.max(...years) : 0
}

function normalizeKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

function normalizeLegalName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\b(S\.A\.|S A|SPA|SP A|LTDA|LIMITADA|EIRL|SAS|SOCIEDAD POR ACCIONES)\b/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function normalizeRut(value: string) {
  const compact = value.toUpperCase().replace(/[^0-9K]/g, "")
  if (compact.length < 2) return value.trim()
  return `${compact.slice(0, -1)}-${compact.slice(-1)}`
}
