import { NextRequest, NextResponse } from 'next/server'
import { createVisionService } from '@/lib/vision/gpt4o-mini'
import { createVisionCache } from '@/lib/vision/cache'
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from '@/lib/api/auth'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

const visionService = createVisionService()
const cache = createVisionCache()

interface AnalyzeRequest {
  image: string
  brandName?: string
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate with API key
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
    }

    const apiKey = authHeader.slice(7)
    const auth = await authenticateApiKey(apiKey)
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.message, reason: auth.reason },
        {
          status: auth.reason === 'quota_exceeded' ? 429 : 401,
          headers:
            auth.reason === 'quota_exceeded' &&
            auth.quota_daily !== undefined &&
            auth.quota_monthly !== undefined &&
            auth.usage_today !== undefined &&
            auth.usage_month !== undefined
              ? getQuotaHeaders({
                  quota_daily: auth.quota_daily,
                  quota_monthly: auth.quota_monthly,
                  usage_today: auth.usage_today,
                  usage_month: auth.usage_month,
                })
              : undefined,
        }
      )
    }
    const context = auth.context

    // Parse request body
    const body: AnalyzeRequest = await request.json()

    // Validate inputs
    if (!body.image) {
      return NextResponse.json({ error: 'Image is required (base64 encoded)' }, { status: 400 })
    }

    if (body.image.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be smaller than 5MB' }, { status: 413 })
    }

    // Generate cache hash
    const cacheHash = crypto
      .createHash('sha256')
      .update(`analyze:${body.image}:${body.brandName || ''}`)
      .digest('hex')

    // Check cache first
    const cachedResult = cache.get(cacheHash)
    if (cachedResult) {
      await logApiKeyUsage({
        user_id: context.user_id,
        organization_id: context.organization_id,
        api_key_id: context.api_key_id,
        action: 'vision.analyze',
        metadata: {
          cached: true,
          brandName: body.brandName ?? null,
        },
      })

      return NextResponse.json(
        {
          analysis: cachedResult,
          cached: true,
          modelUsed: visionService.getModelInfo().model,
          timestamp: new Date().toISOString(),
        },
        {
          status: 200,
          headers: getQuotaHeaders({
            quota_daily: context.quota_daily,
            quota_monthly: context.quota_monthly,
            usage_today: context.usage_today,
            usage_month: context.usage_month,
            increment: 1,
          }),
        }
      )
    }

    // Perform brand analysis
    const startTime = Date.now()
    const analysis = await visionService.analyzeBrand(body.image, body.brandName)
    const responseTime = Date.now() - startTime

    // Cache the result (longer TTL for analysis)
    cache.set(cacheHash, analysis as any, 259200) // 72 hours

    console.log(`[v0] Brand analysis: ${body.brandName || 'Unknown'} (Type: ${analysis.logoType})`)
    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: 'vision.analyze',
      metadata: {
        cached: false,
        brandName: body.brandName ?? null,
        logoType: analysis.logoType,
        responseTime,
      },
    })

    return NextResponse.json(
      {
        analysis,
        cached: false,
        modelUsed: visionService.getModelInfo().model,
        responseTime,
        timestamp: new Date().toISOString(),
        cacheKey: cacheHash,
      },
      {
        status: 200,
        headers: getQuotaHeaders({
          quota_daily: context.quota_daily,
          quota_monthly: context.quota_monthly,
          usage_today: context.usage_today,
          usage_month: context.usage_month,
          increment: 1,
        }),
      }
    )
  } catch (error) {
    console.error('[v0] Brand analysis error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
