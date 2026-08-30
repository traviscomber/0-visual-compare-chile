import { expect, test } from "@playwright/test"

const desktop = { width: 1440, height: 900 }
const mobile = { width: 390, height: 844 }

async function waitForCurrentLanding(page) {
  await expect.poll(async () => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    return page.getByText("02. CÓMO FUNCIONA", { exact: true }).count()
  }, {
    timeout: 120_000,
    intervals: [2_000, 4_000, 8_000, 10_000],
    message: "Wait for the current landing deployment to reach production",
  }).toBeGreaterThan(0)
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1)
}

async function expectRevealContentIsPainted(page) {
  const hiddenRevealCount = await page.locator("[data-px-reveal]").evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = getComputedStyle(node)
      return Number(style.opacity) < 0.99 || style.visibility === "hidden" || style.display === "none"
    }).length,
  )
  expect(hiddenRevealCount).toBe(0)
}

test("VIDENTIA landing keeps the locked full-page composition on desktop and mobile", async ({ page }, testInfo) => {
  await page.setViewportSize(desktop)
  await waitForCurrentLanding(page)

  await expect(page.getByRole("heading", { name: "Protege tu marca desde antes de registrarla." })).toBeVisible()
  await expect(page.getByRole("searchbox", { name: "Buscar una marca, nombre o logo" })).toBeVisible()
  await expect(page.getByText("Revisión inicial gratuita", { exact: true }).first()).toBeVisible()
  await expect(page.getByRole("heading", { name: "Un proceso simple, inteligente y trazable." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Todo lo que necesitas para proteger tu marca." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Diseñado para equipos que construyen marcas." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Portfolio + Watch + Deadlines." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Empieza a proteger tu marca hoy." })).toBeVisible()
  await expectRevealContentIsPainted(page)
  await expectNoHorizontalOverflow(page)

  const heroImage = page.getByAltText("Dos personas comparan marcas con grandes lupas sobre geometría Bauhaus de VIDENTIA")
  await expect(heroImage).toBeVisible()
  const heroBox = await heroImage.boundingBox()
  expect(heroBox?.width ?? 0).toBeGreaterThan(520)
  expect(heroBox?.height ?? 0).toBeGreaterThan(300)

  await page.screenshot({
    path: testInfo.outputPath(`landing-${testInfo.project.name}-desktop.png`),
    fullPage: true,
  })

  await page.setViewportSize(mobile)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: "Protege tu marca desde antes de registrarla." })).toBeVisible()
  await expect(page.getByRole("searchbox", { name: "Buscar una marca, nombre o logo" })).toBeVisible()
  await expect(heroImage).toBeVisible()
  await expectRevealContentIsPainted(page)
  await expectNoHorizontalOverflow(page)

  await page.screenshot({
    path: testInfo.outputPath(`landing-${testInfo.project.name}-mobile.png`),
    fullPage: true,
  })
})
