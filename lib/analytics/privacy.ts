export type DemoInputMode = "name" | "image" | "name_image"
export type DemoAnalysisMode = "trademark" | "visual-only"

export function redactAnalyticsUrl(value: string) {
  const url = new URL(value)
  url.search = ""
  url.hash = ""
  return url.toString()
}

export function getDemoInputMode(hasName: boolean, hasImage: boolean): DemoInputMode {
  if (hasName && hasImage) return "name_image"
  if (hasImage) return "image"
  return "name"
}

export function buildDemoRequestAnalytics(params: {
  hasName: boolean
  hasImage: boolean
  hasActivity: boolean
}) {
  return {
    input_mode: getDemoInputMode(params.hasName, params.hasImage),
    has_activity: params.hasActivity,
  }
}

export function buildDemoResultAnalytics(params: {
  hasName: boolean
  hasImage: boolean
  hasActivity: boolean
  analysisMode: DemoAnalysisMode
}) {
  return {
    ...buildDemoRequestAnalytics(params),
    analysis_mode: params.analysisMode,
  }
}
