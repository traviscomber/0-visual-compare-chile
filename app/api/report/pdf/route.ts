import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"
import { createElement, type ReactElement } from "react"
import path from "path"
import fs from "fs"
import { TrademarkReportDocument, type CaseData } from "@/lib/pdf/trademark-report"
import {
  buildResultRiskLevel,
  buildTrademarkDetailSummary,
  formatRiskLabel,
} from "@/lib/trademark-insights"
import { getTrademarkRecordById, searchTrademarkRecords } from "@/lib/trademark-records"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

function imgDataUri(relativePath: string): string {
  const abs = path.join(process.cwd(), "public", relativePath)
  try {
    const buf = fs.readFileSync(abs)
    const ext = path.extname(relativePath).toLowerCase().replace(".", "")
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png"
    return `data:${mime};base64,${buf.toString("base64")}`
  } catch {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
  }

  const trademarkId = new URL(req.url).searchParams.get("id")?.trim()
  if (!trademarkId || trademarkId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(trademarkId)) {
    return NextResponse.json(
      { error: "Identificador de marca inválido." },
      { status: 400, headers: PRIVATE_HEADERS },
    )
  }

  try {
    const liveCase = await buildLiveTrademarkCase(trademarkId)
    if (!liveCase) {
      return NextResponse.json({ error: "Marca no encontrada." }, { status: 404, headers: PRIVATE_HEADERS })
    }

    const element = createElement(TrademarkReportDocument, {
      cases: [liveCase],
      generatedAt: new Date().toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      preparedFor: `Visual Compare Chile · ${liveCase.name}`,
    })

    const buffer = await renderToBuffer(element as unknown as ReactElement<DocumentProps>)

    await supabase.from("usage_logs").insert({
      user_id: user.id,
      organization_id: null,
      action: "report.pdf.generated",
      metadata: { trademark_id: trademarkId },
    })

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="marca-${slugifyFileName(liveCase.name)}.pdf"`,
        ...PRIVATE_HEADERS,
      },
    })
  } catch (error) {
    console.error("[report-pdf] generation failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "No pudimos generar el informe." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}

async function buildLiveTrademarkCase(id: string): Promise<CaseData | null> {
  const { result: marca } = await getTrademarkRecordById(id)
  if (!marca) return null

  const relatedResponse = await searchTrademarkRecords({
    query: marca.nombre,
    type: "nombre",
    filters: {},
    page: 1,
    limit: 8,
  })

  const relatedResults = relatedResponse.results.filter((result) => result.marca.id !== marca.id).slice(0, 6)
  const summary = buildTrademarkDetailSummary(marca, relatedResults)
  const conflicts = relatedResults.map((result) => {
    const risk = buildResultRiskLevel(result, marca.nombre, "nombre")
    return {
      name: result.marca.nombre,
      score: result.relevancia,
      level: formatRiskLabel(risk).toUpperCase(),
      niza: result.marca.niza,
      country: result.marca.pais,
    }
  })

  const recommendations = [
    summary.recommendation,
    `Priorizar revisión de Niza ${marca.niza.slice(0, 3).join(", ") || "sin clase visible"} antes de registrar.`,
    conflicts.length
      ? `Documentar ${Math.min(conflicts.length, 3)} conflicto${conflicts.length > 1 ? "s" : ""} principal${conflicts.length > 1 ? "es" : ""} antes de decidir.`
      : "No hay conflictos nominales directos en esta consulta; el signo visual debe validarse por separado.",
  ]

  return {
    name: marca.nombre,
    industry: marca.niza.length ? `Clases Niza ${marca.niza.slice(0, 3).join(", ")}` : "Marca sin clase visible",
    description: `${marca.solicitante || "Titular no visible"}. Estado ${marca.estado}. Fecha visible ${marca.fecha || "sin fecha"}.`,
    risk: toPdfRisk(summary.risk),
    tokens: 0,
    cost: "no informado",
    time: "no informado",
    totalConflicts: conflicts.length,
    highConflicts: summary.criticalCount,
    mediumConflicts: summary.mediumCount,
    lowConflicts: summary.lowCount,
    analyzedCount: relatedResults.length,
    viena: marca.viena.slice(0, 8).map((code) => ({
      code,
      description: "Código Viena visible en el registro sincronizado",
      confidence: 100,
    })),
    niza: marca.niza.slice(0, 8).map((code) => ({
      class: code,
      description: "Clase visible en el registro sincronizado",
    })),
    conflicts,
    recommendations,
    nextSteps: buildNextSteps(summary.risk, marca.nombre),
    logoPath: imgDataUri("placeholder-logo.png"),
    screenshotPath: imgDataUri("images/trademark-protection.png"),
    screenshotDetailPath: imgDataUri("images/brand-comparison-hero.png"),
  }
}

function buildNextSteps(risk: "high" | "medium" | "low", name: string) {
  if (risk === "high") {
    return [
      `Detener la decisión sobre ${name} hasta revisar coexistencia con un especialista marcario.`,
      "Cruzar el signo visual en Compare y documentar diferencias defendibles.",
    ]
  }
  if (risk === "medium") {
    return [
      `Validar si ${name} puede convivir con los resultados encontrados en la misma clase.`,
      "Preparar una alternativa de nombre o ajuste visual antes de presentar.",
    ]
  }
  return [
    `Continuar con el expediente de ${name} documentando Niza y cobertura visual.`,
    "Ejecutar una comparación visual final antes de presentar el registro.",
  ]
}

function toPdfRisk(risk: "high" | "medium" | "low"): CaseData["risk"] {
  if (risk === "high") return "ALTO"
  if (risk === "medium") return "MEDIO"
  return "BAJO"
}

function slugifyFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "informe-marca"
}
