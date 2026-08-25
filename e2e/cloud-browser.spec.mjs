import { expect, test } from "@playwright/test"
import pngjs from "pngjs"

const { PNG } = pngjs

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

function attachBrowserHealth(page) {
  const consoleErrors = []
  const pageErrors = []

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text())
  })
  page.on("pageerror", (error) => pageErrors.push(error.message))

  return { consoleErrors, pageErrors }
}

test.describe("VIDENTIA production cloud browser", () => {
  test("desktop: real upload + investigation + contact continuity", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const health = attachBrowserHealth(page)

    await page.goto("/demo", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveTitle(/VIDENTIA/i)
    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()

    const nameInput = page.getByLabel("Nombre de la marca")
    const activityInput = page.getByLabel("Productos o servicios de la marca")
    const fileInput = page.locator('input[type="file"]')

    await fileInput.setInputFiles({
      name: "videntia-cloud-e2e.png",
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })
    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(page.getByText("Imagen lista para investigar")).toBeVisible()

    await nameInput.fill("VIDENTIA")
    await activityInput.fill("software para análisis de datos")

    const investigate = page.getByRole("button", { name: /Investigar marca/i })
    await expect(investigate).toBeEnabled()
    await investigate.click()

    await expect(page.getByRole("status")).toBeVisible()
    await expect(nameInput).toBeDisabled()
    await expect(activityInput).toBeDisabled()
    await expect(fileInput).toBeDisabled()
    await page.screenshot({ path: testInfo.outputPath("desktop-loading.png"), fullPage: false })

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

    const continueButton = page.getByRole("button", { name: /Continuar investigación/i })
    await expect(continueButton).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("desktop-results.png"), fullPage: true })

    await continueButton.click()
    await page.waitForURL(/\/contacto\?/, { timeout: 15_000 })

    const contactUrl = new URL(page.url())
    expect(contactUrl.pathname).toBe("/contacto")
    expect(contactUrl.searchParams.get("origen")).toBe("demo")
    expect(contactUrl.searchParams.get("marca")).toBe("VIDENTIA")
    expect(Number(contactUrl.searchParams.get("resultados"))).toBeGreaterThan(0)

    await expect(page.getByText("Investigación iniciada en la demo", { exact: true })).toBeVisible()
    await expect(page.getByText("VIDENTIA", { exact: true }).first()).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("desktop-contact.png"), fullPage: true })

    expect(health.pageErrors, `page errors: ${health.pageErrors.join(" | ")}`).toEqual([])
    expect(health.consoleErrors, `console errors: ${health.consoleErrors.join(" | ")}`).toEqual([])
  })

  test("mobile: demo layout and upload remain usable without consuming a second search", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const health = attachBrowserHealth(page)

    await page.goto("/demo", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()

    const nameInput = page.getByLabel("Nombre de la marca")
    const activityInput = page.getByLabel("Productos o servicios de la marca")
    const fileInput = page.locator('input[type="file"]')

    await nameInput.fill("VIDENTIA MOBILE QA")
    await activityInput.fill("software para análisis de datos")
    await fileInput.setInputFiles({
      name: "videntia-mobile-e2e.png",
      mimeType: "image/png",
      buffer: FIXTURE_PNG,
    })

    await expect(page.getByAltText("Marca cargada")).toBeVisible()
    await expect(page.getByRole("button", { name: /Investigar marca/i })).toBeVisible()

    const overflow = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))
    expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewport + 1)
    expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.viewport + 1)

    await page.screenshot({ path: testInfo.outputPath("mobile-upload.png"), fullPage: true })

    expect(health.pageErrors, `page errors: ${health.pageErrors.join(" | ")}`).toEqual([])
    expect(health.consoleErrors, `console errors: ${health.consoleErrors.join(" | ")}`).toEqual([])
  })
})
