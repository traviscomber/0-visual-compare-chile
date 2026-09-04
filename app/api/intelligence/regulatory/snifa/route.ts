import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { searchSnifaFirmSanctions } from "@/lib/intelligence/snifa-firm-sanctions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({ error: "Consulta SNIFA inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  try {
    const sanctions = await searchSnifaFirmSanctions(query, 15)
    return NextResponse.json({
      source: "snifa_sma",
      official: true,
      evidenceType: "firm_sanction",
      query,
      sanctions,
      count: sanctions.length,
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.warn("[regulatory:snifa]", error)
    return NextResponse.json({ error: "SNIFA no está disponible temporalmente." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
