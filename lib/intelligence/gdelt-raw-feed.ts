import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const LAST_UPDATE_URL = "https://data.gdeltproject.org/gdeltv2/lastupdate.txt"
const ALLOWED_HOST = "data.gdeltproject.org"
const TIMEOUT_MS = 12_000
const SAMPLE_BYTES = 1024

export type GdeltRawFeedProbeResult = {
  provider: "gdelt_raw_feed"
  lastUpdateStatus: number
  artifactStatus: number
  artifactUrl: string
  artifactBytes: number | null
  artifactTimestamp: string
  ageMinutes: number
  sampleBytes: number
  zipMagic: string
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

    const artifactUrl = new URL(rawUrl.replace(/^http:/, "https:"))
    if (artifactUrl.hostname !== ALLOWED_HOST || !artifactUrl.pathname.startsWith("/gdeltv2/")) {
      throw new Error(`GDELT raw artifact host/path rejected: ${artifactUrl.hostname}${artifactUrl.pathname}`)
    }

    const timestampMatch = artifactUrl.pathname.match(/\/(\d{14})\.export\.CSV\.zip$/)
    if (!timestampMatch) throw new Error("GDELT raw export artifact timestamp is missing")
    const artifactDate = parseGdeltTimestamp(timestampMatch[1])
    const ageMinutes = Math.max(0, Math.round((now.getTime() - artifactDate.getTime()) / 60000))

    const artifact = await fetchWithRetry(artifactUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/zip,application/octet-stream,*/*",
        Range: `bytes=0-${SAMPLE_BYTES - 1}`,
        "User-Agent": "VIDENTIA/1.0",
      },
    }, {
      attempts: 3,
      baseDelayMs: 500,
      timeoutMs: TIMEOUT_MS,
    })

    if (artifact.status !== 200 && artifact.status !== 206) {
      throw new Error(`GDELT raw export range responded ${artifact.status}`)
    }

    const sample = new Uint8Array(await artifact.arrayBuffer())
    const zipMagic = Array.from(sample.slice(0, 4)).map(value => value.toString(16).padStart(2, "0")).join("")
    if (!zipMagic.startsWith("504b")) throw new Error(`GDELT raw export is not a ZIP payload: ${zipMagic}`)

    const result: GdeltRawFeedProbeResult = {
      provider: "gdelt_raw_feed",
      lastUpdateStatus: listing.status,
      artifactStatus: artifact.status,
      artifactUrl: artifactUrl.toString(),
      artifactBytes: Number.isFinite(Number(bytesRaw)) ? Number(bytesRaw) : null,
      artifactTimestamp: artifactDate.toISOString(),
      ageMinutes,
      sampleBytes: sample.byteLength,
      zipMagic,
    }

    console.info("[gdelt/raw-feed] probe success", result)
    return result
  } catch (error) {
    console.warn("[gdelt/raw-feed] probe failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
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
