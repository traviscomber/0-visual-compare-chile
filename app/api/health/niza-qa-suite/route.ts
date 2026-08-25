import { NextRequest, NextResponse } from "next/server"
import { NizaClassifier } from "@/lib/agent/niza-classifier"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type CaseResult = {
  label: string
  classes: string[]
  principals: string[]
  defensive: string[]
  model: string
  escalated: boolean
}

async function classify(label: string, nombre: string, descripcion: string): Promise<CaseResult> {
  const result = await new NizaClassifier().classify({ nombre, descripcion })
  return {
    label,
    classes: result.clases.map((item) => item.numero),
    principals: result.clases.filter((item) => item.tipo === "principal").map((item) => item.numero),
    defensive: result.clases.filter((item) => item.tipo === "defensiva").map((item) => item.numero),
    model: result.model_used,
    escalated: result.routing.escalated,
  }
}

async function previewSmoke(origin: string, descripcion: string) {
  const response = await fetch(`${origin}/api/v1/public/trademark-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "videntia-niza-qa-e2e/1.0",
    },
    body: JSON.stringify({ nombre: "VIDENTIA", actividad: descripcion }),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))
  return {
    status: response.status,
    classes: (payload.niza ?? []).map((item: { numero?: string }) => item.numero),
    contextProvided: payload.niza_context_provided ?? null,
    error: payload.error ?? null,
  }
}

function signature(classes: string[]) {
  return [...classes].sort().join(",")
}

export async function GET(request: NextRequest) {
  try {
    const videntiaDescription = "software para análisis, búsqueda y vigilancia de marcas comerciales"
    const repetitions = await Promise.all(
      Array.from({ length: 5 }, (_, index) => classify(`videntia-${index + 1}`, "VIDENTIA", videntiaDescription)),
    )

    const controls = await Promise.all([
      classify("legal", "LEXGUARD", "servicios jurídicos, asesoría legal y representación de clientes"),
      classify("saas", "CLOUDOPS", "software como servicio SaaS para análisis de datos empresariales"),
      classify("beverage", "FRESHWAVE", "bebidas no alcohólicas, jugos y aguas saborizadas"),
      classify("marketing", "GROWTHLAB", "servicios de publicidad y marketing para terceros"),
      classify("legal-tech-saas", "CASEFLOW", "software como servicio SaaS para gestión de expedientes jurídicos"),
      classify("hybrid-software", "DATAPULSE", "software como servicio SaaS y aplicación móvil descargable para análisis de datos"),
    ])

    const preview = await previewSmoke(request.nextUrl.origin, videntiaDescription)
    const signatures = repetitions.map((item) => signature(item.classes))
    const uniqueSignatures = [...new Set(signatures)]
    const allClasses = repetitions.flatMap((item) => item.classes)
    const frequency = Object.fromEntries(
      [...new Set(allClasses)].sort().map((code) => [code, allClasses.filter((item) => item === code).length]),
    )

    const assertions = {
      videntiaStableExactSet: uniqueSignatures.length === 1 && uniqueSignatures[0] === "09",
      videntiaProductSoftwareIs09: repetitions.every((item) => item.classes.includes("09") && !item.classes.includes("42")),
      videntiaNoCommercial35: repetitions.every((item) => !item.classes.includes("35")),
      videntiaNoLegal45: repetitions.every((item) => !item.classes.includes("45")),
      legalIncludes45: controls[0].classes.includes("45"),
      saasIs42Without09: controls[1].classes.includes("42") && !controls[1].classes.includes("09"),
      beverageIncludes32Without35: controls[2].classes.includes("32") && !controls[2].classes.includes("35"),
      explicitMarketingIncludes35: controls[3].classes.includes("35"),
      legalTechSaasIs42Not45: controls[4].classes.includes("42") && !controls[4].classes.includes("45") && !controls[4].classes.includes("09"),
      hybridSoftwareIncludes09And42: controls[5].classes.includes("09") && controls[5].classes.includes("42"),
      publicPreviewUsesStableNiza: preview.status === 200 && preview.contextProvided === true && signature(preview.classes) === "09",
    }

    return NextResponse.json({
      ok: Object.values(assertions).every(Boolean),
      ran_at: new Date().toISOString(),
      assertions,
      stability: {
        unique_signatures: uniqueSignatures,
        exact_set_stable: uniqueSignatures.length === 1,
        class_frequency_over_5: frequency,
        repetitions,
      },
      controls,
      preview,
    }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
