import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity conviction notification regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(source: string, needle: string, label: string) {
  if (!source.includes(needle)) fail(`${label} missing ${needle}`)
}

const helper = await readFile("lib/intelligence/opportunity-notifications.ts", "utf8")
const research = await readFile("lib/intelligence/opportunity-thesis-research.ts", "utf8")
const outcome = await readFile("lib/intelligence/opportunity-prototype-outcome.ts", "utf8")
const assessment = await readFile("app/api/intelligence/opportunity-theses/[id]/prototype-assessment/route.ts", "utf8")
const page = await readFile("app/(app)/notificaciones/page.tsx", "utf8")

for (const needle of [
  "isMaterialResearchRun(input.researchRun)",
  'comparison.direction !== "weakening"',
  'evidence.decision_degraded === true',
  "resolveRecipients(client, input.organizationId, input.creatorUserId, \"creator_and_admins\")",
  '.from("organization_members")',
  '.eq("organization_id", organizationId)',
  '.from("user_notifications")',
  '.eq("kind", kind)',
  '.eq("href", href)',
  'research=${encodeURIComponent(input.researchRun.id)}',
  'kind: "opportunity_conviction"',
  'Recomendación degradada ·',
  'Convicción bajó ·',
  "createOpportunityPrototypeLearningNotifications",
  'input.stage === "assessment" ? "admins_only" : "creator_and_admins"',
  '"opportunity_prototype_learning"',
  "prototypeLearningHref(input)",
  'outcome=${encodeURIComponent(input.sourceId)}',
  'assessment=${encodeURIComponent(input.sourceId)}',
  'Resultado de prototipo por clasificar ·',
  'Aprendizaje de prototipo listo para re-investigar ·',
  "resolveOpportunityPrototypeLearningNotifications",
  '.update({ read_at: resolvedAt })',
  '.eq("kind", "opportunity_prototype_learning")',
  '.is("read_at", null)',
  'Could not resolve prototype learning notifications',
]) requireText(helper, needle, "notification helper")

for (const forbidden of [
  'comparison.direction === "strengthening"',
  'kind: "opportunity_strengthening"',
  'news_context_count',
]) if (helper.includes(forbidden)) fail(`notification helper must not notify strengthening/news volume: ${forbidden}`)

for (const needle of [
  'created_by,title,status,decision',
  "createOpportunityConvictionNotifications(admin",
  "resolveOpportunityPrototypeLearningNotifications(admin",
  'stage: "research"',
  "sourceId: pendingPrototypeAssessment.id",
  'console.error("[opportunity-theses:research:notification-resolution]"',
  'console.error("[opportunity-theses:research:notification]"',
  "notificationsResolved",
  "notificationsCreated",
]) requireText(research, needle, "research integration")

const researchRollbackGuard = research.indexOf("if (runError || !researchRun)")
const researchResolutionCall = research.indexOf("resolveOpportunityPrototypeLearningNotifications(admin", researchRollbackGuard)
const notificationCall = research.indexOf("createOpportunityConvictionNotifications(admin", researchResolutionCall)
const notificationCatch = research.indexOf('console.error("[opportunity-theses:research:notification]"', notificationCall)
const researchReturn = research.indexOf("notificationsResolved,", notificationCatch)
if (!(researchRollbackGuard >= 0 && researchResolutionCall > researchRollbackGuard && notificationCall > researchResolutionCall && notificationCatch > notificationCall && researchReturn > notificationCatch)) {
  fail("research must resolve consumed prototype-learning work only after canonical snapshot persistence, then deliver conviction notifications best-effort")
}

for (const needle of [
  'select("id,title,created_by,status,confidence',
  "createOpportunityPrototypeLearningNotifications(admin",
  'stage: "assessment"',
  'sourceId: String(research.id)',
  'console.error("[opportunity-prototype-outcome:notification]"',
]) requireText(outcome, needle, "prototype outcome notification")

const outcomeInsert = outcome.indexOf('.from("innovation_opportunity_research_runs")')
const outcomeNotification = outcome.indexOf("createOpportunityPrototypeLearningNotifications(admin", outcomeInsert)
const outcomeCatch = outcome.indexOf('console.error("[opportunity-prototype-outcome:notification]"', outcomeNotification)
if (!(outcomeInsert >= 0 && outcomeNotification > outcomeInsert && outcomeCatch > outcomeNotification)) {
  fail("prototype outcome notifications must be best-effort after canonical outcome lineage persistence")
}

for (const needle of [
  'select("id,title,created_by,status,confidence',
  "const organizationId = parsed.data.organizationId",
  "const assessmentValue = parsed.data.assessment",
  "const outcomeResearchId = String(outcomeRun.id)",
  "const thesisTitle = String(thesis.title)",
  "const thesisCreatorUserId = String(thesis.created_by)",
  "syncPrototypeLearningNotifications",
  "resolveOpportunityPrototypeLearningNotifications(admin",
  'stage: "assessment"',
  "sourceId: outcomeResearchId",
  'console.error("[opportunity-theses:prototype-assessment:notification-resolution]"',
  "createOpportunityPrototypeLearningNotifications(admin",
  'stage: "research"',
  "sourceId: assessmentId",
  "assessment: assessmentValue",
  'console.error("[opportunity-theses:prototype-assessment:notification]"',
  "created: false, ...notificationSync",
  "created: true, ...notificationSync",
]) requireText(assessment, needle, "prototype assessment notification lifecycle")

const assessmentInsert = assessment.indexOf('.insert({')
const assessmentSync = assessment.indexOf("syncPrototypeLearningNotifications(String(assessmentRun.id))", assessmentInsert)
if (!(assessmentInsert >= 0 && assessmentSync > assessmentInsert)) {
  fail("new assessment must persist canonical lineage before resolving the outcome notification and creating the re-research notification")
}

const duplicateReturn = assessment.indexOf("created: false, ...notificationSync")
const duplicateSync = assessment.lastIndexOf("syncPrototypeLearningNotifications(String(row.id))", duplicateReturn)
if (!(duplicateSync >= 0 && duplicateReturn > duplicateSync)) {
  fail("idempotent assessment retry must reconcile notification side effects before returning the existing assessment")
}

for (const needle of [
  'opportunity_prototype_learning:"Aprendizaje de prototipo"',
  'ACTIONABLE_KINDS=new Set(["review_changes_requested","opportunity_prototype_learning","opportunity_conviction"',
  'item.kind==="opportunity_prototype_learning"',
  'label="Tesis por atender"',
  'aprendizaje prototipo',
  'nunca valida ni mueve convicción automáticamente',
]) requireText(page, needle, "notification UI")

console.log("Opportunity notification regression PASS: material weakening remains selective; prototype outcomes notify only admins to classify; assessments automatically resolve their outcome notifications and create deduplicated re-research work; research that consumes an assessment automatically resolves that work; retries reconcile notification side effects; all notification maintenance is best-effort after canonical lineage persistence; and no notification action moves conviction automatically.")
