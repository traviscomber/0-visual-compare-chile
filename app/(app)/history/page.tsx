import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, ShieldCheck, Tags } from "lucide-react"
import { ComparisonRow } from "@/components/app/comparison-row"
import { HistoryFilters } from "@/components/app/history-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { resolvePrimaryBrandName } from "@/lib/comparison/context"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SearchParams { classification?: string; min?: string; max?: string; q?: string }

export default async function HistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const classification = sp.classification ?? "all"
  const minScore = sp.min ?? ""
  const maxScore = sp.max ?? ""
  const query = sp.q ?? ""
  const supabase = await createClient()
  let user = null
  try { user = (await supabase.auth.getUser()).data.user } catch { user = null }
  if (!user) redirect(`/auth/login?redirectTo=${encodeURIComponent("/history")}`)

  let request = supabase.from("comparisons").select("id, similarity_score, classification, recommendation, created_at, result_json, brand_context").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200)
  if (classification && classification !== "all") request = request.eq("classification", classification)
  const minNum = Number(minScore); if (minScore && !Number.isNaN(minNum)) request = request.gte("similarity_score", minNum)
  const maxNum = Number(maxScore); if (maxScore && !Number.isNaN(maxNum)) request = request.lte("similarity_score", maxNum)
  if (query.trim().length > 0) request = request.ilike("recommendation", `%${query.trim()}%`)

  const { data: comparisons } = await request
  const rows = comparisons ?? []
  const filtered = classification !== "all" || minScore !== "" || maxScore !== "" || query.length > 0
  const highRiskCount = rows.filter((row) => row.classification === "exact_match" || row.classification === "near_duplicate" || Number(row.similarity_score) >= 85).length
  const brandIndex = buildBrandIndex(rows)

  return <div className="min-h-full bg-[#F8FAFC]">
    <div className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-slate-200 pb-7">
        <div><Button asChild variant="ghost" className="mb-4 h-auto p-0 text-sm text-slate-500 hover:bg-transparent hover:text-slate-900"><Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al resumen</Link></Button><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0F766E]">Actividad</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">Lo que ya analizaste.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Consulta evaluaciones anteriores, vuelve a abrir una marca y encuentra rápidamente las que merecieron revisión.</p></div>
        <Button asChild className="bg-[#0F766E] text-white hover:bg-[#134E4A]"><Link href="/evaluar"><ShieldCheck className="mr-2 h-4 w-4"/>Analizar otra marca</Link></Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3"><Metric label="Evaluaciones" value={rows.length}/><Metric label="Revisión prioritaria" value={highRiskCount}/><Metric label="Marcas recientes" value={brandIndex.length}/></section>

      {brandIndex.length>0&&<section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Tags className="h-4 w-4 text-slate-400"/><h2 className="font-semibold text-slate-950">Marcas recientes</h2></div><div className="mt-4 flex flex-wrap gap-2">{brandIndex.map(item=><Button key={item.name} variant="outline" size="sm" asChild className="border-slate-200 bg-white"><Link href={`/investigar?q=${encodeURIComponent(item.name)}`}><span className="font-medium">{item.name}</span><span className="ml-2 text-xs text-slate-400">{item.count}</span></Link></Button>)}</div></section>}

      <Card className="border-slate-200 shadow-sm"><CardHeader className="pb-4"><CardTitle className="text-lg">Buscar en tu actividad</CardTitle></CardHeader><CardContent><HistoryFilters defaultClassification={classification} defaultMinScore={minScore} defaultMaxScore={maxScore} defaultQuery={query}/></CardContent></Card>

      <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-lg">Evaluaciones</CardTitle></CardHeader><CardContent>{rows.length===0?<div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center"><p className="mb-4 text-slate-500">{filtered?"No hay evaluaciones que coincidan con esos filtros.":"Tu actividad aparecerá aquí cuando completes tu primera evaluación."}</p>{!filtered&&<Button asChild><Link href="/evaluar">Analizar primera marca</Link></Button>}</div>:<ul className="flex flex-col divide-y divide-slate-100">{rows.map(row=><li key={row.id} className="py-3 first:pt-0 last:pb-0"><ComparisonRow comparison={row}/></li>)}</ul>}</CardContent></Card>
    </div>
  </div>
}

function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p></div>}
function buildBrandIndex(rows:Array<{result_json?:unknown;brand_context?:unknown}>){const counts=new Map<string,number>();for(const row of rows){const primary=resolvePrimaryBrandName(row as Parameters<typeof resolvePrimaryBrandName>[0]);if(!primary)continue;counts.set(primary,(counts.get(primary)??0)+1)}return [...counts.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,8)}