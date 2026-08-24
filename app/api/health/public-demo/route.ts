import { NextResponse } from "next/server"
import { reservePublicDemoQuota } from "@/lib/public-demo-rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const quota = await reservePublicDemoQuota("videntia-public-demo-healthcheck")

  return NextResponse.json(
    {
      ok: quota.ok,
      service: "public-demo-quota",
    },
    {
      status: quota.ok ? 200 : 503,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  )
}
