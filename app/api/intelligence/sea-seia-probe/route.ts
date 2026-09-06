import { NextRequest, NextResponse } from "next/server"

const SEA_BASE = "https://seia.sea.gob.cl"

export async function GET(request: NextRequest) {
  const query = String(request.nextUrl.searchParams.get("q") ?? "Codelco").trim().slice(0, 80)
  const actionUrl = new URL("/busqueda/buscarProyectoResumenAction.php", SEA_BASE)
  const body = new URLSearchParams({
    nombre: query,
    titular: "",
    folio: "",
    selectRegion: "",
    selectComuna: "",
    tipoPresentacion: "",
    projectStatus: "",
    PresentacionMin: "",
    PresentacionMax: "",
    CalificaMin: "",
    CalificaMax: "",
    sectores_economicos: "",
    razoningreso: "",
    id_tipoexpediente: "",
    offset: "1",
    limit: "10",
    orderColumn: "FECHA_PRESENTACION",
    orderDir: "desc",
  })

  const response = await fetch(actionUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json,text/plain,*/*",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "VIDENTIA/1.0 source-validation",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(12_000),
  })
  const buffer = await response.arrayBuffer()
  const text = new TextDecoder("iso-8859-1").decode(buffer)
  let json: any = null
  try { json = JSON.parse(text) } catch {}

  return NextResponse.json({
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    bytes: buffer.byteLength,
    totalRegistros: json?.totalRegistros ?? null,
    rows: Array.isArray(json?.data) ? json.data.slice(0, 3) : null,
    keys: Array.isArray(json?.data) && json.data[0] ? Object.keys(json.data[0]) : null,
    prefix: json ? null : text.slice(0, 1200),
  })
}
