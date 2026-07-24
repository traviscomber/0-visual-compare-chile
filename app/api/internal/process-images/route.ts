import { randomUUID, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { computeEla } from "@/lib/image/ela"
import { extractExif, type ExifData } from "@/lib/image/exif"
import { extractImageText, type OcrResult } from "@/lib/image/ocr"
import { calculatePerceptualHash } from "@/lib/image/phash"
import { BUCKET } from "@/lib/storage"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const maxDuration = 60

const ANALYSIS_TIMEOUT_MS = 10_000
const OCR_TIMEOUT_MS = 15_000
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

function readBoundedInteger(name: string, fallback: number, minimum: number, maximum: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed)) return fallback

  return Math.min(maximum, Math.max(minimum, parsed))
}

const WORKER_BATCH_SIZE = readBoundedInteger("IMAGE_WORKER_BATCH_SIZE", 4, 1, 10)
const WORKER_CONCURRENCY = readBoundedInteger("IMAGE_WORKER_CONCURRENCY", 2, 1, 5)

const EMPTY_EXIF: ExifData = {
  camera_make: null,
  camera_model: null,
  software: null,
  taken_at: null,
  modified_at: null,
  orientation: null,
  gps: null,
  exposure: { iso: null, fnumber: null, exposure_time: null, focal_length: null },
  was_edited: false,
  raw: {},
}

const EMPTY_OCR: OcrResult = {
  text: null,
  confidence: null,
  language: "eng+spa",
}

type ClaimedJob = {
  job_id: string
  image_id: string
  user_id: string
  attempts: number
}

type JobResult = {
  job_id: string
  status: string
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return false

  const supplied = authorization.slice(7)
  const expectedBuffer = Buffer.from(secret)
  const suppliedBuffer = Buffer.from(supplied)

  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer)
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function processJob(job: ClaimedJob): Promise<void> {
  const admin = createAdminClient()
  const { data: image, error: imageError } = await admin
    .from("images")
    .select("id, user_id, storage_path, metadata")
    .eq("id", job.image_id)
    .eq("user_id", job.user_id)
    .single()

  if (imageError || !image) {
    throw new Error("Image row not found")
  }

  await admin
    .from("images")
    .update({ processing_status: "processing", processing_error: null })
    .eq("id", image.id)

  const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(image.storage_path)
  if (downloadError || !file) {
    throw new Error("Original image download failed")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const [phash, exif, ela] = await Promise.all([
    withTimeout(calculatePerceptualHash(buffer).catch(() => null), ANALYSIS_TIMEOUT_MS, null),
    withTimeout(extractExif(buffer).catch(() => EMPTY_EXIF), ANALYSIS_TIMEOUT_MS, EMPTY_EXIF),
    withTimeout(computeEla(buffer).catch(() => null), ANALYSIS_TIMEOUT_MS, null),
  ])

  const ocr = await withTimeout(extractImageText(buffer).catch(() => EMPTY_OCR), OCR_TIMEOUT_MS, EMPTY_OCR)

  let elaPath: string | null = null
  if (ela?.png?.length) {
    elaPath = `${job.user_id}/${job.image_id}/ela.png`
    const { error: elaUploadError } = await admin.storage.from(BUCKET).upload(elaPath, ela.png, {
      contentType: "image/png",
      upsert: true,
    })
    if (elaUploadError) elaPath = null
  }

  const previousMetadata =
    image.metadata && typeof image.metadata === "object" && !Array.isArray(image.metadata)
      ? image.metadata
      : {}

  const { error: updateError } = await admin
    .from("images")
    .update({
      phash,
      metadata: {
        ...previousMetadata,
        ocr: {
          text: ocr.text,
          confidence: ocr.confidence,
          language: ocr.language,
        },
        exif: {
          camera_make: exif.camera_make,
          camera_model: exif.camera_model,
          software: exif.software,
          taken_at: exif.taken_at,
          modified_at: exif.modified_at,
          orientation: exif.orientation,
          was_edited: exif.was_edited,
          has_gps: Boolean(exif.gps),
        },
        ela: ela ? { score: ela.tampering_score, storage_path: elaPath } : null,
      },
      processing_status: "completed",
      processing_error: null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", image.id)

  if (updateError) {
    throw new Error("Image analysis persistence failed")
  }

  const { error: completeError } = await admin.rpc("complete_image_processing_job", {
    p_job_id: job.job_id,
  })
  if (completeError) throw new Error("Job completion failed")
}

async function executeJob(job: ClaimedJob): Promise<JobResult> {
  try {
    await processJob(job)
    return { job_id: job.job_id, status: "completed" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error"
    console.error("[image-worker] job failed", job.job_id, message)

    const admin = createAdminClient()
    const { data: nextStatus, error: failError } = await admin.rpc("fail_image_processing_job", {
      p_job_id: job.job_id,
      p_error: message,
    })

    if (failError) {
      console.error("[image-worker] failure persistence failed", job.job_id, failError.code)
      return { job_id: job.job_id, status: "failure-persistence-error" }
    }

    return { job_id: job.job_id, status: String(nextStatus ?? "failed") }
  }
}

async function processWithConcurrency(jobs: ClaimedJob[], concurrency: number): Promise<JobResult[]> {
  const results: JobResult[] = []

  for (let index = 0; index < jobs.length; index += concurrency) {
    const chunk = jobs.slice(index, index + concurrency)
    results.push(...(await Promise.all(chunk.map(executeJob))))
  }

  return results
}

async function runWorker(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()
  const workerId = `vercel-${randomUUID()}`
  const { data, error } = await admin.rpc("claim_image_processing_jobs", {
    p_worker_id: workerId,
    p_limit: WORKER_BATCH_SIZE,
  })

  if (error) {
    console.error("[image-worker] claim failed", error.code)
    return NextResponse.json({ error: "No se pudo reclamar la cola." }, { status: 500, headers: PRIVATE_HEADERS })
  }

  const jobs = (data ?? []) as ClaimedJob[]
  const results = await processWithConcurrency(jobs, WORKER_CONCURRENCY)

  return NextResponse.json(
    {
      worker_id: workerId,
      claimed: jobs.length,
      concurrency: WORKER_CONCURRENCY,
      batch_size: WORKER_BATCH_SIZE,
      duration_ms: Date.now() - startedAt,
      results,
    },
    { headers: PRIVATE_HEADERS },
  )
}

export async function GET(request: Request) {
  return runWorker(request)
}

export async function POST(request: Request) {
  return runWorker(request)
}
