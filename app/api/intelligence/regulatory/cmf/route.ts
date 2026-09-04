import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { searchCmfRegulations } from "@/lib/intelligence/cmf-regulatory"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? ""
  if (query.length < 2 || query.length > 160) {
    return NextResponse.json({ error: "Consulta regulatoria inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  try {
    const regulations = await searchCmfRegulations(query, 15)
    return NextResponse.json({
      source: "cmf_norms",
      official: true,
      query,
      regulations,
      count: regulations.length,
    }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.warn("[regulatory:cmf]", error)
    return NextResponse.json({ error: "La fuente regulatoria CMF no está disponible temporalmente." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
