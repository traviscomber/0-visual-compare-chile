import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { syncPatentOpenDataYear } from "@/lib/inapi/patent-open-data-sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const TOKEN_HASH = "9ef53afddec3ed6345f6c493af1485b685293097b6a8398b362ffd7a00d2cb92"

function isAuthorized(token: string | null) {
  if (!token) return false
  const actual = createHash("sha256").update(token).digest()
  const expected = Buffer.from(TOKEN_HASH, "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  if (!isAuthorized(url.searchParams.get("token"))) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const year = Number(url.searchParams.get("year"))
  if (!Number.isInteger(year) || year < 2009 || year > 2025) {
    return NextResponse.json({ ok: false, error: "Invalid year" }, { status: 400 })
  }

  try {
    const summary = await syncPatentOpenDataYear(year, ["solicitudes-de-patentes"])
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    return NextResponse.json(
      { ok: false, year, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}
