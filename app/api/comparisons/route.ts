import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
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
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Error al listar comparaciones." }, { status: 500 })
  }

  return NextResponse.json({ comparisons: data })
}
