import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Juan workspace focus regression FAIL: ${message}`)
  process.exit(1)
}

const page = await readFile("app/(app)/mi-espacio/page.tsx", "utf8")

for (const needle of [
  '<JuanExecutiveWorkspace userId={user.id} />',
  '<details className="group',
  'Segundo nivel',
  'Ver radar, oportunidades e inteligencia completa',
  '<JuanVidentiaImprovementRadar userId={user.id} />',
  '<JuanProjectIdeasStrip userId={user.id} />',
  '<JuanProductEvolutionStrip userId={user.id} />',
  'href="/mi-espacio?assistant=open"',
  'Preguntar a VIDENTIA',
]) {
  if (!page.includes(needle)) fail(`missing ${needle}`)
}

const executiveIndex = page.indexOf('<JuanExecutiveWorkspace userId={user.id} />')
const detailsIndex = page.indexOf('<details className="group')
const radarIndex = page.indexOf('<JuanVidentiaImprovementRadar userId={user.id} />')
if (!(executiveIndex >= 0 && detailsIndex > executiveIndex && radarIndex > detailsIndex)) {
  fail("primary executive workspace must precede collapsed secondary intelligence")
}

if (page.includes("defaultOpen") || page.includes("<details open")) {
  fail("secondary intelligence must remain collapsed by default")
}

console.log("Juan workspace focus regression PASS")
