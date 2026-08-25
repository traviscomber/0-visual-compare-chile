import { expect, test } from "@playwright/test"

const PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z6S8AAAAASUVORK5CYII=",
  "base64",
)

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
      buffer: PIXEL_PNG,
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

    await expect(page.getByText("Investigación completada", { exact: true })).toBeVisible({ timeout: 70_000 })
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
      buffer: PIXEL_PNG,
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
