import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`App shell section context regression FAIL: ${message}`)
  process.exit(1)
}

const source = await readFile("components/app/app-nav.tsx", "utf8")

const marksNavigation = source.match(/\{href:"\/investigar",label:"Marcas",icon:Search,aliases:\[([^\]]*)\]\}/)?.[1] ?? ""
if (marksNavigation.includes('"/portfolio"')) {
  fail("portfolio is still classified as a Marcas navigation alias")
}

for (const needle of [
  '"/portfolio":"Portafolio"',
  '"/casos":"Casos"',
  '"/oportunidades":"Oportunidades"',
  '"/empresas":"Empresas"',
  '"/espacios":"Espacios"',
  '"/brechas":"Brechas"',
  '"/fuentes":"Fuentes"',
  '"/notificaciones":"Notificaciones"',
  '"/settings":"Configuración"',
  'const sectionLabels:Readonly<Record<string,string>>',
  'function currentSectionLabel(pathname:string)',
  'Object.entries(sectionLabels)',
  '{currentSectionLabel(pathname)}',
]) {
  if (!source.includes(needle)) fail(`missing shell context invariant: ${needle}`)
}

for (const forbidden of [
  'href:"/portfolio",label:',
  'href:"/casos",label:',
  'href:"/empresas",label:',
  'href:"/espacios",label:',
  'href:"/brechas",label:',
  'href:"/oportunidades",label:',
]) {
  if (source.includes(forbidden)) fail(`operational context leaked into primary navigation syntax: ${forbidden}`)
}

console.log("App shell section context regression PASS: operational workspaces keep exact shell labels without becoming primary navigation items, and Portfolio is no longer presented as Marcas.")
