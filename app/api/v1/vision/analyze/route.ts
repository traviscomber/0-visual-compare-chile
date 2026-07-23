import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from "@/lib/api/auth"
import { createVisionCache } from "@/lib/vision/cache"
import { createVisionService } from "@/lib/vision/gpt4o-mini"
import { normalizeBrandName, validateVisionImage } from "@/lib/vision/request-validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

const visionService = createVisionService()
const cache = createVisionCache()
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE_HEADERS })
    }

    const auth = await authenticateApiKey(authHeader.slice(7))
    if (!auth.ok) {
      const headers = auth.reason === "quota_exceeded" && auth.quota_daily !== undefined && auth.quota_monthly !== undefined && auth.usage_today !== undefined && auth.usage_month !== undefined
        ? { ...NO_STORE_HEADERS, ...getQuotaHeaders({ quota_daily: auth.quota_daily, quota_monthly: auth.quota_monthly, usage_today: auth.usage_today, usage_month: auth.usage_month }) }
        : NO_STORE_HEADERS
      return NextResponse.json(
        { error: auth.reason === "quota_exceeded" ? "Cuota excedida." : "API key inválida.", code: auth.reason },
        { status: auth.reason === "quota_exceeded" ? 429 : 401, headers },
      )
    }

    const body = await request.json().catch(() => null)
    const image = validateVisionImage(body?.image)
    const brandName = normalizeBrandName(body?.brandName)
    if (!image) {
      return NextResponse.json(
        { error: "La imagen debe ser PNG, JPEG o WebP en base64 y no superar 4,5 MB." },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    const context = auth.context
    const cacheHash = crypto.createHash("sha256").update(`analyze:${image.value}:${brandName ?? ""}`).digest("hex")
    const quotaHeaders = { ...NO_STORE_HEADERS, ...getQuotaHeaders({ quota_daily: context.quota_daily, quota_monthly: context.quota_monthly, usage_today: context.usage_today, usage_month: context.usage_month, increment: 1 }) }
    const cachedResult = cache.get(cacheHash)

    if (cachedResult) {
      await logApiKeyUsage({ user_id: context.user_id, organization_id: context.organization_id, api_key_id: context.api_key_id, action: "vision.analyze", metadata: { cached: true } })
      return NextResponse.json({ analysis: cachedResult, cached: true, timestamp: new Date().toISOString() }, { status: 200, headers: quotaHeaders })
    }

    const startTime = Date.now()
    const analysis = await visionService.analyzeBrand(image.value, brandName)
    const responseTime = Date.now() - startTime
    cache.set(cacheHash, analysis as never, 259200)

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "vision.analyze",
      metadata: { cached: false, responseTime, mimeType: image.mimeType, bytes: image.estimatedBytes },
    })

    return NextResponse.json({ analysis, cached: false, responseTime, timestamp: new Date().toISOString() }, { status: 200, headers: quotaHeaders })
  } catch (error) {
    console.error("[vision-analyze] request failed", error)
    return NextResponse.json({ error: "No fue posible analizar la imagen." }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
