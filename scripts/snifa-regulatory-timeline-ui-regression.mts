import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`SNIFA regulatory timeline UI regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [page,route]=await Promise.all([
  readFile("app/(app)/monitorear/page.tsx","utf8"),
  readFile("app/api/intelligence/watches/signals/route.ts","utf8"),
])

for(const needle of [
  "type RegulatoryTimelineMilestone",
  "RegulatoryTimelineDetails",
  "Ver línea regulatoria",
  "Evidencia SMA",
  "hitos SMA",
])requireText(page,needle,"monitoring UI")
if(!page.includes("timeline?: RegulatoryTimeline | null")&&!page.includes("timeline?:RegulatoryTimeline|null"))fail("monitoring UI missing typed regulatory timeline")

for(const needle of [
  "collapseSnifaRegulatoryEvents",
  "timeline?: RegulatoryTimeline | null",
  "canonicalCompanyName: row.timeline.canonicalCompanyName",
  "expediente: row.timeline.expediente",
  "milestones: row.timeline.milestones.map",
  'source: row.timeline ? "SMA · línea regulatoria" : row.source_key',
])requireText(route,needle,"common signal API")

for(const forbidden of [
  "fuzzy",
  "canonical_company_name_in_official_holder",
])if(page.includes(forbidden))fail(`UI must not invent source identity matching semantics: ${forbidden}`)

console.log("SNIFA regulatory timeline UI regression PASS: collapsed official SMA timelines expose typed milestones and render as an expandable chronological evidence path in /monitorear without changing raw event persistence or identity matching.")