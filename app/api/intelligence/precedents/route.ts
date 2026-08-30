import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const QuerySchema = z.object({
  q: z.string().trim().min(1).max(160),
  niza: z.array(z.number().int().min(1).max(45)).max(20).default([]),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const niza = url.searchParams
    .getAll("niza")
    .flatMap(value => value.split(","))
    .map(value => Number(value.trim()))
    .filter(value => Number.isInteger(value))

  const parsed = QuerySchema.safeParse({ q: url.searchParams.get("q") ?? "", niza })
  if (!parsed.success) return NextResponse.json({ error: "Consulta inválida." }, { status: 400 })

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("search_trademark_precedents", {
    p_mark: parsed.data.q,
    p_niza: parsed.data.niza,
    p_limit: 8,
  })

  if (error) {
    console.error("[precedent-search]", error)
    return NextResponse.json({ error: "No pudimos consultar los precedentes." }, { status: 500 })
  }

  return NextResponse.json({
    query: parsed.data.q,
    niza: parsed.data.niza,
    precedents: data ?? [],
    notice: "Los precedentes se presentan como evidencia comparativa y no constituyen una predicción del resultado jurídico.",
  }, { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=1800" } })
}
