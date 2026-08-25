import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const PUBLIC_ROUTES = ["/", "/demo", "/contacto", "/docs", "/privacidad", "/terminos"]
const BLOCKING_IMPACTS = new Set(["serious", "critical"])

function summarizeViolation(violation) {
  const targets = violation.nodes
    .flatMap((node) => node.target)
    .slice(0, 5)
    .join(", ")

  return `${violation.id} [${violation.impact ?? "unknown"}] ${violation.help}${targets ? ` — ${targets}` : ""}`
}

test.describe("VIDENTIA public accessibility", () => {
  test("public routes have no serious or critical WCAG violations", async ({ page, browserName }, testInfo) => {
    test.skip(browserName !== "chromium", "Axe rules are deterministic; Chromium is the accessibility gate while Firefox/WebKit remain interaction coverage.")

    for (const route of PUBLIC_ROUTES) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response, `${route} did not return a navigation response`).not.toBeNull()
      expect(response.status(), `${route} returned HTTP ${response.status()}`).toBeLessThan(400)
      await page.waitForLoadState("networkidle")

      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()

      const blocking = result.violations.filter((violation) => BLOCKING_IMPACTS.has(violation.impact))
      const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-")

      await testInfo.attach(`axe-${slug}.json`, {
        body: Buffer.from(JSON.stringify({
          url: page.url(),
          route,
          violations: result.violations,
          passes: result.passes.length,
          incomplete: result.incomplete,
        }, null, 2)),
        contentType: "application/json",
      })

      expect(
        blocking,
        `${route} has blocking accessibility violations:\n${blocking.map(summarizeViolation).join("\n")}`,
      ).toEqual([])
    }
  })
})
