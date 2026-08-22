import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const [{ data: actions, error: actionsError }, { data: mentions, error: mentionsError }] = await Promise.all([
    auth.supabase.from("case_actions").select("id,case_id,title,status,due_at,created_at,cases(title)").eq("assigned_to", auth.user.id).eq("status", "open").order("due_at", { ascending: true, nullsFirst: false }).limit(100),
    auth.supabase.from("case_comments").select("id,case_id,author_id,body,created_at,cases(title)").contains("mentions", [auth.user.id]).order("created_at", { ascending: false }).limit(100),
  ])

  if (actionsError || mentionsError) return NextResponse.json({ error: "No pudimos cargar tus pendientes." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  return NextResponse.json({ actions: actions ?? [], mentions: mentions ?? [] }, { headers: PRIVATE_NO_STORE_HEADERS })
}
