import { NextRequest, NextResponse } from "next/server"

const SEA_BASE = "https://seia.sea.gob.cl"

export async function GET(request: NextRequest) {
  const query = String(request.nextUrl.searchParams.get("q") ?? "Codelco").trim().slice(0, 80)
  const summaryUrl = new URL("/busqueda/buscarProyectoResumen.php", SEA_BASE)
  summaryUrl.searchParams.set("nombre", query)

  const summaryResponse = await fetch(summaryUrl, {
    cache: "no-store",
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "VIDENTIA/1.0 source-validation",
    },
    signal: AbortSignal.timeout(12_000),
  })
  const html = await summaryResponse.text()

  const actionUrl = new URL("/busqueda/buscarProyectoResumenAction.php", SEA_BASE)
  actionUrl.searchParams.set("nombre", query)
  actionUrl.searchParams.set("draw", "1")
  actionUrl.searchParams.set("start", "0")
  actionUrl.searchParams.set("length", "10")

  const actionResponse = await fetch(actionUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: summaryUrl.toString(),
      "User-Agent": "VIDENTIA/1.0 source-validation",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(12_000),
  })
  const actionText = await actionResponse.text()
  let actionJson: unknown = null
  try { actionJson = JSON.parse(actionText) } catch {}

  return NextResponse.json({
    summary: {
      ok: summaryResponse.ok,
      status: summaryResponse.status,
      finalUrl: summaryResponse.url,
      contentType: summaryResponse.headers.get("content-type"),
      htmlBytes: Buffer.byteLength(html),
      endpointPresent: html.includes("buscarProyectoResumenAction.php"),
    },
    action: {
      ok: actionResponse.ok,
      status: actionResponse.status,
      finalUrl: actionResponse.url,
      contentType: actionResponse.headers.get("content-type"),
      bytes: Buffer.byteLength(actionText),
      json: actionJson,
      prefix: actionJson ? null : actionText.slice(0, 1200),
    },
  })
}
