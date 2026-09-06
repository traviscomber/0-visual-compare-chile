import { NextRequest, NextResponse } from "next/server"

const SEA_BASE = "https://seia.sea.gob.cl"

export async function GET(request: NextRequest) {
  const query = String(request.nextUrl.searchParams.get("q") ?? "Codelco").trim().slice(0, 80)
  const url = new URL("/busqueda/buscarProyectoResumen.php", SEA_BASE)
  url.searchParams.set("nombre", query)

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 source-validation",
    },
    signal: AbortSignal.timeout(12_000),
  })
  const html = await response.text()

  const markers = [
    "Cargando...",
    "buscarProyectoAction.php",
    "buscarProyectoActionExcel.php",
    "id_expediente=",
    "Nombre del Proyecto",
    query,
  ]

  return NextResponse.json({
    ok: response.ok,
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    htmlBytes: Buffer.byteLength(html),
    markers: Object.fromEntries(markers.map(marker => [marker, html.toLowerCase().includes(marker.toLowerCase())])),
    scripts: [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map(match => match[1]).slice(0, 20),
    endpoints: [...new Set([...html.matchAll(/(?:https?:\/\/[^"'\s<>]+|\/[A-Za-z0-9_./?=&%-]+\.php[^"'\s<>]*)/g)].map(match => match[0]).filter(value => /busqueda|proyecto|ajax|xhr/i.test(value)))].slice(0, 40),
  })
}
