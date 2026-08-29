import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { PNG } from "pngjs"

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]
const BLOCKING_IMPACTS = new Set(["serious", "critical"])

function buildFixturePng() {
  const png = new PNG({ width: 128, height: 128 })
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const idx = (png.width * y + x) << 2
      const insideCircle = (x - 64) ** 2 + (y - 64) ** 2 < 42 ** 2
      png.data[idx] = insideCircle ? 30 : 236
      png.data[idx + 1] = insideCircle ? 60 : 239
      png.data[idx + 2] = insideCircle ? 80 : 242
      png.data[idx + 3] = 255
    }
  }
  return PNG.sync.write(png)
}

const FIXTURE_PNG = buildFixturePng()

function buildMockTrademarkPreview(brand) {
  return {
    analysis_mode: "trademark",
    marca: brand,
    denomination_source: "user",
    denomination_confidence: null,
    niza_context_provided: true,
    visual: {
      elementos: ["círculo", "líneas geométricas"],
      colores: ["verde", "blanco"],
      viena: [
        { code: "26.01.01", titulo: "Círculos", elemento: "círculo", confidence: 0.92 },
      ],
      fingerprint: {
        codes: ["26.01.01"],
        categories: ["26"],
        divisions: ["26.01"],
        labels: ["Círculos"],
      },
    },
    niza: [
      {
        numero: "09",
        titulo: "Software y aparatos científicos",
        tipo: "productos",
        razon: "El contexto entregado describe software para análisis de datos.",
      },
    ],
    busqueda: {
      estrategias_planificadas: 1,
      estrategias_ejecutadas: 1,
      estrategias: [{ id: "exact-name", label: "Nombre exacto", query: brand }],
      resultados_brutos: 52,
      resultados_unicos: 50,
      duplicados_eliminados: 2,
      estrategias_fallidas: 0,
    },
    evidencia: {
      fuente: "N3uralia Intelligence + INAPI live",
      consultado_en: "2026-08-25T12:45:00.000Z",
      resultados_totales: 50,
      resultados_activos: 39,
      confianza: "alta",
      imagenes_comparadas: 12,
      antecedentes_con_viena: 1,
      advertencias: [
        "Esta prueba usa evidencia sintética para validar la interfaz; la investigación real puede cambiar con la fuente oficial.",
      ],
    },
    lectura: {
      resumen: `La consulta sobre ${brand} devolvió 50 registros únicos y priorizó señales denominativas, fonéticas y visuales para revisión.`,
      recomendacion: "Revisar los antecedentes priorizados y confirmar alcance, clases y estado directamente en la fuente oficial.",
    },
    antecedentes: [
      {
        id: "mock-axe-antecedent-1",
        nombre: "ANTECEDENTE QA",
        titular: "Titular de prueba",
        estado: "Vigente",
        clases: ["09"],
        numero_registro: "1234567",
        numero_solicitud: "2026123456",
        razones: ["Coincidencia denominativa relevante", "Clase Niza compartida"],
        similitud_denominativa: 0.88,
        similitud_fonetica: 0.76,
        similitud_visual: 0.64,
        similitud_figurativa: 0.58,
        viena_compartida: ["26.01.01"],
        elementos_visuales_compartidos: ["círculo"],
      },
    ],
    locked_count: 49,
  }
}

function buildMockVisualOnlyPreview() {
  return {
    analysis_mode: "visual-only",
    marca: "Marca figurativa sin denominación",
    denomination_source: "not-detected",
    denomination_confidence: null,
    niza_context_provided: false,
    visual: {
      elementos: ["círculo", "silueta abstracta"],
      colores: ["verde", "blanco"],
      viena: [
        { code: "26.01.01", titulo: "Círculos", elemento: "círculo", confidence: 0.91 },
      ],
      fingerprint: {
        codes: ["26.01.01"],
        categories: ["26"],
        divisions: ["26.01"],
        labels: ["Círculos"],
      },
    },
    niza: [],
    busqueda: {
      estrategias_planificadas: 0,
      estrategias_ejecutadas: 0,
      estrategias: [],
      resultados_brutos: 0,
      resultados_unicos: 0,
      duplicados_eliminados: 0,
      estrategias_fallidas: 0,
    },
    evidencia: {
      fuente: "Análisis visual VIDENTIA",
      consultado_en: "2026-08-25T12:45:00.000Z",
      resultados_totales: 0,
      resultados_activos: 0,
      confianza: "media",
      imagenes_comparadas: 0,
      antecedentes_con_viena: 0,
      advertencias: [
        "No se ejecutó una búsqueda por nombre porque no se detectó una denominación con confianza suficiente.",
      ],
    },
    lectura: {
      resumen: "La imagen contiene señales figurativas suficientes para describir elementos y códigos Viena sin inventar una denominación.",
      recomendacion: "Añade una denominación si quieres contrastar antecedentes por nombre y contextualizar la búsqueda con productos o servicios.",
    },
    antecedentes: [],
    locked_count: 0,
  }
}

async function installMockPreviewApi(page, responseBody) {
  await page.route("**/api/v1/public/trademark-preview", async (route) => {
    expect(route.request().method()).toBe("POST")
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    })
  })
}

async function analyzeResultState(page, testInfo, label) {
  const result = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .analyze()

  const blocking = result.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact))

  await testInfo.attach(`axe-${label}.json`, {
    body: Buffer.from(JSON.stringify({
      url: page.url(),
      label,
      violations: result.violations,
      passes: result.passes.length,
      incomplete: result.incomplete,
    }, null, 2)),
    contentType: "application/json",
  })

  if (blocking.length > 0) {
    const summary = blocking
      .map((violation) => {
        const targets = violation.nodes.flatMap((node) => node.target).slice(0, 5).join(", ")
        return `${violation.id} [${violation.impact ?? "unknown"}] ${violation.help}${targets ? ` — ${targets}` : ""}`
      })
      .join("\n")
    throw new Error(`${label} has blocking accessibility violations:\n${summary}`)
  }
}

test.describe("VIDENTIA rendered result accessibility", () => {
  test("mocked trademark result has no serious or critical WCAG violations", async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "Chromium is the deterministic Axe gate; Firefox/WebKit keep interaction coverage in cloud-browser.spec.mjs.")

    await page.setViewportSize({ width: 1365, height: 900 })
    const brand = "VIDENTIA AXE RESULT"
    await installMockPreviewApi(page, buildMockTrademarkPreview(brand))

    await page.goto("/demo", { waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle")
    await page.getByLabel("Nombre de la marca").fill(brand)
    await page.getByLabel("Productos o servicios de la marca").fill("software para análisis de datos")
    await page.getByRole("button", { name: /Investigar marca/i }).click()

    await expect(page.getByText("Investigación completada", { exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: brand, exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "ANTECEDENTE QA", exact: true })).toBeVisible()
    await analyzeResultState(page, testInfo, "mock-trademark-result")
  })

  test("mocked visual-only result has no serious or critical WCAG violations", async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "Chromium is the deterministic Axe gate; Firefox/WebKit keep interaction coverage in cloud-browser.spec.mjs.")

    await page.setViewportSize({ width: 1365, height: 900 })
    await installMockPreviewApi(page, buildMockVisualOnlyPreview())

    await page.goto("/demo", { waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle")
    await page.locator('input[type="file"]').setInputFiles({
      name: "videntia-axe-visual-only.png",
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })
    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await page.getByRole("button", { name: /Investigar marca/i }).click()

    await expect(page.getByText("Análisis visual completado", { exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Marca figurativa sin denominación", exact: true })).toBeVisible()
    await expect(page.getByRole("link", { name: /Continuar investigación/i })).toHaveCount(0)
    await analyzeResultState(page, testInfo, "mock-visual-only-result")
  })
})
