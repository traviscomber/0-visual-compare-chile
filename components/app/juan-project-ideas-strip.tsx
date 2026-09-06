import Link from "next/link"
import { ArrowRight, Lightbulb, Radar } from "lucide-react"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"

export async function JuanProjectIdeasStrip({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const organizations = await listPortfolioOrganizations(admin, userId).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return null

  const [recommendationsResult, thesesResult] = await Promise.all([
    admin
      .from("intelligence_recommendations")
      .select("id,headline,recommended_action,score,tier,status,updated_at")
      .eq("organization_id", organization.id)
      .not("status", "in", '("discarded","converted_to_action")')
      .order("score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(6),
    admin
      .from("innovation_opportunity_theses")
      .select("id,title,overall_score,evidence_strength,status,updated_at")
      .eq("organization_id", organization.id)
      .not("status", "in", '("rejected","archived")')
      .order("overall_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(6),
  ])

  const recommendations = recommendationsResult.error ? [] : recommendationsResult.data ?? []
  const theses = thesesResult.error ? [] : thesesResult.data ?? []

  const ideas = [
    ...recommendations.map(item => ({
      key: `recommendation:${item.id}`,
      title: String(item.headline),
      detail: String(item.recommended_action || "Revisar la evidencia y decidir si merece investigación."),
      strength: Number(item.score ?? 0),
      href: "/oportunidades",
      source: "Señales + evidencia",
    })),
    ...theses.map(item => ({
      key: `thesis:${item.id}`,
      title: String(item.title),
      detail: `Evidencia ${Math.round(Number(item.evidence_strength ?? 0))}/100 · conviene revisar la hipótesis y qué falta confirmar.`,
      strength: Number(item.overall_score ?? 0),
      href: "/oportunidades/tesis",
      source: "Hipótesis investigada",
    })),
  ]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3)

  if (!ideas.length) {
    return (
      <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border-y border-[#294047] bg-[#0D2329] px-4 py-4 sm:w-[calc(100%-3rem)] sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Ideas para proyectos</p>
            <p className="mt-1 text-sm text-[#E7DFCE]">Todavía no hay una idea con evidencia suficiente para mostrar aquí.</p>
          </div>
          <Link href="/oportunidades/descubrir" className="inline-flex items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
            Buscar oportunidades <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border-y border-[#294047] bg-[#0D2329] sm:w-[calc(100%-3rem)]">
      <div className="flex flex-col gap-3 border-b border-[#294047] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><Lightbulb className="h-4 w-4" /></span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Ideas para proyectos</p>
            <p className="mt-1 text-sm text-[#E7DFCE]">Oportunidades que VIDENTIA ya puede justificar con señales o evidencia.</p>
          </div>
        </div>
        <Link href="/oportunidades/descubrir" className="inline-flex items-center gap-2 text-sm font-medium text-[#96B5A6] hover:text-white">
          Buscar más <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-[#294047] lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {ideas.map(idea => (
          <Link key={idea.key} href={idea.href} className="group block px-4 py-4 transition-colors hover:bg-[#13272D] sm:px-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[#83908F]"><Radar className="h-3 w-3" />{idea.source}</div>
            <h2 className="mt-2 text-sm font-medium leading-6 text-white">{idea.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-[#AEB6B4]">{idea.detail}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#96B5A6]">Investigar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>
  )
}
