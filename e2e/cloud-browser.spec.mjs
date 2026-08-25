import { expect, test } from "@playwright/test"
import pngjs from "pngjs"

const { PNG } = pngjs
const RUN_LIVE_INVESTIGATION = process.env.E2E_LIVE === "1"

function buildFixturePng() {
  const png = new PNG({ width: 128, height: 128 })
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const index = (png.width * y + x) << 2
      const insideMark = x >= 28 && x <= 100 && y >= 28 && y <= 100
      png.data[index] = insideMark ? 27 : 244
      png.data[index + 1] = insideMark ? 143 : 247
      png.data[index + 2] = insideMark ? 128 : 246
      png.data[index + 3] = 255
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
      consultado_en: "2026-08-25T03:10:00.000Z",
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
        id: "mock-antecedent-1",
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
    denomination_confidence: 0.18,
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
      consultado_en: "2026-08-25T03:10:00.000Z",
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

function attachBrowserHealth(page) {
  const consoleErrors = []
  const pageErrors = []

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  page.on("pageerror", (error) => pageErrors.push(error.message))

  return { consoleErrors, pageErrors }
}

async function gotoInteractive(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle")
}

async function proveDemoHydration(page, name) {
  const nameInput = page.getByLabel("Nombre de la marca")
  const investigate = page.getByRole("button", { name: /Investigar marca/i })

  await nameInput.fill(name)
  await expect(investigate).toBeEnabled()

  return { nameInput, investigate }
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

async function focusViaKeyboard(page, locator, maxTabs = 16) {
  await expect(locator).toBeVisible()

  for (let index = 0; index <= maxTabs; index += 1) {
    if (await locator.evaluate((element) => document.activeElement === element)) return
    await page.keyboard.press("Tab")
  }

  throw new Error(`Keyboard focus did not reach ${await locator.getAttribute("aria-label") ?? await locator.innerText().catch(() => "target")}`)
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }))

  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewport + 1)
  expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.viewport + 1)
}

async function expectNoNestedInteractiveControls(page) {
  expect(await page.locator("a button, button a").count()).toBe(0)
}

async function expectUniqueDomIds(page) {
  const duplicates = await page.evaluate(() => {
    const counts = new Map()
    for (const element of document.querySelectorAll("[id]")) {
      if (!element.id) continue
      counts.set(element.id, (counts.get(element.id) ?? 0) + 1)
    }
    return [...counts.entries()].filter(([, count]) => count > 1)
  })
  expect(duplicates).toEqual([])
}

async function expectPublicRouteSemantics(page, expectedPath) {
  await expect(page.locator("h1")).toHaveCount(1)
  await expect(page.locator("h1")).toBeVisible()
  await expect(page.locator("main")).toHaveCount(1)

  const description = page.locator('meta[name="description"]')
  await expect(description).toHaveCount(1)
  const descriptionContent = (await description.getAttribute("content"))?.trim() ?? ""
  expect(descriptionContent.length).toBeGreaterThan(20)

  const canonical = page.locator('link[rel="canonical"]')
  await expect(canonical).toHaveCount(1)
  const canonicalHref = await canonical.getAttribute("href")
  expect(canonicalHref).toBeTruthy()
  expect(new URL(canonicalHref, "https://videntia.app").pathname).toBe(expectedPath)

  await expectUniqueDomIds(page)
  await expectNoNestedInteractiveControls(page)
  await expectNoHorizontalOverflow(page)
}

function expectHealthyBrowser(health) {
  expect(health.pageErrors, `page errors: ${health.pageErrors.join(" | ")}`).toEqual([])
  expect(health.consoleErrors, `console errors: ${health.consoleErrors.join(" | ")}`).toEqual([])
}

test.describe("VIDENTIA production cloud browser", () => {
  test("chromium desktop: real upload + investigation + contact continuity", async ({ page, browserName }, testInfo) => {
    test.skip(!RUN_LIVE_INVESTIGATION, "The real public investigation is opt-in so smoke runs do not consume public quota or external AI/INAPI capacity")
    test.skip(browserName !== "chromium", "The live public investigation runs once per suite to protect quota and external dependencies")

    await page.setViewportSize({ width: 1440, height: 1000 })
    const health = attachBrowserHealth(page)

    await gotoInteractive(page, "/demo")
    await expect(page).toHaveTitle(/VIDENTIA/i)
    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()
    await expectNoNestedInteractiveControls(page)

    const { nameInput, investigate } = await proveDemoHydration(page, "VIDENTIA")
    const activityInput = page.getByLabel("Productos o servicios de la marca")
    const fileInput = page.locator('input[type="file"]')

    await activityInput.fill("software para análisis de datos")
    await fileInput.setInputFiles({
      name: "videntia-cloud-e2e.png",
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })
    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(page.getByText("Imagen lista para investigar")).toBeVisible()

    await expect(investigate).toBeEnabled()
    await investigate.click()

    await expect(page.getByRole("status")).toBeVisible()
    await expect(nameInput).toBeDisabled()
    await expect(activityInput).toBeDisabled()
    await expect(fileInput).toBeDisabled()
    await page.screenshot({ path: testInfo.outputPath("chromium-desktop-loading.png"), fullPage: false })

    const resultMarker = page.getByText("Investigación completada", { exact: true })
    const visibleError = page.getByRole("alert").filter({ hasText: /\S/ })
    const outcome = await Promise.race([
      resultMarker.waitFor({ state: "visible", timeout: 70_000 }).then(() => ({ kind: "success", text: "" })),
      visibleError.waitFor({ state: "visible", timeout: 70_000 }).then(async () => ({ kind: "error", text: await visibleError.innerText() })),
    ])
    expect(outcome.kind, outcome.text || "La investigación no llegó al estado completado").toBe("success")

    await expect(page.getByRole("heading", { name: "VIDENTIA", exact: true })).toBeVisible()
    await expect(page.getByText(/Niza 09/).first()).toBeVisible()
    await expect(page.getByText(/Fuente N3uralia Intelligence \+ INAPI live/i)).toBeVisible()
    await expectNoNestedInteractiveControls(page)

    const continueLink = page.getByRole("link", { name: /Continuar investigación/i })
    await expect(continueLink).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("chromium-desktop-results.png"), fullPage: true })

    await continueLink.click()
    await page.waitForURL(/\/contacto\?/, { timeout: 15_000 })

    const contactUrl = new URL(page.url())
    expect(contactUrl.pathname).toBe("/contacto")
    expect(contactUrl.searchParams.get("origen")).toBe("demo")
    expect(contactUrl.searchParams.get("marca")).toBe("VIDENTIA")
    expect(Number(contactUrl.searchParams.get("resultados"))).toBeGreaterThan(0)

    await expect(page.getByText("Investigación iniciada en la demo", { exact: true })).toBeVisible()
    await expect(page.getByText("VIDENTIA", { exact: true }).first()).toBeVisible()
    await expectNoNestedInteractiveControls(page)
    await page.screenshot({ path: testInfo.outputPath("chromium-desktop-contact.png"), fullPage: true })

    expectHealthyBrowser(health)
  })

  test("cross-browser desktop: demo upload and contact context render", async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    const health = attachBrowserHealth(page)

    await gotoInteractive(page, "/demo")
    await expect(page).toHaveTitle(/VIDENTIA/i)
    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()
    await expectNoNestedInteractiveControls(page)

    const { investigate } = await proveDemoHydration(page, `VIDENTIA ${browserName.toUpperCase()} QA`)
    const activityInput = page.getByLabel("Productos o servicios de la marca")
    const fileInput = page.locator('input[type="file"]')

    await activityInput.fill("software para análisis de datos")
    await fileInput.setInputFiles({
      name: `videntia-${browserName}-desktop.png`,
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })

    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(page.getByText("Imagen lista para investigar")).toBeVisible()
    await expect(investigate).toBeEnabled()
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath(`${browserName}-desktop-upload.png`), fullPage: true })

    await gotoInteractive(page, "/contacto?origen=demo&marca=VIDENTIA&resultados=50")
    await expect(page.getByRole("heading", { name: /Continúa la investigación con el contexto que ya levantaste\./i })).toBeVisible()
    await expect(page.getByText("Investigación iniciada en la demo", { exact: true })).toBeVisible()
    await expect(page.getByText(/50 resultados observados/i)).toBeVisible()
    await expectNoNestedInteractiveControls(page)
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath(`${browserName}-desktop-contact.png`), fullPage: true })

    expectHealthyBrowser(health)
  })

  test("cross-browser mocked trademark result: evidence, responsive layout and contact CTA", async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    const health = attachBrowserHealth(page)
    const brand = `VIDENTIA ${browserName.toUpperCase()} MOCK`
    await installMockPreviewApi(page, buildMockTrademarkPreview(brand))

    await gotoInteractive(page, "/demo")
    const { investigate } = await proveDemoHydration(page, brand)
    await page.getByLabel("Productos o servicios de la marca").fill("software para análisis de datos")
    await investigate.click()

    await expect(page.getByText("Investigación completada", { exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: brand, exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "ANTECEDENTE QA", exact: true })).toBeVisible()
    await expect(page.getByText(/Niza 09/).first()).toBeVisible()
    await expect(page.getByText(/Fuente N3uralia Intelligence \+ INAPI live/i)).toBeVisible()
    await expect(page.getByText(/Hay 49 antecedentes adicionales/i)).toBeVisible()
    await expectNoNestedInteractiveControls(page)
    await expectNoHorizontalOverflow(page)

    const continueLink = page.getByRole("link", { name: /Continuar investigación/i })
    await expect(continueLink).toBeVisible()
    const href = await continueLink.getAttribute("href")
    expect(href).toBeTruthy()
    const contactHref = new URL(href, "https://videntia.app")
    expect(contactHref.pathname).toBe("/contacto")
    expect(contactHref.searchParams.get("origen")).toBe("demo")
    expect(contactHref.searchParams.get("marca")).toBe(brand)
    expect(contactHref.searchParams.get("resultados")).toBe("50")

    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await expect(continueLink).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`${browserName}-mock-trademark-mobile.png`), fullPage: false })

    await continueLink.click()
    await page.waitForURL(/\/contacto\?/, { timeout: 15_000 })
    const contactUrl = new URL(page.url())
    expect(contactUrl.searchParams.get("marca")).toBe(brand)
    expect(contactUrl.searchParams.get("resultados")).toBe("50")
    await expect(page.getByText("Investigación iniciada en la demo", { exact: true })).toBeVisible()
    await expectNoNestedInteractiveControls(page)
    await expectNoHorizontalOverflow(page)

    expectHealthyBrowser(health)
  })

  test("cross-browser mocked visual-only result: no invented denomination or antecedents", async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    const health = attachBrowserHealth(page)
    await installMockPreviewApi(page, buildMockVisualOnlyPreview())

    await gotoInteractive(page, "/demo")
    const investigate = page.getByRole("button", { name: /Investigar marca/i })
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: `videntia-${browserName}-visual-only.png`,
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })
    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(investigate).toBeEnabled()
    await investigate.click()

    await expect(page.getByText("Análisis visual completado", { exact: true })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Marca figurativa sin denominación", exact: true })).toBeVisible()
    await expect(page.getByText(/No se detectó texto marcario con confianza suficiente/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /Análisis figurativo, sin inventar antecedentes/i })).toBeVisible()
    await expect(page.getByText(/26\.01\.01 · Círculos/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /Continuar investigación/i })).toHaveCount(0)
    await expectNoNestedInteractiveControls(page)
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: testInfo.outputPath(`${browserName}-mock-visual-only-mobile.png`), fullPage: false })

    await page.getByRole("button", { name: /Añadir denominación/i }).click()
    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()
    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(page.getByLabel("Nombre de la marca")).toHaveValue("")
    await expectNoNestedInteractiveControls(page)

    expectHealthyBrowser(health)
  })

  test("cross-browser mobile: demo layout and upload remain usable", async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const health = attachBrowserHealth(page)

    await gotoInteractive(page, "/demo")
    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()
    await expectNoNestedInteractiveControls(page)

    const { investigate } = await proveDemoHydration(page, `VIDENTIA ${browserName.toUpperCase()} MOBILE QA`)
    const activityInput = page.getByLabel("Productos o servicios de la marca")
    const fileInput = page.locator('input[type="file"]')

    await activityInput.fill("software para análisis de datos")
    await fileInput.setInputFiles({
      name: `videntia-${browserName}-mobile.png`,
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })

    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(investigate).toBeVisible()
    await expect(investigate).toBeEnabled()
    await expectNoHorizontalOverflow(page)

    await page.screenshot({ path: testInfo.outputPath(`${browserName}-mobile-upload.png`), fullPage: true })

    expectHealthyBrowser(health)
  })

  test("cross-browser keyboard: demo controls and legal routes remain accessible", async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 1365, height: 900 })
    const health = attachBrowserHealth(page)

    await gotoInteractive(page, "/demo")
    await expectNoNestedInteractiveControls(page)
    const uploadButton = page.getByRole("button", { name: /Arrastra un logo o una fotografía/i })
    const nameInput = page.getByLabel("Nombre de la marca")
    const activityInput = page.getByLabel("Productos o servicios de la marca")
    const investigate = page.getByRole("button", { name: /Investigar marca/i })

    await focusViaKeyboard(page, uploadButton)
    await expect(uploadButton).toBeFocused()

    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.keyboard.press("Enter")
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: `videntia-${browserName}-keyboard.png`,
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })
    await expect(page.getByAltText("Marca cargada")).toBeVisible()

    await focusViaKeyboard(page, nameInput)
    await page.keyboard.type(`VIDENTIA ${browserName.toUpperCase()} KEYBOARD QA`)
    await expect(investigate).toBeEnabled()

    await focusViaKeyboard(page, activityInput)
    await page.keyboard.type("software para análisis de datos")
    await page.keyboard.press("Shift+Tab")
    await expect(investigate).toBeFocused()
    await page.screenshot({ path: testInfo.outputPath(`${browserName}-keyboard-focus.png`), fullPage: false })

    await gotoInteractive(page, "/privacidad")
    await expect(page.getByRole("heading", { name: "Política de privacidad", exact: true })).toBeVisible()
    await expect(page.getByText(/Última actualización: 24 de agosto de 2026/i)).toBeVisible()
    await expectNoNestedInteractiveControls(page)
    const termsLink = page.getByRole("link", { name: "Términos de uso", exact: true })
    await termsLink.focus()
    await expect(termsLink).toBeFocused()
    await page.keyboard.press("Enter")
    await page.waitForURL(/\/terminos$/)
    await expect(page.getByRole("heading", { name: "Términos de uso", exact: true })).toBeVisible()
    await expect(page.getByRole("link", { name: "Política de privacidad", exact: true })).toBeVisible()
    await expectNoNestedInteractiveControls(page)
    await expectNoHorizontalOverflow(page)

    expectHealthyBrowser(health)
  })

  test("cross-browser public routes: semantic structure remains valid", async ({ page, browserName }, testInfo) => {
    const health = attachBrowserHealth(page)
    const publicRoutes = ["/", "/demo", "/contacto", "/privacidad", "/terminos"]

    for (const route of publicRoutes) {
      await page.setViewportSize({ width: 1365, height: 900 })
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response, `${route} did not return a navigation response`).not.toBeNull()
      expect(response.status(), `${route} returned HTTP ${response.status()}`).toBeLessThan(400)
      await page.waitForLoadState("networkidle")
      await expect(page).toHaveTitle(/VIDENTIA/i)
      await expectPublicRouteSemantics(page, route)

      await page.setViewportSize({ width: 390, height: 844 })
      await expectPublicRouteSemantics(page, route)

      if (route === "/") {
        await page.screenshot({ path: testInfo.outputPath(`${browserName}-public-home-mobile.png`), fullPage: false })
      }
    }

    expectHealthyBrowser(health)
  })

})
