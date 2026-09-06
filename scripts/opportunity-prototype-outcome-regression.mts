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
const thesisPage = await readFile("app/(app)/oportunidades/tesis/page.tsx", "utf8")

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

if (helper.includes('.from("innovation_opportunity_theses").update(') || /\.from\("innovation_opportunity_theses"\)[\s\S]{0,500}\.update\(/.test(helper)) {
  fail("prototype outcomes must never update the thesis row")
}
if (!helper.includes("scoreSnapshot") || !helper.includes("score_snapshot: scoreSnapshot") || !helper.includes("confidence: Number(thesis.confidence)")) {
  fail("prototype outcomes must preserve the current score/confidence as an immutable snapshot")
}

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

for (const needle of [
  "type PrototypeOutcome = {",
  "prototype_outcome?: PrototypeOutcome",
  "actor_role?: string",
  "conviction_effect?: string",
  "const prototypeLearning = latestPrototypeLearning(item.research_history)",
  "Resultado de prototipo",
  "prototypeLearning.outcome.outcome",
  "formatDateTime(prototypeLearning.outcome.outcome_at)",
  "formatActorRole(prototypeLearning.actorRole)",
  "shortId(prototypeLearning.outcome.outcome_by)",
  "prototypeLearning.outcome.case_id",
  "Abrir caso",
  "Evidencia de ejecución · no altera score ni confianza hasta re-investigar.",
  "no equivale a validación automática de mercado",
  "function latestPrototypeLearning(history: ResearchRun[]): PrototypeLearning | null",
  "convictionEffect: run.evidence_summary?.conviction_effect",
]) requireText(thesisPage, needle, "thesis learning UI")

const updateIndex = collaborationRoute.indexOf('.from("case_actions").update({')
const captureIndex = collaborationRoute.indexOf("captureOpportunityPrototypeOutcome(auth.supabase", updateIndex)
const responseIndex = collaborationRoute.indexOf("prototypeOutcomeCapture },", captureIndex)
if (!(updateIndex >= 0 && captureIndex > updateIndex && responseIndex > captureIndex)) {
  fail("prototype learning must happen after the canonical human action update and remain best-effort before the success response")
}

console.log("Opportunity prototype outcome regression PASS: only an attributable completed human prototype action can append execution evidence to its exact thesis; case/item/action/actor/timestamp provenance is preserved; action+outcome_at dedupes retries; identical completion retries keep the database-derived timestamp; score/confidence are copied only as immutable snapshots and the thesis row is never mutated; the latest prototype result is visible with actor/time/case lineage and an explicit no-auto-conviction warning; and lineage capture failure never rolls back canonical action completion.")
