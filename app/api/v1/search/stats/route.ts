import { NextResponse } from "next/server"
import { getTrademarkStats } from "@/lib/trademark-records"

export const runtime = "nodejs"

export async function GET() {
  try {
    const stats = await getTrademarkStats()
    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error("[v0] search stats error", error)
    return NextResponse.json({ error: "Search stats failed" }, { status: 500 })
  }
}
