import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const QuerySchema = z.object({ application: z.string().trim().min(1).max(40) })

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({ application: url.searchParams.get("application") ?? "" })
  if (!parsed.success) return NextResponse.json({ error: "Número de solicitud inválido." }, { status: 400 })

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })

  const { data, error } = await supabase.rpc("get_trademark_owner_context_by_application", {
    p_application_number: parsed.data.application,
  })

  if (error) {
    console.error("[owner-context]", error)
    return NextResponse.json({ error: "No pudimos cargar el contexto del titular." }, { status: 500 })
  }

  return NextResponse.json(data ?? { found: false }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=1800" },
  })
}
