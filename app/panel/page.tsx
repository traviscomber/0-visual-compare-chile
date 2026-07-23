import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Database,
  GitCompareArrows,
  History,
  Home,
  KeyRound,
  Search,
  ShieldAlert,
  Tags,
} from "lucide-react"
import { BuildStamp } from "@/components/build/build-stamp"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DEFAULT_API_KEY_DAILY_QUOTA, DEFAULT_API_KEY_MONTHLY_QUOTA } from "@/lib/api/quotas"
import { formatTrademarkDate } from "@/lib/trademark-insights"
import { getTrademarkOperationalStats } from "@/lib/trademark-records"

const modules = [
  {
    title: "Comparar imagenes",
    description: "Cruza una marca visual contra conflictos potenciales y abre el detalle accionable.",
    icon: GitCompareArrows,
    href: "/compare",
  },
  {
    title: "Consulta operativa",
    description: "Busca por nombre, Niza o Viena y abre fichas conectadas a la base sincronizada.",
    icon: Search,
    href: "/consulta",
  },
  {
    title: "Historial",
    description: "Revisa resultados anteriores y reutiliza rutas de investigacion del MVP.",
    icon: History,
    href: "/history",
  },
]

export default async function PanelPage() {
  const stats = await getTrademarkOperationalStats()
  const monthlyQuotaLabel = formatNumber(DEFAULT_API_KEY_MONTHLY_QUOTA)
  const dailyQuotaLabel = formatNumber(DEFAULT_API_KEY_DAILY_QUOTA)
  const totalStatusRecords = stats.registeredRecords + stats.pendingRecords + stats.deniedRecords
  const registeredShare = totalStatusRecords > 0 ? Math.round((stats.registeredRecords / totalStatusRecords) * 100) : 0
  const latestSyncLabel = stats.lastCompletedSync
    ? `${formatNumber(stats.lastCompletedSync.totalFetched)} filas en el ultimo sync`
    : "Sin sync completado visible"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_42%,_#111827_100%)]">
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Visual Compare Chile</span>
          </Link>
          <Button asChild>
            <Link href="/auth/login">
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="mb-3 text-sm font-medium text-blue-400">Panel operativo del MVP</p>
              <h1 className="text-3xl font-bold text-white md:text-5xl">
                Base sincronizada, consulta conectada y cuota comercial lista para operar.
              </h1>
              <p className="mt-4 max-w-3xl text-slate-300">
                Esta vista ya no es de marketing. Resume el estado real de la capa INAPI, las rutas del producto y la
                cuota base definida para el piloto.
              </p>
              <div className="mt-4">
                <BuildStamp />
              </div>
            </div>

            <div className="grid min-w-[280px] gap-3 rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Dato clave</p>
              <p className="text-3xl font-semibold text-white">{formatNumber(stats.totalRecords)}</p>
              <p className="text-sm text-slate-300">registros de marcas visibles desde {stats.source === "supabase" ? "Supabase" : "seed local"}</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-1">Registradas {formatNumber(stats.registeredRecords)}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">Pendientes {formatNumber(stats.pendingRecords)}</span>
                <span className="rounded-full border border-white/10 px-3 py-1">Denegadas {formatNumber(stats.deniedRecords)}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Database}
              label="Base sincronizada"
              value={formatNumber(stats.totalRecords)}
              detail={latestSyncLabel}
              tone="blue"
            />
            <MetricCard
              icon={BarChart3}
              label="Cobertura registradas"
              value={`${registeredShare}%`}
              detail={`${formatNumber(stats.registeredRecords)} registradas sobre ${formatNumber(totalStatusRecords)} visibles`}
              tone="cyan"
            />
            <MetricCard
              icon={ShieldAlert}
              label="Sync completados"
              value={formatNumber(stats.completedSyncRuns)}
              detail={`${formatNumber(stats.failedSyncRuns)} fallidos registrados`}
              tone="emerald"
            />
            <MetricCard
              icon={KeyRound}
              label="Cuota base API"
              value={`${monthlyQuotaLabel}/mes`}
              detail={`${dailyQuotaLabel}/dia por key en el plan MVP`}
              tone="amber"
            />
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Estado de la capa INAPI</h2>
                <p className="text-sm text-slate-400">Lo que hoy alimenta consulta, compare y fichas reales.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SignalCard
                title="Ultimo sync"
                detail={
                  stats.lastCompletedSync
                    ? `${formatTrademarkDate(stats.lastCompletedSync.createdAt)} · preset ${stats.lastCompletedSync.preset ?? "manual"}`
                    : "Sin corrida completada"
                }
              />
              <SignalCard
                title="Cambios aplicados"
                detail={
                  stats.lastCompletedSync
                    ? `${formatNumber(stats.lastCompletedSync.insertedCount)} insertados · ${formatNumber(stats.lastCompletedSync.updatedCount)} actualizados`
                    : "Sin datos"
                }
              />
              <SignalCard
                title="Fecha mas reciente"
                detail={stats.latestRecordDate ? formatTrademarkDate(stats.latestRecordDate) : "Sin fecha visible"}
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <TaxonomySummary
                icon={Tags}
                title="Top clases Niza"
                items={stats.topNiza.map((item) => `${item.code} (${formatNumber(item.count)})`)}
                emptyLabel="Sin clases visibles"
                tone="blue"
              />
              <TaxonomySummary
                icon={Tags}
                title="Top codigos Viena"
                items={stats.topViena.map((item) => `${item.code} (${formatNumber(item.count)})`)}
                emptyLabel="Sin codigos visibles"
                tone="cyan"
              />
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Fase 1 visible en producto</h2>
                <p className="text-sm text-slate-400">Lo que ya se puede vender, medir y auditar desde la app.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <PhaseCard
                title="INAPI sync"
                description="La consulta y las fichas ya leen la base sincronizada; el ultimo sync completado queda trazado en esta vista."
                href="/settings"
                cta="Operar sync"
              />
              <PhaseCard
                title="API keys y quotas"
                description={`La cuota MVP ya esta definida en ${monthlyQuotaLabel} analisis por mes con enforcement por key.`}
                href="/settings"
                cta="Ver claves"
              />
              <PhaseCard
                title="Rate limiting y contrato"
                description="Las rutas v1 ya responden con limites y remaining headers; falta seguir endureciendo la verificacion externa."
                href="/roadmap"
                cta="Ver criterio"
              />
            </div>
          </Card>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-400">Rutas activas</p>
              <h2 className="text-2xl font-semibold text-white">Superficies que ya trabajan sobre el flujo real del MVP</h2>
            </div>
            <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <Link key={module.href} href={module.href}>
                  <Card className="h-full border-slate-800 bg-slate-900/60 p-6 transition-colors hover:border-blue-500/50">
                    <Icon className="mb-4 h-8 w-8 text-blue-400" />
                    <h2 className="mb-2 text-lg font-semibold text-white">{module.title}</h2>
                    <p className="text-sm text-slate-400">{module.description}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-400">Proximo uso natural</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Usar `/consulta`, abrir `/marca/[id]` y cerrar el informe PDF real</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                El panel ya muestra que la base existe. El siguiente paso de producto es que el usuario consuma ese dato
                desde consulta, compare y el reporte descargable sin cambiar de discurso entre superficies.
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <Link href="/consulta">Abrir consulta</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Database
  label: string
  value: string
  detail: string
  tone: "blue" | "cyan" | "emerald" | "amber"
}) {
  const toneClassName =
    tone === "blue"
      ? "text-blue-300"
      : tone === "cyan"
        ? "text-cyan-300"
        : tone === "emerald"
          ? "text-emerald-300"
          : "text-amber-300"

  return (
    <Card className="border-white/10 bg-slate-950/45 p-5">
      <Icon className={`h-6 w-6 ${toneClassName}`} />
      <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </Card>
  )
}

function SignalCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm text-white">{detail}</p>
    </div>
  )
}

function TaxonomySummary({
  icon: Icon,
  title,
  items,
  emptyLabel,
  tone,
}: {
  icon: typeof Tags
  title: string
  items: string[]
  emptyLabel: string
  tone: "blue" | "cyan"
}) {
  const toneClassName = tone === "blue" ? "text-blue-100 border-blue-400/30" : "text-cyan-100 border-cyan-400/30"

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-300" />
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span key={item} className={`rounded-full border px-3 py-1 text-xs ${toneClassName}`}>
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  )
}

function PhaseCard({
  title,
  description,
  href,
  cta,
}: {
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Card className="border-white/10 bg-slate-950/40 p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <Button asChild variant="link" className="mt-4 px-0 text-cyan-300 hover:text-cyan-200">
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </Card>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CL").format(value)
}
