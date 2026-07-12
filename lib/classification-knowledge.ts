import { API_PORTAL_NIZA, API_PORTAL_VIENA } from "@/lib/api-portal-data"

export type ClassificationKind = "niza" | "viena"

export interface ClassificationKnowledgeItem {
  codigo: string
  titulo: string
  keywords: string[]
}

const NIZA_KEYWORDS: Record<string, string[]> = {
  "09": ["software", "app", "saas", "digital", "tecnologia", "plataforma", "hardware", "dispositivo"],
  "35": ["negocios", "publicidad", "branding", "marketing", "consultoria", "comercial", "ventas"],
  "41": ["educacion", "capacitacion", "entrenamiento", "curso", "training", "contenido", "eventos"],
  "42": ["software", "saas", "api", "tecnologia", "plataforma", "datos", "infraestructura", "consultoria"],
  "45": ["legal", "marca", "registro", "seguridad", "proteccion", "inapi", "abogado", "propiedad intelectual"],
}

const VIENA_KEYWORDS: Record<string, string[]> = {
  "26.01.01": ["circulo", "cuadrado", "triangulo", "geometrico", "shape", "borde", "icono"],
  "26.03.01": ["rostro", "cara", "perfil", "humano", "figura", "avatar", "ilustracion"],
  "26.03.15": ["ojos", "boca", "nariz", "expresion", "facial", "sonrisa", "mirada"],
  "26.04.01": ["escudo", "shield", "blason", "heraldica", "emblema", "badge", "crest"],
  "28.01.01": ["abstracto", "patron", "pattern", "textura", "ornamento", "trama", "decoracion"],
}

const CLASSIFICATION_KNOWLEDGE = {
  niza: buildKnowledgeItems(API_PORTAL_NIZA, NIZA_KEYWORDS),
  viena: buildKnowledgeItems(API_PORTAL_VIENA, VIENA_KEYWORDS),
} satisfies Record<ClassificationKind, ClassificationKnowledgeItem[]>

export function getClassificationCatalog(kind: ClassificationKind): ClassificationKnowledgeItem[] {
  return CLASSIFICATION_KNOWLEDGE[kind]
}

export function findClassificationByCode(
  kind: ClassificationKind,
  code: string,
): ClassificationKnowledgeItem | null {
  const normalized = normalizeQuery(code)
  return getClassificationCatalog(kind).find((item) => normalizeQuery(item.codigo) === normalized) ?? null
}

export function searchClassificationCatalog(
  kind: ClassificationKind,
  query: string,
  limit = 10,
): ClassificationKnowledgeItem[] {
  const normalized = normalizeQuery(query)
  if (!normalized) return []

  const catalog = getClassificationCatalog(kind)
  const scored = catalog
    .map((item) => {
      const haystack = [item.codigo, item.titulo, ...item.keywords].join(" ").toLowerCase()
      const score = haystack.includes(normalized.toLowerCase()) ? 100 : tokenOverlapScore(normalized, haystack)
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.codigo.localeCompare(b.item.codigo))

  return scored.slice(0, limit).map((entry) => entry.item)
}

export function inferClassificationHints(text: string): { niza: string[]; viena: string[] } {
  const normalized = normalizeQuery(text).toLowerCase()
  if (!normalized) return { niza: [], viena: [] }

  const niza = new Set<string>()
  const viena = new Set<string>()

  for (const item of getClassificationCatalog("niza")) {
    if (matchesKnowledgeItem(normalized, item)) niza.add(item.codigo)
  }

  for (const item of getClassificationCatalog("viena")) {
    if (matchesKnowledgeItem(normalized, item)) viena.add(item.codigo)
  }

  return { niza: [...niza], viena: [...viena] }
}

export function getOperationalClassificationLabel(kind: ClassificationKind, code: string): string {
  return findClassificationByCode(kind, code)?.titulo ?? code
}

export function buildClassificationKnowledgeDigest() {
  return {
    niza: getClassificationCatalog("niza").map((item) => ({
      codigo: item.codigo,
      titulo: item.titulo,
      keywords: item.keywords,
    })),
    viena: getClassificationCatalog("viena").map((item) => ({
      codigo: item.codigo,
      titulo: item.titulo,
      keywords: item.keywords,
    })),
  }
}

function buildKnowledgeItems(
  records: Array<{ codigo: string; titulo: string }>,
  keywordMap: Record<string, string[]>,
): ClassificationKnowledgeItem[] {
  return records.map((record) => ({
    codigo: record.codigo,
    titulo: record.titulo,
    keywords: keywordMap[record.codigo] ?? [],
  }))
}

function matchesKnowledgeItem(query: string, item: ClassificationKnowledgeItem): boolean {
  if (query.includes(normalizeQuery(item.codigo).toLowerCase())) return true
  const title = normalizeQuery(item.titulo).toLowerCase()
  if (title && query.includes(title)) return true
  return item.keywords.some((keyword) => query.includes(normalizeQuery(keyword).toLowerCase()))
}

function tokenOverlapScore(query: string, haystack: string): number {
  const queryTokens = query.split(/\s+/).filter(Boolean)
  if (!queryTokens.length) return 0

  const hits = queryTokens.filter((token) => haystack.includes(token.toLowerCase())).length
  return Math.round((hits / queryTokens.length) * 100)
}

function normalizeQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}
