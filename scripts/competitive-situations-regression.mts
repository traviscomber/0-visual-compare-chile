import { readFile } from "node:fs/promises"
import { buildCompetitiveSituations } from "../lib/intelligence/competitive-situations.ts"

function fail(message: string): never { console.error(`Competitive situations regression FAIL: ${message}`); process.exit(1) }
function requireText(source: string, needle: string, label: string) { if (!source.includes(needle)) fail(`${label} missing ${needle}`) }
function forbid(source: string, needle: string, label: string) { if (source.includes(needle)) fail(`${label} must not contain ${needle}`) }

const [projection, page, layout] = await Promise.all([
  readFile("lib/intelligence/competitive-situations.ts", "utf8"),
  readFile("app/(app)/monitorear/situaciones/page.tsx", "utf8"),
  readFile("app/(app)/monitorear/layout.tsx", "utf8"),
])

for (const needle of [
  "buildCompetitiveSituations",
  'item.kind === "opportunity_conviction"',
  "situationKey(item.subject)",
  "activeHypothesisReviews",
  "competitiveExpansions",
  "regulatoryCases",
  "externalSignals",
  "decisionQuestion",
]) requireText(projection, needle, "projection")
for (const forbidden of ["conviction_delta", "confidence_delta", ".update(", ".insert(", "service_role"]) forbid(projection, forbidden, "projection")

for (const needle of [
  "Competitive Situations",
  "Una empresa, una decisión pendiente y un siguiente paso.",
  "Qué requiere decisión",
  "Empresa → decisión → siguiente paso",
  "Hipótesis en revisión",
  '/api/intelligence/watches/signals',
  '/api/intelligence/actions?',
  "Aún sin acción ejecutiva",
  "Asignar responsable",
  "Resolver acción",
  "Ver acción",
  "Revisar hipótesis",
  "Definir acción",
  "Evidencia",
  "La agrupación es sólo una lectura",
  "Revisar cambio de hipótesis:",
  "Resolver atención regulatoria:",
  "Revisar señal ejecutiva:",
]) requireText(page, needle, "situations page")
for (const forbidden of ["assignedTo:null", "defaultDueAt(", "createAction(", 'method:"POST"', 'method: "POST"', "lg:grid-cols-4", "<Fact "]) forbid(page, forbidden, "situations page")
for (const needle of ["Tareas", "Atención", "Situaciones", "Estratégico", "Hipótesis", '/monitorear/situaciones']) requireText(layout, needle, "monitoring navigation")

const sample = buildCompetitiveSituations([
  { key: "a", signalKey: "brand:a", watchKey: "brand:w", title: "Expansión", subject: "ACME SpA", source: "INAPI · Expansión competitiva", href: "/a", priority: "alta", reason: "x", occurredAt: "2026-09-01T00:00:00Z", isNew: true, kind: "competitive_expansion" },
  { key: "b", signalKey: "tech:b", watchKey: "technology:w", title: "Lanzamiento", subject: "Acme", source: "Web", href: "/b", priority: "alta", reason: "y", occurredAt: "2026-09-02T00:00:00Z", isNew: true, kind: "new_high_signal" },
  { key: "c", signalKey: "op:c", watchKey: "opportunity:x", title: "Conviction", subject: "ACME", source: "VIDENTIA", href: "/c", priority: "critica", reason: "z", occurredAt: "2026-09-03T00:00:00Z", isNew: true, kind: "opportunity_conviction" },
])

if (sample.length !== 1) fail(`expected one competitive situation, got ${sample.length}`)
if (sample[0].signalCount !== 2) fail(`opportunity conviction leaked into competitive situation`)
if (sample[0].competitiveExpansions !== 1 || sample[0].externalSignals !== 1) fail("cross-signal counts are wrong")
if (!sample[0].decisionQuestion.includes("expansión registral")) fail("decision question does not reflect combined evidence")

console.log("Competitive situations regression PASS: each situation stays a conservative projection and now exposes one contextual next action without creating a second task or decision system.")
