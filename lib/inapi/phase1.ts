import { buildInapiPresetJobs } from "@/lib/inapi/presets"
import {
  buildPhase1WindowPlanFromTotal,
  type Phase1RunLike,
  type Phase1WindowPlan,
} from "@/lib/inapi/phase1-window"

export type { Phase1WindowPlan } from "@/lib/inapi/phase1-window"

export function getPhase1TotalJobs() {
  return buildInapiPresetJobs("phase1-10k").length
}

export function buildPhase1WindowPlan(runs: Phase1RunLike[], requestedWindowSize = 25): Phase1WindowPlan {
  return buildPhase1WindowPlanFromTotal(getPhase1TotalJobs(), runs, requestedWindowSize)
}
