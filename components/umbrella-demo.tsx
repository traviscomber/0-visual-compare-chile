"use client"

import { type KeyboardEvent, useRef, useState } from "react"
import Link from "next/link"
import type { PublicLocale } from "@/lib/marketing-locale"

const copy = {
  en: {
    note: "Illustrative interface · not live data",
    dimension: "Evidence dimension",
    explainer: "This panel explains the analysis structure. Open the selected vertical for live or preliminary product behavior.",
    views: {
      trademarks: { label: "TRADEMARKS", queryLabel: "BRAND QUERY", query: "N3URALIA", rows: ["Name similarity", "Visual similarity", "Class overlap"], href: "/trademarks", cta: "OPEN TRADEMARK INTELLIGENCE" },
      patents: { label: "PATENTS", queryLabel: "INVENTION QUERY", query: "Lithium battery separator", rows: ["Prior-art relationship", "IPC context", "Applicant activity"], href: "/patents#patent-preview-search", cta: "TRY PATENT SEARCH" },
      technologies: { label: "TECHNOLOGIES", queryLabel: "TECHNOLOGY WATCH", query: "Nanobubbles · Aquaculture", rows: ["Research signals", "Patent activity", "Company activity"], href: "/technologies", cta: "OPEN TECHNOLOGY INTELLIGENCE" },
    },
  },
  es: {
    note: "Interfaz ilustrativa · no son datos en vivo",
    dimension: "Dimensión de evidencia",
    explainer: "Este panel explica la estructura de análisis. Abre la vertical seleccionada para entrar al comportamiento real o preliminar del producto.",
    views: {
      trademarks: { label: "MARCAS", queryLabel: "CONSULTA DE MARCA", query: "N3URALIA", rows: ["Similitud denominativa", "Similitud visual", "Superposición de clases"], href: "/es/marcas", cta: "ABRIR INTELIGENCIA DE MARCAS" },
      patents: { label: "PATENTES", queryLabel: "CONSULTA DE INVENCIÓN", query: "Separador para batería de litio", rows: ["Relación con estado del arte", "Contexto IPC", "Actividad del solicitante"], href: "/es/patentes#patent-preview-search", cta: "PROBAR BÚSQUEDA DE PATENTES" },
      technologies: { label: "TECNOLOGÍAS", queryLabel: "VIGILANCIA TECNOLÓGICA", query: "Nanoburbujas · Acuicultura", rows: ["Señales de investigación", "Actividad de patentes", "Actividad empresarial"], href: "/es/tecnologias", cta: "ABRIR INTELIGENCIA TECNOLÓGICA" },
    },
  },
} as const

type DemoView = "trademarks" | "patents" | "technologies"
const demoKeys: DemoView[] = ["trademarks", "patents", "technologies"]
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091A20]"

export function UmbrellaDemo({ locale = "en" }: { locale?: PublicLocale }) {
  const [active, setActive] = useState<DemoView>("trademarks")
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const t = copy[locale]
  const view = t.views[active]

  const activateTab = (index: number) => {
    setActive(demoKeys[index])
    tabRefs.current[index]?.focus()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % demoKeys.length
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + demoKeys.length) % demoKeys.length
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = demoKeys.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    activateTab(nextIndex)
  }

  return (
    <div className="border-y border-[#294047] bg-[#091A20]">
      <div className="flex flex-col gap-4 border-b border-[#294047] px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-5">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-medium tracking-[0.08em] text-[#96B5A6]" role="tablist" aria-label="VIDENTIA demo vertical">
          {demoKeys.map((key, index) => (
            <button
              key={key}
              ref={(node) => { tabRefs.current[index] = node }}
              id={`videntia-demo-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={active === key}
              aria-controls={`videntia-demo-panel-${key}`}
              tabIndex={active === key ? 0 : -1}
              onClick={() => setActive(key)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`min-h-11 border-b py-2 text-left transition-colors duration-150 ${focusRing} ${active === key ? "border-[#96B5A6] text-white" : "border-transparent text-[#879A97] hover:text-white"}`}
            >
              {t.views[key].label}
            </button>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-[0.1em] text-[#879A97]">{t.note}</span>
      </div>

      <div id={`videntia-demo-panel-${active}`} role="tabpanel" aria-labelledby={`videntia-demo-tab-${active}`} tabIndex={0} className={`px-5 py-7 sm:px-8 sm:py-10 ${focusRing}`}>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#879A97]">{view.queryLabel}</p>
        <p className="mt-3 text-[clamp(1.8rem,8vw,2.7rem)] font-light tracking-[-0.035em] text-[#E7DFCE]">{view.query}</p>

        <div className="mt-7 border-y border-[#294047] sm:mt-8 sm:grid sm:grid-cols-3">
          {view.rows.map((label, index) => (
            <div key={label} className="border-b border-[#294047] py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
              <span className="text-[11px] text-[#587A94]">0{index + 1}</span>
              <p className="mt-3 text-[13px] leading-5 tracking-[0.04em] text-[#E7DFCE]">{label}</p>
              <p className="mt-2 text-[12px] text-[#879A97]">{t.dimension}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[13px] leading-6 text-[#879A97]">{t.explainer}</p>
          <Link href={view.href} className={`inline-flex min-h-12 shrink-0 items-center justify-center border border-[#4A7F74] px-4 text-[11px] font-medium tracking-[0.065em] text-white transition-colors duration-150 hover:border-[#96B5A6] hover:text-[#96B5A6] ${focusRing}`}>{view.cta}</Link>
        </div>
      </div>
    </div>
  )
}
