import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { fetchWipoPatentScopeRss } from "@/lib/intelligence/wipo-patentscope-rss"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({ url: z.string().trim().min(12).max(2048) })

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "URL RSS inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  try {
    const feed = await fetchWipoPatentScopeRss(parsed.data.url, 8)
    await auth.supabase.from("usage_logs").insert({
      user_id: auth.user.id,
      organization_id: null,
      action: "patent.wipo_rss_preview",
      metadata: { source: "wipo_patentscope_rss", result_count: feed.items.length },
    })
    return NextResponse.json({
      source: feed.source,
      availability: feed.availability,
      title: feed.title,
      resultCount: feed.items.length,
      retrievedAt: feed.retrievedAt,
      items: feed.items.slice(0, 5),
      limitation: "La ausencia de resultados en un feed disponible no demuestra ausencia de patentes o derechos. PATENTSCOPE RSS es evidencia observada, no una conclusión jurídica.",
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[patents:wipo-rss-preview]", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No pudimos leer el RSS de PATENTSCOPE.",
      availability: "degraded",
    }, { status: 422, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
