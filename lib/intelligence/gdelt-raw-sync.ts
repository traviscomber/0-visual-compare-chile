import "server-only"
import { createHash } from "node:crypto"
import { inflateRawSync } from "node:zlib"
import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchWithRetry } from "@/lib/intelligence/fetch-with-retry"
import { probeGdeltRawFeed } from "@/lib/intelligence/gdelt-raw-feed"
import {
  failIntelligenceIngestion,
  finishIntelligenceIngestion,
  startIntelligenceIngestion,
} from "@/lib/intelligence/ingestion-observability"

const MAX_COMPRESSED_BYTES = 25 * 1024 * 1024
const MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000
const BATCH_SIZE = 250

const GDELT_COLUMNS = [
  "GLOBALEVENTID","SQLDATE","MonthYear","Year","FractionDate","Actor1Code","Actor1Name","Actor1CountryCode","Actor1KnownGroupCode","Actor1EthnicCode","Actor1Religion1Code","Actor1Religion2Code","Actor1Type1Code","Actor1Type2Code","Actor1Type3Code","Actor2Code","Actor2Name","Actor2CountryCode","Actor2KnownGroupCode","Actor2EthnicCode","Actor2Religion1Code","Actor2Religion2Code","Actor2Type1Code","Actor2Type2Code","Actor2Type3Code","IsRootEvent","EventCode","EventBaseCode","EventRootCode","QuadClass","GoldsteinScale","NumMentions","NumSources","NumArticles","AvgTone","Actor1Geo_Type","Actor1Geo_FullName","Actor1Geo_CountryCode","Actor1Geo_ADM1Code","Actor1Geo_ADM2Code","Actor1Geo_Lat","Actor1Geo_Long","Actor1Geo_FeatureID","Actor2Geo_Type","Actor2Geo_FullName","Actor2Geo_CountryCode","Actor2Geo_ADM1Code","Actor2Geo_ADM2Code","Actor2Geo_Lat","Actor2Geo_Long","Actor2Geo_FeatureID","ActionGeo_Type","ActionGeo_FullName","ActionGeo_CountryCode","ActionGeo_ADM1Code","ActionGeo_ADM2Code","ActionGeo_Lat","ActionGeo_Long","ActionGeo_FeatureID","DATEADDED","SOURCEURL",
] as const

type ParsedEvent = {
  global_event_id: string
  event_date: string | null
  date_added: string | null
  actor1_code: string | null
  actor1_name: string | null
  actor1_country_code: string | null
  actor1_known_group_code: string | null
  actor1_type1_code: string | null
  actor1_type2_code: string | null
  actor1_type3_code: string | null
  actor2_code: string | null
  actor2_name: string | null
  actor2_country_code: string | null
  actor2_known_group_code: string | null
  actor2_type1_code: string | null
  actor2_type2_code: string | null
  actor2_type3_code: string | null
  is_root_event: boolean | null
  event_code: string | null
  event_base_code: string | null
  event_root_code: string | null
  quad_class: number | null
  goldstein_scale: number | null
  num_mentions: number | null
  num_sources: number | null
  num_articles: number | null
  avg_tone: number | null
  actor1_geo_full_name: string | null
  actor1_geo_country_code: string | null
  actor1_geo_lat: number | null
  actor1_geo_long: number | null
  actor2_geo_full_name: string | null
  actor2_geo_country_code: string | null
  actor2_geo_lat: number | null
  actor2_geo_long: number | null
  action_geo_full_name: string | null
  action_geo_country_code: string | null
  action_geo_lat: number | null
  action_geo_long: number | null
  source_url: string | null
  raw_payload: Record<string, string>
  raw_row: string
}

export type GdeltCanonicalSyncResult = {
  ok: true
  skipped: boolean
  artifactId: string
  artifactTimestamp: string
  artifactUrl: string
  rowCount: number
  inserted: number
  updated: number
  rejected: number
  sha256: string | null
}

export async function syncGdeltRawFeed(admin: SupabaseClient, now = new Date()): Promise<GdeltCanonicalSyncResult> {
  const ingestion = await startIntelligenceIngestion(admin, {
    sourceKey: "gdelt_raw_feed",
    runType: "delta",
    scope: { trigger: "vercel-cron", pipeline: "gdelt-raw-canonical", dataset: "events-2.0" },
  })

  let artifactId: string | null = null
  try {
    const probe = await probeGdeltRawFeed(now)
    if (probe.artifactBytes != null && probe.artifactBytes > MAX_COMPRESSED_BYTES) {
      throw new Error(`GDELT raw artifact exceeds compressed safety limit: ${probe.artifactBytes}`)
    }

    const { data: claimData, error: claimError } = await admin.rpc("claim_gdelt_raw_artifact", {
      p_artifact_timestamp: probe.artifactTimestamp,
      p_artifact_url: probe.artifactUrl,
      p_artifact_bytes: probe.artifactBytes,
      p_ingestion_run_id: ingestion.runId,
    })
    if (claimError) throw new Error(`Could not claim GDELT raw artifact: ${claimError.message}`)

    const claim = Array.isArray(claimData) ? claimData[0] : claimData
    artifactId = String(claim?.artifact_id ?? "")
    if (!artifactId) throw new Error("GDELT raw artifact claim returned no artifact id")

    if (!claim?.claimed) {
      await finishIntelligenceIngestion(admin, {
        runId: ingestion.runId,
        sourceId: ingestion.sourceId,
        metadata: {
          pipeline: "gdelt-raw-canonical",
          skipped: String(claim?.current_status ?? "unknown") === "completed" ? "already_completed" : "concurrent_claim",
          artifactId,
          artifactTimestamp: probe.artifactTimestamp,
        },
      })
      return {
        ok: true,
        skipped: true,
        artifactId,
        artifactTimestamp: probe.artifactTimestamp,
        artifactUrl: probe.artifactUrl,
        rowCount: 0,
        inserted: 0,
        updated: 0,
        rejected: 0,
        sha256: null,
      }
    }

    const response = await fetchWithRetry(probe.artifactUrl, {
      cache: "no-store",
      headers: { Accept: "application/zip,application/octet-stream,*/*", "User-Agent": "VIDENTIA/1.0" },
    }, { attempts: 3, baseDelayMs: 750, timeoutMs: FETCH_TIMEOUT_MS })
    if (!response.ok) throw new Error(`GDELT raw artifact download responded ${response.status}`)

    const zip = Buffer.from(await response.arrayBuffer())
    if (zip.byteLength > MAX_COMPRESSED_BYTES) {
      throw new Error(`GDELT raw artifact exceeded compressed safety limit after download: ${zip.byteLength}`)
    }
    const sha256 = createHash("sha256").update(zip).digest("hex")
    const csv = extractEventCsv(zip)
    const retrievalTime = new Date().toISOString()
    const lines = csv.split(/\r?\n/).filter(line => line.length > 0)
    const parsed: ParsedEvent[] = []
    let rejected = 0

    for (const line of lines) {
      const event = parseGdeltEventRow(line)
      if (event) parsed.push(event)
      else rejected += 1
    }

    let inserted = 0
    let updated = 0
    for (let offset = 0; offset < parsed.length; offset += BATCH_SIZE) {
      const batch = parsed.slice(offset, offset + BATCH_SIZE)
      const ids = batch.map(item => item.global_event_id)
      const { data: existing, error: existingError } = await admin
        .from("gdelt_event_records")
        .select("global_event_id")
        .in("global_event_id", ids)
      if (existingError) throw new Error(`Could not reconcile existing GDELT events: ${existingError.message}`)
      const existingIds = new Set((existing ?? []).map(row => String(row.global_event_id)))

      const { error: versionsError } = await admin.from("gdelt_event_versions").upsert(
        batch.map(item => ({
          artifact_id: artifactId,
          global_event_id: item.global_event_id,
          raw_payload: item.raw_payload,
          raw_row: item.raw_row,
          source_retrieved_at: retrievalTime,
        })),
        { onConflict: "artifact_id,global_event_id", ignoreDuplicates: true },
      )
      if (versionsError) throw new Error(`Could not preserve GDELT raw evidence: ${versionsError.message}`)

      const { error: recordsError } = await admin.from("gdelt_event_records").upsert(
        batch.map(({ raw_row: _rawRow, ...item }) => ({
          ...item,
          latest_artifact_id: artifactId,
          artifact_timestamp: probe.artifactTimestamp,
          source_retrieved_at: retrievalTime,
          last_seen_at: retrievalTime,
          updated_at: retrievalTime,
        })),
        { onConflict: "global_event_id" },
      )
      if (recordsError) throw new Error(`Could not upsert canonical GDELT events: ${recordsError.message}`)

      updated += batch.filter(item => existingIds.has(item.global_event_id)).length
      inserted += batch.length - batch.filter(item => existingIds.has(item.global_event_id)).length
    }

    const rowCount = lines.length
    const { error: artifactError } = await admin.from("gdelt_raw_artifacts").update({
      status: "completed",
      artifact_bytes: zip.byteLength,
      sha256,
      row_count: rowCount,
      inserted_count: inserted,
      updated_count: updated,
      rejected_count: rejected,
      retrieved_at: retrievalTime,
      finished_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    }).eq("id", artifactId)
    if (artifactError) throw new Error(`Could not finalize GDELT artifact: ${artifactError.message}`)

    await finishIntelligenceIngestion(admin, {
      runId: ingestion.runId,
      sourceId: ingestion.sourceId,
      fetched: rowCount,
      inserted,
      updated,
      rejected,
      status: rejected > 0 ? "partial" : "completed",
      errorMessage: rejected > 0 ? `${rejected} malformed GDELT rows were preserved only at artifact level and rejected from canonical records.` : null,
      metadata: {
        pipeline: "gdelt-raw-canonical",
        artifactId,
        artifactTimestamp: probe.artifactTimestamp,
        artifactUrl: probe.artifactUrl,
        sha256,
        canonicalIdentity: "GLOBALEVENTID",
      },
    })

    console.info("[gdelt/raw-canonical] sync complete", {
      artifactId,
      artifactTimestamp: probe.artifactTimestamp,
      rowCount,
      inserted,
      updated,
      rejected,
      sha256,
    })

    return {
      ok: true,
      skipped: false,
      artifactId,
      artifactTimestamp: probe.artifactTimestamp,
      artifactUrl: probe.artifactUrl,
      rowCount,
      inserted,
      updated,
      rejected,
      sha256,
    }
  } catch (error) {
    if (artifactId) {
      await admin.from("gdelt_raw_artifacts").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: (error instanceof Error ? error.message : String(error)).slice(0, 4000),
        updated_at: new Date().toISOString(),
      }).eq("id", artifactId).catch(() => undefined)
    }
    await failIntelligenceIngestion(admin, {
      runId: ingestion.runId,
      sourceId: ingestion.sourceId,
      error,
      metadata: { pipeline: "gdelt-raw-canonical", artifactId },
    }).catch(() => undefined)
    throw error
  }
}

export function parseGdeltEventRow(rawRow: string): ParsedEvent | null {
  const fields = rawRow.split("\t")
  if (fields.length < GDELT_COLUMNS.length || !/^\d+$/.test(fields[0] ?? "")) return null

  const rawPayload: Record<string, string> = {}
  for (let index = 0; index < GDELT_COLUMNS.length; index += 1) rawPayload[GDELT_COLUMNS[index]] = fields[index] ?? ""
  if (fields.length > GDELT_COLUMNS.length) rawPayload.__EXTRA_FIELDS__ = JSON.stringify(fields.slice(GDELT_COLUMNS.length))

  return {
    global_event_id: fields[0],
    event_date: parseSqlDate(fields[1]),
    date_added: parseDateAdded(fields[59]),
    actor1_code: textOrNull(fields[5]),
    actor1_name: textOrNull(fields[6]),
    actor1_country_code: textOrNull(fields[7]),
    actor1_known_group_code: textOrNull(fields[8]),
    actor1_type1_code: textOrNull(fields[12]),
    actor1_type2_code: textOrNull(fields[13]),
    actor1_type3_code: textOrNull(fields[14]),
    actor2_code: textOrNull(fields[15]),
    actor2_name: textOrNull(fields[16]),
    actor2_country_code: textOrNull(fields[17]),
    actor2_known_group_code: textOrNull(fields[18]),
    actor2_type1_code: textOrNull(fields[22]),
    actor2_type2_code: textOrNull(fields[23]),
    actor2_type3_code: textOrNull(fields[24]),
    is_root_event: fields[25] === "1" ? true : fields[25] === "0" ? false : null,
    event_code: textOrNull(fields[26]),
    event_base_code: textOrNull(fields[27]),
    event_root_code: textOrNull(fields[28]),
    quad_class: integerOrNull(fields[29]),
    goldstein_scale: numberOrNull(fields[30]),
    num_mentions: integerOrNull(fields[31]),
    num_sources: integerOrNull(fields[32]),
    num_articles: integerOrNull(fields[33]),
    avg_tone: numberOrNull(fields[34]),
    actor1_geo_full_name: textOrNull(fields[36]),
    actor1_geo_country_code: textOrNull(fields[37]),
    actor1_geo_lat: numberOrNull(fields[40]),
    actor1_geo_long: numberOrNull(fields[41]),
    actor2_geo_full_name: textOrNull(fields[44]),
    actor2_geo_country_code: textOrNull(fields[45]),
    actor2_geo_lat: numberOrNull(fields[48]),
    actor2_geo_long: numberOrNull(fields[49]),
    action_geo_full_name: textOrNull(fields[52]),
    action_geo_country_code: textOrNull(fields[53]),
    action_geo_lat: numberOrNull(fields[56]),
    action_geo_long: numberOrNull(fields[57]),
    source_url: safeHttpUrl(fields[60]),
    raw_payload: rawPayload,
    raw_row: rawRow,
  }
}

function extractEventCsv(zip: Buffer) {
  const eocd = findEndOfCentralDirectory(zip)
  const entryCount = zip.readUInt16LE(eocd + 10)
  const directoryOffset = zip.readUInt32LE(eocd + 16)
  let cursor = directoryOffset
  let selected: { method: number; compressedSize: number; uncompressedSize: number; localOffset: number; name: string } | null = null

  for (let index = 0; index < entryCount; index += 1) {
    if (zip.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Invalid GDELT ZIP central directory")
    const flags = zip.readUInt16LE(cursor + 8)
    const method = zip.readUInt16LE(cursor + 10)
    const compressedSize = zip.readUInt32LE(cursor + 20)
    const uncompressedSize = zip.readUInt32LE(cursor + 24)
    const nameLength = zip.readUInt16LE(cursor + 28)
    const extraLength = zip.readUInt16LE(cursor + 30)
    const commentLength = zip.readUInt16LE(cursor + 32)
    const localOffset = zip.readUInt32LE(cursor + 42)
    const name = zip.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8")
    if ((flags & 0x1) !== 0) throw new Error("Encrypted GDELT ZIP entries are not accepted")
    if (/\.csv$/i.test(name)) {
      if (selected) throw new Error("GDELT ZIP contained multiple CSV entries")
      selected = { method, compressedSize, uncompressedSize, localOffset, name }
    }
    cursor += 46 + nameLength + extraLength + commentLength
  }

  if (!selected) throw new Error("GDELT ZIP contained no CSV entry")
  if (selected.compressedSize > MAX_COMPRESSED_BYTES || selected.uncompressedSize > MAX_UNCOMPRESSED_BYTES) {
    throw new Error(`GDELT ZIP entry exceeds safety limits: ${selected.name}`)
  }
  if (zip.readUInt32LE(selected.localOffset) !== 0x04034b50) throw new Error("Invalid GDELT ZIP local header")
  const localNameLength = zip.readUInt16LE(selected.localOffset + 26)
  const localExtraLength = zip.readUInt16LE(selected.localOffset + 28)
  const dataStart = selected.localOffset + 30 + localNameLength + localExtraLength
  const compressed = zip.subarray(dataStart, dataStart + selected.compressedSize)
  const output = selected.method === 8 ? inflateRawSync(compressed) : selected.method === 0 ? Buffer.from(compressed) : null
  if (!output) throw new Error(`Unsupported GDELT ZIP compression method: ${selected.method}`)
  if (output.byteLength > MAX_UNCOMPRESSED_BYTES) throw new Error("GDELT CSV exceeds uncompressed safety limit")
  if (selected.uncompressedSize && output.byteLength !== selected.uncompressedSize) {
    throw new Error(`GDELT ZIP uncompressed size mismatch: expected ${selected.uncompressedSize}, got ${output.byteLength}`)
  }
  return output.toString("utf8")
}

function findEndOfCentralDirectory(zip: Buffer) {
  const minimum = Math.max(0, zip.length - 65_557)
  for (let offset = zip.length - 22; offset >= minimum; offset -= 1) {
    if (zip.readUInt32LE(offset) === 0x06054b50) return offset
  }
  throw new Error("GDELT ZIP end-of-central-directory record was not found")
}

function parseSqlDate(value: string | undefined) {
  if (!value || !/^\d{8}$/.test(value)) return null
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

function parseDateAdded(value: string | undefined) {
  if (!value || !/^\d{14}$/.test(value)) return null
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}.000Z`
  const date = new Date(iso)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function textOrNull(value: string | undefined) {
  const text = String(value ?? "").trim()
  return text || null
}

function numberOrNull(value: string | undefined) {
  const text = String(value ?? "").trim()
  if (!text) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

function integerOrNull(value: string | undefined) {
  const number = numberOrNull(value)
  return number == null ? null : Math.trunc(number)
}

function safeHttpUrl(value: string | undefined) {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}
