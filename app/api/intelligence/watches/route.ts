import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import {
  mergeStrategicSearchMetadata,
  readStrategicSearchScope,
  strategicSemanticKey,
  type StrategicSearchScope,
} from "@/lib/intelligence/search-intent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WatchSource = "brand" | "patent" | "technology"
type CommonWatch = {
  key: string
  id: string
  type: WatchSource
  subtype: string
  query: string
  niceClasses: number[]
  searchScope: StrategicSearchScope | null
  isActive: boolean
  lastCheckedAt: string | null
  lastReviewedAt: string | null
  createdAt: string
  updatedAt: string
}

const HIDDEN_TECHNOLOGY_ARCHIVES = new Set(["strategic_profile_reset", "query_precision_refinement", "semantic_duplicate"])
const SearchScopeSchema = z.enum(["chile", "global", "both"])
const CreateSchema = z.object({
  type: z.enum(["brand", "patent", "technology"]),
  subtype: z.string().trim().max(32).optional(),
  query: z.string().trim().min(2).max(160),
  niceClasses: z.array(z.number().int().min(1).max(45)).max(20).optional().default([]),
  scope: SearchScopeSchema.optional(),
})

const ChangeSchema = z.object({
  key: z.string().min(3).max(80),
  active: z.boolean(),
})

const BRAND_SUBTYPES = new Set(["brand", "owner"])
const PATENT_SUBTYPES = new Set(["company", "ipc"])
const TECHNOLOGY_SUBTYPES = new Set(["technology", "company", "competitor"])

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const [brandResult, patentResult, technologyResult] = await Promise.all([
    auth.supabase
      .from("trademark_watches")
      .select("id,watch_type,query,nice_classes,is_active,last_checked_at,last_reviewed_at,created_at,updated_at")
      .eq("user_id", auth.user.id),
    auth.supabase
      .from("patent_watches")
      .select("id,watch_type,query,is_active,last_checked_at,created_at,updated_at")
      .eq("user_id", auth.user.id),
    auth.supabase
      .from("intelligence_watches")
      .select("id,watch_type,query,is_active,last_checked_at,last_reviewed_at,metadata,created_at,updated_at")
      .eq("user_id", auth.user.id),
  ])

  const failed = [brandResult.error, patentResult.error, technologyResult.error].find(Boolean)
  if (failed) {
    console.error("[common-watches:get]", failed)
    return NextResponse.json({ error: "No pudimos cargar todas tus vigilancias." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const technologyRows = (technologyResult.data ?? []).filter(row => !isHiddenTechnologyArchive(row.metadata))
  const watches: CommonWatch[] = [
    ...(brandResult.data ?? []).map(row => ({
      key: `brand:${row.id}`,
      id: row.id,
      type: "brand" as const,
      subtype: row.watch_type,
      query: row.query,
      niceClasses: Array.isArray(row.nice_classes) ? row.nice_classes : [],
      searchScope: null,
      isActive: row.is_active,
      lastCheckedAt: row.last_checked_at,
      lastReviewedAt: row.last_reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    ...(patentResult.data ?? []).map(row => ({
      key: `patent:${row.id}`,
      id: row.id,
      type: "patent" as const,
      subtype: row.watch_type,
      query: row.query,
      niceClasses: [],
      searchScope: null,
      isActive: row.is_active,
      lastCheckedAt: row.last_checked_at,
      lastReviewedAt: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    ...technologyRows.map(row => ({
      key: `technology:${row.id}`,
      id: row.id,
      type: "technology" as const,
      subtype: row.watch_type,
      query: row.query,
      niceClasses: [],
      searchScope: readStrategicSearchScope(row.metadata),
      isActive: row.is_active,
      lastCheckedAt: row.last_checked_at,
      lastReviewedAt: row.last_reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  ].sort((a, b) => Number(b.isActive) - Number(a.isActive) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))

  return NextResponse.json({ watches, counts: countByType(watches) }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = CreateSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Vigilancia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { type, query, niceClasses } = parsed.data
  const subtype = normalizeSubtype(type, parsed.data.subtype)
  if (!subtype) {
    return NextResponse.json({ error: "Tipo de vigilancia inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const normalizedQuery = type === "technology" ? strategicSemanticKey(query) : normalizeQuery(subtype, query)
  const now = new Date().toISOString()

  if (type === "brand") {
    const { data, error } = await auth.supabase
      .from("trademark_watches")
      .upsert({
        user_id: auth.user.id,
        watch_type: subtype,
        query,
        normalized_query: normalizedQuery,
        nice_classes: [...new Set(niceClasses)].sort((a, b) => a - b),
        is_active: true,
        updated_at: now,
      }, { onConflict: "user_id,watch_type,normalized_query" })
      .select("id,watch_type,query,nice_classes,is_active,last_checked_at,last_reviewed_at,created_at,updated_at")
      .single()
    if (error) return watchWriteError("brand", error)
    return NextResponse.json({ watch: normalizeBrand(data) }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (type === "patent") {
    const { data, error } = await auth.supabase
      .from("patent_watches")
      .upsert({
        user_id: auth.user.id,
        watch_type: subtype,
        query,
        normalized_query: normalizedQuery,
        is_active: true,
        updated_at: now,
      }, { onConflict: "user_id,watch_type,normalized_query" })
      .select("id,watch_type,query,is_active,last_checked_at,created_at,updated_at")
      .single()
    if (error) return watchWriteError("patent", error)
    return NextResponse.json({ watch: normalizePatent(data) }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const scope = parsed.data.scope ?? "both"
  const { data: existing, error: existingError } = await auth.supabase
    .from("intelligence_watches")
    .select("id,metadata")
    .eq("user_id", auth.user.id)
    .eq("watch_type", subtype)
    .eq("normalized_query", normalizedQuery)
    .maybeSingle()
  if (existingError) return watchWriteError("technology", existingError)

  const metadata = mergeStrategicSearchMetadata(existing?.metadata, query, scope)
  const { data, error } = await auth.supabase
    .from("intelligence_watches")
    .upsert({
      user_id: auth.user.id,
      watch_type: subtype,
      query,
      normalized_query: normalizedQuery,
      metadata,
      is_active: true,
      last_checked_at: null,
      last_reviewed_at: null,
      updated_at: now,
    }, { onConflict: "user_id,watch_type,normalized_query" })
    .select("id,watch_type,query,is_active,last_checked_at,last_reviewed_at,metadata,created_at,updated_at")
    .single()
  if (error) return watchWriteError("technology", error)
  return NextResponse.json({ watch: normalizeTechnology(data) }, { status: existing ? 200 : 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = ChangeSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Cambio de vigilancia inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const target = parseKey(parsed.data.key)
  if (!target) return NextResponse.json({ error: "Vigilancia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  const table = tableFor(target.source)
  const { data, error } = await auth.supabase
    .from(table)
    .update({ is_active: parsed.data.active, updated_at: new Date().toISOString() })
    .eq("id", target.id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[common-watches:patch]", { source: target.source, error })
    return NextResponse.json({ error: "No pudimos actualizar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!data) return NextResponse.json({ error: "Vigilancia no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function DELETE(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const key = new URL(request.url).searchParams.get("key") ?? ""
  const target = parseKey(key)
  if (!target) return NextResponse.json({ error: "Vigilancia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const { data, error } = await auth.supabase
    .from(tableFor(target.source))
    .delete()
    .eq("id", target.id)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[common-watches:delete]", { source: target.source, error })
    return NextResponse.json({ error: "No pudimos eliminar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!data) return NextResponse.json({ error: "Vigilancia no encontrada." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function normalizeSubtype(type: WatchSource, requested?: string) {
  if (type === "brand") {
    const value = requested || "brand"
    return BRAND_SUBTYPES.has(value) ? value : null
  }
  if (type === "patent") {
    const value = requested || "company"
    return PATENT_SUBTYPES.has(value) ? value : null
  }
  const value = requested || "technology"
  return TECHNOLOGY_SUBTYPES.has(value) ? value : null
}

function normalizeQuery(subtype: string, value: string) {
  const cleaned = value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  return subtype === "ipc" ? cleaned.replace(/\s+/g, "") : cleaned.replace(/[^A-Z0-9]+/g, " ").trim().replace(/\s+/g, " ")
}

function isHiddenTechnologyArchive(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false
  const reason = (metadata as Record<string, unknown>).deactivated_reason
  return typeof reason === "string" && HIDDEN_TECHNOLOGY_ARCHIVES.has(reason)
}

function parseKey(value: string): { source: WatchSource; id: string } | null {
  const [source, id, extra] = value.split(":")
  if (extra || !z.string().uuid().safeParse(id).success || !["brand", "patent", "technology"].includes(source)) return null
  return { source: source as WatchSource, id }
}

function tableFor(source: WatchSource) {
  if (source === "brand") return "trademark_watches"
  if (source === "patent") return "patent_watches"
  return "intelligence_watches"
}

function normalizeBrand(row: Record<string, any>): CommonWatch {
  return { key: `brand:${row.id}`, id: row.id, type: "brand", subtype: row.watch_type, query: row.query, niceClasses: row.nice_classes ?? [], searchScope: null, isActive: row.is_active, lastCheckedAt: row.last_checked_at, lastReviewedAt: row.last_reviewed_at, createdAt: row.created_at, updatedAt: row.updated_at }
}
function normalizePatent(row: Record<string, any>): CommonWatch {
  return { key: `patent:${row.id}`, id: row.id, type: "patent", subtype: row.watch_type, query: row.query, niceClasses: [], searchScope: null, isActive: row.is_active, lastCheckedAt: row.last_checked_at, lastReviewedAt: null, createdAt: row.created_at, updatedAt: row.updated_at }
}
function normalizeTechnology(row: Record<string, any>): CommonWatch {
  return { key: `technology:${row.id}`, id: row.id, type: "technology", subtype: row.watch_type, query: row.query, niceClasses: [], searchScope: readStrategicSearchScope(row.metadata), isActive: row.is_active, lastCheckedAt: row.last_checked_at, lastReviewedAt: row.last_reviewed_at, createdAt: row.created_at, updatedAt: row.updated_at }
}

function countByType(watches: CommonWatch[]) {
  return {
    all: watches.length,
    active: watches.filter(item => item.isActive).length,
    brand: watches.filter(item => item.type === "brand").length,
    patent: watches.filter(item => item.type === "patent").length,
    technology: watches.filter(item => item.type === "technology").length,
  }
}

function watchWriteError(source: WatchSource, error: { code?: string; message?: string }) {
  console.error("[common-watches:post]", { source, code: error.code, message: error.message })
  return NextResponse.json({ error: "No pudimos crear la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
}
