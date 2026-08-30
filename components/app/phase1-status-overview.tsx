import Link from "next/link"
import { Database, KeyRound, ShieldAlert } from "lucide-react"
import type { Phase1StatusSummary } from "@/lib/phase1-status"

type Variant = "light" | "dark"

type StatusMetricProps = {
  icon: typeof Database
  label: string
  value: string
  primaryDetail: string
  secondaryDetail: React.ReactNode
  variant: Variant
}

export function Phase1StatusOverview({
  summary,
  variant = "light",
}: {
  summary: Phase1StatusSummary
  variant?: Variant
}) {
  return (
    <div className="grid overflow-hidden border border-[#294047] md:grid-cols-3">
      <StatusMetric
        icon={Database}
        label="Cobertura INAPI"
        value={`${summary.inapi.phase1JobsCovered}/${summary.inapi.phase1JobsTotal}`}
        primaryDetail={`${summary.inapi.phase1ProgressPct}% de Phase1-10K cubierto`}
        secondaryDetail={
          summary.inapi.nextWindow
            ? `Siguiente ventana: start ${summary.inapi.nextWindow.startIndex} / max ${summary.inapi.nextWindow.maxJobs}`
            : "Sin ventanas pendientes"
        }
        variant={variant}
      />
      <StatusMetric
        icon={KeyRound}
        label="Capacidad API"
        value={`${summary.apiKeys.monthlyUsage}/${summary.apiKeys.monthlyQuota || 0}`}
        primaryDetail={`${summary.apiKeys.active} activas de ${summary.apiKeys.total} credenciales`}
        secondaryDetail={
          <>
            {summary.apiKeys.monthlyRemaining} análisis restantes ·{" "}
            <Link href="/settings" className="underline decoration-[#4A7F74] underline-offset-4 hover:text-white">
              gestionar
            </Link>
          </>
        }
        variant={variant}
      />
      <StatusMetric
        icon={ShieldAlert}
        label="Presión de cuota"
        value={String(summary.apiKeys.atRisk)}
        primaryDetail="Credenciales sobre 70% mensual"
        secondaryDetail="El control de cuota permanece separado de la cobertura de ingestión."
        variant={variant}
      />
    </div>
  )
}

function StatusMetric({ icon: Icon, label, value, primaryDetail, secondaryDetail, variant }: StatusMetricProps) {
  const backgroundClass = variant === "dark" ? "bg-[#0D222A]" : "bg-[#10262D]"

  return (
    <section
      className={`${backgroundClass} min-w-0 border-b border-[#294047] px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0`}
      aria-label={label}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8F9A98]">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-[#96B5A6]" strokeWidth={1.6} aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-normal tracking-[-0.03em] text-[#E7DFCE]">{value}</p>
      <p className="mt-1 text-sm leading-5 text-white/85">{primaryDetail}</p>
      <p className="mt-2 text-xs leading-5 text-[#8F9A98]">{secondaryDetail}</p>
    </section>
  )
}
