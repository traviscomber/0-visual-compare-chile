import { NextRequest, NextResponse } from 'next/server'
import {
  initializeDatabase,
  searchByName,
  searchByNiza,
  logSearch as dbLogSearch,
} from '@/lib/db-loader'

export const runtime = 'nodejs'

interface SearchParams {
  q?: string
  type?: 'nombre' | 'niza' | 'viena'
  page?: string
  limit?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams as any
    const params: SearchParams = {
      q: searchParams.get('q'),
      type: searchParams.get('type') || 'nombre',
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    }

    // Validate inputs
    if (!params.q || params.q.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const query = params.q.trim().substring(0, 200) // Sanitize
    const type = params.type as 'nombre' | 'niza' | 'viena'
    const page = Math.max(1, parseInt(params.page || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)))

    const start = performance.now()

    // Initialize database
    await initializeDatabase()

    // Perform search
    let resultados = []
    if (type === 'nombre') {
      resultados = await searchByName(query, limit * page)
    } else if (type === 'niza') {
      resultados = await searchByNiza(query, limit * page)
    }

    // Paginate
    const startIdx = (page - 1) * limit
    const paginatedResults = resultados.slice(startIdx, startIdx + limit)
    const totalPages = Math.ceil(resultados.length / limit)

    const tiempo_ms = Math.round(performance.now() - start)

    // Log search
    await dbLogSearch(query, type, resultados.length)

    return NextResponse.json(
      {
        resultados: paginatedResults,
        total: resultados.length,
        pagina: page,
        totalPaginas: totalPages,
        tiempo_ms,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('[API] Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
