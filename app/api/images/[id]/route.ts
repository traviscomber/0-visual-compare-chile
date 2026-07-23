import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

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

    const { data: image, error: fetchError } = await supabase
      .from("images")
      .select("id, user_id")
      .eq("id", id)
      .single()

    if (fetchError || !image || image.user_id !== user.id) {
      return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404, headers: PRIVATE_HEADERS })
    }

    const { error: updateError } = await supabase
      .from("images")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json(
        { error: "No pudimos eliminar la imagen." },
        { status: 500, headers: PRIVATE_HEADERS },
      )
    }

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: null,
      action: "image.deleted",
      metadata: { image_id: id },
    })

    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error("[image-delete] failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json({ error: "Error interno." }, { status: 500, headers: PRIVATE_HEADERS })
  }
}
