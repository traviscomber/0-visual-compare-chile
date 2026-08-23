import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WatchSchema = z.object({
  type: z.enum(["brand", "owner"]).default("brand"),
  query: z.string().trim().min(2).max(160),
  niza: z.array(z.number().int().min(1).max(45)).max(20).default([]),
})

const PatchSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  niza: z.array(z.number().int().min(1).max(45)).max(20).optional(),
})

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data, error } = await auth.supabase
    .from("trademark_watches")
    .select("id,watch_type,query,nice_classes,is_active,last_checked_at,created_at,updated_at")
    .order("is_active", { ascending: false })
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("[trademark-watchlist:get]", error)
    return NextResponse.json({ error: "No pudimos cargar tus vigilancias." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ watches: data ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = WatchSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de vigilancia inválidos." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const { data, error } = await auth.supabase
    .from("trademark_watches")
    .insert({
      user_id: auth.user.id,
      watch_type: parsed.data.type,
      query: parsed.data.query,
      nice_classes: [...new Set(parsed.data.niza)].sort((a, b) => a - b),
    })
    .select("id,watch_type,query,nice_classes,is_active,last_checked_at,created_at,updated_at")
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Esta vigilancia ya existe." }, { status: 409, headers: PRIVATE_NO_STORE_HEADERS })
    }
    console.error("[trademark-watchlist:post]", error)
    return NextResponse.json({ error: "No pudimos crear la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ watch: data }, { status: 201, headers: PRIVATE_NO_STORE_HEADERS })
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success || (parsed.data.active === undefined && parsed.data.niza === undefined)) {
    return NextResponse.json({ error: "Cambio de vigilancia inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.active !== undefined) update.is_active = parsed.data.active
  if (parsed.data.niza !== undefined) update.nice_classes = [...new Set(parsed.data.niza)].sort((a, b) => a - b)

  const { data, error } = await auth.supabase
    .from("trademark_watches")
    .update(update)
    .eq("id", parsed.data.id)
    .select("id,watch_type,query,nice_classes,is_active,last_checked_at,created_at,updated_at")
    .maybeSingle()

  if (error) {
    console.error("[trademark-watchlist:patch]", error)
    return NextResponse.json({ error: "No pudimos actualizar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
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

  const { error } = await auth.supabase.from("trademark_watches").delete().eq("id", id)
  if (error) {
    console.error("[trademark-watchlist:delete]", error)
    return NextResponse.json({ error: "No pudimos eliminar la vigilancia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS })
}
