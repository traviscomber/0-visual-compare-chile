import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { buildPhase1WindowPlanFromTotal } from "../lib/inapi/phase1-window.ts"

function fail(message: string): never {
  console.error(`Phase1 window regression FAIL: ${message}`)
  process.exit(1)
}

function run(startIndex: number, windowSize: number, preset = "phase1-10k") {
  return {
    metadata: {
      preset,
      batchStartIndex: startIndex,
      batchWindowSize: windowSize,
    },
  }
}

function expectPlan(
  label: string,
  actual: ReturnType<typeof buildPhase1WindowPlanFromTotal>,
  expected: {
    coveredJobs: number
    remainingJobs: number
    nextWindow: { startIndex: number; maxJobs: number } | null
  },
) {
  if (actual.coveredJobs !== expected.coveredJobs) {
    fail(`${label}: coveredJobs expected ${expected.coveredJobs}, got ${actual.coveredJobs}`)
  }
  if (actual.remainingJobs !== expected.remainingJobs) {
    fail(`${label}: remainingJobs expected ${expected.remainingJobs}, got ${actual.remainingJobs}`)
  }
  if (JSON.stringify(actual.nextWindow) !== JSON.stringify(expected.nextWindow)) {
    fail(`${label}: nextWindow expected ${JSON.stringify(expected.nextWindow)}, got ${JSON.stringify(actual.nextWindow)}`)
  }
}

expectPlan(
  "complete coverage",
  buildPhase1WindowPlanFromTotal(110, [run(0, 110)], 25),
  { coveredJobs: 110, remainingJobs: 0, nextWindow: null },
)

expectPlan(
  "sparse first gap does not rerun covered jobs",
  buildPhase1WindowPlanFromTotal(110, [run(1, 107)], 25),
  { coveredJobs: 107, remainingJobs: 3, nextWindow: { startIndex: 0, maxJobs: 1 } },
)

expectPlan(
  "tail gap after first missing job is filled separately",
  buildPhase1WindowPlanFromTotal(110, [run(1, 107), run(0, 1)], 25),
  { coveredJobs: 108, remainingJobs: 2, nextWindow: { startIndex: 108, maxJobs: 2 } },
)

expectPlan(
  "overlapping windows are deduplicated",
  buildPhase1WindowPlanFromTotal(10, [run(0, 5), run(3, 5)], 25),
  { coveredJobs: 8, remainingJobs: 2, nextWindow: { startIndex: 8, maxJobs: 2 } },
)

expectPlan(
  "other presets are ignored",
  buildPhase1WindowPlanFromTotal(10, [run(0, 10, "alphabet")], 25),
  { coveredJobs: 0, remainingJobs: 10, nextWindow: { startIndex: 0, maxJobs: 10 } },
)

const routePath = fileURLToPath(new URL("../app/api/admin/inapi-sync/route.ts", import.meta.url))
const routeSource = await readFile(routePath, "utf8")
if (!routeSource.includes('.contains("metadata", { preset: "phase1-10k" })')) {
  fail("admin sync GET must filter completed coverage to the Phase1 preset")
}
if (routeSource.includes('.select("metadata").eq("status", "completed").order("created_at", { ascending: false }).limit(200)')) {
  fail("Phase1 coverage must not be truncated to the latest 200 generic completed runs")
}

console.log("Phase1 window regression PASS: complete history, sparse gaps, overlap dedupe and safe next windows verified.")
