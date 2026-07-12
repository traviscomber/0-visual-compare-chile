import { NextResponse } from 'next/server'
import { API_PORTAL_VIENA } from '@/lib/api-portal-data'
import { searchClassificationCatalog } from '@/lib/classification-knowledge'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const limitParam = url.searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Math.floor(Number(limitParam) || 10)) : 0

  const results = query
    ? searchClassificationCatalog('viena', query, limit || 10)
    : API_PORTAL_VIENA

  return NextResponse.json({ results }, { status: 200 })
}
