import "server-only"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"

const AWS_GDELT_BUCKET = "https://gdelt-open-data.s3.amazonaws.com"
const TIMEOUT_MS = 12_000
const SAMPLE_BYTES = 4096

type AwsObject = {
  key: string
  lastModified: string | null
  size: number | null
}

export type GdeltAwsProbeResult = {
  provider: "aws_open_data"
  bucket: string
  prefix: string
  listStatus: number
  objectKey: string
  objectSize: number | null
  lastModified: string | null
  rangeStatus: number
  sampleBytes: number
  firstRowColumns: number
}

export async function probeGdeltAwsOpenData(now = new Date()): Promise<GdeltAwsProbeResult> {
  try {
    const years = [now.getUTCFullYear(), now.getUTCFullYear() - 1]
    let selected: { prefix: string; status: number; object: AwsObject } | null = null

    for (const year of years) {
      const prefix = `events/${year}`
      const listing = await listObjects(prefix)
      const object = listing.objects
        .filter(item => item.key.endsWith(".csv"))
        .sort((a, b) => a.key.localeCompare(b.key))
        .at(-1)

      if (object) {
        selected = { prefix, status: listing.status, object }
        break
      }
    }

    if (!selected) {
      throw new Error(`AWS GDELT Open Data returned no CSV object for ${years.join(" or ")}`)
    }

    const objectUrl = new URL(selected.object.key, `${AWS_GDELT_BUCKET}/`)
    const response = await fetchWithRetry(objectUrl, {
      cache: "no-store",
      headers: {
        Accept: "text/plain,text/csv,*/*",
        Range: `bytes=0-${SAMPLE_BYTES - 1}`,
        "User-Agent": "VIDENTIA/1.0",
      },
    }, {
      attempts: 3,
      baseDelayMs: 500,
      timeoutMs: TIMEOUT_MS,
    })

    if (response.status !== 200 && response.status !== 206) {
      throw new Error(`AWS GDELT object range responded ${response.status}`)
    }

    const sample = await response.text()
    const firstRow = sample.split(/\r?\n/, 1)[0] ?? ""
    const firstRowColumns = firstRow ? firstRow.split("\t").length : 0
    if (firstRowColumns < 50) {
      throw new Error(`AWS GDELT sample shape is unexpected: ${firstRowColumns} columns`)
    }

    const result: GdeltAwsProbeResult = {
      provider: "aws_open_data",
      bucket: AWS_GDELT_BUCKET,
      prefix: selected.prefix,
      listStatus: selected.status,
      objectKey: selected.object.key,
      objectSize: selected.object.size,
      lastModified: selected.object.lastModified,
      rangeStatus: response.status,
      sampleBytes: Buffer.byteLength(sample, "utf8"),
      firstRowColumns,
    }

    console.info("[gdelt/aws-open-data] probe success", result)
    return result
  } catch (error) {
    console.warn("[gdelt/aws-open-data] probe failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

async function listObjects(prefix: string) {
  const url = new URL(AWS_GDELT_BUCKET)
  url.searchParams.set("list-type", "2")
  url.searchParams.set("prefix", prefix)
  url.searchParams.set("max-keys", "20")

  const response = await fetchWithRetry(url, {
    cache: "no-store",
    headers: { Accept: "application/xml,text/xml,*/*", "User-Agent": "VIDENTIA/1.0" },
  }, {
    attempts: 3,
    baseDelayMs: 500,
    timeoutMs: TIMEOUT_MS,
  })

  if (!response.ok) throw new Error(`AWS GDELT bucket listing responded ${response.status}`)
  const xml = await response.text()
  return { status: response.status, objects: parseObjects(xml) }
}

function parseObjects(xml: string): AwsObject[] {
  return Array.from(xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)).flatMap(match => {
    const block = match[1] ?? ""
    const key = xmlValue(block, "Key")
    if (!key) return []
    const sizeRaw = xmlValue(block, "Size")
    return [{
      key: decodeXml(key),
      lastModified: xmlValue(block, "LastModified"),
      size: sizeRaw && Number.isFinite(Number(sizeRaw)) ? Number(sizeRaw) : null,
    }]
  })
}

function xmlValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return match?.[1]?.trim() || null
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
}
