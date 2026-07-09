import { NextResponse } from 'next/server'
import { API_PORTAL_NIZA } from '@/lib/api-portal-data'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ results: API_PORTAL_NIZA }, { status: 200 })
}
