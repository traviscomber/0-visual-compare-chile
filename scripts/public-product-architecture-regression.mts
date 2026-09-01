import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Public product architecture regression FAIL: ${message}`)
  process.exit(1)
}

function requireText(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) fail(`${label} missing ${needle}`)
}

const [
  roadmap,
  landing,
  demo,
  umbrellaDemo,
  patentPreview,
  patentPreviewRoute,
  esPage,
  enPage,
  rootPage,
  trademarkRoute,
  esTrademarkRoute,
  patents,
  technologies,
  technologyCoverage,
  patentRoute,
  technologyRoute,
  esPatents,
  esTechnologies,
  enTechnologies,
  publicNav,
  sessionProxy,
  englishLogin,
  spanishLogin,
  loginForm,
] = await Promise.all([
  readFile("ROADMAP.md", "utf8"),
  readFile("components/localized-landing-page.tsx", "utf8"),
  readFile("components/public-intelligence-demo.tsx", "utf8"),
  readFile("components/umbrella-demo.tsx", "utf8"),
  readFile("components/patent-preview-search.tsx", "utf8"),
  readFile("app/api/v1/public/patent-preview/route.ts", "utf8"),
  readFile("app/es/[[...path]]/page.tsx", "utf8"),
  readFile("app/en/[[...path]]/page.tsx", "utf8"),
  readFile("app/page.tsx", "utf8"),
  readFile("app/trademarks/page.tsx", "utf8"),
  readFile("app/es/marcas/page.tsx", "utf8"),
  readFile("components/localized-patents-page.tsx", "utf8"),
  readFile("components/localized-technologies-page.tsx", "utf8"),
  readFile("components/technology-source-coverage.tsx", "utf8"),
  readFile("app/patents/page.tsx", "utf8"),
  readFile("app/technologies/page.tsx", "utf8"),
  readFile("app/es/patentes/page.tsx", "utf8"),
  readFile("app/es/tecnologias/page.tsx", "utf8"),
  readFile("app/en/technologies/page.tsx", "utf8"),
  readFile("components/public-platform-nav.tsx", "utf8"),
  readFile("lib/supabase/proxy.ts", "utf8"),
  readFile("app/en/auth/login/page.tsx", "utf8"),
  readFile("app/es/auth/login/page.tsx", "utf8"),
  readFile("components/localized-login-form.tsx", "utf8"),
])

for (const needle of [
  "Brands, Patents y Technologies",
  "SEARCH → COMPARE → EVALUATE → WATCH → REPORT",
  "OVERVIEW / BRANDS / PATENTS / TECHNOLOGIES / WATCHES / REPORTS",
  "Common Watches",
  "Common Reports",
  "Product architecture / canonical roadmap — NOW",
  "Public product / landing umbrella — NOW",
]) requireText(roadmap, needle, "canonical roadmap")

for (const needle of [
  "Inteligencia para lo que construyes, proteges y sigues.",
  "Intelligence for what you build, protect and follow.",
  "Brands. Patents. Technologies.",
  "TRES PREGUNTAS. UN SISTEMA DE INTELIGENCIA.",
  "THREE QUESTIONS. ONE INTELLIGENCE SYSTEM.",
  "BRAND INTELLIGENCE",
  "PATENT INTELLIGENCE",
  "TECHNOLOGY INTELLIGENCE",
  "UN SOLO MOTOR DE INTELIGENCIA",
  "ONE INTELLIGENCE ENGINE",
  "PublicIntelligenceDemo",
  "/es/tecnologias",
  "/en/technologies",
  "/images/videntia-hero-comparison-hd.webp",
]) requireText(landing, needle, "umbrella landing")

if (landing.includes("from \"lucide-react\"") || patents.includes("from \"lucide-react\"") || technologies.includes("from \"lucide-react\"") || technologyCoverage.includes("from \"lucide-react\"")) {
  fail("public umbrella, patent and technology surfaces must not depend on generic Lucide icon language")
}

for (const forbidden of ["bg-gradient", "linear-gradient", "radial-gradient", "glassmorphism"]) {
  if (landing.includes(forbidden) || patents.includes(forbidden) || technologies.includes(forbidden) || technologyCoverage.includes(forbidden)) {
    fail(`public product surfaces must not use forbidden visual language: ${forbidden}`)
  }
}

for (const needle of ["BRAND", "PATENT", "TECHNOLOGY", "The same system. Three ways to ask."]) requireText(demo, needle, "product demo")
for (const needle of [
  'role="tablist"',
  'role="tab"',
  "aria-controls",
  'role="tabpanel"',
  "aria-labelledby",
  "handleTabKeyDown",
  'event.key === "ArrowRight"',
  'event.key === "Home"',
  "focus-visible:ring-2",
]) requireText(demo, needle, "live product demo accessibility")

requireText(esPage, "Inteligencia de propiedad intelectual y tecnología", "Spanish metadata")
requireText(esPage, "marcas, patentes y tecnologías", "Spanish metadata")
requireText(enPage, "Intellectual property and technology intelligence", "English metadata")
requireText(enPage, "brands, patents and technologies", "English metadata")

if (esPage.includes("Inteligencia y protección de marcas") || enPage.includes("Trademark intelligence and protection")) {
  fail("root public metadata must not revert to trademark-only positioning")
}

for (const [source, label] of [
  [rootPage, "canonical root route"],
  [trademarkRoute, "English trademark route"],
  [esTrademarkRoute, "Spanish trademark route"],
  [patentRoute, "English patent route"],
  [technologyRoute, "English technology route"],
  [esPatents, "Spanish patent route"],
  [esTechnologies, "Spanish technology route"],
] as const) {
  requireText(source, 'id="main-content"', label)
  requireText(source, "tabIndex={-1}", label)
}

for (const [source, label, text] of [
  [enPage, "English legacy root", "SKIP TO CONTENT"],
  [esPage, "Spanish public root", "SALTAR AL CONTENIDO"],
] as const) {
  requireText(source, 'href="#main-content"', label)
  requireText(source, 'id="main-content"', label)
  requireText(source, text, label)
}

for (const needle of ["SOURCE ≠ ANALYSIS ≠ LEGAL CONCLUSION", "Family resolution", "jurisdictions", "citations"]) requireText(patents, needle, "public patents")
for (const needle of ["TECHNOLOGY REPORT", "WHAT CHANGED", "WHO IS MOVING", "A search can become a watch.", "TechnologySourceCoverage"]) requireText(technologies, needle, "public technologies")

for (const needle of [
  "SOURCE COVERAGE",
  "OpenAlex + Crossref",
  "INAPI Open Data",
  "INAPI Datos Abiertos",
  "Google News RSS",
  "EPO OPS",
  "OPERATIONAL EVIDENCE",
  "EVIDENCIA OPERACIONAL",
  "OFFICIAL MIRROR · DAILY",
  "MIRROR OFICIAL · DIARIO",
  "OPERATIONAL CONTEXT",
  "CONTEXTO OPERACIONAL",
  "CLIENT READY · CREDENTIAL-GATED",
  "CLIENTE LISTO · REQUIERE CREDENCIALES",
  "Evidence ≠ analysis. Analysis ≠ legal conclusion.",
  "Evidencia ≠ análisis. Análisis ≠ conclusión legal.",
]) requireText(technologyCoverage, needle, "technology source coverage")

if (technologyCoverage.includes('"GDELT"')) fail("technology source coverage must not advertise disabled GDELT as operational")

for (const [source, label, active] of [
  [esPatents, "Spanish patent route", 'active="patents"'],
  [esTechnologies, "Spanish technology route", 'active="technologies"'],
] as const) {
  requireText(source, "PublicPlatformNav", label)
  requireText(source, 'locale="es"', label)
  requireText(source, active, label)
  requireText(source, "[&>main>nav]:hidden", label)
}
requireText(enTechnologies, 'technologiesMetadata("en")', "English technology route")

for (const needle of ['"/marcas"', '"/patentes"', '"/tecnologias"']) requireText(sessionProxy, needle, "localized public routing")
requireText(sessionProxy, "isLocalizedPublicPath", "localized public routing")

for (const needle of [
  "/trademarks",
  "/patents",
  "/technologies",
  "START A SEARCH",
  "MENU",
  "focus-visible:ring-2",
  'href="#main-content"',
  "SKIP TO CONTENT",
  "SALTAR AL CONTENIDO",
]) requireText(publicNav, needle, "shared public navigation")
requireText(publicNav, "/en/auth/login?redirectTo=%2Ftechnologies", "English technology search CTA")
requireText(publicNav, "/es/auth/login?redirectTo=%2Fes%2Ftecnologias", "Spanish technology search CTA")

for (const [source, label] of [
  [patentRoute, "English patent route focus"],
  [esPatents, "Spanish patent route focus"],
  [technologyRoute, "English technology route focus"],
  [esTechnologies, "Spanish technology route focus"],
] as const) requireText(source, ":focus-visible", label)

for (const needle of [
  'role="tablist"',
  'role="tab"',
  "aria-controls",
  'role="tabpanel"',
  "aria-labelledby",
  "handleTabKeyDown",
  'event.key === "ArrowRight"',
  'event.key === "Home"',
  "focus-visible:ring-2",
]) requireText(umbrellaDemo, needle, "keyboard-accessible umbrella demo")

for (const needle of [
  'htmlFor="patent-preview-query"',
  'id="patent-preview-query"',
  'aria-describedby="patent-preview-description"',
  'aria-busy={loading}',
  'aria-live="polite"',
  "focus-within:border-[#96B5A6]",
  "focus-visible:ring-2",
]) requireText(patentPreview, needle, "accessible patent preview")

for (const needle of [
  "EVIDENCE COVERAGE",
  "COBERTURA DE EVIDENCIA",
  "OFFICIAL DATASET",
  "DATASET OFICIAL",
  "application_number",
  "filing_date",
  "source_url",
  "last_synced_at",
  "NOT A LEGAL CONCLUSION",
  "NO ES CONCLUSIÓN LEGAL",
]) requireText(patentPreview, needle, "patent preview evidence provenance")

for (const needle of [
  'PUBLIC_SOURCE_HOST = "datos.gob.cl"',
  'url.hostname !== PUBLIC_SOURCE_HOST',
  "application_number",
  "filing_date",
  "source_url",
  "last_synced_at",
  "international_family_resolution",
  "citations",
  "patentability_conclusion",
  "fto_conclusion",
]) requireText(patentPreviewRoute, needle, "patent preview provenance API")

for (const needle of ["/patents", "/technologies"]) requireText(englishLogin, needle, "English canonical auth return")
for (const needle of ["/es/patentes", "/es/tecnologias"]) requireText(spanishLogin, needle, "Spanish canonical auth return")

requireText(loginForm, "VIDENTIA / IP & TECHNOLOGY INTELLIGENCE", "login positioning")
requireText(loginForm, "Search. Compare. Evaluate. Watch. Report.", "login positioning")
if (loginForm.includes("VIDENTIA / trademark intelligence")) fail("login must not revert to trademark-only positioning")

console.log("Public product architecture regression PASS: VIDENTIA is locked as one Brands/Patents/Technologies intelligence platform with shared navigation, locale-safe public routes, canonical auth returns, aligned workspace positioning, guarded patent claims, patent evidence provenance, explicit technology source coverage, non-generic Bauhaus marketing surfaces, skip navigation and keyboard-accessible public controls.")
