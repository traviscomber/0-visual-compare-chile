import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, Search, ShieldCheck, Tags } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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

  if (!marca) {
    notFound()
  }

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
      ? marca.metadata.source_url
      : null
  const numeroSolicitud =
    typeof marca.metadata?.numero_solicitud === "string" && marca.metadata.numero_solicitud.trim()
      ? marca.metadata.numero_solicitud.trim()
      : typeof marca.metadata?.numSolicitud === "string" && marca.metadata.numSolicitud.trim()
        ? marca.metadata.numSolicitud.trim()
        : "Sin numero"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_40%,_#111827_100%)] text-white">
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
            <Link href={`/consulta?q=${encodeURIComponent(marca.nombre)}&type=nombre`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a consulta
            </Link>
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              <Link href={`/compare?brand=${encodeURIComponent(marca.nombre)}`}>
                Cruzar en compare
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
              <Link href={`/api/report/pdf?id=${encodeURIComponent(marca.id)}`} target="_blank" rel="noreferrer">
                Descargar PDF
              </Link>
            </Button>
            {sourceUrl ? (
              <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400">
                <Link href={sourceUrl} target="_blank" rel="noreferrer">
                  Ver fuente
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge className="border border-blue-400/20 bg-blue-500/15 text-blue-100">Ficha de marca</Badge>
                <h1 className="mt-4 text-3xl font-semibold text-white">{marca.nombre}</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">{marca.solicitante || "Solicitante no disponible"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Riesgo operativo</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.riskLabel}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Estado" value={marca.estado} />
              <InfoCard label="Registro" value={marca.numeroRegistro || "Sin numero"} />
              <InfoCard label="Solicitud" value={numeroSolicitud} />
              <InfoCard label="Fecha" value={formatTrademarkDate(marca.fecha)} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <TaxonomyCard title="Clases Niza" values={marca.niza} tone="blue" emptyLabel="Sin clases visibles" />
              <TaxonomyCard title="Codigos Viena" values={marca.viena} tone="cyan" emptyLabel="Sin codigos visibles" />
            </div>
          </Card>

          <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 p-3 text-blue-200">
                {summary.risk === "high" ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Resumen ejecutivo</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{summary.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{summary.recommendation}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SummaryStat label="Conflictos altos" value={String(summary.criticalCount)} />
              <SummaryStat label="Marcas registradas" value={String(summary.registeredCount)} />
              <SummaryStat label="Clases expuestas" value={summary.topNiza.join(", ") || "Sin dato"} />
              <SummaryStat label="Estados dominantes" value={summary.topStates.join(" · ") || "Sin dato"} />
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Siguiente accion</p>
              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200">
                1. Revisar conflictos nominales. 2. Confirmar cobertura Niza. 3. Si usas logo, validar tambien en Compare.
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-cyan-200" />
              <div>
                <h2 className="text-xl font-semibold text-white">Conflictos relacionados</h2>
                <p className="text-sm text-slate-300">Ranking directo para decidir si esta marca requiere revision adicional.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {relatedResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
                  No aparecieron conflictos nominales directos en la base sincronizada para esta marca.
                </div>
              ) : (
                relatedResults.map((result) => {
                  const risk = buildResultRiskLevel(result, marca.nombre, "nombre")
                  const reason = buildResultReason(result, marca.nombre, "nombre")
                  return (
                    <Link
                      key={result.marca.id}
                      href={`/marca/${result.marca.id}`}
                      className="block rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{result.marca.nombre}</p>
                          <p className="mt-1 text-sm text-slate-300">{result.marca.solicitante || "Titular no disponible"}</p>
                        </div>
                        <Badge className={badgeClassName(risk)}>{formatRiskLabel(risk)}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-slate-200">{reason}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>Relevancia {result.relevancia}%</span>
                        <span>{result.marca.estado}</span>
                        <span>Niza {result.marca.niza.slice(0, 2).join(", ") || "sin dato"}</span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            {relatedResults.length ? (
              <div className="mt-6">
                <div className="mb-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Objetivo vs conflicto</p>
                  <p className="mt-1 text-sm text-slate-300">Resumen operativo para entender por que el motor eleva cada alerta.</p>
                </div>

                <div className="space-y-3">
                  {relatedResults.slice(0, 3).map((result) => {
                    const risk = buildResultRiskLevel(result, marca.nombre, "nombre")
                    const reason = buildResultReason(result, marca.nombre, "nombre")
                    const sharedNiza = intersectCodes(marca.niza, result.marca.niza)
                    const sharedViena = intersectCodes(marca.viena, result.marca.viena)

                    return (
                      <div key={`brief-${result.marca.id}`} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {marca.nombre} vs {result.marca.nombre}
                            </p>
                            <p className="mt-1 text-sm text-slate-300">{reason}</p>
                          </div>
                          <Badge className={badgeClassName(risk)}>{formatRiskLabel(risk)}</Badge>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <ComparisonColumn
                            title="Marca objetivo"
                            name={marca.nombre}
                            subtitle={marca.estado}
                            taxonomy={`Niza ${marca.niza.slice(0, 3).join(", ") || "sin dato"} · Viena ${marca.viena.slice(0, 2).join(", ") || "sin dato"}`}
                          />
                          <ComparisonColumn
                            title="Marca conflicto"
                            name={result.marca.nombre}
                            subtitle={result.marca.estado}
                            taxonomy={`Niza ${result.marca.niza.slice(0, 3).join(", ") || "sin dato"} · Viena ${result.marca.viena.slice(0, 2).join(", ") || "sin dato"}`}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Relevancia {result.relevancia}%
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Niza compartida {sharedNiza.join(", ") || "ninguna"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Viena compartida {sharedViena.join(", ") || "ninguno"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-200" />
              <div>
                <h2 className="text-xl font-semibold text-white">Metadata visible</h2>
                <p className="text-sm text-slate-300">Solo el detalle que sirve para decision y trazabilidad.</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <MetadataRow label="Source" value={String(marca.metadata?.source ?? "inapi")} />
              <MetadataRow label="Source record id" value={String(marca.metadata?.source_record_id ?? marca.id)} />
              <MetadataRow label="Estado original" value={String(marca.metadata?.estadoOriginal ?? marca.estado)} />
              <MetadataRow label="Tipo marca" value={String(marca.metadata?.tipoMarca ?? "Sin dato")} />
              <MetadataRow label="Subtipo" value={String(marca.metadata?.subtipoMarca ?? "Sin dato")} />
              <MetadataRow label="Pais" value={marca.pais} />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Atajos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {marca.niza.slice(0, 3).map((code) => (
                  <Link
                    key={`niza-${code}`}
                    href={`/consulta?type=niza&q=${encodeURIComponent(code)}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
                  >
                    Niza {code}
                  </Link>
                ))}
                {marca.viena.slice(0, 3).map((code) => (
                  <Link
                    key={`viena-${code}`}
                    href={`/consulta?type=viena&q=${encodeURIComponent(code)}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100 transition hover:bg-white/10"
                  >
                    Viena {code}
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function TaxonomyCard({
  title,
  values,
  tone,
  emptyLabel,
}: {
  title: string
  values: string[]
  tone: "blue" | "cyan"
  emptyLabel: string
}) {
  const toneClassName =
    tone === "blue"
      ? "border-blue-400/30 text-blue-100"
      : "border-cyan-400/30 text-cyan-100"

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4 text-slate-300" />
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <Badge key={value} variant="outline" className={toneClassName}>
              {value}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-slate-400">{emptyLabel}</span>
        )}
      </div>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  )
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm text-slate-100">{value}</p>
    </div>
  )
}

function badgeClassName(risk: "high" | "medium" | "low") {
  if (risk === "high") {
    return "border border-red-400/30 bg-red-500/15 text-red-100"
  }

  if (risk === "medium") {
    return "border border-amber-400/30 bg-amber-500/15 text-amber-100"
  }

  return "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
}

function ComparisonColumn({
  title,
  name,
  subtitle,
  taxonomy,
}: {
  title: string
  name: string
  subtitle: string
  taxonomy: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-medium text-white">{name}</p>
      <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{taxonomy}</p>
    </div>
  )
}

function intersectCodes(left: string[], right: string[]) {
  const rightSet = new Set(right)
  return left.filter((value, index) => rightSet.has(value) && left.indexOf(value) === index)
}
