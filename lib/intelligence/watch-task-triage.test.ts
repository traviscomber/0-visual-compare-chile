import { describe, expect, it } from "vitest"
import { triageWatchTasks } from "./watch-task-triage"

const base = {
  type: "technology" as const,
  watchQuery: "enterprise AI agents",
  source: "google_news_rss",
  detail: null,
  occurredAt: "2026-09-05T12:00:00.000Z",
  firstSeenAt: "2026-09-05T12:10:00.000Z",
  isNew: true,
}

describe("triageWatchTasks", () => {
  it("deduplicates equivalent evidence and keeps low relevance informational", () => {
    const result = triageWatchTasks([
      { ...base, key: "technology:1", title: "Same story - Publisher", href: "https://example.com/story?utm_source=test", relevance: "media" as const },
      { ...base, key: "technology:2", title: "Same story - Publisher", href: "https://example.com/story", relevance: "media" as const },
      { ...base, key: "technology:3", title: "Background story", href: "https://example.com/background", relevance: "baja" as const },
    ])

    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].duplicateCount).toBe(1)
    expect(result.tasks[0].groupedKeys).toEqual(["technology:1", "technology:2"])
    expect(result.information).toHaveLength(1)
    expect(result.hiddenDuplicateCount).toBe(1)
  })
})
