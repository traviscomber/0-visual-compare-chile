"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ArrowRight, BellRing, Building2, Database, History, Search, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const actions = [
  {
    href: "/evaluar",
    label: "Evaluar",
    title: "Evaluar una marca",
    description: "Revisa antecedentes, similitudes y señales que merecen una mirada más profunda antes de avanzar.",
    icon: ShieldCheck,
  },
  {
    href: "/investigar",
    label: "Investigar",
    title: "Investigar una empresa o tecnología",
    description: "Explora patentes, solicitantes, IPC, inventores y actividad histórica desde una misma vista.",
    icon: Search,
  },
  {
    href: "/monitorear",
    label: "Monitorear",
    title: "Revisar qué cambió",
    description: "Consulta nuevas coincidencias en empresas y áreas tecnológicas que decidiste seguir.",
    icon: BellRing,
  },
]

const shortcuts = [
  { href: "/consulta-inapi", label: "Buscar marcas", icon: Database },
  { href: "/patentes", label: "Perfiles de empresa", icon: Building2 },
  { href: "/history", label: "Historial", icon: History },
]

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.push("/auth/login")
  }, [user, isLoading, router])

  if (isLoading || !user) return null

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Centro de inteligencia
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-6xl">
            ¿Qué quieres entender hoy?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Evalúa una decisión, investiga el panorama o vuelve a tus monitoreos. Visual Compare organiza las herramientas según lo que necesitas resolver.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/20 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Contexto</p>
          <p className="mt-2 text-sm font-medium text-foreground">Hola, {user.name}.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Empieza por una pregunta. Los detalles técnicos, clasificaciones y fuentes aparecen cuando aportan a la decisión.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Acciones principales</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Evalúa · Investiga · Monitorea</h2>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="group">
                <Card className="h-full border-border bg-card transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/50">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
                    </div>
                    <p className="mt-8 text-sm font-medium text-muted-foreground">{action.label}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{action.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{action.description}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-foreground">
                      Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 border-t border-border py-10 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Atajos</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Volver a una investigación</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {shortcuts.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/30">
                  <span className="flex items-center gap-3 text-sm font-medium text-foreground"><Icon className="h-4 w-4 text-muted-foreground" />{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-secondary/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Fuentes</p>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">Operativas</Badge>
          </div>
          <h3 className="mt-4 font-semibold text-foreground">INAPI sincronizado</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">La plataforma trabaja sobre el mirror oficial de marcas y patentes y mantiene trazabilidad hacia la evidencia disponible.</p>
          <Link href="/api/v1/health" target="_blank">
            <Button variant="ghost" className="mt-3 h-auto p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground">Ver estado técnico <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
          </Link>
        </aside>
      </section>

      <div className="border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
        Los resultados apoyan la investigación y priorización. No constituyen por sí solos una decisión jurídica de registrabilidad, concesión o infracción.
      </div>
    </div>
  )
}
