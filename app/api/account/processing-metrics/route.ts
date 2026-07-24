import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

async function readJobId(request: Request) {
  const body = (await request.json().catch(() => null)) as { job_id?: unknown } | null
  return typeof body?.job_id === "string" ? body.job_id.trim() : ""
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const admin = createAdminClient()
    const [{ data: metrics, error: metricsError }, { data: health, error: healthError }] = await Promise.all([
      supabase.rpc("get_my_image_processing_metrics"),
      admin.rpc("get_image_processing_health"),
    ])

    if (metricsError) {
      console.error("[processing-metrics] user metrics failed", metricsError.code)
      return NextResponse.json(
        { error: "No fue posible cargar las métricas de procesamiento." },
        { status: 503, headers: PRIVATE_HEADERS },
      )
    }

    if (healthError) {
      console.error("[processing-metrics] health failed", healthError.code)
    }

    return NextResponse.json(
      {
        metrics,
        health: healthError
          ? {
              status: "unknown",
              queued: 0,
              processing: 0,
              failures_last_hour: 0,
              completed_last_hour: 0,
              oldest_queued_seconds: 0,
              expiring_leases: 0,
              checked_at: new Date().toISOString(),
            }
          : health,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    )
  } catch (error) {
    console.error("[processing-metrics] route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al consultar las métricas." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}

export async function POST() {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const { data, error } = await supabase.rpc("retry_my_failed_image_jobs")

    if (error) {
      console.error("[processing-metrics] retry failed", error.code)
      return NextResponse.json(
        { error: "No fue posible reintentar los trabajos fallidos." },
        { status: 503, headers: PRIVATE_HEADERS },
      )
    }

    return NextResponse.json(data ?? { retried: 0 }, { status: 200, headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error("[processing-metrics] retry route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al reintentar los trabajos." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const jobId = await readJobId(request)

    if (!UUID_PATTERN.test(jobId)) {
      return NextResponse.json(
        { error: "El identificador del trabajo no es válido." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    const { data, error } = await supabase.rpc("retry_my_image_processing_job", { p_job_id: jobId })

    if (error) {
      console.error("[processing-metrics] individual retry failed", error.code)
      return NextResponse.json(
        { error: "No fue posible reintentar el trabajo." },
        { status: 503, headers: PRIVATE_HEADERS },
      )
    }

    const result = (data ?? {}) as { retried?: boolean; reason?: string; status?: string }

    if (!result.retried) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Trabajo no encontrado." }, { status: 404, headers: PRIVATE_HEADERS })
      }

      return NextResponse.json(
        { error: `El trabajo no se puede reintentar${result.status ? ` (${result.status})` : ""}.` },
        { status: 409, headers: PRIVATE_HEADERS },
      )
    }

    return NextResponse.json(result, { status: 200, headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error("[processing-metrics] individual retry route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al reintentar el trabajo." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedClient()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const jobId = await readJobId(request)

    if (!UUID_PATTERN.test(jobId)) {
      return NextResponse.json(
        { error: "El identificador del trabajo no es válido." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    const { data, error } = await supabase.rpc("cancel_my_image_processing_job", { p_job_id: jobId })

    if (error) {
      console.error("[processing-metrics] cancellation failed", error.code)
      return NextResponse.json(
        { error: "No fue posible cancelar el trabajo." },
        { status: 503, headers: PRIVATE_HEADERS },
      )
    }

    const result = (data ?? {}) as { cancelled?: boolean; reason?: string; status?: string }

    if (!result.cancelled) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Trabajo no encontrado." }, { status: 404, headers: PRIVATE_HEADERS })
      }

      return NextResponse.json(
        { error: `El trabajo ya no se puede cancelar${result.status ? ` (${result.status})` : ""}.` },
        { status: 409, headers: PRIVATE_HEADERS },
      )
    }

    return NextResponse.json(result, { status: 200, headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error("[processing-metrics] cancellation route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al cancelar el trabajo." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}
