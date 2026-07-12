import type { Marca } from "@/types/marca"

const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const SESSION_TTL_MS = 25 * 60 * 1000

export type InapiSearchType = "nombre" | "solicitante" | "clase" | "solicitud" | "registro"
export type InapiMatchMode = "1" | "2" | "3" | "4"

interface InapiSearchOptions {
  query: string
  type?: InapiSearchType
  matchMode?: InapiMatchMode
}

interface InapiMarcaPayload {
  id: string
  cell: string[]
}

interface InapiFindMarcasPayload {
  ErrorMessage?: string
  Hash?: string
  Marcas?: InapiMarcaPayload[]
}

let cachedSession: string | null = null
let sessionFetchedAt = 0

export async function searchInapi({
  query,
  type = "nombre",
  matchMode = "2",
}: InapiSearchOptions): Promise<Marca[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const sessionId = await getSession()
  const payload = await requestInapi({
    query: trimmedQuery,
    type,
    matchMode,
    sessionId,
  })

  return (payload.Marcas ?? []).map((item) => cellToMarca(item.cell, item.id))
}

async function requestInapi({
  query,
  type,
  matchMode,
  sessionId,
}: {
  query: string
  type: InapiSearchType
  matchMode: InapiMatchMode
  sessionId: string
}): Promise<InapiFindMarcasPayload> {
  const params: Record<string, string> = {
    LastNumSol: "0",
    Hash: "",
    IDW: "",
    responseCaptcha: "skip-captcha-for-agent-sync",
    param1: type === "solicitud" ? query : "",
    param2: type === "registro" ? query : "",
    param3: type === "nombre" ? query : "",
    param4: type === "solicitante" ? query : "",
    param5: type === "clase" ? query : "",
    param6: "",
    param7: "",
    param8: "",
    param9: "",
    param10: "",
    param11: "",
    param12: "",
    param13: "",
    param14: "",
    param15: "",
    param16: "",
    param17: matchMode,
  }

  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json, text/javascript, */*",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${INAPI_BASE}/BuscarMarca.aspx`,
      "User-Agent": USER_AGENT,
      Cookie: `ASP.NET_SessionId=${sessionId}`,
    },
    body: JSON.stringify(params),
    cache: "no-store",
  })

  if (!response.ok) {
    cachedSession = null
    throw new Error(`INAPI responded with HTTP ${response.status}`)
  }

  const json = await response.json()
  const data = JSON.parse(json.d ?? "{}") as InapiFindMarcasPayload

  if (data.ErrorMessage) {
    throw new Error(data.ErrorMessage)
  }

  return data
}

async function getSession(): Promise<string> {
  const now = Date.now()
  if (cachedSession && now - sessionFetchedAt < SESSION_TTL_MS) {
    return cachedSession
  }

  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  })

  let sessionId: string | null = null

  if (typeof (response.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function") {
    const cookies = (response.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
    for (const cookie of cookies) {
      const match = cookie.match(/ASP\.NET_SessionId=([^;]+)/)
      if (match) {
        sessionId = match[1]
        break
      }
    }
  }

  if (!sessionId) {
    const setCookie = response.headers.get("set-cookie") ?? ""
    const match = setCookie.match(/ASP\.NET_SessionId=([^;]+)/)
    if (match) {
      sessionId = match[1]
    }
  }

  if (!sessionId) {
    throw new Error(`Could not obtain INAPI session (status ${response.status})`)
  }

  cachedSession = sessionId
  sessionFetchedAt = now
  return sessionId
}

function cellToMarca(cell: string[], id: string): Marca {
  const niza = (cell[2] ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  const estadoOriginal = normalizeText(cell[5] ?? "")
  const estado = estadoOriginal === "En Trámite" || estadoOriginal === "Pendiente"
    ? "Pendiente"
    : estadoOriginal === "Registrada"
      ? "Registrada"
      : "Denegada"

  return {
    id,
    nombre: normalizeText(cell[3] ?? ""),
    solicitante: normalizeText(cell[4] ?? ""),
    numeroRegistro: normalizeText(cell[1] ?? ""),
    estado,
    fecha: "",
    pais: "CL",
    niza,
    viena: [],
    metadata: {
      source: "inapi",
      numSolicitud: normalizeText(cell[0] ?? ""),
      estadoOriginal,
      tipoMarca: normalizeText(cell[6] ?? ""),
      subtipoMarca: normalizeText(cell[7] ?? ""),
      fileSeq: normalizeText(cell[8] ?? ""),
      fileType: normalizeText(cell[9] ?? ""),
    },
  }
}

function normalizeText(value: string) {
  return value
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/TrÃ¡mite/g, "Trámite")
    .trim()
}
