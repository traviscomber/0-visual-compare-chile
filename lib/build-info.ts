export function resolveBuildRevision() {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_REVISION || "local"
}

export function shortRevision(value: string) {
  if (value === "local") return value
  return value.slice(0, 7)
}

export function resolveBuildEnvironment() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV
  return process.env.NODE_ENV || "development"
}
