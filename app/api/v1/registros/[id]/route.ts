import { NextResponse } from 'next/server'
import { findMarcaById } from '@/lib/api-portal-data'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const registro = findMarcaById(id)

    if (!registro) {
      return NextResponse.json({ error: 'Registro not found' }, { status: 404 })
    }

    return NextResponse.json({ result: registro }, { status: 200 })
  } catch (error) {
    console.error('[v0] Registro lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
