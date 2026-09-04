import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const [page, actionRoute] = await Promise.all([
  readFile("app/(app)/monitorear/atencion/page.tsx", "utf8"),
  readFile("app/api/intelligence/actions/route.ts", "utf8"),
])

assert.match(page, /fetch\("\/api\/intelligence\/actions"/, "attention queue must use the canonical intelligence action API")
assert.match(page, /origin:"executive_attention"/, "created work must retain executive-attention provenance")
assert.match(page, /signalKey:item\.signalKey/, "created work must retain the originating signal identity")
assert.match(page, /watchKey:item\.watchKey/, "created work must retain the originating watch identity")
assert.match(page, /sourceHref:item\.href/, "created work must retain the evidence URL")
assert.match(page, /sourceId:item\.signalKey/, "action deduplication must be keyed by the stable signal id")
assert.match(page, /assignedTo:null/, "attention conversion must not invent an assignee")
assert.match(page, /priority==="critica"\?24:priority==="alta"\?48:24\*7/, "attention priorities must map to deterministic 24h, 48h and 7d SLAs")
assert.match(page, /action\.created\?\.action===false\?"Acción existente recuperada"/, "duplicate-safe action reuse must be visible to the user")
assert.match(page, /Abrir acción/, "created or reused work must link into the canonical case workflow")
assert.match(page, /Evidencia/, "action conversion must keep direct evidence access visible")

assert.match(actionRoute, /rpc\("create_intelligence_action"/, "attention flow must reuse the canonical transactional RPC")
assert.match(actionRoute, /href: `\/casos\/\$\{row\.case_id\}\/equipo`/, "canonical action API must return the team workflow destination")
assert.match(actionRoute, /status: created\.case \|\| created\.evidence \|\| created\.action \? 201 : 200/, "canonical API must preserve duplicate-safe reuse semantics")

console.log("Executive attention actions regression PASS: prioritized attention converts into duplicate-safe case work with deterministic SLA and preserved evidence provenance.")
