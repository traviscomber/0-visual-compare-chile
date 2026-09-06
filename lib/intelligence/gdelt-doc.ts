import "server-only"

/**
 * Deprecated compatibility shim.
 *
 * VIDENTIA no longer calls GDELT DOC API because that transport is rate-limited
 * and duplicates the canonical GDELT Events + Mentions + GKG pipeline. Strategic
 * global signals are produced by gdelt-watch-fusion.ts from the synchronized raw
 * corpus, while Google News RSS remains contextual only.
 *
 * Keep this export temporarily so existing scanner imports compile while the
 * obsolete call path is removed in a follow-up cleanup. It intentionally performs
 * no network request and emits no signals.
 */
export type GdeltArticleSignal = {
  source: "gdelt_doc"
  sourceRecordId: string
  title: string
  url: string
  seenAt: string | null
  domain: string | null
  language: string | null
  sourceCountry: string | null
}

export async function searchGdeltArticles(
  _query: string,
  _options: { timespan?: string; limit?: number } = {},
): Promise<GdeltArticleSignal[]> {
  return []
}
