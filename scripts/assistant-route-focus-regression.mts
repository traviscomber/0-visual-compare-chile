import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant route focus regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}

const [proxy, layout, page] = await Promise.all([
  readFile("proxy.ts", "utf8"),
  readFile("app/(app)/layout.tsx", "utf8"),
  readFile("app/(app)/asistente/page.tsx", "utf8"),
])

for (const needle of [
  'requestHeaders.set("x-videntia-pathname", pathname)',
  'updateSession(request, requestHeaders)',
]) requireText(proxy, needle, "proxy")

for (const needle of [
  'import { headers } from "next/headers"',
  'const requestHeaders = await headers()',
  'requestHeaders.get("x-videntia-pathname")',
  'const showJuanContextStrips = showJuanIntelligence && pathname !== "/asistente"',
  'showJuanContextStrips ? <JuanProjectIdeasStrip',
  'showJuanContextStrips ? <JuanProductEvolutionStrip',
  '{children}',
]) requireText(layout, needle, "app layout")

for (const needle of [
  'VIDENTIA / Asistente',
  'Pregunta, investiga y aplica.',
  'Acciones propuestas · requieren aprobación',
]) requireText(page, needle, "assistant page")

console.log("Assistant route focus regression PASS: the authenticated pathname is forwarded into the app layout, Juan intelligence context strips stay available elsewhere, and /asistente keeps the assistant workspace as the primary surface.")
