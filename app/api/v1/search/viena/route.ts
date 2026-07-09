import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getVienaCodes } from '@/lib/db-loader'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.trim().toLowerCase()

    // Initialize database
    await initializeDatabase()

    // Get all Viena codes
    let vienaCodes = await getVienaCodes()

    // Filter if query provided
    if (q) {
      vienaCodes = vienaCodes.filter(
        (viena) =>
          viena.descripcion.toLowerCase().includes(q) ||
          viena.codigo.includes(q) ||
          viena.seccion.toLowerCase().includes(q)
      )
    }

    return NextResponse.json(vienaCodes, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('[API] Get Viena error:', error)
    return NextResponse.json(
      { error: 'Failed to get Viena codes' },
      { status: 500 }
    )
  }
}
