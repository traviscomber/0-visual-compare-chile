import { NextResponse } from "next/server"
import { probeGdeltRawFeed } from "@/lib/intelligence/gdelt-raw-feed"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  try {
    const probe = await probeGdeltRawFeed(new Date())
    return NextResponse.json({ ok: true, probe }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
