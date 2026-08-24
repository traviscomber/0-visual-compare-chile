import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getOperationalClassificationLabel } from "@/lib/classification-knowledge"
import { getTrademarkRecordById, searchTrademarkRecords } from "@/lib/trademark-records"
import {
  buildResultReason,
  buildResultRiskLevel,
  buildTrademarkDetailSummary,
  formatRiskLabel,
  formatTrademarkDate,
} from "@/lib/trademark-insights"

interface MarcaDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MarcaDetailPage({ params }: MarcaDetailPageProps) {
  const { id } = await params
  const { result: marca } = await getTrademarkRecordById(id)

  if (!marca) notFound()

  const relatedResponse = await searchTrademarkRecords({
    query: marca.nombre,
    type: "nombre",
    filters: {},
    page: 1,
    limit: 6,
  })

  const relatedResults = relatedResponse.results.filter((result) => result.marca.id !== marca.id).slice(0, 5)
  const summary = buildTrademarkDetailSummary(marca, relatedResults)
  const sourceUrl =
    typeof marca.metadata?.source_url === "string" && marca.metadata.source_url.trim()
      ? marca.metadata.source_url.trim()
      : null
  const numeroSolicitud = metadataText(marca.metadata, ["numero_solicitud", "numSolicitud"]) || "—"
  const sourceName = metadataText(marca.metadata, ["source"]) || "INAPI / base sincronizada"
  const sourceRecordId = metadataText(marca.metadata, ["source_record_id"]) || marca.id
  const originalState = metadataText(marca.metadata, ["estadoOriginal"]) || marca.estado
  const trademarkType = metadataText(marca.metadata, ["tipoMarca"]) || "—"
  const trademarkSubtype = metadataText(marca.metadata, ["subtipoMarca"]) || "—"

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <Button asChild variant="ghost" className="-ml-3">
            <Link href={`/consulta-inapi?q=${encodeURIComponent(marca.nombre)}&type=nombre&match=3&autorun=1`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a fuente INAPI
            </Link>
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/compare?brand=${encodeURIComponent(marca.nombre)}`}>Comparar evidencia visual</Link>
            </Button>
            {sourceUrl ? (
              <Button asChild>
                <Link href={sourceUrl} target="_blank" rel="noreferrer">
                  Abrir fuente
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <header className="grid gap-7 border-b border-border pb-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Ficha de antecedente</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-medium tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
              {marca.nombre}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              {marca.solicitante || "Titular o solicitante no informado en el registro disponible."}
            </p>
          </div>

          <div className="border-l border-border pl-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Qué significa esta ficha</p>
            <p className="mt-2 text-sm leading-6 text-foreground/85">
              Reúne datos del registro y antecedentes relacionados para facilitar revisión. No determina disponibilidad, confundibilidad jurídica ni registrabilidad.
            </p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Fuente ≠ análisis ≠ decisión jurídica.</p>
          </div>
        </header>

        <section aria-labelledby="record-facts-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">01 / Registro</p>
              <h2 id="record-facts-title" className="mt-2 text-2xl font-medium tracking-tight">Datos observables</h2>
            </div>
            <Badge variant="outline">{sourceName}</Badge>
          </div>

          <div className="grid border-y border-border sm:grid-cols-2 lg:grid-cols-5">
            <Fact label="Estado" value={marca.estado || "—"} />
            <Fact label="Registro" value={marca.numeroRegistro || "—"} />
            <Fact label="Solicitud" value={numeroSolicitud} />
            <Fact label="Fecha" value={formatTrademarkDate(marca.fecha)} />
            <Fact label="País" value={marca.pais || "—"} />
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]" aria-labelledby="taxonomy-title">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">02 / Clasificación</p>
            <h2 id="taxonomy-title" className="mt-2 text-2xl font-medium tracking-tight">Ámbito visible del antecedente</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Las clases y códigos ayudan a ubicar el registro. Abre una investigación para revisar contexto, coexistencia y otros antecedentes.
            </p>
          </div>

          <div className="divide-y divide-border border-y border-border">
            <TaxonomyRow title="Clases Niza" values={marca.niza} kind="niza" emptyLabel="Sin clases visibles" />
            <TaxonomyRow title="Códigos Viena" values={marca.viena} kind="viena" emptyLabel="Sin códigos visibles" />
          </div>
        </section>

        <section aria-labelledby="review-title">
          <div className="grid gap-6 border-y border-border py-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">03 / Contexto relacionado</p>
              <h2 id="review-title" className="mt-2 text-2xl font-medium tracking-tight">{summary.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{summary.recommendation}</p>
            </div>
            <div className="grid grid-cols-3 border-l border-border pl-5">
              <CompactFact label="Prioridad" value={summary.riskLabel} />
              <CompactFact label="Antecedentes" value={String(relatedResults.length)} />
              <CompactFact label="Registrados" value={String(summary.registeredCount)} />
            </div>
          </div>

          <div className="divide-y divide-border">
            {relatedResults.length === 0 ? (
              <div className="py-8">
                <p className="text-sm font-medium text-foreground">Sin antecedentes relacionados en esta muestra.</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Esto describe únicamente la consulta disponible y no equivale a disponibilidad o registrabilidad.
                </p>
              </div>
            ) : (
              relatedResults.map((result) => {
                const priority = buildResultRiskLevel(result, marca.nombre, "nombre")
                const reason = buildResultReason(result, marca.nombre, "nombre")
                const sharedNiza = intersectCodes(marca.niza, result.marca.niza)
                const sharedViena = intersectCodes(marca.viena, result.marca.viena)

                return (
                  <Link
                    key={result.marca.id}
                    href={`/marca/${result.marca.id}`}
                    className="grid gap-4 py-5 transition-colors hover:bg-secondary/20 sm:px-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-medium text-foreground">{result.marca.nombre}</h3>
                        <span className={priorityClassName(priority)}>Prioridad {formatRiskLabel(priority).toLowerCase()}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{reason}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {result.marca.solicitante || "Titular no informado"} · {result.marca.estado}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                      {sharedNiza.slice(0, 3).map((code) => <Badge key={`${result.marca.id}-niza-${code}`} variant="outline">Niza {code}</Badge>)}
                      {sharedViena.slice(0, 3).map((code) => <Badge key={`${result.marca.id}-viena-${code}`} variant="outline">Viena {code}</Badge>)}
                      {!sharedNiza.length && !sharedViena.length ? <Badge variant="outline">Sin clase compartida visible</Badge> : null}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-[1fr_1fr]" aria-labelledby="trace-title">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">04 / Trazabilidad</p>
            <h2 id="trace-title" className="mt-2 text-2xl font-medium tracking-tight">Metadatos disponibles</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Se muestran únicamente campos que ayudan a rastrear el origen y estado del registro sincronizado.
            </p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            <MetadataRow label="Fuente" value={sourceName} />
            <MetadataRow label="ID en la fuente" value={sourceRecordId} />
            <MetadataRow label="Estado original" value={originalState} />
            <MetadataRow label="Tipo de marca" value={trademarkType} />
            <MetadataRow label="Subtipo" value={trademarkSubtype} />
          </div>
        </section>

        <section className="border-y border-border py-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Siguiente acción</p>
              <p className="mt-2 text-lg font-medium text-foreground">Profundiza sólo donde la evidencia lo justifique.</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Revisa la fuente oficial, abre antecedentes relacionados y usa comparación visual cuando exista un signo gráfico relevante.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/investigar?q=${encodeURIComponent(marca.nombre)}`}>Investigar contexto</Link>
              </Button>
              <Button asChild>
                <Link href={`/compare?brand=${encodeURIComponent(marca.nombre)}`}>
                  Comparar evidencia
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function metadataText(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number") return String(value)
  }
  return ""
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border py-4 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function CompactFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-border px-4 last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-medium text-foreground">{value}</p>
    </div>
  )
}

function TaxonomyRow({
  title,
  values,
  kind,
  emptyLabel,
}: {
  title: string
  values: string[]
  kind: "niza" | "viena"
  emptyLabel: string
}) {
  return (
    <div className="py-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <Link key={`${kind}-${value}`} href={`/investigar?q=${encodeURIComponent(value)}`}>
              <Badge variant="outline" className="gap-1 hover:bg-secondary/30">
                {kind === "niza" ? "Niza" : "Viena"} {value}
                <span className="text-muted-foreground">· {getOperationalClassificationLabel(kind, value)}</span>
              </Badge>
            </Link>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">{emptyLabel}</span>
        )}
      </div>
    </div>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-baseline">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="break-words text-sm text-foreground">{value || "—"}</p>
    </div>
  )
}

function priorityClassName(priority: "high" | "medium" | "low") {
  if (priority === "high") return "font-mono text-[10px] uppercase tracking-[0.14em] text-destructive"
  if (priority === "medium") return "font-mono text-[10px] uppercase tracking-[0.14em] text-warning"
  return "font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
}

function intersectCodes(left: string[], right: string[]) {
  const rightSet = new Set(right)
  return left.filter((value, index) => rightSet.has(value) && left.indexOf(value) === index)
}
