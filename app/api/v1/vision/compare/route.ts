import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage, reserveImageQuota } from "@/lib/api/auth"
import { createVisionCache } from "@/lib/vision/cache"
import { createVisionService } from "@/lib/vision/gpt4o-mini"
import { normalizeBrandName, validateVisionImage } from "@/lib/vision/request-validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const visionService = createVisionService()
const cache = createVisionCache()
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE_HEADERS })

    const auth = await authenticateApiKey(authHeader.slice(7), { reserveQuota: false })
    if (!auth.ok) return NextResponse.json({ error: "API key inválida.", code: auth.reason }, { status: auth.reason === "unavailable" ? 503 : 401, headers: NO_STORE_HEADERS })

    const body = await request.json().catch(() => null)
    const image1 = validateVisionImage(body?.image1)
    const image2 = validateVisionImage(body?.image2)
    const brandName1 = normalizeBrandName(body?.brandName1)
    const brandName2 = normalizeBrandName(body?.brandName2)

    if (!image1 || !image2) {
      return NextResponse.json({ error: "Ambas imágenes deben ser PNG, JPEG o WebP en base64 y no superar 4,5 MB cada una." }, { status: 400, headers: NO_STORE_HEADERS })
    }

    const context = auth.context
    const imageQuota = await reserveImageQuota(context.api_key_id, 2)
    if (!imageQuota.ok) {
      const status = imageQuota.reason === "quota_exceeded" ? 429 : 503
      const headers = imageQuota.reason === "quota_exceeded"
        ? { ...NO_STORE_HEADERS, "X-Image-Limit-Monthly": String(imageQuota.quota_images_monthly), "X-Image-Remaining-Monthly": String(Math.max(imageQuota.quota_images_monthly - imageQuota.usage_images_month, 0)) }
        : NO_STORE_HEADERS
      return NextResponse.json({ error: imageQuota.reason === "quota_exceeded" ? "Cuota mensual de imágenes excedida." : "Servicio de cuota visual no disponible.", code: imageQuota.reason }, { status, headers })
    }

    const cacheHash = cache.generateHash(image1.value, image2.value, `${brandName1 ?? ""}|${brandName2 ?? ""}`)
    const quotaHeaders = {
      ...NO_STORE_HEADERS,
      ...getQuotaHeaders({ quota_daily: context.quota_daily, quota_monthly: context.quota_monthly, usage_today: context.usage_today, usage_month: context.usage_month }),
      "X-Image-Limit-Monthly": String(imageQuota.quota_images_monthly),
      "X-Image-Remaining-Monthly": String(Math.max(imageQuota.quota_images_monthly - imageQuota.usage_images_month, 0)),
    }
    const cachedResult = cache.get(cacheHash)

    if (cachedResult) {
      await logApiKeyUsage({ user_id: context.user_id, organization_id: context.organization_id, api_key_id: context.api_key_id, action: "vision.compare", billable_units: 2, cache_hit: true, estimated_cost_usd: 0, metadata: { image1Bytes: image1.estimatedBytes, image2Bytes: image2.estimatedBytes } })
      return NextResponse.json({ result: cachedResult, cached: true, timestamp: new Date().toISOString() }, { status: 200, headers: quotaHeaders })
    }

    const startTime = Date.now()
    const result = await visionService.compareBrands({ image1: image1.value, image2: image2.value, brandName1, brandName2 })
    const responseTime = Date.now() - startTime
    cache.set(cacheHash, result, 86400)

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "vision.compare",
      billable_units: 2,
      cache_hit: false,
      provider: "openai",
      model: result.modelUsed,
      metadata: {
        responseTime,
        image1Bytes: image1.estimatedBytes,
        image2Bytes: image2.estimatedBytes,
        similarity: result.similarity,
        totalTokens: result.tokensUsed,
      },
    })

    return NextResponse.json({ result: { ...result, responseTime }, cached: false, timestamp: new Date().toISOString() }, { status: 200, headers: quotaHeaders })
  } catch (error) {
    console.error("[vision-compare] request failed", error)
    return NextResponse.json({ error: "No fue posible comparar las imágenes." }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
