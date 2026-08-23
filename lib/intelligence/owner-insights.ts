export type OwnerTimelineItem = {
  id: string
  source: string
  source_key: string
  type: string
  title: string
  summary: string | null
  date: string | null
  url: string | null
}

export type OwnerInsight = {
  id: string
  title: string
  explanation: string
  importance: "alta" | "media" | "contexto"
  source_keys: string[]
  evidence_ids: string[]
}

type OwnerInsightInput = {
  owner?: null | { identity_status?: string; rut?: string | null }
  portfolio?: { total?: number; registered?: number; pending?: number }
  top_classes?: Array<{ class: number; count: number }>
  recent_marks?: Array<{ name: string; status: string | null; filed_at: string | null; application: string | null; niza: number[] }>
  portfolio_growth?: Array<{ year: number; count: number }>
  timeline?: OwnerTimelineItem[]
}

export function buildOwnerInsights(context: OwnerInsightInput): OwnerInsight[] {
  const timeline = context.timeline ?? []
  const sources = new Set(timeline.map(item => item.source_key))
  const insights: OwnerInsight[] = []
  const verified = context.owner?.identity_status === "res_verified" && Boolean(context.owner?.rut)
  const total = context.portfolio?.total ?? 0
  const pending = context.portfolio?.pending ?? 0
  const topClasses = context.top_classes ?? []
  const growth = context.portfolio_growth ?? []
  const latestGrowth = growth.at(-1)

  if (verified) {
    const external = ["mercado_publico", "cmf", "superir"].filter(key => sources.has(key))
    if (external.length >= 2) {
      insights.push({
        id: "verified-multi-source",
        title: "El titular ya tiene contexto público verificable",
        explanation: `La identidad está confirmada por RUT y encontramos evidencia oficial en ${external.map(sourceLabel).join(" y ")}. Esto permite analizar al titular como un actor económico, no sólo como un nombre dentro de INAPI.`,
        importance: "alta",
        source_keys: ["registro_empresas", ...external],
        evidence_ids: timeline.filter(item => ["registro_empresas", ...external].includes(item.source_key)).map(item => item.id).slice(0, 8),
      })
    }
  }

  if (sources.has("tdpi")) {
    const tdpi = timeline.filter(item => item.source_key === "tdpi")
    insights.push({
      id: "tdpi-movement",
      title: "Hay antecedentes jurídicos asociados al titular",
      explanation: `Detectamos ${tdpi.length} antecedente${tdpi.length === 1 ? "" : "s"} TDPI dentro del contexto reunido. Conviene revisar esos criterios antes de tratar el portafolio como un conjunto aislado de registros.`,
      importance: "alta",
      source_keys: ["tdpi"],
      evidence_ids: tdpi.map(item => item.id).slice(0, 6),
    })
  }

  if (sources.has("mercado_publico")) {
    const procurement = timeline.filter(item => item.source_key === "mercado_publico")
    insights.push({
      id: "public-activity",
      title: "Existe actividad pública asociada al mismo RUT",
      explanation: `Mercado Público registra actividad vinculada al titular verificado. No equivale por sí sola a uso marcario, pero sí aporta evidencia de actividad económica observable para contextualizar la investigación.`,
      importance: "media",
      source_keys: ["registro_empresas", "mercado_publico"],
      evidence_ids: procurement.map(item => item.id).slice(0, 6),
    })
  }

  if (sources.has("cmf")) {
    const cmf = timeline.filter(item => item.source_key === "cmf")
    insights.push({
      id: "regulated-footprint",
      title: "El titular presenta huella regulatoria en la CMF",
      explanation: "Encontramos una coincidencia oficial por RUT en la CMF. Esto no cambia por sí solo la evaluación marcaria, pero agrega contexto sobre la naturaleza y exposición pública del titular.",
      importance: "media",
      source_keys: ["registro_empresas", "cmf"],
      evidence_ids: cmf.map(item => item.id).slice(0, 6),
    })
  }

  if (sources.has("superir")) {
    const superir = timeline.filter(item => item.source_key === "superir")
    insights.push({
      id: "insolvency-event",
      title: "Hay un evento concursal que merece revisión",
      explanation: "SUPERIR registra un evento asociado al mismo RUT verificado. Para due diligence, licencias, cesiones o vigilancia del portafolio, este hecho debe revisarse junto con la situación de las marcas involucradas.",
      importance: "alta",
      source_keys: ["registro_empresas", "superir"],
      evidence_ids: superir.map(item => item.id).slice(0, 6),
    })
  }

  if (total >= 8 && topClasses.length) {
    const main = topClasses.slice(0, 3).map(item => `Niza ${item.class}`).join(", ")
    insights.push({
      id: "portfolio-concentration",
      title: "El titular mantiene una familia marcaria relevante",
      explanation: `El portafolio reúne ${total} marcas y concentra protección principalmente en ${main}. Esto ayuda a distinguir una coincidencia aislada de una estrategia de protección repetida.`,
      importance: total >= 20 ? "alta" : "media",
      source_keys: ["inapi_open_data"],
      evidence_ids: [],
    })
  }

  if (pending >= 3 || (latestGrowth?.count ?? 0) >= 3) {
    const yearText = latestGrowth ? ` En ${latestGrowth.year} registramos ${latestGrowth.count} presentaciones vinculadas.` : ""
    insights.push({
      id: "portfolio-motion",
      title: "El portafolio muestra movimiento reciente",
      explanation: `${pending} solicitudes aparecen todavía pendientes.${yearText} Es una señal operativa para mantener vigilancia sobre nuevas presentaciones y cambios de estado.`,
      importance: "media",
      source_keys: ["inapi_open_data"],
      evidence_ids: [],
    })
  }

  return dedupe(insights).slice(0, 4)
}

function dedupe(items: OwnerInsight[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function sourceLabel(key: string) {
  const labels: Record<string, string> = {
    mercado_publico: "Mercado Público",
    cmf: "CMF",
    superir: "SUPERIR",
  }
  return labels[key] ?? key
}
