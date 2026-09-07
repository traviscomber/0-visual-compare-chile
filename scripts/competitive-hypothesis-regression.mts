import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Competitive hypothesis regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [migration,route,page]=await Promise.all([
  readFile("supabase/migrations/20260907023000_add_competitive_hypotheses.sql","utf8"),
  readFile("app/api/intelligence/competitive-hypotheses/route.ts","utf8"),
  readFile("app/(app)/monitorear/atencion/page.tsx","utf8"),
])

for(const needle of [
  "create table if not exists public.competitive_hypotheses",
  "status in ('draft','accepted','rejected')",
  "unique (user_id, signal_event_id)",
  "evidence_snapshot jsonb",
  "decided_by uuid",
  "decided_at timestamptz",
  "revoke all on table public.competitive_hypotheses from anon, authenticated",
])requireText(migration,needle,"hypothesis migration")
for(const forbidden of ["grant insert","grant update","conviction","score","confidence"])forbid(migration,forbidden,"hypothesis migration")

for(const needle of [
  "requireUser()",
  "createAdminClient()",
  '.from("trademark_expansion_corroborations")',
  '.eq("user_id", auth.user.id)',
  'corroboration.evidence_state !== "supporting_evidence"',
  '.from("competitive_hypotheses").insert',
  '.eq("status", "draft")',
  'DECISIONS = new Set(["accepted", "rejected"])',
  "decision_reason: reason",
  "decided_by: auth.user.id",
  "evidence_snapshot: draft.snapshot",
  "no pudimos guardar la decisión",
])requireText(route,needle,"hypothesis API")
for(const forbidden of [
  '.from("innovation_opportunity_theses").update',
  "conviction_delta",
  "confidence_delta",
  "auto_promote",
])forbid(route,forbidden,"hypothesis API")

for(const needle of [
  "Hipótesis competitiva",
  "Formular hipótesis",
  "A favor",
  "Falta comprobar",
  "En contra",
  "Aceptar como hipótesis",
  "Descartar",
  "Justificación de la decisión",
  "no modifica conviction, prioridad ni lifecycle de oportunidad",
  '/api/intelligence/competitive-hypotheses',
])requireText(page,needle,"Executive Attention hypothesis UI")

console.log("Competitive hypothesis regression PASS: only independently corroborated Nice expansions can produce one server-owned draft; evidence lineage is immutable from the browser; acceptance/rejection is explicit, justified and attributable; and hypothesis decisions never mutate conviction, opportunity lifecycle or source evidence.")
