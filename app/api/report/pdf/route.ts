import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer, Document, Page, Text, View } from "@react-pdf/renderer"
import { createElement } from "react"
import { TrademarkReportDocument } from "@/lib/pdf/trademark-report"
import path from "path"

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

// Resolve an image path to an absolute file:// URL the PDF renderer can read
function imgUrl(relativePath: string): string {
  const abs = path.join(process.cwd(), "public", relativePath)
  return `file://${abs}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const caseParam = searchParams.get("cases") ?? "all"
  const testMode = searchParams.get("test") === "1"

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
      logoPath: imgUrl("test-logos/logo-toro-bebidas.png"),
      screenshotPath: imgUrl("report-assets/toro-result.png"),
      screenshotDetailPath: imgUrl("report-assets/toro-viena.png"),
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
      logoPath: imgUrl("test-logos/logo-torito-energia.png"),
      screenshotPath: imgUrl("report-assets/torito-result.png"),
      screenshotDetailPath: imgUrl("report-assets/torito-detail.png"),
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

    const buffer = await renderToBuffer(element)

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
