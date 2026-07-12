"use client"

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
  const shellClass =
    variant === "dark"
      ? "rounded-xl border border-white/10 bg-slate-950/40 p-4"
      : "rounded-xl border border-slate-200/15 bg-slate-100/5 p-4"
  const bodyClass = variant === "dark" ? "text-slate-400" : "text-muted-foreground"
  const codeClass =
    variant === "dark"
      ? "mt-2 block rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100"
      : "mt-2 block rounded-lg border border-slate-200/15 bg-slate-950 px-3 py-2 text-xs text-slate-100"

  const items = [
    {
      label: "INAPI",
      value: actions?.nextInapiCommand ?? "pnpm plan:inapi --maxJobs 25",
    },
    {
      label: "Quota fixture",
      value: actions?.quotaFixtureCommand ?? "pnpm fixture:api-key --organizationId <uuid> --quotaDaily 2 --quotaMonthly 10",
    },
    {
      label: "Evidencia",
      value: actions?.evidenceCommand ?? "pnpm evidence:inapi",
    },
    {
      label: "Quota verify",
      value: actions?.quotaVerifyCommand ?? "QUOTA_VERIFY_API_KEY=sc_xxx QUOTA_VERIFY_BASE_URL=https://v0-visual-compare-chile.vercel.app pnpm verify:quota",
    },
  ]

  return (
    <div className={shellClass}>
      <p className="text-sm font-medium text-foreground">Siguiente accion sugerida</p>
      <p className={`mt-2 text-sm ${bodyClass}`}>
        {compact
          ? "Comandos directos para cerrar evidencia operativa de Fase 1."
          : "Usa estos comandos como siguiente paso operativo para mover el criterio de salida de Fase 1."}
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className={`text-xs uppercase tracking-[0.2em] ${bodyClass}`}>{item.label}</p>
            <code className={codeClass}>{item.value}</code>
          </div>
        ))}
      </div>
    </div>
  )
}
