import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const companyName = cleanText(body?.companyName, 160)
  const useCase = cleanText(body?.useCase, 1200)
  const brandContext = cleanText(body?.brandContext, 120)
  const rawUserCount = Number(body?.userCount)
  const userCount = Number.isInteger(rawUserCount) && rawUserCount >= 1 && rawUserCount <= 100000 ? rawUserCount : null

  if (companyName.length < 2 || useCase.length < 8) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString()
  const { data: recentRequest, error: recentError } = await supabase
    .from("enterprise_access_requests")
    .select("id, status, created_at")
    .eq("user_id", user.id)
    .gte("created_at", duplicateSince)
    .in("status", ["new", "contacted", "qualified"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentError) {
    console.error("[enterprise-access] duplicate check failed", recentError.message)
    return NextResponse.json({ error: "request_failed" }, { status: 500 })
  }

  if (recentRequest) {
    return NextResponse.json({ ok: true, duplicate: true, request: recentRequest })
  }

  const { data, error } = await supabase
    .from("enterprise_access_requests")
    .insert({
      user_id: user.id,
      email: user.email,
      company_name: companyName,
      user_count: userCount,
      use_case: useCase,
      brand_context: brandContext || null,
    })
    .select("id, status, created_at")
    .single()

  if (error) {
    console.error("[enterprise-access] insert failed", error.message)
    return NextResponse.json({ error: "request_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, duplicate: false, request: data })
}
