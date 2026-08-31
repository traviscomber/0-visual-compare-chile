"use client"

import { useState } from "react"
import type { PublicLocale } from "@/lib/marketing-locale"

type Mode = "brand" | "patent" | "technology"

const demoCopy = {
  es: {
    brand: {
      label: "MARCA",
      subject: "N3URALIA",
      summary: "Compara identidad, clases y antecedentes antes de decidir.",
      outputs: ["marcas similares", "solapamiento Niza", "señales de similitud", "fuente oficial"],
    },
    patent: {
      label: "PATENTE",
      subject: "Oxigenación con nanoburbujas",
      summary: "Organiza antecedentes técnicos que requieren revisión más cercana.",
      outputs: ["familias / antecedentes", "similitud técnica", "estado observado", "prioridades y evidencia"],
    },
    technology: {
      label: "TECNOLOGÍA",
      subject: "Nanoburbujas · Acuicultura",
      summary: "Sintetiza investigación, patentes, actores y señales de mercado.",
      outputs: ["patentes", "papers", "empresas", "señales comerciales"],
    },
    eyebrow: "DEMO DE PRODUCTO",
    title: "El mismo sistema. Tres formas de preguntar.",
    source: "EVIDENCIA",
    readout: "LECTURA",
  },
  en: {
    brand: {
      label: "BRAND",
      subject: "N3URALIA",
      summary: "Compare identity, classes and prior rights before deciding.",
      outputs: ["similar trademarks", "Nice overlap", "similarity signals", "official source"],
    },
    patent: {
      label: "PATENT",
      subject: "Nanobubble oxygenation",
      summary: "Organize technical prior art that deserves closer review.",
      outputs: ["families / prior art", "technical similarity", "observed status", "priorities and evidence"],
    },
    technology: {
      label: "TECHNOLOGY",
      subject: "Nanobubbles · Aquaculture",
      summary: "Synthesize research, patents, actors and market signals.",
      outputs: ["patents", "papers", "companies", "commercial signals"],
    },
    eyebrow: "PRODUCT DEMO",
    title: "The same system. Three ways to ask.",
    source: "EVIDENCE",
    readout: "READOUT",
  },
} as const

function DemoSymbol({ mode }: { mode: Mode }) {
  if (mode === "brand") {
    return (
      <div className="relative h-24 w-32" aria-hidden="true">
        <span className="absolute left-1 top-3 h-16 w-16 bg-[#4A7F74]" />
        <span className="absolute left-10 top-3 h-16 w-16 rounded-full border-[14px] border-[#96B5A6]" />
      </div>
    )
  }
  if (mode === "patent") {
    return (
      <div className="relative h-24 w-32" aria-hidden="true">
        <span className="absolute left-1 top-2 h-20 w-24 border-[10px] border-[#20393A]" />
        <span className="absolute left-7 top-7 h-12 w-20 border-[10px] border-[#4A7F74]" />
        <span className="absolute left-[58px] top-[38px] h-8 w-8 bg-[#96B5A6]" />
      </div>
    )
  }
  return (
    <div className="relative h-24 w-32" aria-hidden="true">
      <span className="absolute left-0 top-3 h-3 w-3 rounded-full bg-[#96B5A6]" />
      <span className="absolute left-0 top-10 h-3 w-3 rounded-full bg-[#4A7F74]" />
      <span className="absolute left-0 top-[68px] h-3 w-3 rounded-full bg-[#456E8E]" />
      <span className="absolute left-4 top-[19px] h-px w-16 rotate-[18deg] bg-[#456E8E]" />
      <span className="absolute left-4 top-[45px] h-px w-16 bg-[#4A7F74]" />
      <span className="absolute left-4 top-[70px] h-px w-16 -rotate-[18deg] bg-[#96B5A6]" />
      <span className="absolute right-2 top-7 h-12 w-12 rounded-full border-[10px] border-[#96B5A6]" />
    </div>
  )
}

export function PublicIntelligenceDemo({ locale }: { locale: PublicLocale }) {
  const [mode, setMode] = useState<Mode>("brand")
  const copy = demoCopy[locale]
  const current = copy[mode]
  const modes: Mode[] = ["brand", "patent", "technology"]

  return (
    <section className="border-y border-[#294047] bg-[#091A20] px-5 py-24 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-[1480px]">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{copy.eyebrow}</p>
        <div className="mt-4 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2 className="max-w-3xl text-[clamp(2.7rem,5vw,5.2rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE]">{copy.title}</h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.eyebrow}>
            {modes.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                onClick={() => setMode(item)}
                className={`min-h-10 px-4 text-xs font-medium tracking-[0.08em] transition-colors ${mode === item ? "bg-[#4A7F74] text-white" : "bg-[#13272D] text-[#BDBEBD] hover:bg-[#172F34] hover:text-white"}`}
              >
                {copy[item].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid border-y border-[#294047] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="flex min-h-[320px] flex-col justify-between border-b border-[#294047] py-8 lg:border-b-0 lg:border-r lg:py-10 lg:pr-12">
            <DemoSymbol mode={mode} />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#7F918F]">{current.label}</p>
              <h3 className="mt-3 text-3xl font-light tracking-[-0.035em] text-[#E7DFCE] sm:text-4xl">{current.subject}</h3>
              <p className="mt-4 max-w-lg text-sm leading-7 text-[#BDBEBD]">{current.summary}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2">
            <div className="border-b border-[#294047] py-8 md:border-b-0 md:border-r md:px-10 md:py-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">{copy.source}</p>
              <div className="mt-7 space-y-5">
                {current.outputs.map((output, index) => (
                  <div key={output} className="flex items-center gap-4 border-b border-[#20363E] pb-4 last:border-b-0">
                    <span className="grid h-8 w-8 shrink-0 place-items-center bg-[#13272D] text-[10px] text-[#96B5A6]">0{index + 1}</span>
                    <span className="text-sm text-white">{output}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="py-8 md:px-10 md:py-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">{copy.readout}</p>
              <div className="mt-7 space-y-6">
                {[
                  locale === "es" ? "QUÉ CAMBIÓ" : "WHAT CHANGED",
                  locale === "es" ? "POR QUÉ IMPORTA" : "WHY IT MATTERS",
                  locale === "es" ? "EVIDENCIA" : "EVIDENCE",
                  locale === "es" ? "QUÉ REVISAR" : "WHAT TO REVIEW",
                ].map((label, index) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className={`h-2.5 w-2.5 ${index === 0 ? "rounded-full bg-[#96B5A6]" : index === 1 ? "bg-[#4A7F74]" : index === 2 ? "rotate-45 bg-[#456E8E]" : "rounded-full border-2 border-[#96B5A6]"}`} />
                    <span className="text-xs font-medium tracking-[0.1em] text-[#E7DFCE]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
