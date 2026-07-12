/**
 * Conflict Engine — Motor de detección de conflictos de marca
 * Cruza clasificaciones Niza+Viena contra el repositorio de marcas existentes
 * y genera un score de riesgo ponderado.
 */

import type { Marca } from '@/types/marca'
import type { VienaCode } from './viena-classifier'
import type { NizaClass } from './niza-classifier'
import { API_PORTAL_MARCAS } from '@/lib/api-portal-data'

export interface ConflictMatch {
  marca: Marca
  score_total: number        // 0-100
  score_visual: number       // score externo del motor SHA/pHash/embeddings
  viena_overlap: string[]    // códigos Viena en común
  niza_overlap: string[]     // clases Niza en común
  nivel_riesgo: 'alto' | 'medio' | 'bajo'
  razon_conflicto: string
}

export interface ConflictReport {
  total_marcas_analizadas: number
  conflictos: ConflictMatch[]
  nivel_riesgo_global: 'alto' | 'medio' | 'bajo'
  breakdown: {
    alto: number
    medio: number
    bajo: number
  }
}

// Pesos del scoring compuesto
const W_VISUAL = 0.50
const W_VIENA  = 0.30
const W_NIZA   = 0.20

// Umbrales de riesgo
const UMBRAL_ALTO  = 65
const UMBRAL_MEDIO = 40

export class ConflictEngine {
  private repositorio: Marca[]

  constructor(repositorio?: Marca[]) {
    // En producción se reemplaza con los 350K de INAPI
    this.repositorio = repositorio ?? API_PORTAL_MARCAS
  }

  /**
   * Busca conflictos dada la clasificación de una marca nueva
   */
  analyze(params: {
    vienaCodes: VienaCode[]
    nizaClases: NizaClass[]
    visualScore?: number   // score 0-100 del motor de comparación, si ya existe
    nombreMarca?: string
  }): ConflictReport {
    const { vienaCodes, nizaClases, visualScore = 0, nombreMarca = '' } = params

    const vienaSet = new Set(vienaCodes.map(v => v.code))
    const nizaSet = new Set(nizaClases.map(n => n.numero))

    const conflictos: ConflictMatch[] = []

    for (const marca of this.repositorio) {
      const viena_overlap = marca.viena.filter(v => vienaSet.has(v))
      const niza_overlap  = marca.niza.filter(n => nizaSet.has(n))

      // Score Viena: % de overlap sobre el total de códigos de la marca analizada
      const score_viena = vienaSet.size > 0
        ? (viena_overlap.length / vienaSet.size) * 100
        : 0

      // Score Niza: % de overlap sobre el total de clases propuestas
      const score_niza = nizaSet.size > 0
        ? (niza_overlap.length / nizaSet.size) * 100
        : 0

      // Score de similitud de nombre (Levenshtein simplificado)
      const nombre_sim = nombreMarca
        ? this.nameSimilarity(nombreMarca.toUpperCase(), marca.nombre.toUpperCase()) * 100
        : 0

      // Score visual: el externo pasado como param o el de nombre si no hay
      const score_v = visualScore > 0 ? visualScore : nombre_sim

      // Score compuesto ponderado
      const score_total = Math.round(
        score_v   * W_VISUAL +
        score_viena * W_VIENA +
        score_niza  * W_NIZA
      )

      // Solo incluir si hay algún overlap real o score significativo
      if (score_total < 15 && viena_overlap.length === 0 && niza_overlap.length === 0) continue

      const nivel_riesgo = score_total >= UMBRAL_ALTO  ? 'alto'
                         : score_total >= UMBRAL_MEDIO ? 'medio'
                         :                               'bajo'

      const razon_conflicto = this.buildRazon(marca, viena_overlap, niza_overlap, score_total)

      conflictos.push({
        marca,
        score_total,
        score_visual: score_v,
        viena_overlap,
        niza_overlap,
        nivel_riesgo,
        razon_conflicto,
      })
    }

    // Ordenar por score descendente
    conflictos.sort((a, b) => b.score_total - a.score_total)

    const breakdown = {
      alto:  conflictos.filter(c => c.nivel_riesgo === 'alto').length,
      medio: conflictos.filter(c => c.nivel_riesgo === 'medio').length,
      bajo:  conflictos.filter(c => c.nivel_riesgo === 'bajo').length,
    }

    const nivel_riesgo_global: 'alto' | 'medio' | 'bajo' =
      breakdown.alto  > 0 ? 'alto'  :
      breakdown.medio > 0 ? 'medio' : 'bajo'

    return {
      total_marcas_analizadas: this.repositorio.length,
      conflictos: conflictos.slice(0, 20), // top 20
      nivel_riesgo_global,
      breakdown,
    }
  }

  /**
   * Similitud de nombres — combina bigram Jaccard + deteccion de prefijo/substring.
   * Un nombre que es prefijo del otro o que lo contiene como substring recibe score alto.
   */
  private nameSimilarity(a: string, b: string): number {
    if (a === b) return 1
    if (a.length < 2 || b.length < 2) return 0

    // Limpiar palabras vacias comunes (EL, LA, LOS, DE, DEL)
    const clean = (s: string) => s.replace(/\b(EL|LA|LOS|LAS|DE|DEL|Y|EN)\b/g, '').replace(/\s+/g, ' ').trim()
    const ca = clean(a)
    const cb = clean(b)

    // Prefijo: "TORO" es prefijo de "TORITO" → alta similitud
    if (ca.startsWith(cb) || cb.startsWith(ca)) {
      const shorter = Math.min(ca.length, cb.length)
      const longer  = Math.max(ca.length, cb.length)
      return 0.75 + (shorter / longer) * 0.25  // 0.75–1.0
    }

    // Substring: "TORO" aparece dentro de "EL TORO ENERGY"
    if (ca.includes(cb) || cb.includes(ca)) {
      const shorter = Math.min(ca.length, cb.length)
      const longer  = Math.max(ca.length, cb.length)
      return 0.60 + (shorter / longer) * 0.20  // 0.60–0.80
    }

    // Bigram Jaccard
    const bigrams = (s: string) => {
      const set = new Set<string>()
      for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2))
      return set
    }
    const ba = bigrams(ca)
    const bb = bigrams(cb)
    const intersection = [...ba].filter(x => bb.has(x)).length
    const union = new Set([...ba, ...bb]).size

    return union === 0 ? 0 : intersection / union
  }

  private buildRazon(
    marca: Marca,
    viena_overlap: string[],
    niza_overlap: string[],
    score: number,
  ): string {
    const parts: string[] = []
    if (viena_overlap.length > 0)
      parts.push(`comparte ${viena_overlap.length} código(s) Viena (${viena_overlap.slice(0, 3).join(', ')})`)
    if (niza_overlap.length > 0)
      parts.push(`opera en ${niza_overlap.length} clase(s) Niza coincidente(s) (${niza_overlap.join(', ')})`)
    if (parts.length === 0)
      parts.push('similitud de nombre detectada')

    return `"${marca.nombre}" (${marca.pais}, ${marca.estado}): ${parts.join(' y ')}. Score: ${score}/100.`
  }
}
