import { buildInapiPresetJobs } from "@/lib/inapi/presets"

type Phase1RunLike = {
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

export function getPhase1TotalJobs() {
  return buildInapiPresetJobs("phase1-10k").length
}

export function buildPhase1WindowPlan(runs: Phase1RunLike[], requestedWindowSize = 25): Phase1WindowPlan {
  const totalJobs = getPhase1TotalJobs()
  const normalizedWindow = Number.isFinite(requestedWindowSize) ? Math.max(1, Math.floor(requestedWindowSize)) : 25
  const covered = new Set<number>()

  for (const run of runs) {
    const metadata = run.metadata ?? null
    if (!metadata || metadata.preset !== "phase1-10k") {
      continue
    }

    const start = normalizeNumber(metadata.batch_start_index)
    const size = normalizeNumber(metadata.batch_window_size)

    if (start === null || size === null) {
      continue
    }

    for (let index = start; index < start + size && index < totalJobs; index += 1) {
      covered.add(index)
    }
  }

  let nextStartIndex = 0
  while (covered.has(nextStartIndex) && nextStartIndex < totalJobs) {
    nextStartIndex += 1
  }

  const remainingJobs = Math.max(totalJobs - nextStartIndex, 0)
  const nextWindow =
    remainingJobs > 0
      ? {
          startIndex: nextStartIndex,
          maxJobs: Math.min(normalizedWindow, remainingJobs),
        }
      : null

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
