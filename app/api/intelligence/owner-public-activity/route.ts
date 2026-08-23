import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getOwnerPublicActivity } from "@/lib/intelligence/mercado-publico"

const QuerySchema = z.object({ application: z.string().trim().min(1).max(40) })

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const parsed = QuerySchema.safeParse({ application: new URL(request.url).searchParams.get("application") ?? "" })
  if (!parsed.success) return NextResponse.json({ error: "Número de solicitud inválido." }, { status: 400 })

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })

  const admin = createAdminClient()
  const { data: context, error } = await admin.rpc("get_trademark_owner_context_by_application", {
    p_application_number: parsed.data.application,
  })
  if (error) {
    console.error("[owner-public-activity:context]", error)
    return NextResponse.json({ error: "No pudimos cargar el titular." }, { status: 500 })
  }

  const rut = typeof context?.owner?.rut === "string" ? context.owner.rut : null
  const verified = context?.owner?.identity_status === "res_verified" && Boolean(rut)
  if (!verified || !rut) {
    return NextResponse.json({ available: false, verifiedIdentityRequired: true }, {
      headers: { "Cache-Control": "private, max-age=300" },
    })
  }

  const activity = await getOwnerPublicActivity(rut)
  return NextResponse.json({ ...activity, verifiedIdentityRequired: false }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=900" },
  })
}
