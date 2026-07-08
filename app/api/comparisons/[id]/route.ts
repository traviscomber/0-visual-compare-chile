import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { BUCKET } from "@/lib/storage"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("comparisons")
    .select("*, image_a:images!comparisons_image_a_id_fkey(*), image_b:images!comparisons_image_b_id_fkey(*)")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Comparación no encontrada." }, { status: 404 })
  }

  return NextResponse.json({ comparison: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const { data: comparison, error: fetchError } = await supabase
      .from("comparisons")
      .select("id, user_id, diff_storage_path")
      .eq("id", id)
      .single()

    if (fetchError || !comparison || comparison.user_id !== user.id) {
      return NextResponse.json({ error: "Comparación no encontrada." }, { status: 404 })
    }

    const { error: deleteError } = await supabase.from("comparisons").delete().eq("id", id)
    if (deleteError) {
      return NextResponse.json({ error: "No pudimos eliminar la comparación." }, { status: 500 })
    }

    if (comparison.diff_storage_path) {
      const admin = createAdminClient()
      await admin.storage.from(BUCKET).remove([comparison.diff_storage_path])
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      action: "comparison.deleted",
      metadata: { comparison_id: id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] comparison delete error", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
