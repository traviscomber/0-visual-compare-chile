import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { searchFneCompetition } from "@/lib/intelligence/fne-competition"
import { searchTdlcCompetition } from "@/lib/intelligence/tdlc-competition"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const QuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
  source: z.enum(["all", "fne", "tdlc"]).default("all"),
  limit: z.coerce.number().int().min(1).max(24).default(12),
})

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    source: url.searchParams.get("source") ?? "all",
    limit: url.searchParams.get("limit") ?? 12,
  })
  if (!parsed.success) return NextResponse.json({ error: "Consulta de competencia inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })

  const { q, source, limit } = parsed.data
  const [fneResult, tdlcResult] = await Promise.all([
    source === "tdlc" ? Promise.resolve({ ok: false as const, items: [] }) : safeSource(() => searchFneCompetition(q, limit)),
    source === "fne" ? Promise.resolve({ ok: false as const, items: [] }) : safeSource(() => searchTdlcCompetition(q, limit)),
  ])

  const items = [
    ...fneResult.items.map(item => ({ ...item, relevance: "alta" as const })),
    ...tdlcResult.items.map(item => ({ ...item, relevance: "alta" as const })),
  ].sort((a, b) => String(b.publicationDate ?? "").localeCompare(String(a.publicationDate ?? ""))).slice(0, limit)

  await auth.supabase.from("usage_logs").insert({
    user_id: auth.user.id,
    organization_id: null,
    action: "intelligence.competition_search",
    metadata: { query: q, source, result_count: items.length, fne_available: fneResult.ok, tdlc_available: tdlcResult.ok },
  })

  return NextResponse.json({
    query: q,
    observed_at: new Date().toISOString(),
    sources: {
      fne_competition: { available: fneResult.ok, evidence_count: fneResult.items.length },
      tdlc_jurisprudence: { available: tdlcResult.ok, evidence_count: tdlcResult.items.length },
    },
    items,
    limitation: "La evidencia publicada por FNE y TDLC se usa como señal oficial observada. No reemplaza notificaciones legales ni una revisión jurídica del expediente completo.",
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

async function safeSource<T>(operation: () => Promise<T[]>) {
  try {
    return { ok: true as const, items: await operation() }
  } catch (error) {
    console.warn("[competition-intelligence] source unavailable", error)
    return { ok: false as const, items: [] as T[] }
  }
}
