import assert from "node:assert/strict"
import { collapseSnifaRegulatoryEvents, type SnifaTimelineEvent } from "../lib/intelligence/snifa-regulatory-timeline.ts"

function event(input: Partial<SnifaTimelineEvent> & Pick<SnifaTimelineEvent,"id"|"watch_id"|"source_key"|"title"|"first_seen_at">): SnifaTimelineEvent {
  return {
    event_type: "regulation",
    summary: null,
    source_url: null,
    occurred_at: null,
    relevance: "media",
    payload: null,
    ...input,
  }
}

const common = { canonical_company_id: "company-1", canonical_company_name: "Empresa Uno", expediente: "D-033-2016" }
const source: SnifaTimelineEvent[] = [
  event({ id:"a", watch_id:"watch-1", source_key:"snifa_sma", title:"Procedimiento", occurred_at:"2026-03-02", first_seen_at:"2026-03-03T10:00:00Z", relevance:"alta", source_url:"https://snifa.sma.gob.cl/Sancionatorio/Ficha/1", payload:{...common, regulatory_stage:"sanctioning_proceeding"} }),
  event({ id:"b", watch_id:"watch-1", source_key:"snifa_sma", title:"Requerimiento", occurred_at:"2026-01-10", first_seen_at:"2026-03-01T10:00:00Z", relevance:"alta", source_url:"https://snifa.sma.gob.cl/RequerimientoIngreso/Ficha/2", payload:{...common, regulatory_stage:"seia_entry_requirement"} }),
  event({ id:"c", watch_id:"watch-1", source_key:"snifa_sma", title:"Sanción", occurred_at:"2026-06-04", first_seen_at:"2026-06-05T10:00:00Z", relevance:"alta", source_url:"https://snifa.sma.gob.cl/RegistroPublico/Ficha/3", payload:{...common, regulatory_stage:"firm_sanction"} }),
  event({ id:"d", watch_id:"watch-1", source_key:"snifa_sma", title:"Otro expediente", occurred_at:"2026-02-01", first_seen_at:"2026-02-02T10:00:00Z", relevance:"alta", payload:{...common, expediente:"D-033-2016-A", regulatory_stage:"provisional_measure"} }),
  event({ id:"e", watch_id:"watch-1", source_key:"gdelt_doc", title:"Contexto", occurred_at:"2026-05-01", first_seen_at:"2026-05-02T10:00:00Z", relevance:"media", payload:{...common, regulatory_stage:"sanctioning_proceeding"} }),
]

const collapsed = collapseSnifaRegulatoryEvents(source)
assert.equal(collapsed.length, 3, "three exact SNIFA milestones must collapse into one timeline while unrelated rows remain separate")
const timeline = collapsed.find(item => item.timeline)
assert.ok(timeline?.timeline, "timeline must be created for exact canonical company + expediente grouping")
assert.equal(timeline.title, "Hitos regulatorios SMA · D-033-2016")
assert.equal(timeline.timeline.milestones.length, 3)
assert.deepEqual(timeline.timeline.milestones.map(item=>item.stage), ["seia_entry_requirement","sanctioning_proceeding","firm_sanction"], "milestones must follow evidence dates, not ingestion order")
assert.equal(timeline.occurred_at, "2026-06-04", "timeline date must be the latest dated milestone")
assert.equal(timeline.source_url, "https://snifa.sma.gob.cl/RegistroPublico/Ficha/3", "timeline opens the latest dated official evidence")
assert.match(timeline.summary ?? "", /Requerimiento SEIA.*→.*Procedimiento sancionatorio.*→.*Sanción firme/)
assert.ok(collapsed.some(item => item.id === "d"), "near-but-not-exact expediente must not merge")
assert.ok(collapsed.some(item => item.id === "e"), "non-SNIFA context must pass through unchanged")

const separateWatch = collapseSnifaRegulatoryEvents([
  event({ id:"f1", watch_id:"watch-1", source_key:"snifa_sma", title:"W1 medida", occurred_at:"2026-01-01", first_seen_at:"2026-01-01T00:00:00Z", payload:{...common, regulatory_stage:"provisional_measure"} }),
  event({ id:"f2", watch_id:"watch-1", source_key:"snifa_sma", title:"W1 sancionatorio", occurred_at:"2026-02-01", first_seen_at:"2026-02-01T00:00:00Z", payload:{...common, regulatory_stage:"sanctioning_proceeding"} }),
  event({ id:"g1", watch_id:"watch-2", source_key:"snifa_sma", title:"W2 medida", occurred_at:"2026-01-02", first_seen_at:"2026-01-02T00:00:00Z", payload:{...common, regulatory_stage:"provisional_measure"} }),
  event({ id:"g2", watch_id:"watch-2", source_key:"snifa_sma", title:"W2 sancionatorio", occurred_at:"2026-02-02", first_seen_at:"2026-02-02T00:00:00Z", payload:{...common, regulatory_stage:"sanctioning_proceeding"} }),
])
assert.equal(separateWatch.length, 2, "different watches must produce separate timeline rows")
assert.ok(separateWatch.every(item => item.timeline?.milestones.length === 2), "each watch must retain only its own milestones")
assert.equal(new Set(separateWatch.map(item => item.id)).size, 2, "timeline ids must remain unique across duplicate watches")

console.log("SNIFA regulatory timeline regression PASS: exact canonical company + expediente milestones collapse into one chronological inbox signal without changing raw persistence, unrelated expedientes, other sources, or separate watches.")
