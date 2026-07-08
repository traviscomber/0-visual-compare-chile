import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "visual-compare-chile",
    timestamp: new Date().toISOString(),
  })
}
