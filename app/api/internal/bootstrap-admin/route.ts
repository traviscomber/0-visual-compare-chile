import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BOOTSTRAP_TOKEN = "OQkG2caeoOThteVwtH1pySNAzFJKRxTrLuk4q402hkjy7Glgbp4OPlhFXmc4zZ30"
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token") ?? ""
  const email = (searchParams.get("email") ?? "").trim().toLowerCase()
  const password = searchParams.get("password") ?? ""

  if (token !== BOOTSTRAP_TOKEN) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE_HEADERS })
  }

  if (email !== "juan@n3uralia.com" || password.length < 8) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400, headers: NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) {
    console.error("[bootstrap-admin] list users error", listError)
    return NextResponse.json({ error: "No fue posible consultar usuarios." }, { status: 500, headers: NO_STORE_HEADERS })
  }

  const existing = listed.users.find((user) => user.email?.toLowerCase() === email)

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: "admin" },
    })

    if (error) {
      console.error("[bootstrap-admin] update error", error)
      return NextResponse.json({ error: "No fue posible actualizar el administrador." }, { status: 500, headers: NO_STORE_HEADERS })
    }

    return NextResponse.json(
      { ok: true, action: "updated", userId: data.user.id, email: data.user.email, role: data.user.app_metadata?.role },
      { headers: NO_STORE_HEADERS },
    )
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
  })

  if (error) {
    console.error("[bootstrap-admin] create error", error)
    return NextResponse.json({ error: "No fue posible crear el administrador." }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json(
    { ok: true, action: "created", userId: data.user.id, email: data.user.email, role: data.user.app_metadata?.role },
    { status: 201, headers: NO_STORE_HEADERS },
  )
}
