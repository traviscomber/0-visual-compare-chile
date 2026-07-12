import { NextResponse } from "next/server"
import { getTrademarkRecordById } from "@/lib/trademark-records"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { result: registro, source } = await getTrademarkRecordById(id)

    if (!registro) {
      return NextResponse.json({ error: "Registro not found" }, { status: 404 })
    }

    return NextResponse.json({ result: registro, source }, { status: 200 })
  } catch (error) {
    console.error("[v0] registro lookup error", error)
    return NextResponse.json({ error: "Registro lookup failed" }, { status: 500 })
  }
}
