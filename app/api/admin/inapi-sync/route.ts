import { NextResponse } from "next/server"
import { runInapiSync, runInapiSyncBatch } from "@/lib/inapi/sync"
import { buildPhase1WindowPlan } from "@/lib/inapi/phase1"
import { isInapiPresetKey } from "@/lib/inapi/presets"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { InapiMatchMode, InapiSearchType } from "@/lib/inapi/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED_SEARCH_TYPES: InapiSearchType[] = ["nombre", "solicitante", "clase", "solicitud", "registro"]
const ALLOWED_MATCH_MODES: InapiMatchMode[] = ["1", "2", "3", "4"]
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, response: NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE_HEADERS }) }
  }

  if (user.app_metadata?.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Acceso restringido a administradores." },
        { status: 403, headers: NO_STORE_HEADERS },
      ),
    }
  }

  return { user, response: null }
}

export async function GET() {
  try {
    const authorization = await requireAdmin()
    if (authorization.response) return authorization.response

    const admin = createAdminClient()
    const [runsResponse, recordsResponse, nizaResponse, vienaResponse, completedRunsResponse, failedRunsResponse, lastCompletedResponse, phase1CompletedResponse] = await Promise.all([
      admin.from("inapi_sync_runs").select("id, source, status, search_type, query, total_fetched, inserted_count, updated_count, metadata, error_message, started_at, finished_at, created_at").order("created_at", { ascending: false }).limit(20),
      admin.from("trademark_records").select("id", { count: "exact", head: true }),
      admin.from("trademark_record_niza").select("trademark_record_id", { count: "exact", head: true }),
      admin.from("trademark_record_viena").select("trademark_record_id", { count: "exact", head: true }),
      admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "completed"),
      admin.from("inapi_sync_runs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      admin.from("inapi_sync_runs").select("id, created_at, finished_at, total_fetched, inserted_count, updated_count, metadata").eq("status", "completed").order("created_at", { ascending: false }).limit(1),
      admin.from("inapi_sync_runs").select("metadata").eq("status", "completed").order("created_at", { ascending: false }).limit(200),
    ])

    if (runsResponse.error) throw runsResponse.error

    const phase1Plan = buildPhase1WindowPlan(phase1CompletedResponse.data ?? [], 25)

    return NextResponse.json(
      {
        runs: runsResponse.data ?? [],
        stats: {
          totalRecords: recordsResponse.count ?? 0,
          targetRecords: 10000,
          completedRuns: completedRunsResponse.count ?? 0,
          failedRuns: failedRunsResponse.count ?? 0,
          nizaAssignments: nizaResponse.count ?? 0,
          vienaAssignments: vienaResponse.count ?? 0,
          lastCompletedRun: lastCompletedResponse.data?.[0] ?? null,
          phase1Plan,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    console.error("[v0] list inapi sync runs error", error)
    return NextResponse.json(
      { error: "No fue posible cargar las sincronizaciones INAPI." },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await requireAdmin()
    if (authorization.response || !authorization.user) return authorization.response

    const body = await request.json().catch(() => null)
    const query = typeof body?.query === "string" ? body.query.trim() : ""
    const queries = Array.isArray(body?.queries) && body.queries.every((item: unknown) => typeof item === "string")
      ? body.queries.map((item: string) => item.trim()).filter(Boolean)
      : []
    const searchType = isInapiSearchType(body?.searchType) ? body.searchType : "nombre"
    const matchMode = isInapiMatchMode(body?.matchMode) ? body.matchMode : "2"
    const preset = isInapiPresetKey(body?.preset) ? body.preset : null
    const delayMs = typeof body?.delayMs === "number" && Number.isFinite(body.delayMs)
      ? Math.min(10_000, Math.max(250, Math.floor(body.delayMs)))
      : 400
    const startIndex = typeof body?.startIndex === "number" && Number.isFinite(body.startIndex)
      ? Math.max(0, Math.floor(body.startIndex))
      : 0
    const maxJobs = typeof body?.maxJobs === "number" && Number.isFinite(body.maxJobs)
      ? Math.min(100, Math.max(1, Math.floor(body.maxJobs)))
      : undefined

    if (query.length > 160 || queries.some((item: string) => item.length > 160) || queries.length > 100) {
      return NextResponse.json(
        { error: "La solicitud excede los límites permitidos." },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    if (!query && !queries.length && !preset) {
      return NextResponse.json(
        { error: "Debes indicar un query, una lista de queries o un preset para sincronizar desde INAPI." },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    const result = preset || queries.length > 1
      ? await runInapiSyncBatch({
          jobs: queries.length ? queries.map((item: string) => ({ query: item, searchType })) : undefined,
          preset: preset ?? undefined,
          matchMode,
          initiatedBy: authorization.user.id,
          delayMs,
          startIndex,
          maxJobs,
        })
      : await runInapiSync({
          query: query || queries[0],
          searchType,
          matchMode,
          initiatedBy: authorization.user.id,
        })

    return NextResponse.json({ ok: true, ...result }, { status: 201, headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error("[v0] run inapi sync error", error)
    return NextResponse.json(
      { error: "No fue posible ejecutar la sincronización INAPI." },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}

function isInapiSearchType(value: unknown): value is InapiSearchType {
  return typeof value === "string" && ALLOWED_SEARCH_TYPES.includes(value as InapiSearchType)
}

function isInapiMatchMode(value: unknown): value is InapiMatchMode {
  return typeof value === "string" && ALLOWED_MATCH_MODES.includes(value as InapiMatchMode)
}
