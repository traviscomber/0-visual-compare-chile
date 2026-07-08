import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

/**
 * Soft delete an image. We keep the underlying storage object and the row so
 * any historical comparison referencing this image can still be displayed.
 * Status is flipped to "deleted" so it stops appearing in the user's library.
 */
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

    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("id, user_id")
      .eq("id", id)
      .single()

    if (fetchError || !image || image.user_id !== user.id) {
      return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("images")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "No pudimos eliminar la imagen." }, { status: 500 })
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      action: "image.deleted",
      metadata: { image_id: id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] image delete error", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
