import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey, logApiKeyUsage, reserveImageQuota } from "@/lib/api/auth"
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
    if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: NO_STORE_HEADERS })

    const auth = await authenticateApiKey(authHeader.slice(7), { reserveQuota: false })
    if (!auth.ok) return NextResponse.json({ error: "API key inválida.", code: auth.reason }, { status: auth.reason === "unavailable" ? 503 : 401, headers: NO_STORE_HEADERS })

    const body = await request.json().catch(() => null)
    const image = validateVisionImage(body?.image)
    const brandName = normalizeBrandName(body?.brandName)
    if (!image) return NextResponse.json({ error: "La imagen debe ser PNG, JPEG o WebP en base64 y no superar 4,5 MB." }, { status: 400, headers: NO_STORE_HEADERS })

    const context = auth.context
    const imageQuota = await reserveImageQuota(context.api_key_id, 1)
    if (!imageQuota.ok) {
      return NextResponse.json(
        { error: imageQuota.reason === "quota_exceeded" ? "Cuota mensual de imágenes excedida." : "Servicio de cuota no disponible.", code: imageQuota.reason },
        {
          status: imageQuota.reason === "quota_exceeded" ? 429 : 503,
          headers: {
            ...NO_STORE_HEADERS,
            ...(imageQuota.quota_images_monthly !== undefined ? {
              "X-Image-Limit-Monthly": String(imageQuota.quota_images_monthly),
              "X-Image-Remaining-Monthly": String(Math.max(imageQuota.quota_images_monthly - (imageQuota.usage_images_month ?? 0), 0)),
            } : {}),
          },
        },
      )
    }

    const quotaHeaders = {
      ...NO_STORE_HEADERS,
      "X-Image-Limit-Monthly": String(imageQuota.quota_images_monthly),
      "X-Image-Remaining-Monthly": String(Math.max(imageQuota.quota_images_monthly - imageQuota.usage_images_month, 0)),
    }
    const cacheHash = crypto.createHash("sha256").update(`analyze:${image.value}:${brandName ?? ""}`).digest("hex")
    const cachedResult = cache.get(cacheHash)

    if (cachedResult) {
      await logApiKeyUsage({
        user_id: context.user_id,
        organization_id: context.organization_id,
        api_key_id: context.api_key_id,
        action: "vision.analyze",
        billable_units: 1,
        cache_hit: true,
        estimated_cost_usd: 0,
        metadata: { mimeType: image.mimeType, bytes: image.estimatedBytes },
      })
      return NextResponse.json({ analysis: cachedResult, cached: true, timestamp: new Date().toISOString() }, { status: 200, headers: quotaHeaders })
    }

    const startTime = Date.now()
    const result = await visionService.analyzeBrandWithMetrics(image.value, brandName)
    const responseTime = Date.now() - startTime
    cache.set(cacheHash, result.analysis as never, 259200)

    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: "vision.analyze",
      billable_units: 1,
      cache_hit: false,
      provider: result.metrics.provider,
      model: result.metrics.model,
      input_tokens: result.metrics.inputTokens,
      cached_input_tokens: result.metrics.cachedInputTokens,
      output_tokens: result.metrics.outputTokens,
      estimated_cost_usd: result.metrics.estimatedCostUsd,
      metadata: { responseTime, mimeType: image.mimeType, bytes: image.estimatedBytes, totalTokens: result.metrics.totalTokens },
    })

    return NextResponse.json({ analysis: result.analysis, cached: false, responseTime, timestamp: new Date().toISOString() }, { status: 200, headers: quotaHeaders })
  } catch (error) {
    console.error("[vision-analyze] request failed", error)
    return NextResponse.json({ error: "No fue posible analizar la imagen." }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
