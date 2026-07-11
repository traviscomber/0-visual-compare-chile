import { NextResponse } from 'next/server'

const INAPI_BASE = 'https://buscadormarcas.inapi.cl/Marca'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Re-use session from the search route module via a shared import
// (in practice Next.js runs each route in the same process for edge/node)
let cachedSession: string | null = null
let sessionFetchedAt = 0
const SESSION_TTL_MS = 25 * 60 * 1000

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const numSolicitud = searchParams.get('numSolicitud') ?? ''
  const numeroSerie  = searchParams.get('numeroSerie')  ?? ''
  const fileSeq      = searchParams.get('fileSeq')      ?? ''
  const fileType     = searchParams.get('fileType')     ?? '1'

  if (!numSolicitud) {
    return NextResponse.json({ error: 'numSolicitud is required' }, { status: 400 })
  }

  try {
    const sessionId = await getSession()

    const params = {
      numeroSolicitud: numSolicitud,
      numeroSerie,
      FileSeq: fileSeq,
      FileType: fileType,
      Hash: '',
      IDW: '',
    }

    const res = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcaByNumeroSolicitud`, {
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

    if (!res.ok) throw new Error(`INAPI responded with HTTP ${res.status}`)

    const json = await res.json()
    const data = JSON.parse(json.d ?? '{}')

    if (data.ErrorMessage) {
      return NextResponse.json({ error: data.ErrorMessage }, { status: 502 })
    }

    return NextResponse.json(
      { detail: data, source: 'inapi' },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } }
    )
  } catch (err) {
    cachedSession = null
    console.error('[inapi/detail] error:', err)
    return NextResponse.json(
      { error: 'Failed to query INAPI detail', detail: String(err) },
      { status: 502 }
    )
  }
}
