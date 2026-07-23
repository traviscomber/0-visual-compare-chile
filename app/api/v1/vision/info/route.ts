import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth/server"
import { createVisionCache } from "@/lib/vision/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const cache = createVisionCache()
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }

export async function GET() {
  const authorization = await requireAdmin()
  if (authorization.response) return authorization.response

  try {
    const cacheStats = cache.getStats()
    const memoryUsage = cache.getMemoryUsage()

    return NextResponse.json(
      {
        status: "ready",
        cache: {
          stats: cacheStats,
          memory: memoryUsage,
        },
        generatedAt: new Date().toISOString(),
      },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (error) {
    console.error("[vision-info] diagnostics error", error)
    return NextResponse.json(
      { error: "No fue posible cargar el diagnóstico de visión." },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
