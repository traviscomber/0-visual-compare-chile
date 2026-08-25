export interface NizaGuardrailClass {
  numero: string
  titulo: string
  tipo: 'principal' | 'defensiva'
  razon: string
  confidence: number
}

export interface NizaGuardrailParams {
  descripcion?: string
  industria?: string
}

export type NizaTitleResolver = (numero: string) => string | undefined

export function applyNizaSemanticGuardrails<T extends NizaGuardrailClass>(
  params: NizaGuardrailParams,
  modelClasses: T[],
  resolveTitle: NizaTitleResolver,
): NizaGuardrailClass[] {
  const context = normalizeForMatch(`${params.descripcion ?? ''} ${params.industria ?? ''}`)
  if (!context) return stableClassOrder(dedupeClasses(modelClasses))

  const hasSoftware = matchesAny(context, [
    /\bsoftware\b/,
    /\baplicacion(?:es)?\b/,
    /\bapp(?:s)?\b/,
    /\bprograma(?:s)? informaticos?\b/,
  ])
  const hasDownloadableSoftware = matchesAny(context, [
    /\bsoftware (?:descargable|instalable|grabado)\b/,
    /\baplicacion(?:es)? (?:descargable|instalable|movil|moviles)\b/,
    /\bapp(?:s)? movil(?:es)?\b/,
    /\bprograma(?:s)? informaticos? (?:descargable|instalable|grabado)s?\b/,
  ])
  const hasSoftwareService = matchesAny(context, [
    /\bsaas\b/,
    /\bsoftware como (?:un )?servicio\b/,
    /\bpaas\b/,
    /\bplataforma como (?:un )?servicio\b/,
    /\bplataforma (?:web|en linea|online|cloud|en la nube)\b/,
    /\bdesarrollo de software\b/,
    /\bdiseno de software\b/,
    /\bprogramacion informatica\b/,
    /\bhosting\b/,
    /\balojamiento (?:de|para) (?:software|servidores|sitios web)\b/,
  ])
  const hasClass35Service = matchesAny(context, [
    /\bservicios? de publicidad\b/,
    /\bagencia de (?:publicidad|marketing)\b/,
    /\bservicios? de marketing\b/,
    /\bgestion comercial (?:para|de) terceros\b/,
    /\badministracion de empresas\b/,
    /\badministracion comercial\b/,
    /\bservicios? de retail\b/,
    /\bventa al por (?:menor|mayor)\b/,
    /\bmarketplace\b/,
    /\bintermediacion comercial\b/,
  ])
  const hasClass45Service = matchesAny(context, [
    /\bservicios? juridicos?\b/,
    /\bservicios? legales?\b/,
    /\basesoria legal\b/,
    /\brepresentacion legal\b/,
    /\babogad(?:o|a|os|as)\b/,
    /\blitig(?:io|ios|acion)\b/,
    /\barbitraje\b/,
    /\bmediacion legal\b/,
    /\bauditoria de cumplimiento (?:legal|normativo)\b/,
    /\bregistro de marcas\b/,
    /\btramitacion de marcas\b/,
    /\bservicios? de seguridad (?:fisica|personal)\b/,
    /\binvestigacion privada\b/,
  ])

  let classes: NizaGuardrailClass[] = modelClasses
    .filter((item) => {
      if (item.numero === '35' && !hasClass35Service) return false
      if (item.numero === '45' && !hasClass45Service) return false
      if (item.numero === '09' && hasSoftwareService && !hasDownloadableSoftware) return false
      if (item.numero === '42' && hasSoftware && !hasSoftwareService && !hasDownloadableSoftware) return false
      return true
    })
    .map((item) => ({ ...item }))

  if (hasSoftwareService) {
    classes = ensureClass(classes, '42', 'principal', 'La descripción ofrece software como servicio, plataforma tecnológica, hosting o desarrollo de software, modalidad propia de la clase 42.', 0.97, resolveTitle)
  } else if (hasSoftware) {
    classes = ensureClass(classes, '09', 'principal', 'La descripción ofrece software como producto sin indicar una modalidad SaaS/PaaS; con la información disponible corresponde tratarlo como software de clase 09.', 0.97, resolveTitle)
  }

  if (hasDownloadableSoftware) {
    classes = ensureClass(classes, '09', 'principal', 'La descripción indica software o aplicaciones descargables/instalables, propios de la clase 09.', 0.98, resolveTitle)
  }
  if (hasClass45Service) {
    classes = ensureClass(classes, '45', 'principal', 'La descripción ofrece expresamente servicios jurídicos, de representación o seguridad propios de la clase 45.', 0.97, resolveTitle)
  }

  return stableClassOrder(dedupeClasses(classes))
}

function ensureClass(
  classes: NizaGuardrailClass[],
  numero: string,
  tipo: 'principal' | 'defensiva',
  razon: string,
  confidence: number,
  resolveTitle: NizaTitleResolver,
) {
  const existing = classes.find((item) => item.numero === numero)
  if (existing) {
    return classes.map((item) => item.numero === numero && tipo === 'principal' && item.tipo !== 'principal'
      ? { ...item, tipo: 'principal' as const }
      : item)
  }
  const titulo = resolveTitle(numero)
  if (!titulo) return classes
  return [...classes, { numero, titulo, tipo, razon, confidence }]
}

function dedupeClasses(classes: NizaGuardrailClass[]) {
  const byNumber = new Map<string, NizaGuardrailClass>()
  for (const item of classes) {
    const current = byNumber.get(item.numero)
    if (!current || item.tipo === 'principal' || item.confidence > current.confidence) {
      byNumber.set(item.numero, item)
    }
  }
  return [...byNumber.values()]
}

function stableClassOrder(classes: NizaGuardrailClass[]) {
  return [...classes].sort((a, b) => {
    if (a.tipo !== b.tipo) return a.tipo === 'principal' ? -1 : 1
    return Number(a.numero) - Number(b.numero)
  })
}

function normalizeForMatch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value))
}
