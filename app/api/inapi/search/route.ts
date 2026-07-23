import { NextResponse } from "next/server"
import { searchInapi, type InapiMatchMode, type InapiSearchType } from "@/lib/inapi/client"
import type { Marca } from "@/types/marca"

export const runtime = "nodejs"

const ALLOWED_TYPES = new Set<InapiSearchType>(["nombre", "solicitante", "clase", "clase_niza", "solicitud", "registro"])
const ALLOWED_MATCH_MODES = new Set<InapiMatchMode>(["1", "2", "3", "4"])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const rawType = (searchParams.get("type") ?? "nombre") as InapiSearchType
  const rawMatchMode = (searchParams.get("match") ?? "2") as InapiMatchMode

  if (!query) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(rawType)) {
    return NextResponse.json({ error: "Invalid INAPI search type" }, { status: 400 })
  }

  if (!ALLOWED_MATCH_MODES.has(rawMatchMode)) {
    return NextResponse.json({ error: "Invalid INAPI match mode" }, { status: 400 })
  }

  try {
    const results = (await searchInapi({
      query,
      type: rawType,
      matchMode: rawMatchMode,
    })).map(normalizeInapiStatus)

    return NextResponse.json(
      {
        results,
        total: results.length,
        source: "inapi-live",
        query,
        type: rawType,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("[inapi/search] error", error)
    return NextResponse.json(
      {
        error: "Failed to query INAPI",
        detail: String(error),
      },
      { status: 502 },
    )
  }
}

function normalizeInapiStatus(marca: Marca): Marca {
  const original = normalizeStatusText(String(marca.metadata?.estadoOriginal ?? marca.estado ?? ""))

  if (["REGISTRADA", "CONCEDIDA"].includes(original)) {
    return { ...marca, estado: "Registrada" }
  }

  if (["EN TRAMITE", "PENDIENTE", "SOLICITADA"].includes(original)) {
    return { ...marca, estado: "Pendiente" }
  }

  if (
    [
      "CADUCADO",
      "CADUCADA",
      "CANCELADO",
      "CANCELADA",
      "ANULADO",
      "ANULADA",
      "ABANDONADO",
      "ABANDONADA",
      "EXPIRADO",
      "EXPIRADA",
      "NO VIGENTE",
      "TENIDA POR NO PRESENTADA",
      "DESISTIDA",
    ].includes(original)
  ) {
    return { ...marca, estado: "No Vigente" }
  }

  if (["DENEGADA", "RECHAZADA"].includes(original)) {
    return { ...marca, estado: "Denegada" }
  }

  return marca
}

function normalizeStatusText(value: string) {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
}
