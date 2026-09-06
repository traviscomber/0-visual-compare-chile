export type IntelligenceLayer =
  | "propiedad_industrial"
  | "patentes"
  | "ciencia_tecnologia"
  | "empresas"
  | "mercado"
  | "noticias"
  | "jurisprudencia"
  | "regulacion"

export type AutomationPolicy = "allowed" | "credentials_required" | "manual_only"

export type SourceDefinition = {
  key: string
  layer: IntelligenceLayer
  purpose: string
  automationPolicy: AutomationPolicy
  credentialEnv?: string[]
  credentialAnyOf?: string[]
  note?: string
}

export const SOURCE_NETWORK: SourceDefinition[] = [
  { key: "inapi_open_data", layer: "propiedad_industrial", purpose: "Marcas, solicitudes, titulares, estados, clases de Niza y evidencia oficial de Chile.", automationPolicy: "allowed" },
  { key: "tdpi", layer: "jurisprudencia", purpose: "Señales procesales y jurisprudencia del Tribunal de Propiedad Industrial.", automationPolicy: "allowed" },
  { key: "tdlc_jurisprudence", layer: "jurisprudencia", purpose: "Sentencias y resoluciones recientes publicadas por el Tribunal de Defensa de la Libre Competencia.", automationPolicy: "allowed", note: "Conector on-demand sobre las páginas oficiales de jurisprudencia; la publicación web no reemplaza la notificación legal." },
  { key: "fne_competition", layer: "mercado", purpose: "Documentos oficiales de investigaciones y operaciones de concentración publicados por la Fiscalía Nacional Económica.", automationPolicy: "allowed", note: "Conector on-demand por partes involucradas; conserva el documento oficial FNE como evidencia primaria." },
  { key: "sea_seia", layer: "regulacion", purpose: "Proyectos sometidos al Sistema de Evaluación de Impacto Ambiental, con titular, inversión, región, estado y expediente oficial.", automationPolicy: "allowed", note: "Conector on-demand al endpoint público del SEA/SEIA. La presencia de un proyecto es una señal ambiental-regulatoria y no implica aprobación ni desempeño de la empresa." },
  { key: "registro_empresas", layer: "empresas", purpose: "Resolución exacta de identidad societaria y RUT mediante el dataset oficial del Registro de Empresas y Sociedades en datos.gob.cl.", automationPolicy: "allowed", note: "Conector bajo demanda; no implica una réplica mensual completa del registro." },
  { key: "cmf", layer: "empresas", purpose: "Condición regulatoria y presencia de entidades fiscalizadas por la CMF.", automationPolicy: "allowed" },
  { key: "cmf_norms", layer: "regulacion", purpose: "Normativa reciente publicada por la Comisión para el Mercado Financiero para vigilancia regulatoria.", automationPolicy: "allowed" },
  { key: "cmf_market", layer: "mercado", purpose: "Indicadores oficiales de mercado (dólar, UF, euro e IPC) desde la API CMF/SBIF.", automationPolicy: "credentials_required", credentialAnyOf: ["CMF_API_KEY", "SBIF_API_KEY"], note: "El cliente acepta cualquiera de las dos variables por compatibilidad con la API CMF/SBIF." },
  { key: "bcn_norms", layer: "regulacion", purpose: "Normas chilenas consultadas desde el endpoint SPARQL oficial de la Biblioteca del Congreso Nacional.", automationPolicy: "allowed" },
  { key: "diario_oficial", layer: "regulacion", purpose: "Publicaciones regulatorias y actos oficiales de las ediciones electrónicas del Diario Oficial de Chile.", automationPolicy: "allowed" },
  { key: "snifa_sma", layer: "regulacion", purpose: "Sanciones, procedimientos, medidas provisionales y programas de cumplimiento publicados por SNIFA/SMA.", automationPolicy: "allowed" },
  { key: "gleif", layer: "empresas", purpose: "Identidad legal internacional mediante LEI y evidencia oficial de GLEIF para entidades resueltas de forma exacta.", automationPolicy: "allowed", note: "El fuzzy search sólo descubre candidatos; VIDENTIA acepta una identidad GLEIF cuando queda una única coincidencia normalizada exacta." },
  { key: "mercado_publico", layer: "mercado", purpose: "Compras públicas, licitaciones y actividad comercial verificable en Chile.", automationPolicy: "credentials_required", credentialEnv: ["CHILECOMPRA_TICKET"] },
  { key: "openalex", layer: "ciencia_tecnologia", purpose: "Publicaciones, autores, instituciones y dinámica científica para medir evolución tecnológica.", automationPolicy: "allowed", credentialEnv: ["OPENALEX_API_KEY"], note: "La clave es opcional para uso básico y recomendable para operación continua." },
  { key: "crossref", layer: "ciencia_tecnologia", purpose: "Metadatos DOI y publicaciones para corroborar actividad científica y tecnológica.", automationPolicy: "allowed", credentialEnv: ["CROSSREF_MAILTO"], note: "CROSSREF_MAILTO no es obligatorio, pero habilita el polite pool recomendado por Crossref." },
  { key: "epo_ops", layer: "patentes", purpose: "Datos mundiales de patentes, familias, bibliografía y estado legal mediante EPO OPS.", automationPolicy: "credentials_required", credentialEnv: ["EPO_OPS_CONSUMER_KEY", "EPO_OPS_CONSUMER_SECRET"], note: "Requiere una aplicación registrada en EPO OPS y aceptación de sus términos." },
  { key: "wipo_patentscope_rss", layer: "patentes", purpose: "Monitoreo de nuevas publicaciones de patentes mediante feeds RSS públicos de consultas guardadas en WIPO PATENTSCOPE.", automationPolicy: "allowed", note: "WIPO documenta RSS como mecanismo de sindicación para búsquedas PATENTSCOPE. VIDENTIA sólo acepta feeds HTTPS públicos en patentscope.wipo.int." },
  { key: "google_news_rss", layer: "noticias", purpose: "Contexto noticioso reciente para búsquedas y vigilancias estratégicas de VIDENTIA.", automationPolicy: "allowed", note: "Fuente contextual, no evidencia canónica ni eje de scoring. Se usa para artículos recientes; no sustituye el raw feed canónico de GDELT." },
  { key: "gdelt_raw_feed", layer: "noticias", purpose: "Eventos globales GDELT 2.0 normalizados desde el raw feed oficial, preservando cada observación y su evidencia de origen.", automationPolicy: "allowed", note: "Fuente canónica automatizada por GLOBALEVENTID; el transporte raw se publica aproximadamente cada 15 minutos." },
  { key: "gdelt_mentions", layer: "noticias", purpose: "Menciones documentales GDELT 2.0 para medir propagación, diversidad de fuentes, confianza y contexto por evento.", automationPolicy: "allowed", note: "Se une a Events por GLOBALEVENTID y al GKG por MentionIdentifier = V2DOCUMENTIDENTIFIER." },
  { key: "gdelt_gkg", layer: "noticias", purpose: "Global Knowledge Graph 2.1 proyectado a documentos enlazados desde Mentions para extraer organizaciones, personas, temas, lugares y tono.", automationPolicy: "allowed", note: "VIDENTIA no replica todo el GKG: materializa sólo documentos enlazados por evidencia de Mentions y conserva provenance del artifact." },
]

export function runtimeSourceStatus(definition: SourceDefinition) {
  if (definition.automationPolicy === "manual_only") return { status: "manual_only" as const, configured: false, missing: [] as string[] }
  const required = definition.credentialEnv ?? []
  const missingRequired = required.filter(name => !String(process.env[name] ?? "").trim())
  const alternatives = definition.credentialAnyOf ?? []
  const hasAlternative = alternatives.length === 0 || alternatives.some(name => String(process.env[name] ?? "").trim())
  const missingAlternative = hasAlternative ? [] : [alternatives.join(" o ")]
  const missing = [...missingRequired, ...missingAlternative]
  if (definition.key === "openalex" || definition.key === "crossref") return { status: missing.length ? "ready_basic" as const : "ready" as const, configured: true, missing }
  if (definition.automationPolicy === "credentials_required" && missing.length) return { status: "credentials_required" as const, configured: false, missing }
  return { status: "ready" as const, configured: true, missing }
}

export function sourceDefinition(key: string) {
  return SOURCE_NETWORK.find(item => item.key === key) ?? null
}
