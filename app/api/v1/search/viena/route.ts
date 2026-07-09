import { NextResponse } from 'next/server'
import { API_PORTAL_VIENA } from '@/lib/api-portal-data'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ results: API_PORTAL_VIENA }, { status: 200 })
}
