import { readFile } from "node:fs/promises"

function fail(message:string):never{console.error(`Assistant route focus regression FAIL: ${message}`);process.exit(1)}
function requireText(source:string,needle:string,label:string){if(!source.includes(needle))fail(`${label} missing ${needle}`)}
function forbid(source:string,needle:string,label:string){if(source.includes(needle))fail(`${label} must not contain ${needle}`)}

const [proxy, layout, page, launcher] = await Promise.all([
  readFile("proxy.ts", "utf8"),
  readFile("app/(app)/layout.tsx", "utf8"),
  readFile("app/(app)/asistente/page.tsx", "utf8"),
  readFile("components/app/videntia-assistant-launcher.tsx", "utf8"),
])

for (const needle of [
  'updateSession(request, requestHeaders)',
]) requireText(proxy, needle, "proxy")
forbid(proxy, 'x-videntia-pathname', "proxy")

for (const needle of [
  'showJuanIntelligence ? <JuanProjectIdeasStrip',
  'showJuanIntelligence ? <JuanProductEvolutionStrip',
  '{children}',
  '<VidentiaAssistantLauncher />',
]) requireText(layout, needle, "app layout")
for (const forbidden of [
  'import { headers } from "next/headers"',
  'pathname !== "/asistente"',
]) forbid(layout, forbidden, "app layout")

requireText(page, 'redirect("/dashboard?assistant=open")', "assistant compatibility route")
for (const forbidden of [
  'OperationalPage',
  'Pregunta, investiga y aplica.',
]) forbid(page, forbidden, "assistant compatibility route")

for (const needle of [
  'aria-label="Abrir Asistente VIDENTIA"',
  'role="dialog"',
  'aria-label="Asistente VIDENTIA"',
  'fixed inset-x-2 bottom-2 top-[72px]',
  'setOpen(false)',
]) requireText(launcher, needle, "floating assistant")

console.log("Assistant route focus regression PASS: VIDENTIA no longer depends on a dedicated assistant workspace; the assistant is a persistent floating chat layered over authenticated workspaces while the legacy /asistente URL opens it on the dashboard.")
