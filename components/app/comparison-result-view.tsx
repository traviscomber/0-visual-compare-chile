"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Camera,
  Clock,
  Fingerprint,
  MapPin,
  PenSquare,
  Search,
  ShieldAlert,
  Tags,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOperationalClassificationLabel } from "@/lib/classification-knowledge"
import { classificationLabel, classificationTone, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type {
  BrandTaxonomyContext,
  BrandTaxonomySnapshotLike,
  ComparisonResultPayload,
  ExifSummary,
  ForensicSignals,
  OcrSummary,
} from "@/types/comparison"

type ImageInfo = { url: string; filename: string } | null

export function ComparisonResultView({
  result,
  imageA,
  imageB,
}: {
  result: ComparisonResultPayload
  imageA: ImageInfo
  imageB: ImageInfo
}) {
  const tone = classificationTone(result.classification)
  const forensics = result.signals.forensics
  const evidenceCoverage = buildEvidenceCoverage(result)
  const artifacts = buildArtifactChecklist(result)
  const artifactCount = artifacts.filter((artifact) => artifact.available).length
  const ocrDetected = Boolean(result.ocr_a?.text || result.ocr_b?.text)
  const forensicsState = forensics?.ela_alert
    ? "Alerta ELA"
    : forensics?.any_edited
      ? "Edición detectada"
      : "Sin alertas fuertes"

  return (
    <div className="flex flex-col gap-6">
      <section className="border-y border-border bg-card/40 px-5 py-7 sm:px-7">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Evidencia visual / lectura técnica
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-medium tracking-[-0.035em] text-foreground sm:text-4xl">
                {classificationLabel(result.classification)}
              </h2>
              <span className={cn("h-2 w-2 rounded-full", toneDot(tone))} aria-hidden />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {result.recommendation ?? "La comparación quedó registrada con sus señales técnicas y artefactos de evidencia."}
            </p>
          </div>

          <div className="border-l border-border pl-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Qué significa esto</p>
            <p className="mt-2 text-sm leading-6 text-foreground/85">
              La clasificación sintetiza señales de imagen. No determina confundibilidad jurídica, registrabilidad ni una decisión de INAPI.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {forensics?.ela_alert ? (
                <Badge variant="destructive" className="gap-1">
                  <ShieldAlert className="h-3 w-3" /> ELA requiere revisión
                </Badge>
              ) : null}
              {forensics?.any_edited && !forensics?.ela_alert ? (
                <Badge variant="outline" className="gap-1 border-warning text-warning">
                  <PenSquare className="h-3 w-3" /> Edición detectada
                </Badge>
              ) : null}
              <Badge variant="outline">Resultado trazable</Badge>
            </div>
          </div>
        </div>

        <div className="mt-7 grid border-t border-border sm:grid-cols-3">
          <OperationalStat label="Cobertura" value={evidenceCoverage} helper={ocrDetected ? "OCR disponible" : "Sin OCR fuerte"} />
          <OperationalStat
            label="Forense"
            value={forensicsState}
            helper={forensics?.any_edited ? "Revisar ELA y metadatos" : "EXIF consistente o incompleto"}
          />
          <OperationalStat label="Artefactos" value={`${artifactCount}/${artifacts.length}`} helper="Persistidos en el resultado" />
        </div>
      </section>

      <section className="border-y border-border px-1 py-2">
        <div className="px-4 py-4 sm:px-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Trazabilidad</p>
          <h3 className="mt-2 text-xl font-medium tracking-tight text-foreground">Qué quedó guardado con esta comparación</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Cada bloque indica si existe evidencia suficiente para volver a revisar el resultado desde historial o detalle.
          </p>
        </div>
        <div className="divide-y divide-border border-t border-border">
          {artifacts.map((artifact) => (
            <ArtifactRow key={artifact.label} label={artifact.label} description={artifact.description} available={artifact.available} />
          ))}
        </div>
      </section>

      {result.brand_context && <BrandTaxonomyCard context={result.brand_context} />}

      {(result.ocr_a || result.ocr_b) && <OcrEvidenceCard ocrA={result.ocr_a ?? null} ocrB={result.ocr_b ?? null} />}

      <ImageReview imageA={imageA} imageB={imageB} diffUrl={result.diff_url} elaUrlA={result.ela_url_a} elaUrlB={result.ela_url_b} />

      <ForensicsCard exifA={result.exif_a} exifB={result.exif_b} forensics={forensics} />

      <section className="border-y border-border px-5 py-6 sm:px-7">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Señales técnicas separadas</p>
        <h3 className="mt-2 text-xl font-medium tracking-tight text-foreground">La clasificación no depende de una sola cifra.</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Revisa cada señal por separado. Los porcentajes son mediciones técnicas de imagen y no equivalen a riesgo jurídico ni probabilidad de registro.
        </p>
        <div className="mt-5 divide-y divide-border border-y border-border">
          {result.signals.pixel_similarity != null && (
            <SignalRow
              label="Diferencia pixel a pixel"
              value={result.signals.pixel_similarity}
              description="Comparación directa en una grilla normalizada de 768 px; sensible a cambios locales."
            />
          )}
          <SignalRow
            label="Hash perceptual DCT"
            value={result.signals.phash_similarity}
            description="Captura estructura visual general y resiste recompresión o cambios menores de tono."
          />
          <SignalRow
            label="Histograma de color"
            value={result.signals.color_similarity}
            description="Compara la distribución de tonos y luminancia entre ambas imágenes."
          />
          <SignalRow
            label="Relación de aspecto"
            value={result.signals.aspect_ratio_similarity}
            description="Mide cuánto se parecen las proporciones ancho/alto de las dos imágenes."
          />
          <SignalRow
            label="Coincidencia exacta de bytes"
            value={result.signals.exact_match ? 100 : 0}
            description={
              result.signals.exact_match
                ? "Las dos imágenes son binariamente idénticas y comparten el mismo SHA-256."
                : "Las imágenes no son idénticas a nivel de archivo."
            }
            binary
          />
        </div>
      </section>
    </div>
  )
}

function OcrEvidenceCard({ ocrA, ocrB }: { ocrA: OcrSummary | null; ocrB: OcrSummary | null }) {
  const hasAny = Boolean(ocrA?.text || ocrB?.text)
  if (!hasAny) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Fingerprint className="h-5 w-5 text-muted-foreground" /> Evidencia OCR
        </CardTitle>
        <CardDescription>Texto extraído de cada imagen para auditar el contexto utilizado por la comparación.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <OcrColumn title="Imagen A" ocr={ocrA} />
        <OcrColumn title="Imagen B" ocr={ocrB} />
      </CardContent>
    </Card>
  )
}

function OperationalStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="border-b border-border py-4 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-medium text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  )
}

function ArtifactRow({ label, description, available }: { label: string; description: string; available: boolean }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Badge variant={available ? "secondary" : "outline"} className="w-fit shrink-0">
        {available ? "Disponible" : "Sin evidencia"}
      </Badge>
    </div>
  )
}

function OcrColumn({ title, ocr }: { title: string; ocr: OcrSummary | null }) {
  return (
    <div className="border-l border-border pl-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{title}</span>
        {ocr?.confidence != null && <Badge variant="outline">Confianza OCR {ocr.confidence}%</Badge>}
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{ocr?.text ?? "Sin texto detectado"}</p>
      <p className="mt-2 text-xs text-muted-foreground">Idioma: {ocr?.language ?? "n/d"}</p>
    </div>
  )
}

function BrandTaxonomyCard({ context }: { context: BrandTaxonomyContext }) {
  const sharedNiza = context.shared_niza ?? []
  const sharedViena = context.shared_viena ?? []
  const hasShared = sharedNiza.length > 0 || sharedViena.length > 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Tags className="h-5 w-5 text-muted-foreground" /> Contexto de marca inferido
        </CardTitle>
        <CardDescription>
          Usa nombre de archivo y metadatos visibles para sugerir contexto Niza/Viena. Es una pista de investigación, no una identidad confirmada.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <BrandSnapshotCard title="Imagen A" snapshot={context.image_a} />
        <BrandSnapshotCard title="Imagen B" snapshot={context.image_b} />
        {hasShared && (
          <div className="border-t border-border pt-4 md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4 text-muted-foreground" /> Señales de clasificación compartidas
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sharedNiza.map((code) => (
                <Link key={`niza-${code}`} href={`/investigar?q=${encodeURIComponent(code)}`}>
                  <Badge variant="outline" className="gap-1 hover:bg-secondary/40">
                    <span>Niza {code}</span>
                    <span className="text-muted-foreground">{getOperationalClassificationLabel("niza", code)}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Badge>
                </Link>
              ))}
              {sharedViena.map((code) => (
                <Link key={`viena-${code}`} href={`/investigar?q=${encodeURIComponent(code)}`}>
                  <Badge variant="outline" className="gap-1 hover:bg-secondary/40">
                    <span>Viena {code}</span>
                    <span className="text-muted-foreground">{getOperationalClassificationLabel("viena", code)}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BrandSnapshotCard({ title, snapshot }: { title: string; snapshot: BrandTaxonomySnapshotLike | null | undefined }) {
  const hints = {
    niza: snapshot?.hints?.niza ?? [],
    viena: snapshot?.hints?.viena ?? [],
  }
  const matches = snapshot?.matches ?? []

  return (
    <div className="border-l border-border pl-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{snapshot ? snapshot.filename : "Sin contexto disponible"}</p>
        </div>
        {snapshot && <Badge variant="outline">{snapshot.source}</Badge>}
      </div>

      {snapshot ? (
        <div className="mt-4 space-y-4">
          <div className="text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Consulta detectada:</span> {snapshot.query}
          </div>

          <div className="flex flex-wrap gap-2">
            {hints.niza.map((code) => (
              <Link key={`hint-niza-${title}-${code}`} href={`/investigar?q=${encodeURIComponent(code)}`}>
                <Badge variant="secondary" className="gap-1">
                  <span>Niza {code}</span>
                  <span className="text-muted-foreground">{getOperationalClassificationLabel("niza", code)}</span>
                </Badge>
              </Link>
            ))}
            {hints.viena.map((code) => (
              <Link key={`hint-viena-${title}-${code}`} href={`/investigar?q=${encodeURIComponent(code)}`}>
                <Badge variant="secondary" className="gap-1">
                  <span>Viena {code}</span>
                  <span className="text-muted-foreground">{getOperationalClassificationLabel("viena", code)}</span>
                </Badge>
              </Link>
            ))}
          </div>

          {snapshot.primary_match ? (
            <div className="border-t border-primary/25 pt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Identidad por confirmar</p>
              <p className="mt-2 font-medium text-foreground">{snapshot.primary_match.nombre}</p>
              <p className="mt-1 text-xs text-muted-foreground">{snapshot.primary_match.solicitante || "Titular no informado"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.primary_match.numeroRegistro ? <Badge variant="outline">Registro {snapshot.primary_match.numeroRegistro}</Badge> : null}
                {snapshot.primary_match.niza?.slice(0, 2).map((code) => (
                  <Badge key={`${snapshot.primary_match?.id}-primary-niza-${code}`} variant="outline">
                    Niza {code} · {getOperationalClassificationLabel("niza", code)}
                  </Badge>
                ))}
                {snapshot.primary_match.viena?.slice(0, 2).map((code) => (
                  <Badge key={`${snapshot.primary_match?.id}-primary-viena-${code}`} variant="outline">
                    Viena {code} · {getOperationalClassificationLabel("viena", code)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="border-t border-dashed border-border pt-3 text-xs leading-5 text-muted-foreground">
              No se detectó una identidad suficientemente clara. Continúa la investigación por nombre o clasificación.
            </p>
          )}

          {matches.length > 1 && (
            <div className="border-t border-border pt-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Otras coincidencias contextuales</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {matches.slice(1).map((match, index) => (
                  <Badge key={match.id ?? `${title}-${match.nombre ?? "match"}-${index}`} variant="outline">
                    {match.nombre || "Sin nombre"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 border-t border-dashed border-border pt-3 text-xs text-muted-foreground">Sin señales útiles en nombre o metadatos.</p>
      )}
    </div>
  )
}

type ImagePaneTab = "original" | "diff" | "ela_a" | "ela_b"

function ImageReview({
  imageA,
  imageB,
  diffUrl,
  elaUrlA,
  elaUrlB,
}: {
  imageA: ImageInfo
  imageB: ImageInfo
  diffUrl: string | null
  elaUrlA: string | null
  elaUrlB: string | null
}) {
  const [tab, setTab] = useState<ImagePaneTab>(diffUrl ? "diff" : "original")
  const tabs: { id: ImagePaneTab; label: string; available: boolean }[] = [
    { id: "original", label: "Originales", available: true },
    { id: "diff", label: "Diferencias", available: Boolean(diffUrl) },
    { id: "ela_a", label: "ELA A", available: Boolean(elaUrlA) },
    { id: "ela_b", label: "ELA B", available: Boolean(elaUrlB) },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-xl font-medium">Inspección visual</CardTitle>
          <CardDescription>Alterna entre originales, mapa de diferencias y Error Level Analysis sin perder el contexto del resultado.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs.filter((tabItem) => tabItem.available).map((tabItem) => (
            <Button key={tabItem.id} type="button" size="sm" variant={tab === tabItem.id ? "default" : "outline"} onClick={() => setTab(tabItem.id)}>
              {tabItem.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {tab === "original" && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ImagePane label="Imagen A" image={imageA} />
            <ImagePane label="Imagen B" image={imageB} />
          </div>
        )}
        {tab === "diff" && diffUrl && (
          <ImagePane label="Las zonas resaltadas marcan píxeles que difieren entre A y B" image={{ url: diffUrl, filename: "Mapa de diferencias" }} full accent />
        )}
        {tab === "ela_a" && elaUrlA && <ImagePane label="ELA imagen A · zonas brillantes pueden requerir revisión" image={{ url: elaUrlA, filename: "ELA imagen A" }} full />}
        {tab === "ela_b" && elaUrlB && <ImagePane label="ELA imagen B · zonas brillantes pueden requerir revisión" image={{ url: elaUrlB, filename: "ELA imagen B" }} full />}
      </CardContent>
    </Card>
  )
}

function ImagePane({
  label,
  image,
  full,
  accent,
}: {
  label: string
  image: { url: string; filename: string } | null
  full?: boolean
  accent?: boolean
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div className={cn("flex items-center justify-center overflow-hidden rounded-md border bg-muted", full ? "aspect-video" : "aspect-[4/3]", accent ? "border-primary/40" : "border-border")}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url || "/placeholder.svg"} alt={image.filename} className="h-full w-full object-contain" />
        ) : (
          <span className="px-3 text-center text-xs text-muted-foreground">Imagen no disponible</span>
        )}
      </div>
      {image && full && <div className="mt-1.5 text-[11px] text-muted-foreground">{image.filename}</div>}
    </div>
  )
}

function ForensicsCard({
  exifA,
  exifB,
  forensics,
}: {
  exifA: ExifSummary | null
  exifB: ExifSummary | null
  forensics: ForensicSignals | undefined
}) {
  const hasAny =
    (exifA && (exifA.camera || exifA.taken_at || exifA.gps || exifA.software)) ||
    (exifB && (exifB.camera || exifB.taken_at || exifB.gps || exifB.software)) ||
    (forensics?.ela_score_a != null && forensics.ela_score_a !== undefined) ||
    (forensics?.ela_score_b != null && forensics.ela_score_b !== undefined)

  if (!hasAny) return null

  const elaA = forensics?.ela_score_a
  const elaB = forensics?.ela_score_b

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-medium">
          <Fingerprint className="h-5 w-5 text-muted-foreground" /> Análisis forense
        </CardTitle>
        <CardDescription>Metadatos EXIF y ELA para detectar ediciones, recortes o discrepancias entre las dos imágenes.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ExifColumn title="Imagen A" exif={exifA} elaScore={elaA ?? null} />
        <ExifColumn title="Imagen B" exif={exifB} elaScore={elaB ?? null} />
        <ForensicMatchRow
          icon={Camera}
          label="Cámara"
          value={forensics?.camera_match == null ? "Datos insuficientes" : forensics.camera_match ? "Misma cámara declarada" : "Cámaras diferentes"}
          ok={forensics?.camera_match}
        />
        <ForensicMatchRow
          icon={Clock}
          label="Diferencia de captura"
          value={forensics?.timestamp_delta_seconds == null ? "Sin timestamp en EXIF" : formatTimeDelta(forensics.timestamp_delta_seconds)}
          ok={forensics?.timestamp_delta_seconds == null ? null : forensics.timestamp_delta_seconds < 60}
        />
        <ForensicMatchRow
          icon={MapPin}
          label="Distancia GPS"
          value={forensics?.gps_distance_meters == null ? "Sin GPS en EXIF" : formatDistance(forensics.gps_distance_meters)}
          ok={forensics?.gps_distance_meters == null ? null : forensics.gps_distance_meters < 50}
        />
        <ForensicMatchRow
          icon={PenSquare}
          label="Software"
          value={
            forensics?.any_edited
              ? "Procesada por editor de imágenes"
              : forensics?.software_match == null
                ? "Sin software declarado"
                : forensics.software_match
                  ? "Mismo software"
                  : "Software distinto"
          }
          ok={forensics?.any_edited ? false : forensics?.software_match ?? null}
        />
      </CardContent>
    </Card>
  )
}

function ExifColumn({ title, exif, elaScore }: { title: string; exif: ExifSummary | null; elaScore: number | null }) {
  return (
    <div className="flex flex-col gap-2 border-l border-border pl-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {elaScore != null && <Badge variant={elaScore > 40 ? "destructive" : elaScore > 20 ? "outline" : "secondary"}>ELA {Math.round(elaScore)}</Badge>}
      </div>
      <ExifLine label="Cámara" value={exif?.camera ?? "—"} />
      <ExifLine label="Capturada" value={exif?.taken_at ? formatDate(exif.taken_at) : "—"} />
      <ExifLine label="GPS" value={exif?.gps ? `${exif.gps.lat.toFixed(5)}, ${exif.gps.lng.toFixed(5)}` : "—"} />
      <ExifLine label="Software" value={exif?.software ?? "—"} />
    </div>
  )
}

function ExifLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value}</span>
    </div>
  )
}

function ForensicMatchRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: typeof Camera
  label: string
  value: string
  ok: boolean | null | undefined
}) {
  const tone = ok === true ? "text-success" : ok === false ? "text-destructive" : "text-muted-foreground"
  return (
    <div className="flex items-center gap-3 border-t border-border px-1 py-3">
      <Icon className={cn("h-4 w-4 shrink-0", tone)} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("truncate text-sm", tone)}>{value}</div>
      </div>
    </div>
  )
}

function formatTimeDelta(seconds: number): string {
  if (seconds < 1) return "Misma marca temporal"
  if (seconds < 60) return `${Math.round(seconds)} s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86_400) return `${(seconds / 3600).toFixed(1)} h`
  return `${Math.round(seconds / 86_400)} días`
}

function formatDistance(meters: number): string {
  if (meters < 1) return "Mismo punto"
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

function SignalRow({
  label,
  value,
  description,
  binary,
}: {
  label: string
  value: number
  description: string
  binary?: boolean
}) {
  const pct = Math.round(value)
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="font-mono text-xs text-foreground sm:pt-0.5">{binary ? (pct === 100 ? "Sí" : "No") : `${pct}%`}</div>
    </div>
  )
}

function toneDot(tone: ReturnType<typeof classificationTone>) {
  if (tone === "danger") return "bg-destructive"
  if (tone === "warn") return "bg-warning"
  if (tone === "ok") return "bg-success"
  return "bg-muted-foreground"
}

function buildEvidenceCoverage(result: ComparisonResultPayload): string {
  let score = 0
  if (result.signals.pixel_similarity != null) score += 1
  if (result.ocr_a?.text || result.ocr_b?.text) score += 1
  if (result.exif_a || result.exif_b) score += 1
  if (result.brand_context?.shared_niza?.length || result.brand_context?.shared_viena?.length) score += 1
  if (score >= 4) return "Alta"
  if (score >= 2) return "Media"
  return "Básica"
}

function buildArtifactChecklist(result: ComparisonResultPayload) {
  return [
    {
      label: "Lectura técnica y recomendación",
      description: "Síntesis operativa de las señales disponibles; no constituye una conclusión jurídica.",
      available: Boolean(result.classification && result.recommendation),
    },
    {
      label: "Mapa de diferencias",
      description: "Overlay visual pixel a pixel para revisar zonas concretas de cambio.",
      available: Boolean(result.diff_url),
    },
    {
      label: "Error Level Analysis",
      description: "Señal forense para detectar edición, recompresión o recortes que ameriten revisión.",
      available: Boolean(result.ela_url_a || result.ela_url_b),
    },
    {
      label: "OCR y contexto de marca",
      description: "Texto detectado y cruces Niza/Viena disponibles como contexto de investigación.",
      available: Boolean(
        result.ocr_a?.text ||
          result.ocr_b?.text ||
          result.brand_context?.shared_niza?.length ||
          result.brand_context?.shared_viena?.length,
      ),
    },
    {
      label: "Metadatos EXIF",
      description: "Cámara, fecha, GPS y software cuando la imagen los expone.",
      available: Boolean(result.exif_a || result.exif_b),
    },
  ]
}
