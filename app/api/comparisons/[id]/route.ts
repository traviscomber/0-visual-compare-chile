import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { BUCKET } from "@/lib/storage"

export const runtime = "nodejs"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
  }

  const { data, error } = await supabase
    .from("comparisons")
    .select("*, image_a:images!comparisons_image_a_id_fkey(*), image_b:images!comparisons_image_b_id_fkey(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Comparación no encontrada." }, { status: 404, headers: PRIVATE_HEADERS })
  }

  return NextResponse.json({ comparison: data }, { headers: PRIVATE_HEADERS })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const { data: comparison, error: fetchError } = await supabase
      .from("comparisons")
      .select("id, user_id, diff_storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !comparison) {
      return NextResponse.json({ error: "Comparación no encontrada." }, { status: 404, headers: PRIVATE_HEADERS })
    }

    const { error: deleteError } = await supabase
      .from("comparisons")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: "No pudimos eliminar la comparación." },
        { status: 500, headers: PRIVATE_HEADERS },
      )
    }

    if (comparison.diff_storage_path) {
      const admin = createAdminClient()
      await admin.storage.from(BUCKET).remove([comparison.diff_storage_path])
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: null,
      action: "comparison.deleted",
      metadata: { comparison_id: id },
    })

    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error("[comparison-delete] failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json({ error: "Error interno." }, { status: 500, headers: PRIVATE_HEADERS })
  }
}
