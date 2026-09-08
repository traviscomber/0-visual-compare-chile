const LOOKBACK_DAYS = 7
const PAGE_SIZE = 100
const MAX_CONTIGUOUS_PAGES = 3

const TOPIC_KEYWORDS = [
  "orchard",
  "facility",
  "asana",
  "inventory",
  "maintenance",
  "geology",
  "assistant",
  "quality",
  "production",
  "harvest",
  "nursery",
  "sales",
  "mobile",
  "map",
  "auth",
  "evidence",
  "compliance",
  "fleet",
  "valuation",
  "portal",
  "api",
  "data",
  "ui",
  "qa",
] as const

type GitHubCommitWire = {
  sha?: string
  html_url?: string
  commit?: {
    message?: string
    author?: { date?: string | null } | null
    committer?: { date?: string | null } | null
  }
}

type NormalizedCommit = {
  sha: string
  message: string
  committedAt: string | null
  url: string | null
}

type GitHubPage = {
  commits: NormalizedCommit[]
  lastPage: number
  rateLimitRemaining: number | null
}

export type GitHubRepositoryActivity = {
  source: "github"
  status: "ok"
  repoFullName: string
  repoUrl: string
  observedAt: string
  lookbackDays: number
  commits7d: number
  commits24h: number
  commits24hLowerBound: boolean
  sampledCommits: number
  sampleComplete: boolean
  latestCommit: NormalizedCommit | null
  recentCommits: NormalizedCommit[]
  scopeActivity: Array<{ scope: string; count: number }>
  rateLimitRemaining: number | null
  decisionEffect: "none"
  note: string
}

export async function fetchGitHubRepositoryActivity(repoUrl: string, now = new Date()): Promise<GitHubRepositoryActivity> {
  const repoFullName = parseGitHubRepoUrl(repoUrl)
  if (!repoFullName) throw new Error(`Unsupported GitHub repository URL: ${repoUrl}`)

  const since = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString()
  const first = await fetchCommitPage(repoFullName, since, 1)
  const pages = new Map<number, GitHubPage>([[1, first]])
  const lastPage = Math.max(1, first.lastPage)

  for (let page = 2; page <= Math.min(lastPage, MAX_CONTIGUOUS_PAGES); page += 1) {
    pages.set(page, await fetchCommitPage(repoFullName, since, page))
  }
  if (lastPage > MAX_CONTIGUOUS_PAGES) {
    pages.set(lastPage, await fetchCommitPage(repoFullName, since, lastPage))
  }

  const last = pages.get(lastPage) ?? first
  const commits7d = lastPage === 1
    ? first.commits.length
    : (lastPage - 1) * PAGE_SIZE + last.commits.length

  const sampled = dedupeCommits([...pages.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([, page]) => page.commits))
  const frontSample = dedupeCommits([...pages.entries()]
    .filter(([page]) => page <= MAX_CONTIGUOUS_PAGES)
    .sort(([a], [b]) => a - b)
    .flatMap(([, page]) => page.commits))

  const cutoff24h = now.getTime() - 86_400_000
  const commits24h = frontSample.filter(commit => {
    const timestamp = commit.committedAt ? Date.parse(commit.committedAt) : Number.NaN
    return Number.isFinite(timestamp) && timestamp >= cutoff24h
  }).length
  const oldestFrontTimestamp = frontSample.reduce((oldest, commit) => {
    const timestamp = commit.committedAt ? Date.parse(commit.committedAt) : Number.NaN
    if (!Number.isFinite(timestamp)) return oldest
    return oldest === null || timestamp < oldest ? timestamp : oldest
  }, null as number | null)
  const commits24hLowerBound = lastPage > MAX_CONTIGUOUS_PAGES
    && (oldestFrontTimestamp === null || oldestFrontTimestamp >= cutoff24h)

  const scopeCounts = new Map<string, number>()
  for (const commit of sampled) {
    const scope = inferScope(commit.message)
    if (!scope) continue
    scopeCounts.set(scope, (scopeCounts.get(scope) ?? 0) + 1)
  }

  return {
    source: "github",
    status: "ok",
    repoFullName,
    repoUrl: `https://github.com/${repoFullName}`,
    observedAt: now.toISOString(),
    lookbackDays: LOOKBACK_DAYS,
    commits7d,
    commits24h,
    commits24hLowerBound,
    sampledCommits: sampled.length,
    sampleComplete: commits7d <= sampled.length,
    latestCommit: first.commits[0] ?? null,
    recentCommits: first.commits.slice(0, 8),
    scopeActivity: [...scopeCounts.entries()]
      .map(([scope, count]) => ({ scope, count }))
      .sort((a, b) => b.count - a.count || a.scope.localeCompare(b.scope))
      .slice(0, 8),
    rateLimitRemaining: first.rateLimitRemaining,
    decisionEffect: "none",
    note: "GitHub activity is authenticated institutional execution context only. It can update delivery/reuse context, but never evidence conviction, Chile adoption, market demand or a human decision.",
  }
}

function parseGitHubRepoUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname.toLowerCase() !== "github.com") return null
    const [owner, rawRepo] = url.pathname.split("/").filter(Boolean)
    const repo = rawRepo?.replace(/\.git$/i, "")
    return owner && repo ? `${owner}/${repo}` : null
  } catch {
    return null
  }
}

async function fetchCommitPage(repoFullName: string, since: string, page: number): Promise<GitHubPage> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "VIDENTIA-GitHub-Portfolio/1.0",
    "x-github-api-version": "2022-11-28",
  }
  if (token) headers.authorization = `Bearer ${token}`

  const params = new URLSearchParams({ since, per_page: String(PAGE_SIZE), page: String(page) })
  const response = await fetch(`https://api.github.com/repos/${repoFullName}/commits?${params.toString()}`, {
    headers,
    cache: "no-store",
  })
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining")
    throw new Error(`GitHub ${repoFullName} returned ${response.status}${remaining ? ` (rate remaining ${remaining})` : ""}`)
  }

  const payload = await response.json() as GitHubCommitWire[]
  const commits = Array.isArray(payload) ? payload.map(normalizeCommit).filter((item): item is NormalizedCommit => Boolean(item)) : []
  const rateLimitRemaining = numberOrNull(response.headers.get("x-ratelimit-remaining"))
  const lastPage = parseLastPage(response.headers.get("link")) ?? page
  return { commits, lastPage, rateLimitRemaining }
}

function normalizeCommit(value: GitHubCommitWire): NormalizedCommit | null {
  const sha = typeof value.sha === "string" ? value.sha.trim() : ""
  const rawMessage = value.commit?.message
  if (!sha || typeof rawMessage !== "string" || !rawMessage.trim()) return null
  const message = rawMessage.split("\n")[0]?.trim().slice(0, 240) ?? rawMessage.trim().slice(0, 240)
  const committedAt = value.commit?.committer?.date ?? value.commit?.author?.date ?? null
  return {
    sha,
    message,
    committedAt: typeof committedAt === "string" ? committedAt : null,
    url: typeof value.html_url === "string" ? value.html_url : null,
  }
}

function parseLastPage(link: string | null) {
  if (!link) return null
  for (const segment of link.split(",")) {
    if (!/rel="last"/.test(segment)) continue
    const match = segment.match(/[?&]page=(\d+)/)
    if (match) return Number(match[1])
  }
  return null
}

function inferScope(message: string) {
  const firstLine = message.split("\n")[0]?.trim().toLowerCase() ?? ""
  const conventional = firstLine.match(/^[a-z]+(?:\(([^)]+)\))?!?:/)
  if (conventional?.[1]) return normalizeScope(conventional[1])
  for (const keyword of TOPIC_KEYWORDS) {
    if (containsToken(firstLine, keyword)) return keyword
  }
  return null
}

function normalizeScope(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "other"
}

function containsToken(value: string, token: string) {
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(token)}([^a-z0-9]|$)`, "i").test(value)
}

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") }
function numberOrNull(value: string | null) { if (!value) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
function dedupeCommits(items: NormalizedCommit[]) { const seen = new Set<string>(); return items.filter(item => { if (seen.has(item.sha)) return false; seen.add(item.sha); return true }) }
