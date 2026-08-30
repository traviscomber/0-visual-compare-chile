import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { SpaceMovement } from "@/lib/intelligence/competitive-rules"

export type IpSpaceEntityType = "patent" | "trademark"

export type IpSpaceCompany = {
  identity_id: string
  canonical_name: string
  country: string | null
  current_count: number
  previous_count: number
  delta: number
  movement: SpaceMovement
  latest_filing: string | null
}

type SpaceRow = {
  identity_id: string
  canonical_name: string
  country: string | null
  current_count: number | string
  previous_count: number | string
  delta: number | string
  movement: SpaceMovement
  latest_filing: string | null
}

export function normalizeClassificationCode(entityType: IpSpaceEntityType, rawCode: string) {
  const trimmed = rawCode.trim()
  return entityType === "patent" ? trimmed.toUpperCase().replace(/\s+/g, "") : String(Number(trimmed))
}

export async function buildIpSpaceAnalysis(
  admin: SupabaseClient,
  entityType: IpSpaceEntityType,
  rawCode: string,
  windowDays = 180,
) {
  const code = normalizeClassificationCode(entityType, rawCode)
  const { data, error } = await admin.rpc("analyze_ip_space", {
    p_entity_type: entityType,
    p_code: code,
    p_window_days: windowDays,
  })
  if (error) throw new Error(`No pudimos analizar el espacio competitivo: ${error.message}`)

  const companies: IpSpaceCompany[] = ((data ?? []) as SpaceRow[]).map(row => ({
    identity_id: String(row.identity_id),
    canonical_name: String(row.canonical_name),
    country: row.country ? String(row.country) : null,
    current_count: Number(row.current_count ?? 0),
    previous_count: Number(row.previous_count ?? 0),
    delta: Number(row.delta ?? 0),
    movement: row.movement,
    latest_filing: row.latest_filing ? String(row.latest_filing) : null,
  }))

  const entrants = companies.filter(item => item.movement === "entrante")
  const accelerating = companies.filter(item => item.movement === "acelerando")
  const consolidated = companies.filter(item => item.movement === "consolidado")
  const experimental = companies.filter(item => item.movement === "experimental")
  const retreating = companies.filter(item => item.movement === "retirandose")
  const currentFilings = companies.reduce((sum, item) => sum + item.current_count, 0)
  const previousFilings = companies.reduce((sum, item) => sum + item.previous_count, 0)

  return {
    generated_at: new Date().toISOString(),
    entity_type: entityType,
    code,
    classification: entityType === "patent" ? "IPC" : "Niza",
    window: {
      days: windowDays,
      current_label: `últimos ${windowDays} días`,
      previous_label: `${windowDays} días anteriores`,
    },
    metrics: {
      entrants: entrants.length,
      accelerating: accelerating.length,
      consolidated: consolidated.length,
      experimental: experimental.length,
      retreating: retreating.length,
      current_filings: currentFilings,
      previous_filings: previousFilings,
      delta: currentFilings - previousFilings,
    },
    interpretation: {
      observed_fact: entrants.length
        ? `${entrants.length} ${entrants.length === 1 ? "empresa registra" : "empresas registran"} al menos dos presentaciones en ${code} durante la ventana actual y ninguna en la ventana anterior.`
        : `No hay empresas que cumplan el umbral de entrada repetida en ${code} durante la ventana actual.`,
      signal: entrants.length
        ? "Hay nuevos actores con actividad repetida en este espacio."
        : experimental.length
          ? "Hay actividad nueva, pero todavía es experimental porque aparece una sola vez por empresa."
          : "No se observa una señal nueva suficiente para hablar de entrada.",
      guardrail: "Entrada significa actividad repetida observada en INAPI; no implica intención estratégica, éxito registral ni participación comercial.",
    },
    entrants: entrants.slice(0, 50),
    accelerating: accelerating.slice(0, 50),
    consolidated: consolidated.slice(0, 50),
    experimental: experimental.slice(0, 50),
    retreating: retreating.slice(0, 30),
  }
}
