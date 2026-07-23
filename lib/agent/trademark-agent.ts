/**
 * Trademark Agent — orquestador interno de inteligencia marcaria.
 */

import OpenAI from "openai"
import { VienaClassifier, type VienaClassification } from "./viena-classifier"
import { NizaClassifier, type NizaClassification } from "./niza-classifier"
import { ConflictEngine, type ConflictReport } from "./conflict-engine"
import { searchInapi } from "@/lib/inapi/client"
import type { Marca } from "@/types/marca"

export interface TrademarkAgentRequest {
  imageBase64: string
  imageMimeType?: string
  nombreMarca: string
  descripcion?: string
  industria?: string
  visualScore?: number
  repositorio?: Marca[]
}

export interface TrademarkInsightReport {
  marca: string
  timestamp: string
  costo_estimado_usd: number
  tokens_totales: number
  viena: VienaClassification
  niza: NizaClassification
  conflictos: ConflictReport
  registrabilidad?: {
    disponible: boolean
    decision: "REVISAR" | "SIN_ANTECEDENTES_ACTIVOS" | "FUENTE_NO_DISPONIBLE"
    marca_encontrada?: {
      nombre: string
      solicitante: string
      clase_niza: string
      estado: string
      fecha_registro?: string
      pais: string
      numero_registro?: string
      numero_solicitud?: string
    }
    antecedentes: Array<{
      id: string
      nombre: string
      solicitante: string
      estado: string
      clases: string[]
      numero_registro: string
      numero_solicitud: string
      puntaje_relevancia: number
      razones: string[]
    }>
    conflictos_reales: number
    recomendacion: string
    fuente: {
      nombre: "INAPI"
      modo: "consulta-live"
      consulta: string
      tipo: "nombre"
      match: "contiene"
      consultado_en: string
    }
    calidad: {
      confianza: "alta" | "media" | "baja"
      cobertura_clases: number
      resultados_totales: number
      resultados_activos: number
      advertencias: string[]
    }
  }
  informe: {
    resumen_ejecutivo: string
    analisis_conflictos: string
    nivel_riesgo_global: "ALTO" | "MEDIO" | "BAJO"
    recomendaciones: string[]
    proximos_pasos: string[]
    disclaimer: string
  }
  pipeline_ms: number
}

const REPORT_SYSTEM_PROMPT = `Eres un analista interno senior de propiedad intelectual para una plataforma chilena de apoyo a decisiones.

Redacta para CEO, administración y analistas. Sé directo, corporativo y verificable.
Nunca declares que una marca es registrable, disponible, aprobada o rechazada jurídicamente.
Distingue datos INAPI, inferencias del motor y limitaciones. No reemplazas asesoría jurídica.`

export class TrademarkAgent {
  private vienaClassifier: VienaClassifier
  private nizaClassifier: NizaClassifier
  private openai: OpenAI

  constructor() {
    this.vienaClassifier = new VienaClassifier()
    this.nizaClassifier = new NizaClassifier()
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  async analyze(req: TrademarkAgentRequest): Promise<TrademarkInsightReport> {
    const start = Date.now()
    let tokens_totales = 0

    const [viena, niza] = await Promise.all([
      this.vienaClassifier.classify(req.imageBase64, req.imageMimeType),
      this.nizaClassifier.classify({
        nombre: req.nombreMarca,
        descripcion: req.descripcion,
        industria: req.industria,
      }),
    ])

    tokens_totales += viena.tokens_used + niza.tokens_used

    const conflictEngine = new ConflictEngine(req.repositorio)
    const conflictos = conflictEngine.analyze({
      vienaCodes: viena.codes,
      nizaClases: niza.clases,
      visualScore: req.visualScore,
      nombreMarca: req.nombreMarca,
    })

    let registrabilidad: TrademarkInsightReport["registrabilidad"] | undefined
    try {
      registrabilidad = await this.searchInapiAvailability(req.nombreMarca, niza.clases)
    } catch (error) {
      console.error("[trademark-agent] INAPI unavailable", error)
      registrabilidad = buildUnavailableInapiResult(req.nombreMarca)
    }

    const informe = await this.generateReport({
      nombreMarca: req.nombreMarca,
      viena,
      niza,
      conflictos,
      registrabilidad,
      visualScore: req.visualScore,
    })
    tokens_totales += informe.tokens_used

    return {
      marca: req.nombreMarca,
      timestamp: new Date().toISOString(),
      costo_estimado_usd: Number(((tokens_totales / 1000) * 0.01).toFixed(4)),
      tokens_totales,
      viena,
      niza,
      conflictos,
      registrabilidad,
      informe: informe.data,
      pipeline_ms: Date.now() - start,
    }
  }

  private async generateReport(params: {
    nombreMarca: string
    viena: VienaClassification
    niza: NizaClassification
    conflictos: ConflictReport
    registrabilidad?: TrademarkInsightReport["registrabilidad"]
    visualScore?: number
  }) {
    const { nombreMarca, viena, niza, conflictos, registrabilidad, visualScore } = params
    const vienaResumen = viena.codes.slice(0, 5).map((c) => `${c.code} (${c.titulo}): ${c.elemento}`).join("\n")
    const nizaResumen = niza.clases.map((c) => `Clase ${c.numero} [${c.tipo}]: ${c.titulo} — ${c.razon}`).join("\n")
    const conflictosTop = conflictos.conflictos.slice(0, 5).map((c) =>
      `• "${c.marca.nombre}" (${c.marca.pais}) — Score ${c.score_total}/100 — ${c.razon_conflicto}`,
    ).join("\n")
    const antecedentesInapi = registrabilidad?.antecedentes.slice(0, 5).map((item) =>
      `• ${item.nombre} — ${item.estado} — clases ${item.clases.join(", ") || "sin clase"} — relevancia ${item.puntaje_relevancia}/100`,
    ).join("\n") ?? "Fuente INAPI no disponible"

    const userPrompt = `Genera un informe ejecutivo interno para:

MARCA: "${nombreMarca}"
SCORE VISUAL: ${visualScore ?? "No disponible"}/100
RIESGO DEL MOTOR: ${conflictos.nivel_riesgo_global.toUpperCase()}
CONFLICTOS DEL REPOSITORIO: ${conflictos.conflictos.length}

ESTADO DE LA CONSULTA INAPI:
Decisión operativa: ${registrabilidad?.decision ?? "FUENTE_NO_DISPONIBLE"}
Confianza: ${registrabilidad?.calidad.confianza ?? "baja"}
Cobertura de clases: ${registrabilidad?.calidad.cobertura_clases ?? 0}%
Resultados activos: ${registrabilidad?.calidad.resultados_activos ?? 0}
Advertencias: ${registrabilidad?.calidad.advertencias.join("; ") || "ninguna"}

ANTECEDENTES INAPI PRIORIZADOS:
${antecedentesInapi}

CLASIFICACIÓN VIENA:
${vienaResumen || "No determinada"}

CLASIFICACIÓN NIZA:
${nizaResumen || "No determinada"}

OTROS CONFLICTOS DEL MOTOR:
${conflictosTop || "Sin conflictos relevantes"}

Responde ÚNICAMENTE con JSON válido:
{
  "resumen_ejecutivo": "Máximo 3 oraciones: decisión sugerida, evidencia principal y nivel de confianza.",
  "analisis_conflictos": "Distingue antecedentes INAPI de inferencias visuales y de clasificación.",
  "nivel_riesgo_global": "ALTO|MEDIO|BAJO",
  "recomendaciones": ["Acción concreta 1", "Acción concreta 2", "Acción concreta 3"],
  "proximos_pasos": ["Paso inmediato", "Paso posterior"],
  "disclaimer": "Indica que es una evaluación preliminar basada en fuentes disponibles y no una decisión de INAPI ni asesoría jurídica."
}`

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 900,
      temperature: 0.1,
      messages: [
        { role: "system", content: REPORT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? "{}"
    const tokens_used = response.usage?.total_tokens ?? 0

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
      return {
        data: {
          resumen_ejecutivo: String(parsed.resumen_ejecutivo ?? "Evaluación preliminar completada."),
          analisis_conflictos: String(parsed.analisis_conflictos ?? ""),
          nivel_riesgo_global: normalizeRisk(parsed.nivel_riesgo_global, conflictos.nivel_riesgo_global),
          recomendaciones: toStringArray(parsed.recomendaciones).slice(0, 5),
          proximos_pasos: toStringArray(parsed.proximos_pasos).slice(0, 4),
          disclaimer: "Evaluación preliminar basada en las fuentes disponibles. No constituye una decisión de INAPI ni reemplaza asesoría jurídica.",
        } satisfies TrademarkInsightReport["informe"],
        tokens_used,
      }
    } catch {
      return {
        data: {
          resumen_ejecutivo: "La evaluación preliminar fue completada, pero el resumen automático no pudo estructurarse.",
          analisis_conflictos: "Revise directamente los antecedentes y las clasificaciones mostradas.",
          nivel_riesgo_global: conflictos.nivel_riesgo_global.toUpperCase() as "ALTO" | "MEDIO" | "BAJO",
          recomendaciones: ["Revisar antecedentes INAPI priorizados", "Validar clases Niza relevantes"],
          proximos_pasos: ["Documentar la decisión", "Solicitar revisión jurídica cuando corresponda"],
          disclaimer: "Evaluación preliminar basada en las fuentes disponibles. No constituye una decisión de INAPI ni reemplaza asesoría jurídica.",
        },
        tokens_used,
      }
    }
  }

  private async searchInapiAvailability(
    nombreMarca: string,
    nizaClases: NizaClassification["clases"],
  ): Promise<TrademarkInsightReport["registrabilidad"]> {
    const consultedAt = new Date().toISOString()
    const marcasEncontradas = await searchInapi({
      query: nombreMarca,
      type: "nombre",
      matchMode: "2",
    })

    const requestedClasses = new Set(nizaClases.map((clase) => String(clase.numero)))
    const ranked = marcasEncontradas
      .map((marca) => rankInapiResult(marca, nombreMarca, requestedClasses))
      .sort((a, b) => b.score - a.score)

    const active = ranked.filter(({ marca }) => marca.estado === "Registrada" || marca.estado === "Pendiente")
    const sameClassActive = active.filter(({ marca }) => marca.niza.some((code) => requestedClasses.has(String(code))))
    const relevantActive = sameClassActive.length > 0 ? sameClassActive : active
    const top = relevantActive[0] ?? ranked[0]
    const coverage = calculateClassCoverage(ranked.map(({ marca }) => marca), requestedClasses)
    const confidence = determineConfidence(marcasEncontradas.length, coverage, requestedClasses.size)
    const warnings: string[] = []

    if (requestedClasses.size === 0) warnings.push("No se determinó una clase Niza para contrastar.")
    if (coverage < 100 && requestedClasses.size > 0) warnings.push("La consulta por nombre no cubrió todas las clases sugeridas.")
    if (marcasEncontradas.length === 0) warnings.push("Una búsqueda sin coincidencias no garantiza ausencia de conflicto.")

    const antecedentes = ranked.slice(0, 12).map(({ marca, score, reasons }) => ({
      id: marca.id,
      nombre: marca.nombre,
      solicitante: marca.solicitante,
      estado: marca.estado,
      clases: marca.niza,
      numero_registro: marca.numeroRegistro,
      numero_solicitud: String(marca.metadata?.numSolicitud ?? ""),
      puntaje_relevancia: score,
      razones: reasons,
    }))

    const base = {
      antecedentes,
      fuente: {
        nombre: "INAPI" as const,
        modo: "consulta-live" as const,
        consulta: nombreMarca,
        tipo: "nombre" as const,
        match: "contiene" as const,
        consultado_en: consultedAt,
      },
      calidad: {
        confianza,
        cobertura_clases: coverage,
        resultados_totales: marcasEncontradas.length,
        resultados_activos: active.length,
        advertencias: warnings,
      },
    }

    if (relevantActive.length > 0 && top) {
      return {
        ...base,
        disponible: false,
        decision: "REVISAR",
        marca_encontrada: toPrimaryReference(top.marca),
        conflictos_reales: relevantActive.length,
        recomendacion: sameClassActive.length > 0
          ? `Revisión prioritaria: existen ${sameClassActive.length} antecedentes activos en clases Niza relacionadas.`
          : `Revisión necesaria: existen ${active.length} antecedentes activos por nombre, aunque no se confirmó coincidencia de clase en esta consulta.`,
      }
    }

    return {
      ...base,
      disponible: true,
      decision: "SIN_ANTECEDENTES_ACTIVOS",
      marca_encontrada: top ? toPrimaryReference(top.marca) : undefined,
      conflictos_reales: 0,
      recomendacion: ranked.length > 0
        ? "No se detectaron antecedentes activos entre los resultados priorizados; existen registros históricos que deben conservarse como contexto."
        : "No se detectaron coincidencias en esta consulta por nombre. Verifique variantes, titulares y clases antes de decidir.",
    }
  }
}
=======
    nizaClases: NizaClassification["clases"],
  ): Promise<TrademarkInsightReport["registrabilidad"]> {
    const consultedAt = new Date().toISOString()
    const marcasEncontradas = await searchInapi({
      query: nombreMarca,
      type: "nombre",
      matchMode: "2",
    })

    const requestedClasses = new Set(nizaClases.map((clase) => String(clase.numero)))
    const ranked = marcasEncontradas
      .map((marca) => rankInapiResult(marca, nombreMarca, requestedClasses))
      .sort((a, b) => b.score - a.score)
>>>>>>> 2f0e65f9bf3a74124305c14e6708572e319fe56f

    const active = ranked.filter(({ marca }) => marca.estado === "Registrada" || marca.estado === "Pendiente")
    const sameClassActive = active.filter(({ marca }) => marca.niza.some((code) => requestedClasses.has(String(code))))
    const relevantActive = sameClassActive.length > 0 ? sameClassActive : active
    const top = relevantActive[0] ?? ranked[0]
    const coverage = calculateClassCoverage(ranked.map(({ marca }) => marca), requestedClasses)
    const confidence = determineConfidence(marcasEncontradas.length, coverage, requestedClasses.size)
    const warnings: string[] = []

    if (requestedClasses.size === 0) warnings.push("No se determinó una clase Niza para contrastar.")
    if (coverage < 100 && requestedClasses.size > 0) warnings.push("La consulta por nombre no cubrió todas las clases sugeridas.")
    if (marcasEncontradas.length === 0) warnings.push("Una búsqueda sin coincidencias no garantiza ausencia de conflicto.")

    const antecedentes = ranked.slice(0, 12).map(({ marca, score, reasons }) => ({
      id: marca.id,
      nombre: marca.nombre,
      solicitante: marca.solicitante,
      estado: marca.estado,
      clases: marca.niza,
      numero_registro: marca.numeroRegistro,
      numero_solicitud: String(marca.metadata?.numSolicitud ?? ""),
      puntaje_relevancia: score,
      razones: reasons,
    }))

    const base = {
      antecedentes,
      fuente: {
        nombre: "INAPI" as const,
        modo: "consulta-live" as const,
        consulta: nombreMarca,
        tipo: "nombre" as const,
        match: "contiene" as const,
        consultado_en: consultedAt,
      },
      calidad: {
        confianza,
        cobertura_clases: coverage,
        resultados_totales: marcasEncontradas.length,
        resultados_activos: active.length,
        advertencias: warnings,
      },
    }

    if (relevantActive.length > 0 && top) {
      return {
<<<<<<< HEAD
        disponible,
        marca_encontrada: {
          nombre: marca.nombre,
          solicitante: marca.solicitante || 'Desconocido',
          clase_niza: marca.niza?.join(', ') || 'N/A',
          estado: marca.estado,
          fecha_registro: marca.metadata?.numSolicitud
            ? `Solicitud ${marca.metadata.numSolicitud}`
            : '',
          pais: 'Chile',
        },
        conflictos_reales: todasLasMarcas.length,
        recomendacion,
      }
    }

    // Búsqueda 2: Por nombre en clase Niza principal
    if (nizaClases.length > 0) {
      const clasePrincipal = nizaClases.find(c => c.tipo === 'principal')?.numero ?? nizaClases[0].numero
      const conflictosClase = await searchInapi({
        query: String(clasePrincipal),
        type: 'clase_niza',
        matchMode: '2',
      })

      if (conflictosClase.length > 0) {
        return {
          disponible: false,
          conflictos_reales: conflictosClase.length,
          recomendacion: `⚠ Se encontraron ${conflictosClase.length} marca(s) en la misma clase Niza ${clasePrincipal}. Riesgo moderado. Consulta con un abogado de PI.`,
        }
      }
    }

    // Sin conflictos encontrados en INAPI
=======
        ...base,
        disponible: false,
        decision: "REVISAR",
        marca_encontrada: toPrimaryReference(top.marca),
        conflictos_reales: relevantActive.length,
        recomendacion: sameClassActive.length > 0
          ? `Revisión prioritaria: existen ${sameClassActive.length} antecedentes activos en clases Niza relacionadas.`
          : `Revisión necesaria: existen ${active.length} antecedentes activos por nombre, aunque no se confirmó coincidencia de clase en esta consulta.`,
      }
    }

>>>>>>> 2f0e65f9bf3a74124305c14e6708572e319fe56f
    return {
      ...base,
      disponible: true,
      decision: "SIN_ANTECEDENTES_ACTIVOS",
      marca_encontrada: top ? toPrimaryReference(top.marca) : undefined,
      conflictos_reales: 0,
<<<<<<< HEAD
      recomendacion: 'No se encontraron antecedentes en el registro de INAPI para las búsquedas realizadas. Resultado referencial — INAPI determina la registrabilidad final.',
=======
      recomendacion: ranked.length > 0
        ? "No se detectaron antecedentes activos entre los resultados priorizados; existen registros históricos que deben conservarse como contexto."
        : "No se detectaron coincidencias en esta consulta por nombre. Verifique variantes, titulares y clases antes de decidir.",
>>>>>>> 2f0e65f9bf3a74124305c14e6708572e319fe56f
    }
  }
}

function rankInapiResult(marca: Marca, query: string, requestedClasses: Set<string>) {
  const normalizedName = normalizeComparable(marca.nombre)
  const normalizedQuery = normalizeComparable(query)
  const exact = normalizedName === normalizedQuery
  const starts = normalizedName.startsWith(normalizedQuery)
  const classOverlap = marca.niza.filter((code) => requestedClasses.has(String(code))).length
  const active = marca.estado === "Registrada" || marca.estado === "Pendiente"

  let score = active ? 40 : 5
  const reasons: string[] = [active ? "antecedente activo" : "antecedente histórico"]
  if (exact) {
    score += 35
    reasons.push("nombre exacto")
  } else if (starts) {
    score += 20
    reasons.push("nombre comienza igual")
  } else if (normalizedName.includes(normalizedQuery)) {
    score += 12
    reasons.push("nombre contiene la consulta")
  }
  if (classOverlap > 0) {
    score += Math.min(25, classOverlap * 10)
    reasons.push(`${classOverlap} clase(s) Niza coincidente(s)`)
  }

  return { marca, score: Math.min(100, score), reasons }
}

function calculateClassCoverage(marcas: Marca[], requestedClasses: Set<string>) {
  if (requestedClasses.size === 0) return 0
  const covered = new Set<string>()
  for (const marca of marcas) {
    for (const code of marca.niza) {
      if (requestedClasses.has(String(code))) covered.add(String(code))
    }
  }
  return Math.round((covered.size / requestedClasses.size) * 100)
}

function determineConfidence(results: number, coverage: number, requestedClassCount: number): "alta" | "media" | "baja" {
  if (requestedClassCount > 0 && results > 0 && coverage === 100) return "alta"
  if (results > 0 || coverage > 0) return "media"
  return "baja"
}

function toPrimaryReference(marca: Marca) {
  return {
    nombre: marca.nombre,
    solicitante: marca.solicitante || "Desconocido",
    clase_niza: marca.niza.join(", ") || "N/A",
    estado: marca.estado,
    fecha_registro: marca.fecha || "",
    pais: "Chile",
    numero_registro: marca.numeroRegistro || "",
    numero_solicitud: String(marca.metadata?.numSolicitud ?? ""),
  }
}

function buildUnavailableInapiResult(query: string): TrademarkInsightReport["registrabilidad"] {
  return {
    disponible: false,
    decision: "FUENTE_NO_DISPONIBLE",
    antecedentes: [],
    conflictos_reales: 0,
    recomendacion: "La fuente INAPI no estuvo disponible. No tome una decisión hasta repetir la consulta.",
    fuente: {
      nombre: "INAPI",
      modo: "consulta-live",
      consulta: query,
      tipo: "nombre",
      match: "contiene",
      consultado_en: new Date().toISOString(),
    },
    calidad: {
      confianza: "baja",
      cobertura_clases: 0,
      resultados_totales: 0,
      resultados_activos: 0,
      advertencias: ["Fuente INAPI no disponible durante el análisis."],
    },
  }
}

function normalizeComparable(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ")
}

function normalizeRisk(value: unknown, fallback: string): "ALTO" | "MEDIO" | "BAJO" {
  const normalized = String(value ?? fallback).toUpperCase()
  return normalized === "ALTO" || normalized === "MEDIO" ? normalized : "BAJO"
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}
