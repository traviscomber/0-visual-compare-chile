import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, getDatabase } from '@/lib/db-loader'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid ID parameter' },
        { status: 400 }
      )
    }

    // Initialize database
    await initializeDatabase()
    const db = await getDatabase()

    // Get registro
    const results = db.exec(
      `SELECT id, nombre, solicitante, numero_registro, estado, fecha_registro,
              fecha_vencimiento, pais, metadata
       FROM registros WHERE id = ?`,
      [id]
    )

    if (!results[0] || results[0].values.length === 0) {
      return NextResponse.json(
        { error: 'Registro not found' },
        { status: 404 }
      )
    }

    const row = results[0].values[0]
    const registro = {
      id: row[0],
      nombre: row[1],
      solicitante: row[2],
      numero_registro: row[3],
      estado: row[4],
      fecha_registro: row[5],
      fecha_vencimiento: row[6],
      pais: row[7],
      metadata: row[8] ? JSON.parse(row[8] as string) : {},
      niza_expandido: [],
      viena_expandido: [],
    }

    // Get Niza classifications
    const nizaResults = db.exec(
      `SELECT n.codigo, n.clase, n.titulo, n.descripcion, n.seccion
       FROM niza n
       INNER JOIN marcas_niza mn ON n.codigo = mn.niza_codigo
       WHERE mn.marca_id = ?`,
      [id]
    )

    if (nizaResults[0]) {
      registro.niza_expandido = nizaResults[0].values.map((row: any[]) => ({
        codigo: row[0],
        clase: row[1],
        titulo: row[2],
        descripcion: row[3],
        seccion: row[4],
      }))
    }

    // Get Viena classifications
    const vienResults = db.exec(
      `SELECT v.codigo, v.categoria, v.division, v.seccion, v.descripcion
       FROM viena v
       INNER JOIN marcas_viena mv ON v.codigo = mv.viena_codigo
       WHERE mv.marca_id = ?`,
      [id]
    )

    if (vienResults[0]) {
      registro.viena_expandido = vienResults[0].values.map((row: any[]) => ({
        codigo: row[0],
        categoria: row[1],
        division: row[2],
        seccion: row[3],
        descripcion: row[4],
      }))
    }

    return NextResponse.json(registro, {
      headers: {
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[API] Get registro error:', error)
    return NextResponse.json(
      { error: 'Failed to get registro' },
      { status: 500 }
    )
  }
}
