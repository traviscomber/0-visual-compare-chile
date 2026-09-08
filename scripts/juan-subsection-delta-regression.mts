import { readFile } from "node:fs/promises"
import {
  buildSubsectionDiscoveryDelta,
  subsectionPaperIdentity,
  SUBSECTION_DELTA_BOUNDARY,
} from "../lib/intelligence/subsection-research-delta.ts"

function fail(message:string):never{console.error(`Juan subsection delta regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}
function assert(condition:boolean,message:string){if(!condition)fail(message)}

const [cron, ui, assistant] = await Promise.all([
  readFile("app/api/cron/juan-subsection-papers/route.ts", "utf8"),
  readFile("components/app/juan-subsection-research.tsx", "utf8"),
  readFile("lib/intelligence/assistant-juan-workspace.ts", "utf8"),
])

for (const needle of [
  'buildSubsectionDiscoveryDelta',
  'readStoredSubsectionResearchForDelta',
  'SUBSECTION_DELTA_BOUNDARY',
  'dynamic_subsection_papers_v2_delta',
  'conviction_delta: 0',
  'decision_effect: "none"',
  'scoreChanged: false',
]) requireText(cron, needle, "subsection research cron")
for (const forbidden of [
  '.update({ score:',
  '.update({ status:',
  'auto_promote',
  '.from("competitive_hypotheses")',
  '.from("innovation_opportunity_theses")',
]) forbid(cron, forbidden, "subsection research cron")

for (const needle of [
  'type SubsectionResearchDelta = {',
  'Línea base creada: la próxima pasada podrá distinguir qué papers son realmente nuevos.',
  'Sin papers nuevos',
  'novedad bibliográfica orienta revisión; no demuestra por sí sola un cambio de mercado.',
  'Separa papers nuevos desde la última pasada del total histórico retenido.',
  'No modifica convicción',
]) requireText(ui, needle, "subsection research UI")
for (const forbidden of [
  '.update(',
  '.insert(',
  '.upsert(',
  '.delete(',
]) forbid(ui, forbidden, "subsection research UI")

for (const needle of [
  'subsectionNewPapersObserved',
  'subsectionProductsWithFreshPapers',
  'subsectionResearch.delta measures discovery freshness only',
  'new papers do not prove market movement and papers not observed again are neutral',
]) requireText(assistant, needle, "Juan assistant snapshot")
for (const forbidden of [
  '.insert(',
  '.update(',
  '.upsert(',
  '.delete(',
]) forbid(assistant, forbidden, "Juan assistant snapshot")

const orchardPaper = {
  source: "OpenAlex",
  sourceRecordId: "W-ORCHARD-1",
  title: "Machine vision for orchard crop monitoring",
  date: "2026-08-01",
  url: "https://example.org/orchard-1",
  doi: "10.1000/orchard.1",
}
const bookingPaper = {
  source: "Crossref",
  sourceRecordId: "10.1000/booking.1",
  title: "Decision support for hospitality booking systems",
  date: "2026-08-20",
  url: "https://doi.org/10.1000/booking.1",
  doi: "https://doi.org/10.1000/booking.1",
}

const baseline = buildSubsectionDiscoveryDelta(null, [
  { key: "orchard", papers: [orchardPaper] },
])
assert(baseline.baseline_created === true, "first observation must create a baseline")
assert(baseline.new_paper_count === 0, "first observation must not label the whole baseline as new")
assert(baseline.new_topic_count === 0, "first observation must not label baseline topics as new")
assert(baseline.decision_effect === "none", "baseline must have no decision effect")

const previous = {
  generated_at: "2026-09-07T07:28:00.000Z",
  paper_count: 2,
  topics: [
    { key: "orchard", papers: [orchardPaper, { source: "OpenAlex", sourceRecordId: "W-OLD", title: "Older orchard automation", url: "https://example.org/old", doi: null }] },
  ],
}
const delta = buildSubsectionDiscoveryDelta(previous, [
  { key: "orchard", papers: [{ ...orchardPaper, doi: "https://doi.org/10.1000/orchard.1" }] },
  { key: "booking", papers: [bookingPaper, { ...bookingPaper }] },
])
assert(delta.baseline_created === false, "existing snapshot must be compared rather than rebased")
assert(delta.previous_generated_at === previous.generated_at, "delta must retain the previous observation timestamp")
assert(delta.new_paper_count === 1, "one genuinely new paper must be detected despite duplicate current appearances")
assert(delta.new_papers.length === 1 && delta.new_papers[0]?.title === bookingPaper.title, "new-paper detail must be bounded and attributable")
assert(delta.new_topic_count === 1 && delta.new_topics[0] === "booking", "new subsection must be detected")
assert(delta.not_observed_again_count === 1, "previous paper not observed again must be counted without becoming negative evidence")
assert(delta.boundary === SUBSECTION_DELTA_BOUNDARY && /neutral rather than negative evidence/.test(delta.boundary), "delta boundary must keep disappearance neutral")
assert(delta.decision_effect === "none", "freshness delta must never create a decision effect")

const sameDoiA = subsectionPaperIdentity({ doi: "10.1000/ABC.X", title: "A" })
const sameDoiB = subsectionPaperIdentity({ doi: "https://doi.org/10.1000/abc.x", title: "B" })
assert(sameDoiA === sameDoiB, "DOI identity must normalize direct and doi.org forms")
const recordIdentity = subsectionPaperIdentity({ source: "OpenAlex", sourceRecordId: "W123", title: "One" })
assert(recordIdentity === subsectionPaperIdentity({ source: "openalex", sourceRecordId: "W123", title: "Renamed" }), "source record identity must survive title changes")

console.log("Juan subsection delta regression PASS: deterministic fixtures verify neutral baselining, DOI/source identity, duplicate-safe new-paper detection, new-topic detection, neutral not-observed-again semantics and zero decision effect; UI and assistant boundaries remain wired.")
