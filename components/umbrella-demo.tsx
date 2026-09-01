"use client"

import { type KeyboardEvent, useRef, useState } from "react"
import Link from "next/link"

const demoViews = {
  trademarks: {
    label: "TRADEMARKS",
    queryLabel: "BRAND QUERY",
    query: "N3URALIA",
    rows: ["Name similarity", "Visual similarity", "Class overlap"],
    href: "/trademarks",
    cta: "OPEN TRADEMARK INTELLIGENCE",
  },
  patents: {
    label: "PATENTS",
    queryLabel: "INVENTION QUERY",
    query: "Lithium battery separator",
    rows: ["Prior-art relationship", "IPC context", "Applicant activity"],
    href: "/patents#patent-preview-search",
    cta: "TRY PATENT SEARCH",
  },
  technologies: {
    label: "TECHNOLOGIES",
    queryLabel: "TECHNOLOGY WATCH",
    query: "Nanobubbles · Aquaculture",
    rows: ["Research signals", "Patent activity", "Company activity"],
    href: "/technologies",
    cta: "OPEN TECHNOLOGY INTELLIGENCE",
  },
} as const

type DemoView = keyof typeof demoViews

const demoKeys = Object.keys(demoViews) as DemoView[]
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091A20]"

export function UmbrellaDemo() {
  const [active, setActive] = useState<DemoView>("trademarks")
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const view = demoViews[active]

  const activateTab = (index: number) => {
    const next = demoKeys[index]
    setActive(next)
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
    <div className="bg-[#091A20] p-7 sm:p-10">
      <div className="flex flex-col gap-4 border-b border-[#294047] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-5 text-[10px] font-medium tracking-[0.1em] text-[#96B5A6]" role="tablist" aria-label="VIDENTIA demo vertical">
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
              className={`border-b py-1 text-left ${focusRing} ${active === key ? "border-[#96B5A6] text-white" : "border-transparent hover:text-white"}`}
            >
              {demoViews[key].label}
            </button>
          ))}
        </div>
        <span className="text-[9px] uppercase tracking-[0.12em] text-[#738180]">Illustrative interface · not live data</span>
      </div>

      <div
        id={`videntia-demo-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`videntia-demo-tab-${active}`}
        tabIndex={0}
        className={focusRing}
      >
        <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-[#7F918F]">{view.queryLabel}</p>
        <p className="mt-3 text-3xl font-light tracking-[-0.04em] text-[#E7DFCE]">{view.query}</p>

        <div className="mt-9 grid gap-px bg-[#294047] sm:grid-cols-3">
          {view.rows.map((label, index) => (
            <div key={label} className="bg-[#13272D] p-5">
              <span className="text-[10px] text-[#456E8E]">0{index + 1}</span>
              <p className="mt-5 text-xs tracking-[0.08em] text-[#E7DFCE]">{label}</p>
              <p className="mt-3 text-sm text-[#96B5A6]">Evidence dimension</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-6 text-[#7F918F]">This panel explains the analysis structure. Open the selected vertical for live or preliminary product behavior.</p>
          <Link href={view.href} className={`inline-block shrink-0 bg-[#4A7F74] px-5 py-3.5 text-xs font-medium tracking-[0.06em] text-white ${focusRing}`}>{view.cta}</Link>
        </div>
      </div>
    </div>
  )
}
