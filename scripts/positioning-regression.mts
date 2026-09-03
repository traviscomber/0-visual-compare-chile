import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Positioning regression FAIL: ${message}`)
  process.exit(1)
}

const layout = await readFile("app/layout.tsx", "utf8")
const login = await readFile("app/auth/login/login-form.tsx", "utf8")
const spanishRoot = await readFile("app/es/[[...path]]/page.tsx", "utf8")

for (const needle of [
  "VIDENTIA — IP & Technology Intelligence",
  "Research and continuously monitor trademarks, patents and technologies",
  "propiedad intelectual Chile",
  "inteligencia tecnológica",
  "clases Niza",
  "clasificación de Viena",
  "IPC patentes",
]) {
  if (!layout.includes(needle)) fail(`global metadata missing ${needle}`)
}

for (const needle of [
  "VIDENTIA | Inteligencia de propiedad intelectual y tecnología",
  "Busca, compara y monitorea marcas, patentes y tecnologías",
]) {
  if (!spanishRoot.includes(needle)) fail(`Spanish public metadata missing ${needle}`)
}

if (layout.includes("VIDENTIA | Inteligencia y protección de marcas")) {
  fail("global title regressed to trademark-only positioning")
}
if (!login.includes("VIDENTIA / inteligencia de propiedad intelectual y tecnología")) {
  fail("login positioning is not aligned with the broader product scope")
}
if (login.includes("VIDENTIA / inteligencia marcaria")) {
  fail("login regressed to trademark-only positioning")
}

console.log("Positioning regression PASS: canonical English metadata, localized Spanish positioning and broader IP/technology scope preserve marks, Niza, Vienna and patents.")
