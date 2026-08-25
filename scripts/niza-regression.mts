import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { applyNizaSemanticGuardrails, type NizaGuardrailClass } from '../lib/agent/niza-guardrails.ts'

type FixtureCase = {
  id: string
  expected: string
  description: string
}

const fixturePath = fileURLToPath(new URL('../tests/fixtures/niza-regression-cases.json', import.meta.url))
const fixture = JSON.parse(await readFile(fixturePath, 'utf8')) as FixtureCase[]

function fail(message: string): never {
  console.error(`Niza regression FAIL: ${message}`)
  process.exit(1)
}

function codes(items: NizaGuardrailClass[]) {
  return items.map((item) => item.numero)
}

function fakeClass(numero: string, tipo: 'principal' | 'defensiva' = 'principal'): NizaGuardrailClass {
  return {
    numero,
    titulo: `Clase ${numero}`,
    tipo,
    razon: 'fixture',
    confidence: 0.9,
  }
}

function expectExact(label: string, description: string, modelCodes: string[], expected: string[]) {
  const result = applyNizaSemanticGuardrails(
    { descripcion: description },
    modelCodes.map((numero) => fakeClass(numero)),
    (numero) => `Clase ${numero}`,
  )
  const actual = codes(result)
  if (actual.join(',') !== expected.join(',')) {
    fail(`${label}: expected [${expected.join(', ')}], got [${actual.join(', ')}]`)
  }
}

const expectedCodes = Array.from({ length: 45 }, (_, index) => String(index + 1).padStart(2, '0'))
if (fixture.length !== 45) fail(`fixture must contain 45 cases, found ${fixture.length}`)

const fixtureCodes = fixture.map((item) => item.expected)
const uniqueCodes = [...new Set(fixtureCodes)]
if (uniqueCodes.length !== 45) fail(`fixture contains duplicate expected classes: ${fixtureCodes.join(', ')}`)

for (const code of expectedCodes) {
  const matches = fixture.filter((item) => item.expected === code)
  if (matches.length !== 1) fail(`class ${code} must appear exactly once, found ${matches.length}`)
  if (!matches[0].description.trim()) fail(`class ${code} has an empty description`)
  if (matches[0].id !== `niza-${code}`) fail(`class ${code} has inconsistent id ${matches[0].id}`)
}

expectExact(
  'generic product software',
  'software para análisis, búsqueda y vigilancia de marcas comerciales',
  ['09', '35', '42', '45'],
  ['09'],
)
expectExact(
  'pure SaaS',
  'software como servicio SaaS para análisis de datos empresariales',
  ['09', '35', '42'],
  ['42'],
)
expectExact(
  'hybrid SaaS and downloadable app',
  'software como servicio SaaS y aplicación móvil descargable para análisis de datos',
  ['09', '42'],
  ['09', '42'],
)
expectExact(
  'legal-tech SaaS is not legal service',
  'software como servicio SaaS para gestión de expedientes jurídicos',
  ['09', '42', '45'],
  ['42'],
)
expectExact(
  'explicit legal service',
  'servicios jurídicos, asesoría legal y representación legal de clientes',
  ['45'],
  ['45'],
)
expectExact(
  'own beverage does not imply class 35',
  'bebidas no alcohólicas y jugos',
  ['32', '35'],
  ['32'],
)
expectExact(
  'explicit marketing service',
  'servicios de publicidad y marketing para terceros',
  ['35'],
  ['35'],
)

const deduped = applyNizaSemanticGuardrails(
  { descripcion: 'software como servicio SaaS para análisis de datos' },
  [fakeClass('42', 'defensiva'), fakeClass('42', 'principal'), fakeClass('09')],
  (numero) => `Clase ${numero}`,
)
if (codes(deduped).join(',') !== '42' || deduped[0]?.tipo !== 'principal') {
  fail('dedupe/principal precedence is not deterministic')
}

console.log(`Niza regression PASS: ${fixture.length}/45 class fixtures present; 8 deterministic guardrail assertions passed.`)
