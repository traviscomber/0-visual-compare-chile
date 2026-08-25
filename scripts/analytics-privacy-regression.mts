import {
  buildDemoRequestAnalytics,
  buildDemoResultAnalytics,
  getDemoInputMode,
  redactAnalyticsUrl,
} from '../lib/analytics/privacy.ts'

function fail(message: string): never {
  console.error(`Analytics privacy regression FAIL: ${message}`)
  process.exit(1)
}

const contactUrl = 'https://videntia.app/contacto?origen=demo&marca=MARCA-SECRETA&resultados=50#continuar'
const redacted = redactAnalyticsUrl(contactUrl)
if (redacted !== 'https://videntia.app/contacto') {
  fail(`expected query and hash to be removed, got ${redacted}`)
}
if (redacted.includes('MARCA-SECRETA') || redacted.includes('resultados') || redacted.includes('origen')) {
  fail('redacted URL still contains continuation context')
}

const modeCases = [
  [true, false, 'name'],
  [false, true, 'image'],
  [true, true, 'name_image'],
] as const
for (const [hasName, hasImage, expected] of modeCases) {
  const actual = getDemoInputMode(hasName, hasImage)
  if (actual !== expected) fail(`expected ${expected}, got ${actual}`)
}

const request = buildDemoRequestAnalytics({ hasName: true, hasImage: true, hasActivity: true })
const requestKeys = Object.keys(request).sort().join(',')
if (requestKeys !== 'has_activity,input_mode') {
  fail(`unexpected Demo Request properties: ${requestKeys}`)
}

const result = buildDemoResultAnalytics({
  hasName: false,
  hasImage: true,
  hasActivity: false,
  analysisMode: 'visual-only',
})
const resultKeys = Object.keys(result).sort().join(',')
if (resultKeys !== 'analysis_mode,has_activity,input_mode') {
  fail(`unexpected Demo Result properties: ${resultKeys}`)
}

const forbiddenKeys = ['marca', 'nombre', 'actividad', 'image', 'imagen', 'ip', 'user_agent', 'user-agent']
for (const payload of [request, result]) {
  const serializedKeys = Object.keys(payload).map((key) => key.toLowerCase())
  for (const forbidden of forbiddenKeys) {
    if (serializedKeys.includes(forbidden)) fail(`analytics payload exposes forbidden key ${forbidden}`)
  }
}

console.log('Analytics privacy regression PASS: URL context redacted; 3 input modes and event schemas are privacy-safe.')
