import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getNizaClasses } from '@/lib/db-loader'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.trim().toLowerCase()

    // Initialize database
    await initializeDatabase()

    // Get all Niza classes
    let nizaClasses = await getNizaClasses()

    // Filter if query provided
    if (q) {
      nizaClasses = nizaClasses.filter(
        (niza) =>
          niza.titulo.toLowerCase().includes(q) ||
          niza.descripcion.toLowerCase().includes(q) ||
          niza.codigo.includes(q)
      )
    }

    return NextResponse.json(nizaClasses, {
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('[API] Get Niza error:', error)
    return NextResponse.json(
      { error: 'Failed to get Niza classes' },
      { status: 500 }
    )
  }
}
