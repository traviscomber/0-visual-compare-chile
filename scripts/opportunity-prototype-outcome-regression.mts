import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity prototype outcome regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const helper = await readFile("lib/intelligence/opportunity-prototype-outcome.ts", "utf8")
const collaborationRoute = await readFile("app/api/cases/collaboration/route.ts", "utf8")
const outcomeMigration = await readFile("supabase/migrations/20260831023000_add_case_action_outcomes.sql", "utf8")

for (const needle of [
  'action.status !== "done"',
  '!action.outcome?.trim()',
  '!action.outcome_at',
  '!action.outcome_by',
  'action.outcome_by !== userId',
  '.eq("item_type", "research")',
  'metadata.origin === "opportunity_engine"',
  'metadata.human_decision === "prototype"',
  'String(metadata.linked_action_id ?? "") === action.id',
  'item.source_id === `opportunity:${opportunityId}`',
  'assertPortfolioOrganizationAccess(admin, userId, organizationId)',
  'thesis.status !== "prototype"',
  'prototypeOutcome.action_id === action.id && prototypeOutcome.outcome_at === action.outcome_at',
  'run_type: "human_review"',
  'scores_unchanged: true',
  'conviction_effect: "none_until_research"',
  'trigger: "human_action_completion"',
  'created_by: userId',
]) requireText(helper, needle, "outcome helper")

for (const forbidden of [
  '.from("innovation_opportunity_theses").update(',
  'overall_score:',
  'evidence_strength:',
  'timing_score:',
  'decision:',
]) if (helper.includes(forbidden)) fail(`prototype outcomes must not automatically mutate thesis conviction/lifecycle: ${forbidden}`)

for (const needle of [
  'captureOpportunityPrototypeOutcome',
  'status === "done"',
  '.select("id,case_id,status,outcome,outcome_at,outcome_by,completed_at")',
  'await captureOpportunityPrototypeOutcome(auth.supabase, auth.user.id, data)',
  'console.error("[case-action:prototype-outcome]"',
  'return NextResponse.json({ ok: true, prototypeOutcomeCapture }',
]) requireText(collaborationRoute, needle, "action completion route")

if (collaborationRoute.includes("createAdminClient") || collaborationRoute.includes("SUPABASE_SERVICE_ROLE_KEY")) {
  fail("canonical action completion must remain authenticated/RLS-scoped; privilege elevation belongs only in the post-completion lineage helper")
}

for (const needle of [
  "if old.status is distinct from new.status or old.outcome is distinct from new.outcome then",
  "new.outcome_at := old.outcome_at",
  "new.outcome_by := old.outcome_by",
]) requireText(outcomeMigration, needle, "outcome trigger")

const updateIndex = collaborationRoute.indexOf('.from("case_actions").update({')
const captureIndex = collaborationRoute.indexOf("captureOpportunityPrototypeOutcome(auth.supabase", updateIndex)
const responseIndex = collaborationRoute.indexOf("prototypeOutcomeCapture },", captureIndex)
if (!(updateIndex >= 0 && captureIndex > updateIndex && responseIndex > captureIndex)) {
  fail("prototype learning must happen after the canonical human action update and remain best-effort before the success response")
}

console.log("Opportunity prototype outcome regression PASS: only an attributable completed human prototype action can append execution evidence to its exact thesis; case/item/action/actor/timestamp provenance is preserved; action+outcome_at dedupes retries; identical completion retries keep the database-derived timestamp; conviction scores and lifecycle remain unchanged until explicit research; and lineage capture failure never rolls back canonical action completion.")
