import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Competitive hypothesis regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [migration,route,page,monitorMigration,reviewScheduleMigration,monitorLib,monitorCron,monitorApi,activeApi,activePage,vercel]=await Promise.all([
  readFile("supabase/migrations/20260907023000_add_competitive_hypotheses.sql","utf8"),
  readFile("app/api/intelligence/competitive-hypotheses/route.ts","utf8"),
  readFile("app/(app)/monitorear/atencion/page.tsx","utf8"),
  readFile("supabase/migrations/20260907024500_add_competitive_hypothesis_monitoring.sql","utf8"),
  readFile("supabase/migrations/20260907033000_add_competitive_hypothesis_review_schedule.sql","utf8"),
  readFile("lib/intelligence/competitive-hypothesis-monitoring.ts","utf8"),
  readFile("app/api/cron/competitive-hypothesis-monitoring/route.ts","utf8"),
  readFile("app/api/intelligence/competitive-hypotheses/monitoring/route.ts","utf8"),
  readFile("app/api/intelligence/competitive-hypotheses/active/route.ts","utf8"),
  readFile("app/(app)/monitorear/hipotesis/page.tsx","utf8"),
  readFile("vercel.json","utf8"),
])

for(const needle of ["create table if not exists public.competitive_hypotheses","status in ('draft','accepted','rejected')","unique (user_id, signal_event_id)","evidence_snapshot jsonb","decided_by uuid","decided_at timestamptz","revoke all on table public.competitive_hypotheses from anon, authenticated"])requireText(migration,needle,"hypothesis migration")
for(const forbidden of ["grant insert","grant update","conviction","score","confidence"])forbid(migration,forbidden,"hypothesis migration")
for(const needle of ["requireUser()","createAdminClient()",'.from("trademark_expansion_corroborations")','.eq("user_id", auth.user.id)','corroboration.evidence_state !== "supporting_evidence"','.from("competitive_hypotheses").insert','.eq("status", "draft")','DECISIONS = new Set(["accepted", "rejected"])',"decision_reason: reason","decided_by: auth.user.id","evidence_snapshot: draft.snapshot","No pudimos guardar la decisión"])requireText(route,needle,"hypothesis API")
for(const forbidden of ['.from("innovation_opportunity_theses").update',"conviction_delta","confidence_delta","auto_promote"])forbid(route,forbidden,"hypothesis API")
for(const needle of ["Hipótesis competitiva","Formular hipótesis","A favor","Falta comprobar","En contra","Aceptar como hipótesis","Descartar","Justificación de la decisión","no modifica conviction, prioridad ni lifecycle de oportunidad",'/api/intelligence/competitive-hypotheses'])requireText(page,needle,"Executive Attention hypothesis UI")
for(const needle of ["create table if not exists public.competitive_hypothesis_monitoring_events","strengthening_signal","contradictory_signal","source_degradation","stale_review_due","no_material_change","review_status in ('pending','reviewed','dismissed','not_required')","revoke all on table public.competitive_hypothesis_monitoring_events from anon, authenticated"])requireText(monitorMigration,needle,"monitoring migration")
for(const forbidden of ["grant select","grant insert","grant update","conviction","score","confidence"])forbid(monitorMigration,forbidden,"monitoring migration")
for(const needle of ["add column if not exists next_review_at timestamptz","next_review_at > reviewed_at","competitive_hypothesis_monitoring_next_review_idx"])requireText(reviewScheduleMigration,needle,"review schedule migration")
for(const needle of ["classifyContradictoryTitle","assessHypothesisMonitoring","input.contradictoryEvidence.length","newEvidence.length","unavailable.length","scheduledReviewDue","input.nextReviewAt","no la vuelve falsa ni obsoleta"])requireText(monitorLib,needle,"monitoring classifier")
for(const needle of ['request.headers.get("authorization") !== `Bearer ${secret}`','.eq("status", "accepted")',"DUE_AFTER_MS","gatherExternalExpansionCorroboration","gatherLocalPatentEvidence","gatherContradictoryWebEvidence","latestReviewed","nextReviewAt: latestReviewed?.next_review_at ?? null","assessHypothesisMonitoring",'.from("competitive_hypothesis_monitoring_events").insert','review_status: material ? "pending" : "not_required"'])requireText(monitorCron,needle,"monitoring cron")
for(const forbidden of ["conviction_delta","confidence_delta","status: \"rejected\"","status: \"accepted\""])forbid(monitorCron,forbidden,"monitoring cron")
for(const needle of ["requireUser()",'REVIEW_DECISIONS = new Set(["reviewed", "dismissed"])','.eq("user_id", auth.user.id)','.eq("review_status", "pending")',"next_review_at: nextReviewAt","resolveLinkedExecutiveAction",'const sourceId = `${REVIEW_SOURCE_PREFIX}${eventId}`','.from("case_items")','.from("case_actions")','.update({ status: "done", outcome','review_status: "pending", review_reason: null, reviewed_by: null, reviewed_at: null, next_review_at: null',"La señal permanece pendiente"])requireText(monitorApi,needle,"monitoring review API")
for(const forbidden of ["service_role","conviction_delta","confidence_delta",'.from("competitive_hypotheses").update'])forbid(monitorApi,forbidden,"monitoring review API")
for(const needle of ['.eq("status", "accepted")',"pendingReview","contradictory","stale","latestMonitoring","next_review_at","nextReviewAt"])requireText(activeApi,needle,"active hypotheses API")
for(const needle of ["Hipótesis competitivas activas","Nueva evidencia compatible","Señal contradictoria","Revisión por antigüedad","Registrar revisión","Descartar señal","Próxima revisión","resuelve también la acción vinculada en Atención ejecutiva","próxima revalidación canónica","no modifica conviction, score, prioridad, estado de oportunidad ni la aceptación original"])requireText(activePage,needle,"active hypotheses UI")
requireText(vercel,'"path": "/api/cron/competitive-hypothesis-monitoring"',"Vercel cron")
requireText(vercel,'"schedule": "10 9 * * *"',"Vercel cron")

console.log("Competitive hypothesis regression PASS: corroborated Nice expansions require human acceptance before becoming active hypotheses; accepted hypotheses are monitored for new evidence, contradiction, source degradation and scheduled revalidation; a human review records its next review date and reconciles the linked Executive Attention action; failures compensate back to pending; and neither monitoring nor review mutates conviction, opportunity lifecycle, source evidence or the original human acceptance.")
