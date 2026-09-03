import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchWipoPatentScopeRss, validateWipoPatentScopeRssUrl } from "@/lib/intelligence/wipo-patentscope-rss"
import { scanWipoPatentWatch, type WipoPatentWatchRow } from "@/lib/intelligence/wipo-patent-watch-scan"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const CreateSchema = z.object({
  type: z.enum(["company", "ipc"]).default("company"),
  query: z.string().trim().min(2).max(160),
  feedUrl: z.string().trim().min(12).max(2048),
})
const PatchSchema = z.object({ id: z.string().uuid(), active: z.boolean() })

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const { data, error } = await auth.supabase
    .from("patent_watches")
    .select("id,watch_type,query,is_active,last_checked_at,source_url,source_status,source_last_error,source_last_checked_at,created_at,updated_at")
    .eq("user_id", auth.user.id)
    .eq("source_type", "wipo_patentscope_rss")
    .order("updated_at", { ascending: false })
  if (error) return NextResponse.json({ error: "No pudimos cargar las fuentes WIPO." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ watches: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const parsed = CreateSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Watch WIPO inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  try {
    const feedUrl = validateWipoPatentScopeRssUrl(parsed.data.feedUrl)
    const feed = await fetchWipoPatentScopeRss(feedUrl, 30)
    const normalized = normalizeQuery(parsed.data.type, parsed.data.query)
    const now = new Date().toISOString()
    const { data: existing, error: existingError } = await auth.supabase
      .from("patent_watches")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("watch_type", parsed.data.type)
      .eq("normalized_query", normalized)
      .eq("source_type", "wipo_patentscope_rss")
      .maybeSingle()
    if (existingError) throw existingError

    const payload = {
      user_id: auth.user.id,
      watch_type: parsed.data.type,
      query: parsed.data.query,
      normalized_query: normalized,
      source_type: "wipo_patentscope_rss",
      source_url: feed.feedUrl,
      source_status: "available",
      source_last_error: null,
      source_last_checked_at: null,
      last_checked_at: now,
      is_active: true,
      updated_at: now,
    }
    const write = existing
      ? await auth.supabase.from("patent_watches").update(payload).eq("id", existing.id).eq("user_id", auth.user.id).select("id,watch_type,query,is_active,source_url,source_status,source_last_checked_at,created_at,updated_at").single()
      : await auth.supabase.from("patent_watches").insert(payload).select("id,watch_type,query,is_active,source_url,source_status,source_last_checked_at,created_at,updated_at").single()
    if (write.error) throw write.error

    await auth.supabase.from("usage_logs").insert({ user_id: auth.user.id, organization_id: null, action: "patent.wipo_rss_watch_create", metadata: { result_count: feed.items.length, watch_type: parsed.data.type } })
    return NextResponse.json({ watch: write.data, previewCount: feed.items.length, baseline: "existing_items_will_be_marked_reviewed" }, { status: existing ? 200 : 201, headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[patents:wipo-rss-watches:post]", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos crear el watch WIPO." }, { status: 422, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

export async function PUT() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const scanAt = new Date().toISOString()
  const { data, error } = await admin.from("patent_watches")
    .select("id,user_id,query,source_url,source_last_checked_at")
    .eq("user_id", auth.user.id)
    .eq("source_type", "wipo_patentscope_rss")
    .eq("is_active", true)
    .not("source_url", "is", null)
    .order("source_last_checked_at", { ascending: true, nullsFirst: true })
    .limit(10)
  if (error) return NextResponse.json({ error: "No pudimos preparar la actualización WIPO." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })

  const watches = (data ?? []) as WipoPatentWatchRow[]
  const results = []
  for (let index = 0; index < watches.length; index += 4) {
    const batch = watches.slice(index, index + 4)
    const batchResults = await Promise.all(batch.map(watch => scanWipoPatentWatch(admin, watch, scanAt)))
    results.push(...batchResults)
  }

  const failed = results.filter(item => !item.ok)
  await auth.supabase.from("usage_logs").insert({
    user_id: auth.user.id,
    organization_id: null,
    action: "patent.wipo_rss_manual_refresh",
    metadata: {
      watches: watches.length,
      fetched: results.reduce((sum, item) => sum + item.fetched, 0),
      inserted: results.reduce((sum, item) => sum + item.inserted, 0),
      failed: failed.length,
    },
  })

  return NextResponse.json({
    ok: failed.length === 0,
    watches: watches.length,
    fetched: results.reduce((sum, item) => sum + item.fetched, 0),
    inserted: results.reduce((sum, item) => sum + item.inserted, 0),
    failed: failed.length,
    results,
    scannedAt: scanAt,
  }, { status: failed.length ? 207 : 200, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Cambio inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { data, error } = await auth.supabase.from("patent_watches")
    .update({ is_active: parsed.data.active, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id).eq("user_id", auth.user.id).eq("source_type", "wipo_patentscope_rss").select("id").maybeSingle()
  if (error) return NextResponse.json({ error: "No pudimos actualizar el watch WIPO." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  if (!data) return NextResponse.json({ error: "Watch WIPO no encontrado." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  const id = new URL(request.url).searchParams.get("id")
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Id inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const { data, error } = await auth.supabase.from("patent_watches").delete().eq("id", id).eq("user_id", auth.user.id).eq("source_type", "wipo_patentscope_rss").select("id").maybeSingle()
  if (error) return NextResponse.json({ error: "No pudimos eliminar el watch WIPO." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  if (!data) return NextResponse.json({ error: "Watch WIPO no encontrado." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function normalizeQuery(type: "company" | "ipc", value: string) {
  const cleaned = value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  return type === "ipc" ? cleaned.replace(/\s+/g, "") : cleaned.replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ")
}
