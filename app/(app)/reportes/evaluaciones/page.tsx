import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, FileSearch } from "lucide-react"
import { ComparisonRow } from "@/components/app/comparison-row"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function LegacyEvaluationsPage(){
  const supabase=await createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)redirect("/auth/login?redirectTo=%2Freportes%2Fevaluaciones")
  const {data,error}=await supabase.from("comparisons").select("id, similarity_score, classification, recommendation, created_at, result_json, brand_context").eq("user_id",auth.user.id).order("created_at",{ascending:false}).limit(200)
  if(error)throw new Error("No pudimos cargar las evaluaciones guardadas.")
  const rows=data??[]
  return <OperationalPage>
    <Button asChild variant="ghost" size="sm" className="mb-4 w-fit px-0 text-muted-foreground hover:bg-transparent hover:text-white"><Link href="/reportes"><ArrowLeft className="h-4 w-4"/>Volver a Reportes</Link></Button>
    <OperationalHeader eyebrow="VIDENTIA / Reportes / Evaluaciones" title="Historial técnico de comparaciones de marca." description={<>Esta vista conserva las evaluaciones anteriores. No son reportes comunes versionados y no se presentan como dictámenes jurídicos.</>} meta={<><span>Legacy preservado</span><span>Evidencia técnica</span><span>Revisión humana</span></>}/>
    <section className="py-8"><OperationalSectionHeader eyebrow="Registro" title="Evaluaciones persistidas" meta={`${rows.length} resultado${rows.length===1?"":"s"}`}/>{rows.length?<div className="mt-5 divide-y divide-border/80 border-y border-border/80">{rows.map(row=><ComparisonRow key={row.id} comparison={row}/>)}</div>:<OperationalPanel className="mt-5 py-10 text-center"><FileSearch className="mx-auto h-5 w-5 text-[#96B5A6]"/><p className="mt-4 text-sm font-medium text-white">Aún no hay evaluaciones guardadas.</p></OperationalPanel>}</section>
  </OperationalPage>
}
