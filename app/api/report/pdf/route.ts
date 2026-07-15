import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer, Document, Page, Text, View, type DocumentProps } from "@react-pdf/renderer"
import { createElement, type ReactElement } from "react"
import { TrademarkReportDocument, type CaseData } from "@/lib/pdf/trademark-report"
import {
  buildResultRiskLevel,
  buildTrademarkDetailSummary,
  formatRiskLabel,
} from "@/lib/trademark-insights"
import { getTrademarkRecordById, searchTrademarkRecords } from "@/lib/trademark-records"
import path from "path"
import fs from "fs"

export const maxDuration = 60

// Quick smoke test — minimal doc with no images
async function renderMinimal(): Promise<Buffer> {
  const doc = createElement(Document, {},
    createElement(Page, { size: "A4" },
      createElement(View, { style: { padding: 40 } },
        createElement(Text, {}, "Visual Compare Chile — Test PDF")
      )
    )
  )
  return renderToBuffer(doc)
}

// Read an image from public/ and return a base64 data URI.
// react-pdf on Vercel serverless cannot read file:// paths reliably,
// but accepts data URIs directly.
function imgDataUri(relativePath: string): string {
  const abs = path.join(process.cwd(), "public", relativePath)
  try {
    const buf = fs.readFileSync(abs)
    const ext = path.extname(relativePath).toLowerCase().replace(".", "")
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png"
    return `data:${mime};base64,${buf.toString("base64")}`
  } catch {
    // Return a 1x1 transparent PNG data URI as fallback so the PDF still renders
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const caseParam = searchParams.get("cases") ?? "all"
  const testMode = searchParams.get("test") === "1"
  const trademarkId = searchParams.get("id")?.trim()

  if (testMode) {
    try {
      const buf = await renderMinimal()
      return new NextResponse(buf, {
        status: 200,
        headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=test.pdf" },
      })
    } catch (err) {
      return NextResponse.json({ error: "minimal test failed", detail: String(err) }, { status: 500 })
    }
  }

  if (trademarkId) {
    try {
      const liveCase = await buildLiveTrademarkCase(trademarkId)

      if (!liveCase) {
        return NextResponse.json({ error: "Trademark not found" }, { status: 404 })
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

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="marca-${slugifyFileName(liveCase.name)}.pdf"`,
          "Cache-Control": "no-store",
        },
      })
    } catch (err) {
      const stack = err instanceof Error ? err.stack : String(err)
      console.error("[v0] live PDF generation error:", stack)
      return NextResponse.json(
        { error: "Error generating live PDF", detail: String(err), stack },
        { status: 500 },
      )
    }
  }

  // ─── Hard-coded demo data from the two real test runs ───────────────────
  const allCases = [
    {
      name: "TORO BEBIDAS",
      industry: "Bebidas / Alimentación",
      description:
        "Empresa chilena de bebidas naturales y jugos. Marca TORO para jugos y bebidas no alcohólicas en Chile.",
      risk: "BAJO" as const,
      tokens: 4367,
      cost: "$0.0437",
      time: "8.9s",
      totalConflicts: 3,
      highConflicts: 0,
      mediumConflicts: 0,
      lowConflicts: 3,
      analyzedCount: 11,
      viena: [
        { code: "03.02.02", description: "Toros y bovinos estilizados", confidence: 95 },
        { code: "26.03.01", description: "Círculos simples", confidence: 95 },
        { code: "27.01.01", description: "Letras latinas mayúsculas (tipografía estándar)", confidence: 90 },
        { code: "27.01.04", description: "Letras latinas minúsculas (tipografía estándar)", confidence: 90 },
      ],
      niza: [
        { class: "32", description: "Cervezas, aguas minerales, jugos y bebidas no alcohólicas" },
        { class: "35", description: "Publicidad, gestión comercial, administración de empresas" },
      ],
      conflicts: [
        { name: "LOGO MATCH", score: 22, level: "BAJO", niza: ["35"], country: "CL" },
        { name: "VISUAL AI", score: 18, level: "BAJO", niza: ["09", "42"], country: "CL" },
        { name: "TECH SEARCH", score: 16, level: "BAJO", niza: ["42"], country: "CL" },
      ],
      recommendations: [
        "Proceder con el registro de la marca en la clase 32, que es la principal.",
        "Considerar el registro en la clase 35 para protección defensiva, a pesar de los conflictos menores.",
        "Monitorear el estado de la marca 'LOGO MATCH' en Chile para anticipar cualquier posible conflicto futuro.",
      ],
      nextSteps: [
        "Iniciar el proceso de registro de la marca 'TORO BEBIDAS' en la clase 32.",
        "Evaluar la necesidad de registro en la clase 35 y proceder si se considera estratégico.",
      ],
      logoPath: imgDataUri("test-logos/logo-toro-bebidas.png"),
      screenshotPath: imgDataUri("report-assets/toro-result.png"),
      screenshotDetailPath: imgDataUri("report-assets/toro-viena.png"),
    },
    {
      name: "TORITO ENERGIA",
      industry: "Bebidas energéticas / Alimentación",
      description:
        "Empresa chilena de bebidas energéticas. Marca TORITO para bebidas energizantes y suplementos deportivos en Chile.",
      risk: "MEDIO" as const,
      tokens: 4571,
      cost: "$0.0457",
      time: "5.9s",
      totalConflicts: 8,
      highConflicts: 0,
      mediumConflicts: 2,
      lowConflicts: 6,
      analyzedCount: 11,
      viena: [
        { code: "03.02.02", description: "Toros y bovinos estilizados", confidence: 92 },
        { code: "26.05.01", description: "Pentágonos, hexágonos y polígonos", confidence: 88 },
        { code: "27.01.01", description: "Letras latinas mayúsculas (tipografía estándar)", confidence: 90 },
      ],
      niza: [
        { class: "32", description: "Cervezas, aguas minerales, jugos y bebidas no alcohólicas" },
        { class: "35", description: "Publicidad, gestión comercial, administración de empresas" },
        { class: "41", description: "Educación, entretenimiento, actividades deportivas y culturales" },
      ],
      conflicts: [
        { name: "EL TORO ENERGY", score: 68, level: "MEDIO", niza: ["32", "35"], country: "MX" },
        { name: "TORITO ROJO", score: 61, level: "MEDIO", niza: ["32"], country: "CL" },
        { name: "TORO", score: 44, level: "BAJO", niza: ["32", "33"], country: "CL" },
        { name: "TORO ROJO", score: 38, level: "BAJO", niza: ["32"], country: "AT" },
        { name: "BULL POWER", score: 28, level: "BAJO", niza: ["32"], country: "US" },
        { name: "BEBIDAS CAMPO", score: 18, level: "BAJO", niza: ["29", "30", "32"], country: "CL" },
        { name: "LOGO MATCH", score: 17, level: "BAJO", niza: ["35"], country: "CL" },
        { name: "VISUAL AI", score: 15, level: "BAJO", niza: ["09", "42"], country: "CL" },
      ],
      recommendations: [
        "Realizar un análisis detallado de los conflictos más relevantes ('EL TORO ENERGY' y 'TORITO ROJO') para evaluar la posibilidad de coexistencia.",
        "Considerar la modificación de elementos visuales o denominativos de la marca para reducir similitudes con las marcas conflictivas.",
        "Consultar con un abogado especializado en propiedad intelectual para explorar opciones de negociación o acuerdos con titulares de marcas conflictivas.",
      ],
      nextSteps: [
        "Solicitar un informe de viabilidad de registro con un experto en propiedad intelectual.",
        "Evaluar la posibilidad de rebranding o ajustes en el diseño de la marca para minimizar riesgos.",
      ],
      logoPath: imgDataUri("test-logos/logo-torito-energia.png"),
      screenshotPath: imgDataUri("report-assets/torito-result.png"),
      screenshotDetailPath: imgDataUri("report-assets/torito-detail.png"),
    },
  ]

  const cases = caseParam === "1" ? [allCases[0]] : caseParam === "2" ? [allCases[1]] : allCases

  try {
    const element = createElement(TrademarkReportDocument, {
      cases,
      generatedAt: new Date().toLocaleDateString("es-CL", {
        day: "2-digit", month: "long", year: "numeric",
      }),
      preparedFor: "Visual Compare Chile — Demo",
    })

    const buffer = await renderToBuffer(element as unknown as ReactElement<DocumentProps>)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="informe-marcas-visualcompare-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const stack = err instanceof Error ? err.stack : String(err)
    console.error("[v0] PDF generation error:", stack)
    return NextResponse.json(
      { error: "Error generating PDF", detail: String(err), stack },
      { status: 500 }
    )
  }
}

async function buildLiveTrademarkCase(id: string): Promise<CaseData | null> {
  const { result: marca } = await getTrademarkRecordById(id)

  if (!marca) {
    return null
  }

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

  const solicitanteLabel = marca.solicitante || "Titular no visible"
  const nextSteps = buildNextSteps(summary.risk, marca.nombre)
  const recommendations = [
    summary.recommendation,
    `Priorizar revision de Niza ${marca.niza.slice(0, 3).join(", ") || "sin clase visible"} antes de registrar.`,
    conflicts.length
      ? `Documentar ${Math.min(conflicts.length, 3)} conflicto${conflicts.length > 1 ? "s" : ""} principal${conflicts.length > 1 ? "es" : ""} antes de decidir.`
      : "No hay conflictos nominales directos en esta corrida, pero el logo igual debe validarse en Compare.",
  ]

  return {
    name: marca.nombre,
    industry: marca.niza.length ? `Clases Niza ${marca.niza.slice(0, 3).join(", ")}` : "Marca sin clase visible",
    description: `${solicitanteLabel}. Estado ${marca.estado}. Fecha visible ${marca.fecha || "sin fecha"}.`,
    risk: toPdfRisk(summary.risk),
    tokens: 0,
    cost: "base sync",
    time: "sync",
    totalConflicts: conflicts.length,
    highConflicts: summary.criticalCount,
    mediumConflicts: summary.mediumCount,
    lowConflicts: summary.lowCount,
    analyzedCount: relatedResults.length,
    viena: marca.viena.slice(0, 8).map((code) => ({
      code,
      description: "Codigo Viena visible en el registro sincronizado",
      confidence: 100,
    })),
    niza: marca.niza.slice(0, 8).map((code) => ({
      class: code,
      description: "Clase prioritaria detectada en la base sincronizada",
    })),
    conflicts,
    recommendations,
    nextSteps,
    logoPath: imgDataUri("placeholder-logo.png"),
    screenshotPath: imgDataUri("images/trademark-protection.png"),
    screenshotDetailPath: imgDataUri("images/brand-comparison-hero.png"),
  }
}

function buildNextSteps(risk: "high" | "medium" | "low", name: string) {
  if (risk === "high") {
    return [
      `Detener el registro de ${name} hasta revisar coexistencia con un abogado marcario.`,
      "Cruzar el signo visual en Compare y documentar diferencias defendibles.",
    ]
  }

  if (risk === "medium") {
    return [
      `Validar si ${name} puede convivir con los resultados encontrados en la misma clase.`,
      "Preparar alternativa de nombre o ajuste visual antes de presentar.",
    ]
  }

  return [
    `Continuar con el expediente de ${name} documentando Niza y cobertura visual.`,
    "Ejecutar una comparacion visual final antes de enviar el registro.",
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
