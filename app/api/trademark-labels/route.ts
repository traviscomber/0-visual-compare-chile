import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  const { data, error } = await supabase.from("trademark_internal_labels").select("id,name,slug,category,description,color").order("category").order("name")
  if (error) return NextResponse.json({ error: "No fue posible cargar las etiquetas." }, { status: 500 })
  return NextResponse.json({ labels: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  const body = await request.json().catch(() => null)
  const comparisonId = typeof body?.comparisonId === "string" ? body.comparisonId : ""
  const labelIds = Array.isArray(body?.labelIds) ? body.labelIds.filter((id: unknown): id is string => typeof id === "string") : []
  if (!comparisonId || labelIds.length === 0) return NextResponse.json({ error: "Comparación y etiquetas son requeridas." }, { status: 400 })

  const { data: comparison } = await supabase.from("comparisons").select("id").eq("id", comparisonId).eq("user_id", user.id).maybeSingle()
  if (!comparison) return NextResponse.json({ error: "La comparación no existe o no pertenece al usuario." }, { status: 404 })

  const rows = labelIds.map((labelId) => ({ comparison_id: comparisonId, label_id: labelId, user_id: user.id, source: "manual" }))
  const { error } = await supabase.from("trademark_comparison_labels").upsert(rows, { onConflict: "comparison_id,label_id" })
  if (error) return NextResponse.json({ error: "No fue posible registrar las etiquetas." }, { status: 500 })
  await supabase.from("trademark_label_audit_log").insert(labelIds.map((labelId) => ({ comparison_id: comparisonId, label_id: labelId, user_id: user.id, action: "assigned", reason: "Asignación manual desde el análisis" })))
  return NextResponse.json({ ok: true, comparisonId, labelIds })
}
