import Link from "next/link"
import { redirect } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  History,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Comparison = {
  id: string
  similarity_score: number | null
  classification: string | null
  recommendation: string | null
  created_at: string
}

type Research = {
  id: string
  query: string
  search_type: string
  results_count: number
  status: string
  created_at: string
}

type Watch = {
  id: string
  watch_type: "company" | "ipc"
  query: string
  is_active: boolean
  last_checked_at: string
}

type Signal = {
  id: string
  title: string
  applicants: string | null
  detected_at: string
  read_at: string | null
}

function isHighRisk(row: Comparison) {
  return (
    row.classification === "exact_match" ||
    row.classification === "near_duplicate" ||
    Number(row.similarity_score ?? 0) >= 85
  )
}

function formatRelative(value?: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} d`
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(date)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) redirect("/auth/login?redirectTo=%2Fdashboard")

  const [comparisonResult, researchResult, watchResult, signalResult] = await Promise.all([
    supabase
      .from("comparisons")
      .select("id,similarity_score,classification,recommendation,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("search_history")
      .select("id,query,search_type,results_count,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("patent_watches")
      .select("id,watch_type,query,is_active,last_checked_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("patent_alert_events")
      .select("id,title,applicants,detected_at,read_at")
      .eq("user_id", user.id)
      .order("detected_at", { ascending: false })
      .limit(20),
  ])

  const comparisons = (comparisonResult.data ?? []) as Comparison[]
  const research = (researchResult.data ?? []) as Research[]
  const watches = (watchResult.data ?? []) as Watch[]
  const signals = (signalResult.data ?? []) as Signal[]

  const unreadSignals = signals.filter((signal) => !signal.read_at)
  const highRiskComparisons = comparisons.filter(isHighRisk)
  const activeWatches = watches.filter((watch) => watch.is_active)
  const latestSignal = signals[0] ?? null
  const latestComparison = comparisons[0] ?? null
  const latestResearch = research[0] ?? null

  const attentionCount = unreadSignals.length + highRiskComparisons.length
  const displayName =
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    user.email?.split("@")[0] ||
    "tu equipo"

  const priorities = [
    unreadSignals.length > 0
      ? {
          href: "/monitorear",
          icon: BellRing,
          title: `${unreadSignals.length} señal${unreadSignals.length === 1 ? "" : "es"} nueva${unreadSignals.length === 1 ? "" : "s"}`,
          detail: latestSignal ? `${latestSignal.title} · ${latestSignal.applicants || "solicitante no informado"}` : "Revisa los cambios detectados en tus vigilancias.",
          meta: latestSignal ? formatRelative(latestSignal.detected_at) : "Ahora",
          tone: "attention",
        }
      : null,
    highRiskComparisons.length > 0
      ? {
          href: "/history?min=85",
          icon: AlertTriangle,
          title: `${highRiskComparisons.length} evaluación${highRiskComparisons.length === 1 ? "" : "es"} para revisar`,
          detail: "Hay comparaciones recientes con similitud alta o clasificación de coincidencia cercana.",
          meta: latestComparison ? formatRelative(latestComparison.created_at) : "Reciente",
          tone: "attention",
        }
      : null,
    activeWatches.length === 0
      ? {
          href: "/monitorear",
          icon: Eye,
          title: "Tu radar todavía está vacío",
          detail: "Crea una vigilancia de empresa o IPC para que Visual Compare empiece a detectar cambios por ti.",
          meta: "Configurar",
          tone: "neutral",
        }
      : null,
  ].filter(Boolean) as Array<{
    href: string
    icon: typeof BellRing
    title: string
    detail: string
    meta: string
    tone: "attention" | "neutral"
  }>

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <section className="grid gap-7 border-b border-border pb-9 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Intelligence Home
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
            {attentionCount > 0 ? "Hay cosas que requieren tu atención." : "Tu panorama está al día."}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Hola, {displayName}. Este es el resumen de tus evaluaciones, investigaciones y monitoreos. Empieza por lo importante y profundiza sólo cuando haga falta.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-secondary/20 p-3">
          <Metric value={String(unreadSignals.length)} label="Señales nuevas" />
          <Metric value={String(activeWatches.length)} label="Vigilancias" />
          <Metric value={String(highRiskComparisons.length)} label="Por revisar" />
        </div>
      </section>

      <section className="py-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Prioridad</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Qué requiere atención hoy</h2>
          </div>
          {attentionCount === 0 && (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Sin pendientes críticos
            </Badge>
          )}
        </div>

        {priorities.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {priorities.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.title} href={item.href} className="group">
                  <Card className={`h-full transition-all hover:-translate-y-0.5 hover:shadow-lg ${item.tone === "attention" ? "border-amber-500/30" : "border-border"}`}>
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary/50"><Icon className="h-4 w-4" /></span>
                        <span className="text-xs text-muted-foreground">{item.meta}</span>
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground">Revisar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/20 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span>
            <div><p className="font-medium text-foreground">No hay señales nuevas ni evaluaciones de alto riesgo pendientes.</p><p className="mt-1 text-sm text-muted-foreground">Puedes seguir investigando o ampliar tu radar con nuevas vigilancias.</p></div>
          </div>
        )}
      </section>

      <section className="grid gap-5 border-t border-border py-9 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Actividad</p><CardTitle className="mt-2 text-xl">Lo último que hiciste</CardTitle></div>
            <Button asChild variant="ghost" size="sm"><Link href="/history">Ver historial <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestComparison && (
              <ActivityRow icon={ShieldCheck} href="/history" title="Evaluación reciente" detail={latestComparison.recommendation || `Similitud ${Math.round(Number(latestComparison.similarity_score ?? 0))}%`} meta={formatRelative(latestComparison.created_at)} />
            )}
            {latestResearch && (
              <ActivityRow icon={Search} href={`/investigar?q=${encodeURIComponent(latestResearch.query)}`} title={`Investigaste “${latestResearch.query}”`} detail={`${latestResearch.results_count ?? 0} resultados · ${latestResearch.search_type}`} meta={formatRelative(latestResearch.created_at)} />
            )}
            {latestSignal && (
              <ActivityRow icon={BellRing} href="/monitorear" title="Última señal detectada" detail={latestSignal.title} meta={formatRelative(latestSignal.detected_at)} />
            )}
            {!latestComparison && !latestResearch && !latestSignal && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center"><Clock3 className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">Tu actividad aparecerá aquí cuando empieces a usar Visual Compare.</p></div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Radar</p><CardTitle className="mt-2 text-xl">Qué estás siguiendo</CardTitle></CardHeader>
          <CardContent>
            {activeWatches.length > 0 ? (
              <div className="space-y-2">
                {activeWatches.slice(0, 5).map((watch) => (
                  <Link key={watch.id} href="/monitorear" className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/30">
                    <div className="min-w-0"><div className="flex items-center gap-2"><Badge variant="secondary">{watch.watch_type === "company" ? "Empresa" : "IPC"}</Badge><span className="truncate text-sm font-medium text-foreground">{watch.query}</span></div><p className="mt-1 text-xs text-muted-foreground">Chequeado {formatRelative(watch.last_checked_at).toLowerCase()}</p></div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center"><Target className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-foreground">Todavía no sigues empresas ni tecnologías.</p><Button asChild size="sm" className="mt-4"><Link href="/monitorear">Crear vigilancia</Link></Button></div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="border-t border-border py-9">
        <div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Continuar</p><h2 className="mt-2 text-xl font-semibold text-foreground">¿Qué quieres hacer ahora?</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          <Journey href="/evaluar" icon={ShieldCheck} label="Evaluar" description="Revisar una marca antes de avanzar." />
          <Journey href="/investigar" icon={Search} label="Investigar" description="Entender una marca, empresa o tecnología." />
          <Journey href="/monitorear" icon={BellRing} label="Monitorear" description="Seguir cambios relevantes en el tiempo." />
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Database className="h-3.5 w-3.5" /> Datos INAPI sincronizados y trazables.</span>
        <Link href="/api/v1/health" target="_blank" className="inline-flex items-center gap-1 hover:text-foreground">Estado técnico <ArrowRight className="h-3.5 w-3.5" /></Link>
      </section>
    </div>
  )
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-background/60 px-3 py-4 text-center"><p className="text-2xl font-semibold text-foreground">{value}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{label}</p></div>
}

function ActivityRow({ icon: Icon, href, title, detail, meta }: { icon: typeof History; href: string; title: string; detail: string; meta: string }) {
  return <Link href={href} className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/30"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60"><Icon className="h-4 w-4 text-muted-foreground" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p></div><span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{meta}</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>
}

function Journey({ href, icon: Icon, label, description }: { href: string; icon: typeof Search; label: string; description: string }) {
  return <Link href={href} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>
}