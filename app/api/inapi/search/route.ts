import { NextResponse } from 'next/server'
import type { Marca } from '@/types/marca'

const INAPI_BASE = 'https://buscadormarcas.inapi.cl/Marca'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ─── session cache (per process) ─────────────────────────────────────────────
let cachedSession: string | null = null
let sessionFetchedAt = 0
const SESSION_TTL_MS = 25 * 60 * 1000 // 25 minutes

async function getSession(): Promise<string> {
  const now = Date.now()
  if (cachedSession && now - sessionFetchedAt < SESSION_TTL_MS) {
    return cachedSession
  }

  const res = await fetch(`${INAPI_BASE}/BuscarMarca.aspx`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })

  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/ASP\.NET_SessionId=([^;]+)/)
  if (!match) throw new Error('Could not obtain INAPI session')

  cachedSession = match[1]
  sessionFetchedAt = now
  return cachedSession
}

// ─── INAPI cell → Marca ───────────────────────────────────────────────────────
function cellToMarca(cell: string[], id: string): Marca {
  // cell layout: [numSol, numRegistro, clases_niza, denominacion, titular, estado, tipoMarca, tipoMarca2, numSol2, fileType]
  const niza = (cell[2] ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  const estadoRaw = cell[5] ?? ''
  const estado = estadoRaw === 'En Trámite' || estadoRaw === 'Pendiente'
    ? 'Pendiente'
    : estadoRaw === 'Registrada'
      ? 'Registrada'
      : 'Denegada'

  return {
    id,
    nombre: cell[3] ?? '',
    solicitante: cell[4] ?? '',
    numeroRegistro: cell[1] ?? '',
    estado,
    fecha: '',           // Not returned by FindMarcas – populated by detail fetch
    pais: 'CL',
    niza,
    viena: [],           // Not returned by FindMarcas
    metadata: {
      numSolicitud: cell[0] ?? '',
      estadoOriginal: estadoRaw,
      tipoMarca: cell[6] ?? '',
      fileSeq: cell[8] ?? '',
      fileType: cell[9] ?? '',
    },
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const query = (searchParams.get('q') ?? '').trim()
  const type = searchParams.get('type') ?? 'nombre'   // nombre | solicitante | clase | solicitud | registro
  const matchMode = searchParams.get('match') ?? '2'  // 1=exacta 2=contenga 3=empieza 4=termina

  if (!query) {
    return NextResponse.json({ error: 'q parameter is required' }, { status: 400 })
  }

  try {
    const sessionId = await getSession()

    // Build param object – maps search type to INAPI params
    const params: Record<string, string> = {
      LastNumSol: '0',
      Hash: '',
      IDW: '',
      responseCaptcha: 'este texto no se validará',
      param1: type === 'solicitud'   ? query : '',
      param2: type === 'registro'    ? query : '',
      param3: type === 'nombre'      ? query : '',
      param4: type === 'solicitante' ? query : '',
      param5: type === 'clase'       ? query : '',
      param6: '',
      param7: '',
      param8: '',
      param9: '',
      param10: '', param11: '', param12: '', param13: '', param14: '', param15: '',
      param16: '',
      param17: matchMode,
    }

    const res = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json, text/javascript, */*',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${INAPI_BASE}/BuscarMarca.aspx`,
        'User-Agent': USER_AGENT,
        'Cookie': `ASP.NET_SessionId=${sessionId}`,
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(`INAPI responded with HTTP ${res.status}`)
    }

    const json = await res.json()
    const data = JSON.parse(json.d ?? '{}')

    if (data.ErrorMessage) {
      return NextResponse.json({ error: data.ErrorMessage }, { status: 502 })
    }

    const marcas: Marca[] = (data.Marcas ?? []).map(
      (item: { id: string; cell: string[] }) => cellToMarca(item.cell, item.id)
    )

    // Update session hash for subsequent requests within this process
    if (data.Hash) {
      // Hash rotates per request — cache the session but not the hash
    }

    return NextResponse.json(
      {
        results: marcas,
        total: marcas.length,
        source: 'inapi',
        query,
        type,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (err) {
    // Invalidate session so next request retries
    cachedSession = null
    console.error('[inapi/search] error:', err)
    return NextResponse.json(
      { error: 'Failed to query INAPI', detail: String(err) },
      { status: 502 }
    )
  }
}
