import { NextResponse } from "next/server"
import { z } from "zod"
import { getTrademarkIntelligenceContext } from "@/lib/intelligence/trademark-context"

const ParamsSchema = z.object({ id: z.string().uuid() })

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = ParamsSchema.safeParse(await context.params)
  if (!parsed.success) return NextResponse.json({ error: "Identificador de marca inválido." }, { status: 400 })

  try {
    const data = await getTrademarkIntelligenceContext(parsed.data.id)
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN"
    if (message === "UNAUTHENTICATED") return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })
    console.error("[trademark-intelligence-context]", error)
    return NextResponse.json({ error: "No pudimos cargar la inteligencia de esta marca." }, { status: 500 })
  }
}
