import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_STATUSES = new Set(["new", "contacted", "qualified", "approved", "rejected", "closed"])

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 })
  }

  if (user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const status = typeof body?.status === "string" ? body.status : ""

  if (!id || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("enterprise_access_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status, updated_at")
    .single()

  if (error) {
    console.error("[enterprise-access] status update failed", error.message)
    return NextResponse.json({ error: "request_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, request: data })
}
