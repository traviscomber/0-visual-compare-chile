import assert from "node:assert/strict"
import { buildExecutiveAttentionQueue, type ExecutiveAttentionSignal } from "../lib/intelligence/executive-attention.ts"

function signal(input: Partial<ExecutiveAttentionSignal> & Pick<ExecutiveAttentionSignal,"key"|"watchKey"|"type"|"watchQuery"|"source"|"title"|"firstSeenAt"|"relevance"|"isNew"|"href">): ExecutiveAttentionSignal {
  return { detail:null, occurredAt:null, timeline:null, ...input }
}

const queue = buildExecutiveAttentionQueue([
  signal({
    key:"reg-materialized", watchKey:"technology:w1", type:"technology", watchQuery:"Empresa Uno", source:"SMA · línea regulatoria", title:"Caso 1", firstSeenAt:"2026-06-05T10:00:00Z", relevance:"alta", isNew:false, href:"https://snifa.sma.gob.cl/RegistroPublico/Ficha/3",
    timeline:{ expediente:"D-033-2016", canonicalCompanyName:"Empresa Uno", assessment:{ latestStage:"firm_sanction", latestStageLabel:"Sanción firme", latestMovementAt:"2026-06-04", direction:"materializado", attention:"alta", durationDays:145, rationale:"x" } },
  }),
  signal({
    key:"reg-escalating", watchKey:"technology:w2", type:"technology", watchQuery:"Empresa Dos", source:"SMA · línea regulatoria", title:"Caso 2", firstSeenAt:"2026-05-02T10:00:00Z", relevance:"alta", isNew:true, href:"https://snifa.sma.gob.cl/Sancionatorio/Ficha/2",
    timeline:{ expediente:"D-010-2026", canonicalCompanyName:"Empresa Dos", assessment:{ latestStage:"sanctioning_proceeding", latestStageLabel:"Procedimiento sancionatorio", latestMovementAt:"2026-05-01", direction:"escalando", attention:"alta", durationDays:30, rationale:"x" } },
  }),
  signal({
    key:"reg-mitigation", watchKey:"technology:w3", type:"technology", watchQuery:"Empresa Tres", source:"SMA · línea regulatoria", title:"Caso 3", firstSeenAt:"2026-04-02T10:00:00Z", relevance:"media", isNew:false, href:"https://snifa.sma.gob.cl/ProgramaCumplimiento/Ficha/4",
    timeline:{ expediente:"D-020-2026", canonicalCompanyName:"Empresa Tres", assessment:{ latestStage:"compliance_program", latestStageLabel:"Programa de Cumplimiento", latestMovementAt:"2026-04-01", direction:"mitigacion", attention:"media", durationDays:60, rationale:"x" } },
  }),
  signal({ key:"fresh-high", watchKey:"brand:b1", type:"brand", watchQuery:"Marca Uno", source:"INAPI", title:"Nueva oposición", firstSeenAt:"2026-07-01T10:00:00Z", relevance:"alta", isNew:true, href:"/monitorear" }),
  signal({ key:"old-high", watchKey:"brand:b2", type:"brand", watchQuery:"Marca Dos", source:"INAPI", title:"Histórica", firstSeenAt:"2026-07-02T10:00:00Z", relevance:"alta", isNew:false, href:"/monitorear" }),
  signal({ key:"fresh-medium", watchKey:"patent:p1", type:"patent", watchQuery:"Patente", source:"WIPO", title:"Nueva patente", firstSeenAt:"2026-07-03T10:00:00Z", relevance:"media", isNew:true, href:"/patentes" }),
])

assert.equal(queue.length, 4, "queue must keep regulatory cases plus only new high non-regulatory signals")
assert.deepEqual(queue.map(item=>item.priority), ["critica","alta","alta","media"], "priority order must be critical, high, then medium")
assert.equal(queue[0].signalKey, "reg-materialized", "materialized regulatory risk must lead even after inbox review")
assert.equal(queue[1].signalKey, "reg-escalating", "new escalating regulatory case must precede generic high signal")
assert.equal(queue[2].signalKey, "fresh-high")
assert.equal(queue[3].signalKey, "reg-mitigation", "mitigation remains in executive queue even when already reviewed")
assert.match(queue[0].reason, /riesgo regulatorio ya se materializó/)
assert.match(queue[1].reason, /trayectoria oficial está escalando/)
assert.match(queue[3].reason, /señal formal de mitigación/)
assert.ok(!queue.some(item=>item.signalKey==="old-high"), "reviewed generic high signals must not become persistent executive cases")
assert.ok(!queue.some(item=>item.signalKey==="fresh-medium"), "generic medium signals must stay out of executive attention")

console.log("Executive attention queue regression PASS: persistent regulatory cases and new high signals are ranked deterministically by materiality, novelty and recency without turning review state into case resolution.")
