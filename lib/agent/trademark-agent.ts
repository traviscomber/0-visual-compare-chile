/**
 * Trademark Agent — orquestador interno de inteligencia marcaria.
 */

import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { VienaClassifier, type VienaClassification } from "./viena-classifier"
import { NizaClassifier, type NizaClassification } from "./niza-classifier"
import { ConflictEngine, type ConflictReport } from "./conflict-engine"
import { searchTrademarkIntelligently, rankTrademarkSearchResults } from "@/lib/inapi/intelligent-search"
import { analyzeTrademarkVisualCandidates } from "@/lib/image/trademark-visual-similarity"
import { buildAttempt, maxTier, modelForTier, totalRoutingCostUsd, type ModelAttempt, type ModelRoutingSummary, type ModelTier } from "@/lib/ai/model-router"
import type { Marca } from "@/types/marca"

export interface TrademarkAgentRequest { imageBase64?: string; imageMimeType?: string; nombreMarca: string; descripcion?: string; industria?: string; visualScore?: number; repositorio?: Marca[] }
export interface TrademarkInsightReport {
  marca: string; timestamp: string; costo_estimado_usd: number; tokens_totales: number
  routing: { max_tier_used: ModelTier; escalated: boolean; report: ModelRoutingSummary }
  viena: VienaClassification
  visual_fingerprint: { codes: string[]; categories: string[]; divisions: string[]; labels: string[] }
  niza: NizaClassification; conflictos: ConflictReport
  registrabilidad?: {
    disponible: boolean; decision: "REVISAR" | "SIN_ANTECEDENTES_ACTIVOS" | "FUENTE_NO_DISPONIBLE"
    marca_encontrada?: { nombre: string; solicitante: string; clase_niza: string; estado: string; fecha_registro?: string; pais: string; numero_registro?: string; numero_solicitud?: string }
    antecedentes: Array<{ id: string; nombre: string; solicitante: string; estado: string; clases: string[]; numero_registro: string; numero_solicitud: string; puntaje_relevancia: number; razones: string[]; similitud_denominativa: number; similitud_fonetica: number; similitud_visual: number | null; similitud_figurativa: number | null; viena_compartida: string[]; elementos_visuales_compartidos: string[]; imagen_url?: string }>
    conflictos_reales: number; recomendacion: string
    fuente: { nombre: "INAPI"; modo: "consulta-live"; consulta: string; tipo: "nombre"; match: "inteligente"; consultado_en: string }
    calidad: { confianza: "alta" | "media" | "baja"; cobertura_clases: number; resultados_totales: number; resultados_activos: number; advertencias: string[]; estrategias_ejecutadas: number; estrategias: Array<{ id: string; label: string; query: string }>; resultados_brutos: number; duplicados_eliminados: number; imagenes_comparadas: number; antecedentes_con_viena: number }
  }
  informe: { resumen_ejecutivo: string; analisis_conflictos: string; nivel_riesgo_global: "ALTO" | "MEDIO" | "BAJO"; recomendaciones: string[]; proximos_pasos: string[]; disclaimer: string }
  pipeline_ms: number
}

const ReportSchema = z.object({ resumen_ejecutivo: z.string(), analisis_conflictos: z.string(), nivel_riesgo_global: z.enum(["ALTO", "MEDIO", "BAJO"]), recomendaciones: z.array(z.string()), proximos_pasos: z.array(z.string()) })
const REPORT_SYSTEM_PROMPT = `Eres un analista interno senior de propiedad intelectual para una plataforma chilena de apoyo a decisiones. Sé directo, corporativo y verificable. Nunca declares que una marca es registrable, disponible, aprobada o rechazada jurídicamente. Distingue datos INAPI, similitud calculada e interpretación. No reemplazas asesoría jurídica.`

export class TrademarkAgent {
  private vienaClassifier = new VienaClassifier()
  private nizaClassifier = new NizaClassifier()
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  async analyze(req: TrademarkAgentRequest): Promise<TrademarkInsightReport> {
    const start = Date.now()
    const [viena, niza] = await Promise.all([
      this.vienaClassifier.classify(req.imageBase64, req.imageMimeType),
      this.nizaClassifier.classify({ nombre: req.nombreMarca, descripcion: req.descripcion, industria: req.industria }),
    ])
    const conflictos = new ConflictEngine(req.repositorio).analyze({ vienaCodes: viena.codes, nizaClases: niza.clases, visualScore: req.visualScore, nombreMarca: req.nombreMarca })
    let registrabilidad: TrademarkInsightReport["registrabilidad"]
    try { registrabilidad = await this.searchInapiAvailability(req.nombreMarca, niza.clases, viena, req.imageBase64) }
    catch (error) { console.error("[trademark-agent] INAPI unavailable", error); registrabilidad = buildUnavailableInapiResult(req.nombreMarca) }
    const visual_fingerprint = { codes: viena.codes.map((item) => item.code), categories: [...new Set(viena.codes.map((item) => item.code.split(".")[0]))], divisions: [...new Set(viena.codes.map((item) => item.code.split(".").slice(0, 2).join(".")))], labels: viena.codes.map((item) => item.titulo) }
    const reportTier = chooseReportTier({ viena, niza, conflictos, registrabilidad })
    const informe = await this.generateReport({ nombreMarca: req.nombreMarca, viena, niza, conflictos, registrabilidad, visualScore: req.visualScore, tier: reportTier })
    const tokens_totales = viena.tokens_used + niza.tokens_used + informe.tokens_used
    const costo_estimado_usd = Number((viena.estimated_cost_usd + niza.estimated_cost_usd + informe.estimated_cost_usd).toFixed(6))
    return { marca: req.nombreMarca, timestamp: new Date().toISOString(), costo_estimado_usd, tokens_totales, routing: { max_tier_used: maxTier(maxTier(viena.routing.final_tier, niza.routing.final_tier), informe.routing.final_tier), escalated: viena.routing.escalated || niza.routing.escalated || reportTier !== "luna", report: informe.routing }, viena, visual_fingerprint, niza, conflictos, registrabilidad, informe: informe.data, pipeline_ms: Date.now() - start }
  }

  private async generateReport(params: { nombreMarca: string; viena: VienaClassification; niza: NizaClassification; conflictos: ConflictReport; registrabilidad?: TrademarkInsightReport["registrabilidad"]; visualScore?: number; tier: ModelTier }) {
    const { nombreMarca, viena, niza, conflictos, registrabilidad, visualScore, tier } = params
    const antecedentesInapi = registrabilidad?.antecedentes.slice(0, 5).map((item) => `• ${item.nombre} — ${item.estado} — clases ${item.clases.join(", ") || "sin clase"} — relevancia ${item.puntaje_relevancia}/100 — denominativa ${item.similitud_denominativa}% — fonética ${item.similitud_fonetica}%${item.similitud_visual != null ? ` — estructural ${item.similitud_visual}%` : ""}${item.similitud_figurativa != null ? ` — figurativa Viena ${item.similitud_figurativa}%` : ""} — ${item.razones.join("; ")}`).join("\n") ?? "Fuente INAPI no disponible"
    const userPrompt = `Genera un informe ejecutivo interno para MARCA: "${nombreMarca}". SCORE VISUAL EXTERNO: ${visualScore ?? "No disponible"}/100. RIESGO DEL MOTOR: ${conflictos.nivel_riesgo_global.toUpperCase()}. Decisión operativa INAPI: ${registrabilidad?.decision ?? "FUENTE_NO_DISPONIBLE"}. Confianza: ${registrabilidad?.calidad.confianza ?? "baja"}. Imágenes comparadas: ${registrabilidad?.calidad.imagenes_comparadas ?? 0}. Antecedentes con Viena: ${registrabilidad?.calidad.antecedentes_con_viena ?? 0}. ANTECEDENTES:\n${antecedentesInapi}\nHUELLA VIENA: ${viena.codes.slice(0, 6).map((c) => `${c.code}: ${c.elemento}`).join("; ") || "No determinada"}. NIZA: ${niza.clases.map((c) => `Clase ${c.numero}: ${c.titulo}`).join("; ") || "No determinada"}. Entrega resumen máximo 3 oraciones, análisis, nivel de riesgo, hasta 5 recomendaciones y 4 próximos pasos.`
    const model = modelForTier(tier)
    const response = await this.openai.chat.completions.parse({ model, max_completion_tokens: 900, messages: [{ role: "system", content: REPORT_SYSTEM_PROMPT }, { role: "user", content: userPrompt }], response_format: zodResponseFormat(ReportSchema, "trademark_report") })
    const parsed = response.choices[0]?.message.parsed
    if (!parsed) throw new Error("Trademark report returned no schema-valid output")
    const attempts: ModelAttempt[] = [buildAttempt({ tier, model, confidence: reportConfidence(registrabilidad), usage: response.usage, reason: `risk-aware-report:${tier}` })]
    return { data: { resumen_ejecutivo: parsed.resumen_ejecutivo, analisis_conflictos: parsed.analisis_conflictos, nivel_riesgo_global: normalizeRisk(parsed.nivel_riesgo_global, conflictos.nivel_riesgo_global), recomendaciones: parsed.recomendaciones.slice(0, 5), proximos_pasos: parsed.proximos_pasos.slice(0, 4), disclaimer: "Evaluación preliminar basada en las fuentes disponibles. No constituye una decisión de INAPI ni reemplaza asesoría jurídica." }, tokens_used: attempts.reduce((sum, attempt) => sum + attempt.total_tokens, 0), estimated_cost_usd: totalRoutingCostUsd(attempts), routing: { final_tier: tier, final_model: model, escalated: tier !== "luna", attempts } satisfies ModelRoutingSummary }
  }

  private async searchInapiAvailability(nombreMarca: string, nizaClases: NizaClassification["clases"], viena: VienaClassification, imageBase64?: string): Promise<TrademarkInsightReport["registrabilidad"]> {
    const consultedAt = new Date().toISOString()
    const execution = await searchTrademarkIntelligently(nombreMarca)
    const requestedClasses = new Set(nizaClases.map((clase) => String(clase.numero)))
    const ranked = rankTrademarkSearchResults(execution, nombreMarca, [...requestedClasses])
    const visualAnalysis = await analyzeTrademarkVisualCandidates(imageBase64, viena.codes, ranked.slice(0, 6).map(({ marca }) => marca))
    const enrichedById = new Map(visualAnalysis.candidates.map((item) => [item.id, item]))
    const rankedEnriched = ranked.map((item) => ({ ...item, marca: enrichedById.get(item.marca.id) ?? item.marca }))
    const active = rankedEnriched.filter(({ marca }) => marca.estado === "Registrada" || marca.estado === "Pendiente")
    const sameClassActive = active.filter(({ marca }) => marca.niza.some((code) => requestedClasses.has(String(code))))
    const relevantActive = sameClassActive.length > 0 ? sameClassActive : active
    const top = relevantActive[0] ?? rankedEnriched[0]
    const coverage = calculateClassCoverage(rankedEnriched.map(({ marca }) => marca), requestedClasses)
    const confidence = determineConfidence(execution.deduplicatedResultCount, coverage, requestedClasses.size, execution.completedStrategies.length)
    const warnings: string[] = []
    if (requestedClasses.size === 0) warnings.push("No se determinó una clase Niza para contrastar.")
    if (coverage < 100 && requestedClasses.size > 0) warnings.push("Los antecedentes recuperados no cubren todas las clases sugeridas.")
    if (execution.failedStrategies.length > 0) warnings.push(`${execution.failedStrategies.length} estrategia(s) de búsqueda no pudieron completarse.`)
    if (execution.deduplicatedResultCount === 0) warnings.push("Una búsqueda sin coincidencias no garantiza ausencia de conflicto.")
    const imageComparisons = [...visualAnalysis.signals.values()].filter((signal) => signal.structuralSimilarity != null).length
    const viennaComparisons = [...visualAnalysis.signals.values()].filter((signal) => signal.figurativeSimilarity != null).length
    if (imageBase64 && imageComparisons === 0) warnings.push("La consulta incluyó imagen, pero no todos los antecedentes exponen archivos gráficos comparables.")

    const antecedentes = rankedEnriched.slice(0, 12).map(({ marca, score, reasons, denominativeSimilarity, phoneticSimilarity }) => {
      const visual = visualAnalysis.signals.get(marca.id)
      const structural = visual?.structuralSimilarity ?? null
      const figurative = visual?.figurativeSimilarity ?? null
      const enrichedReasons = [...reasons]
      if (structural != null && structural >= 70) enrichedReasons.push(`similitud visual estructural ${structural}%`)
      if (figurative != null && figurative >= 60) enrichedReasons.push(`similitud figurativa Viena ${figurative}%`)
      if (visual?.sharedViennaLabels.length) enrichedReasons.push(`comparte ${visual.sharedViennaLabels.slice(0, 2).join(" y ")}`)
      const visualEvidence = [structural, figurative].filter((value): value is number => value != null)
      const visualComposite = visualEvidence.length ? visualEvidence.reduce((sum, value) => sum + value, 0) / visualEvidence.length : null
      const relevance = visualComposite != null ? Math.min(100, Math.round(score * 0.78 + visualComposite * 0.22)) : score
      return { id: marca.id, nombre: marca.nombre, solicitante: marca.solicitante, estado: marca.estado, clases: marca.niza, numero_registro: marca.numeroRegistro, numero_solicitud: String(marca.metadata?.numSolicitud ?? ""), puntaje_relevancia: relevance, razones: enrichedReasons, similitud_denominativa: denominativeSimilarity, similitud_fonetica: phoneticSimilarity, similitud_visual: structural, similitud_figurativa: figurative, viena_compartida: visual?.sharedViennaCodes ?? [], elementos_visuales_compartidos: visual?.sharedViennaLabels ?? [], ...(visual?.imageUrl || marca.imagenUrl ? { imagen_url: visual?.imageUrl ?? marca.imagenUrl } : {}) }
    })
    const base = { antecedentes, fuente: { nombre: "INAPI" as const, modo: "consulta-live" as const, consulta: nombreMarca, tipo: "nombre" as const, match: "inteligente" as const, consultado_en: consultedAt }, calidad: { confianza: confidence, cobertura_clases: coverage, resultados_totales: execution.deduplicatedResultCount, resultados_activos: active.length, advertencias: warnings, estrategias_ejecutadas: execution.completedStrategies.length, estrategias: execution.completedStrategies.map(({ id, label, query }) => ({ id, label, query })), resultados_brutos: execution.rawResultCount, duplicados_eliminados: Math.max(0, execution.rawResultCount - execution.deduplicatedResultCount), imagenes_comparadas: imageComparisons, antecedentes_con_viena: viennaComparisons } }
    if (relevantActive.length > 0 && top) return { ...base, disponible: false, decision: "REVISAR", marca_encontrada: toPrimaryReference(top.marca), conflictos_reales: relevantActive.length, recomendacion: sameClassActive.length > 0 ? `Revisión prioritaria: existen ${sameClassActive.length} antecedentes activos en clases Niza relacionadas, con señales denominativas, fonéticas y visuales cuando la fuente las permite.` : `Revisión necesaria: existen ${active.length} antecedentes activos recuperados por la búsqueda inteligente.` }
    return { ...base, disponible: true, decision: "SIN_ANTECEDENTES_ACTIVOS", marca_encontrada: top ? toPrimaryReference(top.marca) : undefined, conflictos_reales: 0, recomendacion: rankedEnriched.length > 0 ? "No se detectaron antecedentes activos entre los resultados priorizados; conserve los históricos como contexto." : "No se detectaron coincidencias en las estrategias ejecutadas. Esto no garantiza registrabilidad." }
  }
}

function chooseReportTier(params: { viena: VienaClassification; niza: NizaClassification; conflictos: ConflictReport; registrabilidad?: TrademarkInsightReport["registrabilidad"] }): ModelTier { const upstreamTier = maxTier(params.viena.routing.final_tier, params.niza.routing.final_tier); const low = params.registrabilidad?.calidad.confianza === "baja"; const high = params.conflictos.nivel_riesgo_global.toUpperCase() === "ALTO"; if (upstreamTier === "sol" || (low && high)) return "sol"; if (upstreamTier === "terra" || low || high) return "terra"; return "luna" }
function reportConfidence(r?: TrademarkInsightReport["registrabilidad"]) { return r?.calidad.confianza === "alta" ? 0.95 : r?.calidad.confianza === "media" ? 0.75 : 0.45 }
function calculateClassCoverage(marcas: Marca[], requested: Set<string>) { if (!requested.size) return 0; const covered = new Set<string>(); for (const marca of marcas) for (const code of marca.niza) if (requested.has(String(code))) covered.add(String(code)); return Math.round((covered.size / requested.size) * 100) }
function determineConfidence(results: number, coverage: number, classes: number, strategies: number): "alta" | "media" | "baja" { if (strategies >= 2 && classes > 0 && results > 0 && coverage === 100) return "alta"; if (results > 0 || coverage > 0) return "media"; return "baja" }
function toPrimaryReference(marca: Marca) { return { nombre: marca.nombre, solicitante: marca.solicitante || "Desconocido", clase_niza: marca.niza.join(", ") || "N/A", estado: marca.estado, fecha_registro: marca.fecha || "", pais: "Chile", numero_registro: marca.numeroRegistro || "", numero_solicitud: String(marca.metadata?.numSolicitud ?? "") } }
function buildUnavailableInapiResult(query: string): TrademarkInsightReport["registrabilidad"] { return { disponible: false, decision: "FUENTE_NO_DISPONIBLE", antecedentes: [], conflictos_reales: 0, recomendacion: "La fuente INAPI no estuvo disponible. No tome una decisión hasta repetir la consulta.", fuente: { nombre: "INAPI", modo: "consulta-live", consulta: query, tipo: "nombre", match: "inteligente", consultado_en: new Date().toISOString() }, calidad: { confianza: "baja", cobertura_clases: 0, resultados_totales: 0, resultados_activos: 0, advertencias: ["Fuente INAPI no disponible durante el análisis."], estrategias_ejecutadas: 0, estrategias: [], resultados_brutos: 0, duplicados_eliminados: 0, imagenes_comparadas: 0, antecedentes_con_viena: 0 } } }
function normalizeRisk(value: unknown, fallback: string): "ALTO" | "MEDIO" | "BAJO" { const normalized = String(value ?? fallback).toUpperCase(); return normalized === "ALTO" || normalized === "MEDIO" ? normalized : "BAJO" }
