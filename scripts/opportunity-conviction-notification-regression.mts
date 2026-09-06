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
  'outcome=${encodeURIComponent(input.sourceId)}',
  'assessment=${encodeURIComponent(input.sourceId)}',
  'Resultado de prototipo por clasificar ·',
  'Aprendizaje de prototipo listo para re-investigar ·',
]) requireText(helper, needle, "notification helper")

for (const forbidden of [
  'comparison.direction === "strengthening"',
  'kind: "opportunity_strengthening"',
  'news_context_count',
]) if (helper.includes(forbidden)) fail(`notification helper must not notify strengthening/news volume: ${forbidden}`)

for (const needle of [
  'created_by,title,status,decision',
  "createOpportunityConvictionNotifications(admin",
  'console.error("[opportunity-theses:research:notification]"',
  "notificationsCreated",
]) requireText(research, needle, "research integration")

const notificationCall = research.indexOf("createOpportunityConvictionNotifications(admin")
const notificationCatch = research.indexOf('console.error("[opportunity-theses:research:notification]"')
const researchReturn = research.indexOf("notificationsCreated,", notificationCatch)
if (!(notificationCall >= 0 && notificationCatch > notificationCall && researchReturn > notificationCatch)) {
  fail("conviction notification delivery must be best-effort after canonical research persistence, not a rollback condition")
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
  "createOpportunityPrototypeLearningNotifications(admin",
  'stage: "research"',
  'sourceId: String(assessmentRun.id)',
  "assessment: parsed.data.assessment",
  'console.error("[opportunity-theses:prototype-assessment:notification]"',
]) requireText(assessment, needle, "prototype assessment notification")

const assessmentInsert = assessment.indexOf('.from("innovation_opportunity_research_runs")')
const assessmentNotification = assessment.indexOf("createOpportunityPrototypeLearningNotifications(admin", assessmentInsert)
const assessmentCatch = assessment.indexOf('console.error("[opportunity-theses:prototype-assessment:notification]"', assessmentNotification)
if (!(assessmentInsert >= 0 && assessmentNotification > assessmentInsert && assessmentCatch > assessmentNotification)) {
  fail("prototype assessment notifications must be best-effort after canonical assessment persistence")
}

for (const needle of [
  'opportunity_prototype_learning:"Aprendizaje de prototipo"',
  'ACTIONABLE_KINDS=new Set(["review_changes_requested","opportunity_prototype_learning","opportunity_conviction"',
  'item.kind==="opportunity_prototype_learning"',
  'label="Tesis por atender"',
  'aprendizaje prototipo',
  'nunca valida ni mueve convicción automáticamente',
]) requireText(page, needle, "notification UI")

console.log("Opportunity notification regression PASS: material weakening remains selective; prototype outcomes notify only admins to classify; assessed prototype learning notifies admins plus the thesis creator to re-research; exact source-linked hrefs deduplicate delivery; all notification delivery is best-effort after canonical lineage persistence; and the notification workspace treats prototype learning as actionable without implying automatic validation or score movement.")
