import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, ImageIcon, Search, Tags } from "lucide-react"
import { ComparisonRow } from "@/components/app/comparison-row"
import { HistoryFilters } from "@/components/app/history-filters"
import { Button } from "@/components/ui/button"
import { resolvePrimaryBrandName } from "@/lib/comparison/context"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
interface SearchParams { classification?: string; q?: string; min?: string; max?: string }

export default async function HistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const classification = sp.classification ?? "all"
  const query = sp.q ?? ""
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect(`/auth/login?redirectTo=${encodeURIComponent("/history")}`)

  let request = supabase.from("comparisons").select("id, similarity_score, classification, recommendation, created_at, result_json, brand_context").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(200)
  if (classification && classification !== "all") request = request.eq("classification", classification)
  if (query.trim()) request = request.ilike("recommendation", `%${query.trim()}%`)

  const { data: comparisons, error } = await request
  if (error) throw new Error("No pudimos cargar tu actividad de evaluaciones.")
  const rows = comparisons ?? []
  const filtered = classification !== "all" || query.trim().length > 0
  const closeCount = rows.filter(row => row.classification === "exact_match" || row.classification === "near_duplicate").length
  const visualCount = rows.filter(row => row.classification === "visually_similar" || row.classification === "partially_similar").length
  const brandIndex = buildBrandIndex(rows)

  return <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
    <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Actividad</p><h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Vuelve a la evidencia que ya revisaste.</h1></div>
      <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Consulta evaluaciones anteriores por marca, clasificación registrada y recomendación. El historial conserva el score técnico, pero esta vista no lo usa como criterio de prioridad ni de navegación.</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/investigar">Investigar</Link></Button><Button asChild><Link href="/evaluar">Nueva evaluación <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>
    </header>

    <section className="grid border-b border-border sm:grid-cols-3">
      <Metric label="Evaluaciones" value={rows.length} detail="Registros dentro de esta vista" />
      <Metric label="Coincidencias cercanas" value={closeCount} detail="Exactas o muy cercanas" />
      <Metric label="Señales visuales" value={visualCount} detail="Similares o parcialmente similares" />
    </section>

    {brandIndex.length > 0 && <section className="border-b border-border py-8"><div className="flex items-center gap-2 text-primary"><Tags className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Marcas recientes</p></div><div className="mt-4 flex flex-wrap gap-2">{brandIndex.map(item => <Button key={item.name} variant="outline" size="sm" asChild><Link href={`/investigar?q=${encodeURIComponent(item.name)}&mode=brand`}><span>{item.name}</span><span className="ml-2 text-xs text-muted-foreground">{item.count}</span></Link></Button>)}</div></section>}

    <section className="border-b border-border py-8"><div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]"><div><div className="flex items-center gap-2 text-primary"><Search className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.16em]">Filtrar actividad</p></div><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Encuentra una evaluación anterior</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Filtra por la clasificación registrada o por texto de la recomendación.</p></div><HistoryFilters defaultClassification={classification} defaultQuery={query} /></div></section>

    <section className="py-8"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Evaluaciones</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Registro reciente</h2></div><span className="text-xs text-muted-foreground">{rows.length} resultado{rows.length===1?"":"s"}</span></div>{rows.length===0?<div className="mt-5 border-y border-dashed border-border py-12 text-center"><ImageIcon className="mx-auto h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-foreground">{filtered?"No hay evaluaciones con esos filtros.":"Aún no hay evaluaciones registradas."}</p>{!filtered&&<Button asChild variant="outline" className="mt-5"><Link href="/evaluar">Evaluar una marca</Link></Button>}</div>:<div className="mt-5 divide-y divide-border border-y border-border">{rows.map(row=><ComparisonRow key={row.id} comparison={row}/>)}</div>}</section>
  </div>
}

function Metric({label,value,detail}:{label:string;value:number;detail:string}){return <div className="border-b border-border py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0"><p className="text-3xl font-semibold tracking-[-0.03em] text-foreground">{value}</p><p className="mt-1 text-sm font-semibold text-foreground">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>}
function buildBrandIndex(rows:Array<{result_json?:unknown;brand_context?:unknown}>){const counts=new Map<string,number>();for(const row of rows){const primary=resolvePrimaryBrandName(row as Parameters<typeof resolvePrimaryBrandName>[0]);if(!primary)continue;counts.set(primary,(counts.get(primary)??0)+1)}return [...counts.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,8)}
