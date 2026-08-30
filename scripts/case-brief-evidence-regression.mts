import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const briefPath = fileURLToPath(new URL("../app/(app)/casos/[id]/brief/page.tsx", import.meta.url))
const source = await readFile(briefPath, "utf8")

assert.match(source, /\.maybeSingle\(\)/, "brief case lookup must distinguish missing case from query failure")
assert.match(source, /caseResult\.error \|\| itemsResult\.error \|\| eventsResult\.error/, "brief must fail closed when any evidence source fails")
assert.match(source, /throw new Error\("No pudimos cargar la evidencia completa del caso para generar el brief\."\)/, "brief must surface incomplete evidence loading as an error")
assert.doesNotMatch(source, /items:\s*\(items \?\? \[\]\)/, "brief must not silently replace a failed item query with an empty evidence set")
assert.doesNotMatch(source, /events:\s*\(events \?\? \[\]\)/, "brief must not silently replace a failed timeline query with an empty event set")

console.log("Case brief evidence regression PASS: incomplete evidence cannot produce a valid-looking brief.")
