import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { notFound } from "next/navigation"
import { OperationalHeader, OperationalPage, OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const APPLICATION_PATTERN = /^[A-Za-z0-9._-]{2,80}$/

type PageProps = { params: Promise<{ applicationNumber: string }> }

export default async function PatentEvidenceDetailPage({ params }: PageProps) {
  const { applicationNumber: rawApplicationNumber } = await params
  const applicationNumber = decodeURIComponent(rawApplicationNumber).trim()
  if (!APPLICATION_PATTERN.test(applicationNumber)) notFound()

  const admin = createAdminClient()
  const { data: patent, error } = await admin
    .from("patent_records")
    .select("id,application_number,registration_number,title,applicants,representatives,inventors,filing_date,publication_date,registration_date,expiration_date,type_name,subtype_name,status,country,applicant_location,applicant_region,representative_location,representative_region,pct_application_date,pct_publication_date,priorities,source_url,last_synced_at")
    .eq("source", "inapi")
    .eq("application_number", applicationNumber)
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Could not load INAPI patent record: ${error.message}`)
  if (!patent) notFound()

  const { data: ipcRows, error: ipcError } = await admin
    .from("patent_record_ipc")
    .select("code")
    .eq("patent_record_id", patent.id)
    .order("code", { ascending: true })
    .limit(40)
  if (ipcError) throw new Error(`Could not load patent IPC: ${ipcError.message}`)

  const sourceUrl = safeHttpUrl(patent.source_url)
  const ipc = (ipcRows ?? []).map((row) => String(row.code)).filter(Boolean)

  return <OperationalPage>
    <OperationalHeader
      eyebrow="VIDENTIA / Patentes / Registro"
      title={patent.title || `Solicitud ${applicationNumber}`}
      description={<>Ficha exacta del expediente observado en el mirror oficial de INAPI. La fuente de datos y el registro canónico se mantienen separados.</>}
      meta={<><span>Solicitud {patent.application_number || applicationNumber}</span><span>{patent.status || "Estado no informado"}</span><span>INAPI Open Data</span></>}
      actions={<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/patentes"><ArrowLeft className="h-4 w-4"/>Patentes</Link></Button>{sourceUrl?<Button asChild variant="outline"><a href={sourceUrl} target="_blank" rel="noreferrer">Fuente de datos INAPI<ExternalLink className="h-4 w-4"/></a></Button>:null}</div>}
    />

    <section className="py-9"><OperationalPanel>
      <OperationalSectionHeader eyebrow="01 / Ficha" title="Información del expediente" meta="Registro observado → procedencia oficial"/>
      <div className="mt-5 grid gap-x-8 gap-y-5 border-y border-border/80 py-6 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Solicitud" value={patent.application_number}/>
        <Field label="Registro" value={patent.registration_number}/>
        <Field label="Estado" value={patent.status}/>
        <Field label="Tipo" value={[patent.type_name, patent.subtype_name].filter(Boolean).join(" · ")}/>
        <Field label="Presentación" value={formatDate(patent.filing_date)}/>
        <Field label="Publicación" value={formatDate(patent.publication_date)}/>
        <Field label="Fecha de registro" value={formatDate(patent.registration_date)}/>
        <Field label="Expiración" value={formatDate(patent.expiration_date)}/>
        <Field label="País" value={patent.country}/>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-white">Actores</h2>
          <div className="mt-3 space-y-4">
            <Field label="Solicitantes" value={patent.applicants}/>
            <Field label="Inventores" value={patent.inventors}/>
            <Field label="Representantes" value={patent.representatives}/>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-white">Clasificación y prioridad</h2>
          <div className="mt-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">IPC</p>{ipc.length?<div className="mt-2 flex flex-wrap gap-1.5">{ipc.map((code)=><Badge key={code} variant="outline">{code}</Badge>)}</div>:<p className="mt-1 text-sm text-muted-foreground">No informado</p>}</div>
          <div className="mt-4"><Field label="Prioridades" value={patent.priorities}/></div>
        </div>
      </div>

      <div className="mt-7 border-l-2 border-[#96B5A6]/35 pl-4 text-xs leading-5 text-muted-foreground">
        Esta ficha reproduce el registro canónico importado desde INAPI Open Data. “Fuente de datos INAPI” identifica la procedencia del dataset; no se presenta como si fuera un deep link oficial a esta patente.
        {patent.last_synced_at ? ` Última sincronización: ${formatDateTime(patent.last_synced_at)}.` : ""}
      </div>
    </OperationalPanel></section>
  </OperationalPage>
}

function Field({ label, value }: { label: string; value: unknown }) {
  const text = typeof value === "string" ? value.trim() : value == null ? "" : String(value)
  return <div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm leading-6 text-[#E7DFCE]">{text || "No informado"}</p></div>
}

function safeHttpUrl(value: unknown) {
  const text = typeof value === "string" ? value.trim() : ""
  return /^https?:\/\//i.test(text) ? text : null
}

function formatDate(value: unknown) {
  const text = typeof value === "string" ? value : ""
  if (!text) return ""
  const date = new Date(`${text.slice(0, 10)}T12:00:00Z`)
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "UTC" }).format(date)
}

function formatDateTime(value: unknown) {
  const text = typeof value === "string" ? value : ""
  if (!text) return ""
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(date)
}
