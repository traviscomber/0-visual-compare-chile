import Link from "next/link"
import { Database, KeyRound, ShieldAlert } from "lucide-react"
import type { Phase1StatusSummary } from "@/lib/phase1-status"

type Variant = "light" | "dark"

export function Phase1StatusOverview({
  summary,
  variant = "light",
}: {
  summary: Phase1StatusSummary
  variant?: Variant
}) {
  const isDark = variant === "dark"
  const shellClass = isDark
    ? "rounded-2xl border border-white/10 bg-slate-950/40 p-4"
    : "rounded-2xl border border-slate-200/15 bg-slate-100/5 p-4"
  const headingClass = isDark ? "text-slate-300" : "text-slate-700 dark:text-slate-200"
  const bodyClass = isDark ? "text-slate-400" : "text-muted-foreground"
  const valueClass = isDark ? "text-white" : "text-foreground"
  const linkClass = isDark ? "underline underline-offset-2 text-slate-300 hover:text-white" : "underline underline-offset-2"

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className={shellClass}>
        <div className={`flex items-center gap-2 ${headingClass}`}>
          <Database className="h-4 w-4 text-cyan-500" />
          <p className="text-sm font-medium">INAPI</p>
        </div>
        <p className={`mt-3 text-2xl font-semibold ${valueClass}`}>
          {summary.inapi.totalRecords}/{summary.inapi.targetRecords}
        </p>
        <p className={`mt-1 text-sm ${bodyClass}`}>{summary.inapi.phase1ProgressPct}% del batch phase1-10k cubierto</p>
        <p className={`mt-1 text-sm ${bodyClass}`}>Runs: {summary.inapi.completedRuns} ok / {summary.inapi.failedRuns} fallidas</p>
        <p className={`mt-2 text-xs ${bodyClass}`}>
          {summary.inapi.nextWindow
            ? `Siguiente ventana: start ${summary.inapi.nextWindow.startIndex} / max ${summary.inapi.nextWindow.maxJobs}`
            : "Sin ventanas pendientes"}
        </p>
      </div>

      <div className={shellClass}>
        <div className={`flex items-center gap-2 ${headingClass}`}>
          <KeyRound className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-medium">API keys</p>
        </div>
        <p className={`mt-3 text-2xl font-semibold ${valueClass}`}>
          {summary.apiKeys.monthlyUsage}/{summary.apiKeys.monthlyQuota || 0}
        </p>
        <p className={`mt-1 text-sm ${bodyClass}`}>
          {summary.apiKeys.active} activas de {summary.apiKeys.total} totales
        </p>
        <p className={`mt-1 text-sm ${bodyClass}`}>{summary.apiKeys.monthlyRemaining} analisis restantes</p>
        <p className={`mt-2 text-xs ${bodyClass}`}>
          Gestion detallada en{" "}
          <Link href="/settings" className={linkClass}>
            Settings
          </Link>
        </p>
      </div>

      <div className={shellClass}>
        <div className={`flex items-center gap-2 ${headingClass}`}>
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-medium">Rate limiting</p>
        </div>
        <p className={`mt-3 text-2xl font-semibold ${valueClass}`}>{summary.apiKeys.atRisk}</p>
        <p className={`mt-1 text-sm ${bodyClass}`}>claves en zona de presion ({">="}70% mensual)</p>
        <p className={`mt-1 text-sm ${bodyClass}`}>`429` ya implementado; falta validacion externa sobre deploy real</p>
        <p className={`mt-2 text-xs ${bodyClass}`}>
          Criterio de salida visible en{" "}
          <Link href="/roadmap" className={linkClass}>
            Roadmap
          </Link>
        </p>
      </div>
    </div>
  )
}
