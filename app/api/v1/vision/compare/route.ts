import { NextRequest, NextResponse } from 'next/server'
import { createVisionService } from '@/lib/vision/gpt4o-mini'
import { createVisionCache } from '@/lib/vision/cache'
import { authenticateApiKey } from '@/lib/api/auth'
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
    const context = await authenticateApiKey(apiKey)
    if (!context) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

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
      return NextResponse.json(
        {
          result: cachedResult,
          cached: true,
          modelUsed: visionService.getModelInfo().model,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
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
      { status: 200 }
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
