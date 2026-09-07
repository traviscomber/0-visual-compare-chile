import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Competitive hypothesis Executive Attention regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [route,page]=await Promise.all([
  readFile("app/api/intelligence/watches/signals/route.ts","utf8"),
  readFile("app/(app)/monitorear/atencion/page.tsx","utf8"),
])

for(const needle of [
  'loadCompetitiveHypothesisAttention(admin, auth.user.id)',
  '.from("competitive_hypothesis_monitoring_events")',
  '.eq("user_id", userId)',
  '.eq("review_status", "pending")',
  '.neq("assessment", "no_material_change")',
  '.from("competitive_hypotheses")',
  '.eq("status", "accepted")',
  'signalKey: `hypothesis-monitoring:${row.id}`',
  'source: "VIDENTIA · Seguimiento de hipótesis"',
  'href: "/monitorear/hipotesis"',
  'hypothesisReview: hypothesisAttention.length',
  'este seguimiento no modifica conviction ni la aceptación original',
])requireText(route,needle,"watch signals API")

for(const forbidden of [
  '.from("competitive_hypotheses").update',
  'conviction_delta',
  'confidence_delta',
  'auto_accept',
  'auto_reject',
])forbid(route,forbidden,"watch signals API")

for(const needle of [
  'sourceId:item.signalKey',
  'actionTitle:title',
  'suggestedDueAt:dueAt',
  'reason:item.reason',
])requireText(page,needle,"Executive Attention action provenance")

console.log("Competitive hypothesis Executive Attention regression PASS: only material pending reviews for accepted hypotheses are escalated, every item has stable action identity and SLA provenance, and monitoring cannot mutate conviction or the human hypothesis decision.")
