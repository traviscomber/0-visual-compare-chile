export type Phase1RunLike = {
  metadata?: Record<string, unknown> | null
}

export interface Phase1WindowPlan {
  totalJobs: number
  coveredJobs: number
  remainingJobs: number
  progressPct: number
  nextWindow: {
    startIndex: number
    maxJobs: number
  } | null
}

export function buildPhase1WindowPlanFromTotal(
  totalJobsValue: number,
  runs: Phase1RunLike[],
  requestedWindowSize = 25,
): Phase1WindowPlan {
  const totalJobs = Number.isFinite(totalJobsValue) ? Math.max(0, Math.floor(totalJobsValue)) : 0
  const normalizedWindow = Number.isFinite(requestedWindowSize) ? Math.max(1, Math.floor(requestedWindowSize)) : 25
  const covered = new Set<number>()

  for (const run of runs) {
    const metadata = run.metadata ?? null
    if (!metadata || metadata.preset !== "phase1-10k") continue

    const start = readMetadataNumber(metadata, "batch_start_index", "batchStartIndex")
    const size = readMetadataNumber(metadata, "batch_window_size", "batchWindowSize")

    if (start === null || size === null || start < 0 || size <= 0 || start >= totalJobs) continue

    const endExclusive = Math.min(totalJobs, start + size)
    for (let index = start; index < endExclusive; index += 1) covered.add(index)
  }

  let nextStartIndex = 0
  while (nextStartIndex < totalJobs && covered.has(nextStartIndex)) nextStartIndex += 1

  const remainingJobs = Math.max(totalJobs - covered.size, 0)
  let nextWindow: Phase1WindowPlan["nextWindow"] = null

  if (remainingJobs > 0 && nextStartIndex < totalJobs) {
    let contiguousMissing = 0
    let index = nextStartIndex
    while (index < totalJobs && !covered.has(index) && contiguousMissing < normalizedWindow) {
      contiguousMissing += 1
      index += 1
    }

    if (contiguousMissing > 0) {
      nextWindow = {
        startIndex: nextStartIndex,
        maxJobs: contiguousMissing,
      }
    }
  }

  return {
    totalJobs,
    coveredJobs: covered.size,
    remainingJobs,
    progressPct: totalJobs > 0 ? Math.min(100, Math.round((covered.size / totalJobs) * 10000) / 100) : 0,
    nextWindow,
  }
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : null
}

function readMetadataNumber(metadata: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const normalized = normalizeNumber(metadata[key])
    if (normalized !== null) return normalized
  }

  return null
}
