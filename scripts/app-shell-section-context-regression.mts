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
  '{href:"/portfolio",label:"Portafolio"}',
  '{href:"/casos",label:"Casos"}',
  '{href:"/oportunidades",label:"Oportunidades"}',
  '{href:"/empresas",label:"Empresas"}',
  '{href:"/espacios",label:"Espacios"}',
  '{href:"/brechas",label:"Brechas"}',
  '{href:"/fuentes",label:"Fuentes"}',
  '{href:"/notificaciones",label:"Notificaciones"}',
  '{href:"/settings",label:"Configuración"}',
  'function currentSectionLabel(pathname:string)',
  '{currentSectionLabel(pathname)}',
]) {
  if (!source.includes(needle)) fail(`missing shell context invariant: ${needle}`)
}

console.log("App shell section context regression PASS: operational workspaces keep exact section labels and Portfolio is no longer presented as Marcas.")
