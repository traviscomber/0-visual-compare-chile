import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { mergeStrategicSearchMetadata, strategicSemanticKey } from "@/lib/intelligence/search-intent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WATCH_SELECT = "id,watch_type,query,normalized_query,is_active,last_checked_at,last_reviewed_at,metadata,created_at,updated_at"
const HIDDEN_ARCHIVE_REASONS = new Set(["strategic_profile_reset", "query_precision_refinement", "semantic_duplicate"])
const SearchScopeSchema = z.enum(["chile", "global", "both"])

const WatchSchema = z.object({
  type: z.enum(["technology", "company", "competitor"]),
  query: z.string().trim().min(2).max(160),
  scope: SearchScopeSchema.default("both"),
})

const PatchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  scope: SearchScopeSchema.optional(),
}).refine(value => value.active !== undefined || value.scope !== undefined, { message: "No hay cambios." })

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.supabase
    .from("intelligence_watches")
    .select(WATCH_SELECT)
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("[strategic-watchlist:get]", error)
    return NextResponse.json({ error: "No pudimos cargar las vigilancias estratégicas." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const watches = (data ?? []).filter(watch => !isHiddenArchive(watch.metadata))
  return NextResponse.json({ watches }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = WatchSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de vigilancia estratégica inválidos." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const normalizedQuery = parsed.data.type === "technology"
    ? strategicSemanticKey(parsed.data.query)
    : normalize(parsed.data.query)
  const metadata = mergeStrategicSearchMetadata(null, parsed.data.query, parsed.data.scope)
  const { data, error } = await auth.supabase
    .from("intelligence_watches")
    .insert({
      user_id: auth.user.id,
      watch_type: parsed.data.type,
      query: parsed.data.query,
      normalized_query: normalizedQuery,
      metadata,
    })
    .select(WATCH_SELECT)
    .single()

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: existingError } = await auth.supabase
        .from("intelligence_watches")
        .select(WATCH_SELECT)
        .eq("user_id", auth.user.id)
        .eq("watch_type", parsed.data.type)
        .eq("normalized_query", normalizedQuery)
        .maybeSingle()
      if (existingError || !existing) {
        console.error("[strategic-watchlist:post:existing]", existingError)
        return NextResponse.json({ error: "No pudimos confirmar la vigilancia estratégica existente." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
      }

      const mergedMetadata = mergeStrategicSearchMetadata(existing.metadata, parsed.data.query, parsed.data.scope)
      const { data: updated, error: updateError } = await auth.supabase
        .from("intelligence_watches")
        .update({
          query: parsed.data.query,
          is_active: true,
          metadata: mergedMetadata,
          last_checked_at: null,
          last_reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select(WATCH_SELECT)
        .single()
      if (updateError) {
        console.error("[strategic-watchlist:post:reconfigure]", updateError)
        return NextResponse.json({ error: "No pudimos actualizar el ámbito de la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
      }
      return NextResponse.json({ watch: updated, created: false, reconfigured: true }, { headers: PRIVATE_NO_STORE_HEADERS })
    }
    console.error("[strategic-watchlist:post]", error)
    return NextResponse.json({ error: "No pudimos crear la vigilancia estratégica." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ watch: data, created: true }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Cambio de vigilancia inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data: existing, error: existingError } = await auth.supabase
    .from("intelligence_watches")
    .select(WATCH_SELECT)
    .eq("id", parsed.data.id)
    .maybeSingle()
  if (existingError) {
    console.error("[strategic-watchlist:patch:read]", existingError)
    return NextResponse.json({ error: "No pudimos cargar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!existing) return NextResponse.json({ error: "Vigilancia no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.active !== undefined) updates.is_active = parsed.data.active
  if (parsed.data.scope) {
    updates.metadata = mergeStrategicSearchMetadata(existing.metadata, existing.query, parsed.data.scope)
    updates.last_checked_at = null
    updates.last_reviewed_at = null
  }

  const { data, error } = await auth.supabase
    .from("intelligence_watches")
    .update(updates)
    .eq("id", parsed.data.id)
    .select(WATCH_SELECT)
    .maybeSingle()

  if (error) {
    console.error("[strategic-watchlist:patch]", error)
    return NextResponse.json({ error: "No pudimos actualizar la vigilancia estratégica." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!data) return NextResponse.json({ error: "Vigilancia no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })

  return NextResponse.json({ watch: data }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const id = new URL(request.url).searchParams.get("id")
  if (!id || !z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Vigilancia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { error } = await auth.supabase.from("intelligence_watches").delete().eq("id", id)
  if (error) {
    console.error("[strategic-watchlist:delete]", error)
    return NextResponse.json({ error: "No pudimos eliminar la vigilancia estratégica." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function isHiddenArchive(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false
  const reason = (metadata as Record<string, unknown>).deactivated_reason
  return typeof reason === "string" && HIDDEN_ARCHIVE_REASONS.has(reason)
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}
