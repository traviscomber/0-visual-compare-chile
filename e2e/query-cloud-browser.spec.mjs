import { expect, test } from "@playwright/test"

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }))

  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewport + 1)
  expect(overflow.bodyWidth).toBeLessThanOrEqual(overflow.viewport + 1)
}

test.describe("VIDENTIA landing to demo continuity", () => {
  test("query marca prefills the public investigation across browsers", async ({ page, browserName }) => {
    const brand = `VIDENTIA ${browserName.toUpperCase()} PREFILL`
    await page.setViewportSize({ width: 1365, height: 900 })
    await page.goto(`/demo?marca=${encodeURIComponent(brand)}`, { waitUntil: "domcontentloaded" })
    await page.waitForLoadState("networkidle")

    await expect(page.getByRole("heading", { name: /Entrega la marca\. Revisa la evidencia\./i })).toBeVisible()
    await expect(page.getByLabel("Nombre de la marca")).toHaveValue(brand)
    await expect(page.getByRole("button", { name: /Investigar marca/i })).toBeEnabled()
    await expectNoHorizontalOverflow(page)

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByLabel("Nombre de la marca")).toHaveValue(brand)
    await expectNoHorizontalOverflow(page)
  })
})
