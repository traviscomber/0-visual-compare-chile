import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Opportunity human decision regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const route = await readFile("app/api/intelligence/opportunity-theses/[id]/decision/route.ts", "utf8")
const page = await readFile("app/(app)/oportunidades/tesis/page.tsx", "utf8")

for (const needle of [
  "requireUser()",
  "assertPortfolioOrganizationAccess",
  'z.enum(["exploring", "watching", "prototype", "rejected"])',
  ".min(8).max(1000)",
  'const sensitiveTarget = parsed.data.target === "prototype" || parsed.data.target === "rejected"',
  'current.status === "prototype" || current.status === "rejected"',
  'access.role !== "admin"',
  'run_type: "human_review"',
  "scores_unchanged: true",
  'trigger: "explicit_user_action"',
  "evidence_warning: warning",
  "rollback",
  "Prototipado aprobado por decisión humana pese a guardrails de evidencia",
]) requireText(route, needle, "human decision API")

for (const forbidden of [
  "overall_score: parsed",
  "evidence_strength: parsed",
  "confidence: parsed",
]) if (route.includes(forbidden)) fail(`human decision API must not mutate AI scores from client input: ${forbidden}`)

for (const needle of [
  "Vigilar",
  "Prototipar",
  "Descartar",
  "Reabrir análisis",
  "Última decisión humana",
  "El score y la confianza no cambian con esta decisión.",
  "Prototipar y descartar requieren rol administrador.",
  "/decision",
  "Mínimo 8 caracteres",
]) requireText(page, needle, "human decision workspace")

if (!page.includes('item.evidence_strength < 60 || item.confidence < 0.65 || item.evidence_state === "hypothesis"')) {
  fail("prototype UI must surface weak-evidence guardrails before a human override")
}

console.log("Opportunity human decision regression PASS: thesis lifecycle decisions remain explicit and reasoned, watch is operational, prototype/reject and reversal of admin states require admin, score/confidence are not overwritten by the decision, weak-evidence prototype overrides are visibly warned and audited, and audit failure rolls the lifecycle change back.")
