export type IntelligenceSpaceType = "patent" | "trademark"
export type StrategicWatchContextType = "technology" | "company" | "competitor"

function buildHref(pathname: string, entries: Array<[string, string | number | null | undefined]>) {
  const params = new URLSearchParams()
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue
    const normalized = String(value).trim()
    if (normalized) params.set(key, normalized)
  }
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function companyHref(company: string, identityId?: string | null) {
  return buildHref("/empresas", [["company", company], ["identityId", identityId]])
}

export function spaceHref(type: IntelligenceSpaceType, code: string) {
  return buildHref("/espacios", [["type", type], ["code", code]])
}

export function technologyHref(technology: string, windowDays: number = 180) {
  return buildHref("/tecnologias", [["technology", technology], ["windowDays", windowDays]])
}

export function strategicWatchHref(type: StrategicWatchContextType, query: string) {
  return buildHref("/monitorear/estrategico/nueva", [["type", type], ["q", query]])
}

export function strategicAnalysisHref(type: StrategicWatchContextType, query: string) {
  return type === "technology" ? technologyHref(query) : companyHref(query)
}

export function portfolioGapHref(competitor: string, competitorIdentityId?: string | null) {
  return buildHref("/brechas", [["competitor", competitor], ["competitorIdentityId", competitorIdentityId]])
}
