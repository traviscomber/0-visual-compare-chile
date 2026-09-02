import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const LAST_UPDATE_URL = "https://data.gdeltproject.org/gdeltv2/lastupdate.txt"
const ALLOWED_HOST = "data.gdeltproject.org"
const TIMEOUT_MS = 12_000
const READINESS_TIMEOUT_MS = 6_000
const SAMPLE_BYTES = 1024
const FALLBACK_STEPS_MINUTES = [0, 15, 30, 45, 60] as const

export type GdeltRawFeedProbeResult = {
  provider: "gdelt_raw_feed"
  lastUpdateStatus: number
  artifactStatus: number
  artifactUrl: string
  artifactBytes: number | null
  artifactTimestamp: string
  ageMinutes: number
  fallbackMinutes: number
  sampleBytes: number
  zipMagic: string
}

type Candidate = {
  url: URL
  date: Date
  bytes: number | null
  fallbackMinutes: number
}

export async function probeGdeltRawFeed(now = new Date()): Promise<GdeltRawFeedProbeResult> {
  try {
    const listing = await fetchWithRetry(LAST_UPDATE_URL, {
      cache: "no-store",
      headers: { Accept: "text/plain,*/*", "User-Agent": "VIDENTIA/1.0" },
    }, {
      attempts: 3,
      baseDelayMs: 500,
      timeoutMs: TIMEOUT_MS,
    })

    if (!listing.ok) throw new Error(`GDELT raw lastupdate responded ${listing.status}`)
    const text = await listing.text()
    const exportLine = text
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(line => line.endsWith(".export.CSV.zip"))

    if (!exportLine) throw new Error("GDELT raw lastupdate did not contain an export artifact")
    const [bytesRaw, , rawUrl] = exportLine.split(/\s+/)
    if (!rawUrl) throw new Error("GDELT raw export artifact URL is missing")

    const latestUrl = validateArtifactUrl(rawUrl)
    const timestampMatch = latestUrl.pathname.match(/\/(\d{14})\.export\.CSV\.zip$/)
    if (!timestampMatch) throw new Error("GDELT raw export artifact timestamp is missing")
    const latestDate = parseGdeltTimestamp(timestampMatch[1])
    const latestBytes = Number.isFinite(Number(bytesRaw)) ? Number(bytesRaw) : null

    let lastStatus = 0
    for (const fallbackMinutes of FALLBACK_STEPS_MINUTES) {
      const candidate = buildCandidate(latestUrl, latestDate, latestBytes, fallbackMinutes)
      const artifact = await fetchWithRetry(candidate.url, {
        cache: "no-store",
        headers: {
          Accept: "application/zip,application/octet-stream,*/*",
          Range: `bytes=0-${SAMPLE_BYTES - 1}`,
          "User-Agent": "VIDENTIA/1.0",
        },
      }, {
        attempts: 1,
        baseDelayMs: 250,
        timeoutMs: READINESS_TIMEOUT_MS,
      })

      lastStatus = artifact.status
      if (artifact.status === 404) continue
      if (artifact.status !== 200 && artifact.status !== 206) {
        throw new Error(`GDELT raw export range responded ${artifact.status}`)
      }

      const sample = new Uint8Array(await artifact.arrayBuffer())
      const zipMagic = Array.from(sample.slice(0, 4)).map(value => value.toString(16).padStart(2, "0")).join("")
      if (!zipMagic.startsWith("504b")) throw new Error(`GDELT raw export is not a ZIP payload: ${zipMagic}`)

      const ageMinutes = Math.max(0, Math.round((now.getTime() - candidate.date.getTime()) / 60000))
      const result: GdeltRawFeedProbeResult = {
        provider: "gdelt_raw_feed",
        lastUpdateStatus: listing.status,
        artifactStatus: artifact.status,
        artifactUrl: candidate.url.toString(),
        artifactBytes: candidate.bytes ?? responseTotalBytes(artifact),
        artifactTimestamp: candidate.date.toISOString(),
        ageMinutes,
        fallbackMinutes,
        sampleBytes: sample.byteLength,
        zipMagic,
      }

      console.info("[gdelt/raw-feed] probe success", result)
      return result
    }

    throw new Error(`GDELT raw export unavailable across ${FALLBACK_STEPS_MINUTES.at(-1)} minute readiness window (latest status ${lastStatus || "unknown"})`)
  } catch (error) {
    console.warn("[gdelt/raw-feed] probe failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

function validateArtifactUrl(rawUrl: string) {
  const artifactUrl = new URL(rawUrl.replace(/^http:/, "https:"))
  if (artifactUrl.hostname !== ALLOWED_HOST || !artifactUrl.pathname.startsWith("/gdeltv2/")) {
    throw new Error(`GDELT raw artifact host/path rejected: ${artifactUrl.hostname}${artifactUrl.pathname}`)
  }
  return artifactUrl
}

function buildCandidate(latestUrl: URL, latestDate: Date, latestBytes: number | null, fallbackMinutes: number): Candidate {
  const date = new Date(latestDate.getTime() - fallbackMinutes * 60_000)
  const stamp = formatGdeltTimestamp(date)
  const url = new URL(latestUrl.toString())
  url.pathname = url.pathname.replace(/\/\d{14}\.export\.CSV\.zip$/, `/${stamp}.export.CSV.zip`)
  return { url, date, bytes: fallbackMinutes === 0 ? latestBytes : null, fallbackMinutes }
}

function responseTotalBytes(response: Response) {
  const contentRange = response.headers.get("content-range")
  const match = contentRange?.match(/\/(\d+)$/)
  if (match && Number.isFinite(Number(match[1]))) return Number(match[1])
  const contentLength = Number(response.headers.get("content-length"))
  return Number.isFinite(contentLength) && response.status === 200 ? contentLength : null
}

function formatGdeltTimestamp(date: Date) {
  const parts = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ]
  return parts.map((value, index) => index === 0 ? String(value).padStart(4, "0") : String(value).padStart(2, "0")).join("")
}

function parseGdeltTimestamp(value: string) {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1
  const day = Number(value.slice(6, 8))
  const hour = Number(value.slice(8, 10))
  const minute = Number(value.slice(10, 12))
  const second = Number(value.slice(12, 14))
  const date = new Date(Date.UTC(year, month, day, hour, minute, second))
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid GDELT raw timestamp: ${value}`)
  return date
}
