import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
