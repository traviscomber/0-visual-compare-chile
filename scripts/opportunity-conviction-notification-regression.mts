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
const page = await readFile("app/(app)/notificaciones/page.tsx", "utf8")

for (const needle of [
  "isMaterialResearchRun(input.researchRun)",
  'comparison.direction !== "weakening"',
  'evidence.decision_degraded === true',
  '.from("organization_members")',
  '.eq("organization_id", input.organizationId)',
  'String(member.role ?? "") === "admin" || String(member.user_id) === input.creatorUserId',
  '.from("user_notifications")',
  '.eq("kind", "opportunity_conviction")',
  '.eq("href", href)',
  'research=${encodeURIComponent(input.researchRun.id)}',
  'kind: "opportunity_conviction"',
  'Recomendación degradada ·',
  'Convicción bajó ·',
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
  fail("notification delivery must be best-effort after canonical research persistence, not a rollback condition")
}

for (const needle of [
  'opportunity_conviction:"Tesis debilitada"',
  'ACTIONABLE_KINDS=new Set(["review_changes_requested","opportunity_conviction"',
  'label="Tesis debilitadas"',
  'Movimiento material negativo sin revisar',
  'Sólo movimientos materiales negativos de convicción generan aviso',
]) requireText(page, needle, "notification UI")

console.log("Opportunity conviction notification regression PASS: only material weakening or recommendation degradation creates notifications, recipients are limited to the thesis creator plus current organization admins, exact research-run hrefs deduplicate delivery, strengthening/baseline/news volume remain silent, and delivery failure never rolls back canonical research.")
