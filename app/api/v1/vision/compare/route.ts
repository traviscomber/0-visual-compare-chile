import { NextRequest, NextResponse } from 'next/server'
import { createVisionService } from '@/lib/vision/gpt4o-mini'
import { createVisionCache } from '@/lib/vision/cache'
import { authenticateApiKey, getQuotaHeaders, logApiKeyUsage } from '@/lib/api/auth'
import type { ComparisonResult } from '@/lib/vision/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const visionService = createVisionService()
const cache = createVisionCache()

interface CompareRequest {
  image1: string
  image2: string
  brandName1?: string
  brandName2?: string
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
    const body: CompareRequest = await request.json()

    // Validate inputs
    if (!body.image1 || !body.image2) {
      return NextResponse.json(
        { error: 'Both image1 and image2 are required (base64 encoded)' },
        { status: 400 }
      )
    }

    if (body.image1.length > 5 * 1024 * 1024 || body.image2.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Images must be smaller than 5MB' }, { status: 413 })
    }

    // Generate cache hash
    const cacheHash = cache.generateHash(
      body.image1,
      body.image2,
      `${body.brandName1}|${body.brandName2}`
    )

    // Check cache first
    const cachedResult = cache.get(cacheHash)
    if (cachedResult) {
      await logApiKeyUsage({
        user_id: context.user_id,
        organization_id: context.organization_id,
        api_key_id: context.api_key_id,
        action: 'vision.compare',
        metadata: {
          cached: true,
          brandName1: body.brandName1 ?? null,
          brandName2: body.brandName2 ?? null,
        },
      })

      return NextResponse.json(
        {
          result: cachedResult,
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

    // Perform vision comparison
    const startTime = Date.now()
    const result = await visionService.compareBrands({
      image1: body.image1,
      image2: body.image2,
      brandName1: body.brandName1,
      brandName2: body.brandName2,
    })
    const responseTime = Date.now() - startTime

    // Cache the result
    cache.set(cacheHash, result, 86400)

    // Log to audit trail
    console.log(`[v0] Vision comparison: ${body.brandName1 || 'Brand1'} vs ${body.brandName2 || 'Brand2'} (Score: ${result.similarity})`)
    await logApiKeyUsage({
      user_id: context.user_id,
      organization_id: context.organization_id,
      api_key_id: context.api_key_id,
      action: 'vision.compare',
      metadata: {
        cached: false,
        brandName1: body.brandName1 ?? null,
        brandName2: body.brandName2 ?? null,
        similarity: result.similarity,
        responseTime,
      },
    })

    return NextResponse.json(
      {
        result: {
          ...result,
          responseTime,
        },
        cached: false,
        modelUsed: visionService.getModelInfo().model,
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
    console.error('[v0] Vision comparison error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
