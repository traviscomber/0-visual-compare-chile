import { ArrowRight, BookOpen, Boxes, Cable, CheckCircle2, FileSearch, Github, Radar, Sparkles } from "lucide-react"
import { listPortfolioOrganizations } from "@/lib/intelligence/portfolio-access"
import { createAdminClient } from "@/lib/supabase/admin"
import { JuanProductEvolutionActions } from "@/components/app/juan-product-evolution-actions"

type EvolutionRow = {
  id: string
  product_key: string
  product_name: string
  title: string
  score: number
  status: "researching" | "ready_for_review" | "accepted" | "rejected"
  outcome: string
  chile_need: string | null
  external_signal: string | null
  reuse_summary: string | null
  integration_summary: string | null
  effort: "bajo" | "medio" | "alto" | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

type EvidenceSnapshot = {
  repo?: string
  paper?: { source?: string; title?: string; url?: string; date?: string | null } | null
  patent?: { title?: string; applicants?: string | null; url?: string | null; date?: string | null } | null
  chile_signal?: { title?: string; source?: string; url?: string | null; relevance?: string } | null
  global_signal?: { title?: string; source?: string; url?: string | null; relevance?: string } | null
  reuse_assets?: Array<{ title?: string; url?: string; reuse?: string }>
  integrations?: string[]
  dimensions?: { outcome?: number; reuse_advantage?: number; integration_leverage?: number; agentic_mcp_potential?: number; chile_fit?: number }
}

export async function JuanProductEvolutionStrip({ userId }: { userId: string }) {
  const admin = createAdminClient()
  const organizations = await listPortfolioOrganizations(admin, userId).catch(() => [])
  const organization = organizations[0] ?? null
  if (!organization) return null

  const { data, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("id,product_key,product_name,title,score,status,outcome,chile_need,external_signal,reuse_summary,integration_summary,effort,evidence_snapshot,updated_at")
    .eq("user_id", userId)
    .eq("organization_id", organization.id)
    .neq("status", "rejected")
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(12)

  if (error) {
    console.error("[juan-product-evolution-strip]", error)
    return null
  }

  const rows = (data ?? []) as EvolutionRow[]
  if (!rows.length) return null

  const pending = rows.filter(row => row.status === "ready_for_review").slice(0, 4)
  const researching = rows.filter(row => row.status === "researching").slice(0, Math.max(0, 4 - pending.length))
  const accepted = rows.filter(row => row.status === "accepted").slice(0, 3)

  return <section className="mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border-y border-[#294047] bg-[#0B2025] sm:w-[calc(100%-3rem)]">
    <div className="flex flex-col gap-3 border-b border-[#294047] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#173B37] text-[#96B5A6]"><Sparkles className="h-4 w-4" /></span>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Evolución de productos · Juan</p>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-[#E7DFCE]">VIDENTIA cruza necesidades de Chile, frontera tecnológica, papers, patentes y lo que N3uralia ya construyó para proponer el siguiente salto de cada producto.</p>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.14em] text-[#748481]">investigación automática · decisión humana</span>
    </div>

    {pending.length ? <EvolutionGroup title={`Pendientes de tu decisión · ${pending.length}`} rows={pending} organizationId={organization.id} decision /> : null}
    {researching.length ? <EvolutionGroup title={`Todavía investigando · ${researching.length}`} rows={researching} organizationId={organization.id} /> : null}
    {accepted.length ? <EvolutionGroup title={`Aprobadas · ${accepted.length}`} rows={accepted} organizationId={organization.id} accepted /> : null}
  </section>
}

function EvolutionGroup({ title, rows, organizationId, decision = false, accepted = false }: { title: string; rows: EvolutionRow[]; organizationId: string; decision?: boolean; accepted?: boolean }) {
  return <div className="border-b border-[#294047] last:border-b-0">
    <div className="flex items-center gap-2 border-b border-[#294047] px-4 py-2.5 sm:px-5">
      {accepted ? <CheckCircle2 className="h-3.5 w-3.5 text-[#96B5A6]" /> : <Radar className="h-3.5 w-3.5 text-[#83908F]" />}
      <p className={`text-[10px] font-medium uppercase tracking-[0.14em] ${decision || accepted ? "text-[#96B5A6]" : "text-[#83908F]"}`}>{title}</p>
    </div>
    <div className={`divide-y divide-[#294047] ${rows.length > 1 ? "xl:grid xl:grid-cols-4 xl:divide-x xl:divide-y-0" : ""}`}>
      {rows.map(row => <EvolutionCard key={row.id} row={row} organizationId={organizationId} decision={decision} accepted={accepted} />)}
    </div>
  </div>
}

function EvolutionCard({ row, organizationId, decision, accepted }: { row: EvolutionRow; organizationId: string; decision: boolean; accepted: boolean }) {
  const evidence = (row.evidence_snapshot ?? {}) as EvidenceSnapshot
  const dimensions = evidence.dimensions ?? {}
  const repoHref = typeof evidence.repo === "string" ? evidence.repo : null
  const topDimensions = [
    ["Outcome", dimensions.outcome],
    ["Chile", dimensions.chile_fit],
    ["Reuse", dimensions.reuse_advantage],
    ["MCP", dimensions.agentic_mcp_potential],
  ].filter((item): item is [string, number] => typeof item[1] === "number")

  return <article className={`px-4 py-4 sm:px-5 ${decision ? "bg-[#102A2C]" : accepted ? "bg-[#0F2728]/55" : ""}`}>
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">{row.product_name}</span>
      <span className={`text-sm font-semibold ${row.score >= 90 ? "text-[#B8D5C6]" : "text-[#D5DDD9]"}`}>{row.score}</span>
    </div>
    <h2 className="mt-2 text-sm font-medium leading-6 text-white">{row.title}</h2>
    <p className="mt-2 text-xs leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">Outcome:</span> {row.outcome}</p>

    {topDimensions.length ? <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-y border-[#294047] py-2">{topDimensions.map(([label, value]) => <span key={label} className="text-[10px] uppercase tracking-[0.09em] text-[#748481]">{label} <span className="font-semibold text-[#B8C4C1]">{value}</span></span>)}</div> : null}

    <div className="mt-3 space-y-2">
      {row.chile_need ? <EvidenceLine icon={Radar} label="Chile" value={row.chile_need} /> : null}
      {evidence.paper?.title ? <EvidenceLink icon={BookOpen} label={`Paper${evidence.paper.source ? ` · ${evidence.paper.source}` : ""}`} value={evidence.paper.title} href={evidence.paper.url ?? null} /> : null}
      {evidence.patent?.title ? <EvidenceLink icon={FileSearch} label="Patente" value={evidence.patent.title} href={evidence.patent.url ?? null} /> : null}
      {evidence.global_signal?.title ? <EvidenceLink icon={Sparkles} label="Afuera" value={evidence.global_signal.title} href={evidence.global_signal.url ?? null} /> : null}
      {evidence.chile_signal?.title ? <EvidenceLink icon={Radar} label="Señal Chile" value={evidence.chile_signal.title} href={evidence.chile_signal.url ?? null} /> : null}
      {row.reuse_summary ? <EvidenceLine icon={Github} label="Reciclar" value={row.reuse_summary} /> : null}
      {row.integration_summary ? <EvidenceLine icon={Cable} label="MCP / conexiones" value={row.integration_summary} /> : null}
      <EvidenceLine icon={Boxes} label="Esfuerzo" value={row.effort ?? "por estimar"} />
    </div>

    {evidence.reuse_assets?.length ? <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">{evidence.reuse_assets.slice(0, 4).map(asset => asset.url && asset.title ? <a key={asset.url} href={asset.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-[#96B5A6] hover:text-white hover:underline">{asset.title}<ArrowRight className="h-3 w-3" /></a> : null)}</div> : null}
    {repoHref ? <a href={repoHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#738180] hover:text-white">Abrir producto en GitHub <ArrowRight className="h-3 w-3" /></a> : null}

    {decision ? <div className="mt-4 border-t border-[#294047] pt-4"><JuanProductEvolutionActions recommendationId={row.id} organizationId={organizationId} /></div> : null}
    {accepted ? <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#B8D5C6]"><CheckCircle2 className="h-3.5 w-3.5" />Aprobado · VIDENTIA puede seguir enriqueciendo la evidencia sin cambiar tu decisión.</div> : null}
  </article>
}

function compact(value: string, max = 150) {
  const clean = value.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const clipped = clean.slice(0, max)
  const lastSpace = clipped.lastIndexOf(" ")
  return `${clipped.slice(0, lastSpace > max * 0.7 ? lastSpace : max).trim()}…`
}

function EvidenceLine({ icon: Icon, label, value }: { icon: typeof Radar; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]" /><p className="text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">{label}:</span> {compact(value)}</p></div>
}

function EvidenceLink({ icon: Icon, label, value, href }: { icon: typeof Radar; label: string; value: string; href: string | null }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6F807E]" /><p className="text-[11px] leading-5 text-[#AEB6B4]"><span className="font-medium text-[#D6DDDA]">{label}:</span> {compact(value)} {href ? <a href={href} target="_blank" rel="noreferrer" className="whitespace-nowrap text-[#96B5A6] hover:text-white hover:underline">Ver fuente</a> : null}</p></div>
}
