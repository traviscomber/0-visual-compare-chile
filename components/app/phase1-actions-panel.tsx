"use client"

import { TerminalSquare } from "lucide-react"
import type { Phase1StatusPayload } from "@/lib/phase1-status"

type Variant = "light" | "dark"

export function Phase1ActionsPanel({
  actions,
  variant = "light",
  compact = false,
}: {
  actions: Phase1StatusPayload["actions"] | null
  variant?: Variant
  compact?: boolean
}) {
  const items = [
    {
      label: "INAPI",
      description: "Planificación o evidencia siguiente según la cobertura vigente.",
      value: actions?.nextInapiCommand ?? "pnpm plan:inapi --maxJobs 25",
    },
    {
      label: "Quota fixture",
      description: "Fixture controlado para validar límites sin tocar credenciales comerciales.",
      value: actions?.quotaFixtureCommand ?? "pnpm fixture:api-key --organizationId <uuid> --quotaDaily 2 --quotaMonthly 10",
    },
    {
      label: "Evidencia",
      description: "Genera evidencia operativa de la ingestión INAPI.",
      value: actions?.evidenceCommand ?? "pnpm evidence:inapi",
    },
    {
      label: "Quota verify",
      description: "Verifica el comportamiento de cuota contra un deployment explícito.",
      value:
        actions?.quotaVerifyCommand ??
        "QUOTA_VERIFY_API_KEY=sc_xxx QUOTA_VERIFY_BASE_URL=https://v0-visual-compare-chile.vercel.app pnpm verify:quota",
    },
  ]

  const surfaceClass = variant === "dark" ? "bg-[#091A20]" : "bg-[#0D222A]"

  return (
    <section className={`overflow-hidden border border-[#294047] ${surfaceClass}`} aria-labelledby="phase1-runbook-title">
      <header className="border-b border-[#294047] px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <TerminalSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" strokeWidth={1.6} aria-hidden="true" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#96B5A6]">Runbook Phase1</p>
            <h3 id="phase1-runbook-title" className="mt-1 text-base font-medium text-[#E7DFCE]">
              Comandos operativos verificables
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#8F9A98]">
              {compact
                ? "Comandos directos para cerrar evidencia operativa de Fase 1."
                : "Referencia explícita para planificación, evidencia y verificación de cuota. Estos comandos no se ejecutan desde esta interfaz."}
            </p>
          </div>
        </div>
      </header>

      <div className="divide-y divide-[#294047]">
        {items.map((item) => (
          <div key={item.label} className="grid gap-3 px-5 py-4 sm:px-6 lg:grid-cols-[170px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B7D3D1]">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-[#7F8C8A]">{item.description}</p>
            </div>
            <code className="block overflow-x-auto border border-[#294047] bg-[#091A20] px-3 py-2.5 text-xs leading-5 text-[#D8DDDB]">
              {item.value}
            </code>
          </div>
        ))}
      </div>
    </section>
  )
}
