import assert from "node:assert/strict"
import { describe, it } from "node:test"
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

    assert.equal(result.tasks.length, 1)
    assert.equal(result.tasks[0].duplicateCount, 1)
    assert.deepEqual(result.tasks[0].groupedKeys, ["technology:1", "technology:2"])
    assert.equal(result.information.length, 1)
    assert.equal(result.hiddenDuplicateCount, 1)
  })
})
