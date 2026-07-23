const INAPI_BASE = "https://buscadormarcas.inapi.cl/Marca"
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const SESSION_TTL_MS = 25 * 60 * 1000
const VIENA_CODE_PATTERN = /\b\d{2}\.\d{2}\.\d{2}\b/g

let cachedSession: string | null = null
let sessionFetchedAt = 0

export interface InapiDetailLookup {
  numSolicitud: string
  numeroSerie?: string | null
  fileSeq?: string | null
  fileType?: string | null
}

export async function fetchInapiTrademarkDetail({
  numSolicitud,
  numeroSerie,
  fileSeq,
  fileType,
}: InapiDetailLookup): Promise<Record<string, unknown>> {
  const normalizedNumSolicitud = normalizeTextValue(numSolicitud)
  if (!normalizedNumSolicitud) {
    throw new Error("Missing numSolicitud for INAPI detail lookup")
  }

  const sessionId = await getSession()
  const params = {
    numeroSolicitud: normalizedNumSolicitud,
    numeroSerie: normalizeTextValue(numeroSerie),
    FileSeq: normalizeTextValue(fileSeq),
    FileType: normalizeTextValue(fileType) || "1",
    Hash: "",
    IDW: "",
  }

  const response = await fetch(`${INAPI_BASE}/BuscarMarca.aspx/FindMarcaByNumeroSolicitud`, {
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
    throw new Error(`INAPI detail responded with HTTP ${response.status}`)
  }

  const json = await response.json()
  const payload = JSON.parse(json.d ?? "{}") as Record<string, unknown> & { ErrorMessage?: string }

  if (payload.ErrorMessage) {
    throw new Error(String(payload.ErrorMessage))
  }

  return payload
}

export function extractVienaCodesFromInapiDetail(detail: unknown): string[] {
  const found = new Set<string>()
  visitValue(detail, found)
  return [...found].sort()
}

export function isInapiRateLimitError(error: unknown): boolean {
  const message = String(error ?? "").toLowerCase()
  return message.includes("excedido el limite") || message.includes("limite de consultas disponibles")
}

function visitValue(value: unknown, found: Set<string>) {
  if (typeof value === "string") {
    const matches = value.match(VIENA_CODE_PATTERN)
    if (matches) {
      for (const match of matches) {
        found.add(match)
      }
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      visitValue(item, found)
    }
    return
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      visitValue(nested, found)
    }
  }
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

  const setCookie = response.headers.get("set-cookie") ?? ""
  const match = setCookie.match(/ASP\.NET_SessionId=([^;]+)/)
  if (!match) {
    throw new Error(`Could not obtain INAPI session (status ${response.status})`)
  }

  cachedSession = match[1]
  sessionFetchedAt = now
  return cachedSession
}

function normalizeTextValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : ""
}
