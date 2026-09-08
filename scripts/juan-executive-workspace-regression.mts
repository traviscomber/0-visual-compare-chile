import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Juan executive workspace regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [layout, nav, page, workspace, handoffs, evolution] = await Promise.all([
  readFile("app/(app)/layout.tsx", "utf8"),
  readFile("components/app/app-nav.tsx", "utf8"),
  readFile("app/(app)/mi-espacio/page.tsx", "utf8"),
  readFile("components/app/juan-executive-workspace.tsx", "utf8"),
  readFile("app/api/cron/juan-project-handoffs/route.ts", "utf8"),
  readFile("app/api/cron/juan-product-evolution/route.ts", "utf8"),
])

for (const forbidden of [
  "JuanProjectIdeasStrip",
  "JuanProductEvolutionStrip",
  "showJuanIntelligence",
]) forbid(layout, forbidden, "global authenticated layout")

for (const needle of [
  'const juanNavigationItem:NavigationItem={href:"/mi-espacio",label:"Mi espacio"',
  'userEmail.trim().toLowerCase()==="juan@n3uralia.com"',
  '<NavigationMenu showJuanWorkspace={showJuanWorkspace}/>',
  '"/mi-espacio":"Mi espacio"',
]) requireText(nav, needle, "owner navigation")

for (const needle of [
  'const JUAN_EMAIL = "juan@n3uralia.com"',
  'if (user.email?.trim().toLowerCase() !== JUAN_EMAIL) redirect("/dashboard")',
  '<JuanExecutiveWorkspace userId={user.id} />',
  'id="oportunidades-institucionales"',
  'id="evolucion-productos"',
]) requireText(page, needle, "private Juan route")

for (const needle of [
  "Qué requiere decisión, qué conviene ejecutar y qué falta demostrar.",
  "La evidencia externa define convicción. La capacidad N3uralia define cómo ejecutar.",
  "Requiere tu decisión",
  "Recomendaciones de ejecución",
  "Recomendación operativa · no modifica convicción",
  'label="Evidencia"',
  'label="Integración"',
  'label="Reuso"',
  "Ausencia de evidencia Chile es neutral, nunca evidencia negativa.",
]) requireText(workspace, needle, "Juan command center")

for (const needle of [
  'inapiPatentEvidenceUrl, inapiPatentEvidenceUrlFromSourceRecord',
  '.select("source,source_record_id,application_number,title,applicants,filing_date,publication_date,source_url")',
  '.select("title,summary,source_key,event_type,relevance,source_url,occurred_at,last_seen_at")',
  'normalize(sourceKey) === "inapi_open_data" && (eventType === "patent" || eventType === "trademark")',
  'inapiPatentEvidenceUrl(row.application_number) ?? inapiPatentEvidenceUrlFromSourceRecord(row.source_record_id)',
  'research_mode: "deep_auto_v4_source_separated"',
  'institutionalScoreBoost: 0',
]) requireText(handoffs, needle, "project handoff research")

for (const forbidden of [
  '.from("competitive_hypotheses").update',
  '.from("innovation_opportunity_theses").update',
  'confidence_delta',
  'conviction_delta',
  'auto_promote',
]) forbid(handoffs, forbidden, "project handoff research")

for (const needle of [
  "const MAX_EVIDENCE_TITLE_LENGTH = 320",
  "isPlausibleEvidenceTitle(work.title)",
  "if (!title || !isPlausibleEvidenceTitle(title)) return []",
  'source === "inapi_open_data" && (eventType === "patent" || eventType === "trademark")',
]) requireText(evolution, needle, "product evolution evidence hygiene")

console.log("Juan executive workspace regression PASS: Juan intelligence is isolated in a private command center; evidence conviction, execution readiness and human decisions stay separate; patent activity cannot masquerade as market adoption, and malformed evidence titles are rejected.")
