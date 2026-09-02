import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import {
  assertBusinessOpportunityTier,
  summarizeBusinessOpportunityEvidence,
  type BusinessOpportunityGateEvidence,
} from "../lib/intelligence/business-opportunity-gates.ts"

const migration = await readFile("supabase/migrations/20260902035500_add_business_opportunity_domain.sql", "utf8")

for (const needle of [
  "create table public.business_opportunities",
  "create table public.business_opportunity_evidence",
  "organization_id uuid not null references public.organizations(id) on delete cascade",
  "unique (organization_id, dedupe_key)",
  "unique (id, organization_id)",
  "foreign key (opportunity_id, organization_id)",
  "axis in ('frontier', 'market_pull', 'company_fit')",
  "gate_status in ('eligible', 'context_only', 'rejected')",
  "source_class in ('external_signal', 'market_signal', 'company_evidence', 'human_evidence')",
  "business_opportunity_evidence_axis_source_class",
  "business_opportunity_evidence_human_actor",
  "business_opportunity_has_gate_axes",
  "count(distinct evidence.axis) = 3",
  "evidence.gate_status = 'eligible'",
  "business_opportunities_bet_now_gate",
  "business_opportunity_evidence_bet_now_gate",
  "deferrable initially deferred",
  "BET NOW requires eligible frontier, market_pull and company_fit evidence",
  "alter table public.business_opportunities enable row level security",
  "alter table public.business_opportunity_evidence enable row level security",
  "revoke all on table public.business_opportunities from anon, authenticated",
  "revoke all on table public.business_opportunity_evidence from anon, authenticated",
  "to service_role",
  "Narrative generation is not evidence",
]) assert.ok(migration.includes(needle), `business opportunity migration missing: ${needle}`)

assert.doesNotMatch(
  migration,
  /alter\s+table\s+public\.intelligence_recommendations/i,
  "business opportunity domain must not repurpose the IP recommendation table",
)
assert.doesNotMatch(
  migration,
  /source_class[^\n]+(?:ai|llm|model|narrative)/i,
  "AI/LLM narrative must not be an evidence source class",
)
assert.match(
  migration,
  /status in \('detected', 'reviewed', 'approved', 'rejected', 'converted_to_action'\)/,
  "human review lifecycle must be explicit",
)
assert.match(
  migration,
  /status <> 'converted_to_action'[\s\S]+converted_by is not null[\s\S]+case_id is not null[\s\S]+action_id is not null/,
  "conversion must remain attributable and linked to case/action records",
)

const none = summarizeBusinessOpportunityEvidence([])
assert.equal(none.canBetNow, false)
assert.deepEqual(none.missingAxes, ["frontier", "market_pull", "company_fit"])

const partial: BusinessOpportunityGateEvidence[] = [
  { axis: "frontier", gateStatus: "eligible" },
  { axis: "market_pull", gateStatus: "eligible" },
]
assert.equal(summarizeBusinessOpportunityEvidence(partial).canBetNow, false)
assert.throws(() => assertBusinessOpportunityTier("bet_now", partial), /company_fit/)
assert.doesNotThrow(() => assertBusinessOpportunityTier("validate", partial))
assert.doesNotThrow(() => assertBusinessOpportunityTier("watch", partial))

const contextOnly: BusinessOpportunityGateEvidence[] = [
  { axis: "frontier", gateStatus: "eligible" },
  { axis: "market_pull", gateStatus: "context_only" },
  { axis: "company_fit", gateStatus: "eligible" },
]
assert.equal(summarizeBusinessOpportunityEvidence(contextOnly).canBetNow, false)

const rejected: BusinessOpportunityGateEvidence[] = [
  { axis: "frontier", gateStatus: "eligible" },
  { axis: "market_pull", gateStatus: "eligible" },
  { axis: "company_fit", gateStatus: "rejected" },
]
assert.equal(summarizeBusinessOpportunityEvidence(rejected).canBetNow, false)

const duplicateAxis: BusinessOpportunityGateEvidence[] = [
  { axis: "frontier", gateStatus: "eligible" },
  { axis: "frontier", gateStatus: "eligible" },
  { axis: "market_pull", gateStatus: "eligible" },
]
assert.equal(summarizeBusinessOpportunityEvidence(duplicateAxis).canBetNow, false)

const complete: BusinessOpportunityGateEvidence[] = [
  { axis: "frontier", gateStatus: "eligible" },
  { axis: "market_pull", gateStatus: "eligible" },
  { axis: "company_fit", gateStatus: "eligible" },
]
const completeSummary = summarizeBusinessOpportunityEvidence(complete)
assert.equal(completeSummary.canBetNow, true)
assert.deepEqual(completeSummary.missingAxes, [])
assert.doesNotThrow(() => assertBusinessOpportunityTier("bet_now", complete))

console.log("Business opportunity domain regression PASS: opportunities are organization-scoped and separate from IP recommendations; BET NOW requires eligible frontier + market pull + company fit evidence in both TypeScript and deferred database gates; narrative never counts as evidence; lifecycle and service-only boundaries remain explicit.")
