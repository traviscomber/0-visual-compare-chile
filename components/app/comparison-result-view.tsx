"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Clock,
  Fingerprint,
  Info,
  MapPin,
  PenSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
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
  const score = Math.round(Number(result.similarity_score))
  const tone = classificationTone(result.classification)
  const forensics = result.signals.forensics
  const evidenceCoverage = buildEvidenceCoverage(result)
  const artifacts = buildArtifactChecklist(result)
  const artifactCount = artifacts.filter((artifact) => artifact.available).length
  const ocrDetected = Boolean(result.ocr_a?.text || result.ocr_b?.text)
  const forensicsState = forensics?.ela_alert
    ? "Alerta ELA"
    : forensics?.any_edited
      ? "Edicion detectada"
      : "Sin alertas fuertes"

  return (
    <div className="flex flex-col gap-4">
      <Card className={cn("overflow-hidden border-2", toneBorder(tone))}>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-lg font-serif text-3xl",
                toneBackground(tone),
              )}
            >
              {score}
              <span className="text-base">%</span>
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 font-serif text-2xl">
                <ToneIcon tone={tone} />
                {classificationLabel(result.classification)}
              </CardTitle>
              <CardDescription className="mt-1 max-w-prose leading-relaxed">
                {result.recommendation ?? "Analisis completado correctamente."}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {forensics?.ela_alert && (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3 w-3" />
                ELA: posible edicion
              </Badge>
            )}
            {forensics?.any_edited && !forensics?.ela_alert && (
              <Badge variant="outline" className="gap-1 border-warning text-warning">
                <PenSquare className="h-3 w-3" />
                Editada en software
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs", toneBorder(tone), toneText(tone))}>
              Similitud global
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl">Resumen operativo inmediato</CardTitle>
          <CardDescription>El motor ya dejo trazado lo suficiente para decidir si seguir, consultar o escalar.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <OperationalStat
            label="Veredicto"
            value={classificationLabel(result.classification)}
            helper={`${score}% de similitud`}
            tone={tone}
          />
          <OperationalStat
            label="Cobertura"
            value={evidenceCoverage}
            helper={ocrDetected ? "OCR presente" : "Sin OCR fuerte"}
            tone="neutral"
          />
          <OperationalStat
            label="Forense"
            value={forensicsState}
            helper={forensics?.any_edited ? "Revisar ELA y software" : "EXIF consistente o incompleto"}
            tone={forensics?.ela_alert ? "danger" : forensics?.any_edited ? "warn" : "neutral"}
          />
          <OperationalStat
            label="Artefactos"
            value={`${artifactCount}/${artifacts.length}`}
            helper="Persistidos en el resultado"
            tone="neutral"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl">Contrato visible del resultado</CardTitle>
          <CardDescription>
            Esto es lo que el motor entrega y deja disponible para historial, detalle y auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {artifacts.map((artifact) => (
            <ArtifactRow
              key={artifact.label}
              label={artifact.label}
              description={artifact.description}
              available={artifact.available}
            />
          ))}
        </CardContent>
      </Card>

      {result.brand_context && <BrandTaxonomyCard context={result.brand_context} />}

      {(result.ocr_a || result.ocr_b) && (
        <OcrEvidenceCard ocrA={result.ocr_a ?? null} ocrB={result.ocr_b ?? null} />
      )}

      <ImageReview
        imageA={imageA}
        imageB={imageB}
        diffUrl={result.diff_url}
        elaUrlA={result.ela_url_a}
        elaUrlB={result.ela_url_b}
      />

      <ForensicsCard exifA={result.exif_a} exifB={result.exif_b} forensics={forensics} />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Detalle por dimension</CardTitle>
          <CardDescription>Cada senal aporta evidencia independiente al puntaje final.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {result.signals.pixel_similarity != null && (
            <SignalRow
              label="Diferencia pixel a pixel"
              value={result.signals.pixel_similarity}
              description="Comparacion directa en una grilla normalizada de 768px. Es la senal mas sensible a manipulaciones locales."
              highlight
            />
          )}
          <SignalRow
            label="Hash perceptual DCT"
            value={result.signals.phash_similarity}
            description="Captura la estructura visual general (formas, regiones) y resiste recompresion y cambios menores de tono."
          />
          <SignalRow
            label="Histograma de color"
            value={result.signals.color_similarity}
            description="Compara la distribucion de tonos y luminancia entre ambas imagenes."
          />
          <SignalRow
            label="Relacion de aspecto"
            value={result.signals.aspect_ratio_similarity}
            description="Diferencia de proporcion entre ancho y alto."
          />
          <SignalRow
            label="Coincidencia exacta de bytes"
            value={result.signals.exact_match ? 100 : 0}
            description={
              result.signals.exact_match
                ? "Las dos imagenes son binariamente identicas (mismo SHA-256)."
                : "Las imagenes no son identicas a nivel de archivo."
            }
            binary
          />
        </CardContent>
      </Card>
    </div>
  )
}

function OcrEvidenceCard({ ocrA, ocrB }: { ocrA: OcrSummary | null; ocrB: OcrSummary | null }) {
  const hasAny = Boolean(ocrA?.text || ocrB?.text)
  if (!hasAny) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <Fingerprint className="h-5 w-5 text-muted-foreground" />
          Evidencia OCR
        </CardTitle>
        <CardDescription>
          Texto extraido de cada imagen. Sirve para auditar el contexto de marca usado por el motor.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <OcrColumn title="Imagen A" ocr={ocrA} />
        <OcrColumn title="Imagen B" ocr={ocrB} />
      </CardContent>
    </Card>
  )
}

function OperationalStat({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: ReturnType<typeof classificationTone> | "neutral"
}) {
  const toneStyles =
    tone === "danger"
      ? "border-destructive bg-destructive/5 text-destructive"
      : tone === "warn"
        ? "border-warning bg-warning/5 text-warning"
        : tone === "ok"
          ? "border-success bg-success/5 text-success"
          : "border-border bg-card text-foreground"

  return (
    <div className={`rounded-lg border p-4 ${toneStyles}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-serif font-semibold">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function ArtifactRow({
  label,
  description,
  available,
}: {
  label: string
  description: string
  available: boolean
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <Badge variant={available ? "secondary" : "outline"}>{available ? "Disponible" : "Vacante"}</Badge>
      </div>
    </div>
  )
}

function OcrColumn({ title, ocr }: { title: string; ocr: OcrSummary | null }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{title}</span>
        {ocr?.confidence != null && (
          <Badge variant="outline" className="text-[10px]">
            Confianza {ocr.confidence}%
          </Badge>
        )}
      </div>
      <p className="mt-2 break-words whitespace-pre-wrap text-sm text-foreground">
        {ocr?.text ?? "Sin texto detectado"}
      </p>
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
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <Tags className="h-5 w-5 text-muted-foreground" />
          Contexto de marca inferido
        </CardTitle>
        <CardDescription>
          Este bloque usa el nombre del archivo y metadatos visibles para sugerir marcas, clases Niza y codigos Viena.
          No reemplaza OCR ni revision humana, pero deja una ruta directa hacia la consulta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <BrandSnapshotCard title="Imagen A" snapshot={context.image_a} />
        <BrandSnapshotCard title="Imagen B" snapshot={context.image_b} />
        {hasShared && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4 text-muted-foreground" />
              Senales compartidas
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sharedNiza.map((code) => (
                <Link key={`niza-${code}`} href={`/consulta?type=niza&q=${encodeURIComponent(code)}`}>
                  <Badge variant="outline" className="gap-1 hover:bg-background">
                    <span>Niza {code}</span>
                    <span className="text-muted-foreground">
                      {getOperationalClassificationLabel("niza", code)}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                  </Badge>
                </Link>
              ))}
              {sharedViena.map((code) => (
                <Link key={`viena-${code}`} href={`/consulta?type=viena&q=${encodeURIComponent(code)}`}>
                  <Badge variant="outline" className="gap-1 hover:bg-background">
                    <span>Viena {code}</span>
                    <span className="text-muted-foreground">
                      {getOperationalClassificationLabel("viena", code)}
                    </span>
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

function BrandSnapshotCard({
  title,
  snapshot,
}: {
  title: string
  snapshot: BrandTaxonomySnapshotLike | null | undefined
}) {
  const hints = {
    niza: snapshot?.hints?.niza ?? [],
    viena: snapshot?.hints?.viena ?? [],
  }
  const matches = snapshot?.matches ?? []

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {snapshot ? snapshot.filename : "Sin contexto disponible"}
          </div>
        </div>
        {snapshot && (
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            {snapshot.source}
          </Badge>
        )}
      </div>

      {snapshot ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Consulta detectada:</span> {snapshot.query}
          </div>

          <div className="flex flex-wrap gap-2">
            {hints.niza.map((code) => (
              <Link key={`hint-niza-${title}-${code}`} href={`/consulta?type=niza&q=${encodeURIComponent(code)}`}>
                <Badge variant="secondary" className="gap-1">
                  <span>Niza {code}</span>
                  <span className="text-muted-foreground">
                    {getOperationalClassificationLabel("niza", code)}
                  </span>
                </Badge>
              </Link>
            ))}
            {hints.viena.map((code) => (
              <Link key={`hint-viena-${title}-${code}`} href={`/consulta?type=viena&q=${encodeURIComponent(code)}`}>
                <Badge variant="secondary" className="gap-1">
                  <span>Viena {code}</span>
                  <span className="text-muted-foreground">
                    {getOperationalClassificationLabel("viena", code)}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>

          {snapshot.primary_match ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Marca probable</div>
              <div className="mt-1 font-medium text-foreground">{snapshot.primary_match.nombre}</div>
              <div className="text-xs text-muted-foreground">{snapshot.primary_match.solicitante}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {snapshot.primary_match.numeroRegistro}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Relevancia {snapshot.primary_match.relevancia}%
                </Badge>
                {snapshot.primary_match.niza?.slice(0, 2).map((code) => (
                  <Badge key={`${snapshot.primary_match?.id}-primary-niza-${code}`} variant="outline" className="text-[10px]">
                    Niza {code} · {getOperationalClassificationLabel("niza", code)}
                  </Badge>
                ))}
                {snapshot.primary_match.viena?.slice(0, 2).map((code) => (
                  <Badge key={`${snapshot.primary_match?.id}-primary-viena-${code}`} variant="outline" className="text-[10px]">
                    Viena {code} · {getOperationalClassificationLabel("viena", code)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
              No se encontro una marca solida. La busqueda por nombre o clasificacion sigue disponible.
            </div>
          )}

          {matches.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Otras coincidencias</div>
              <div className="flex flex-wrap gap-2">
                {matches.slice(1).map((match) => (
                  <Badge key={match.id} variant="outline" className="text-[10px]">
                    {match.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Ninguna senal util en el nombre del archivo.
        </div>
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
    { id: "original", label: "Imagenes originales", available: true },
    { id: "diff", label: "Diferencias visuales", available: Boolean(diffUrl) },
    { id: "ela_a", label: "ELA imagen A", available: Boolean(elaUrlA) },
    { id: "ela_b", label: "ELA imagen B", available: Boolean(elaUrlB) },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="font-serif text-xl">Visualizacion forense</CardTitle>
          <CardDescription>
            Alterna entre las imagenes originales, el mapa de diferencias y los mapas ELA por imagen.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs
            .filter((tabItem) => tabItem.available)
            .map((tabItem) => (
              <Button
                key={tabItem.id}
                type="button"
                size="sm"
                variant={tab === tabItem.id ? "default" : "outline"}
                onClick={() => setTab(tabItem.id)}
              >
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
          <ImagePane
            label="Las zonas en rojo marcan los pixeles que difieren entre A y B"
            image={{ url: diffUrl, filename: "Mapa de diferencias" }}
            full
            accent
          />
        )}
        {tab === "ela_a" && elaUrlA && (
          <ImagePane
            label="ELA - imagen A. Zonas brillantes indican posibles ediciones."
            image={{ url: elaUrlA, filename: "ELA imagen A" }}
            full
          />
        )}
        {tab === "ela_b" && elaUrlB && (
          <ImagePane
            label="ELA - imagen B. Zonas brillantes indican posibles ediciones."
            image={{ url: elaUrlB, filename: "ELA imagen B" }}
            full
          />
        )}
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
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-md border bg-muted",
          full ? "aspect-video" : "aspect-[4/3]",
          accent ? "border-destructive" : "border-border",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url || "/placeholder.svg"}
            alt={image.filename}
            className="h-full w-full object-contain"
          />
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
        <CardTitle className="flex items-center gap-2 font-serif text-xl">
          <Fingerprint className="h-5 w-5 text-muted-foreground" />
          Analisis forense
        </CardTitle>
        <CardDescription>
          Metadatos EXIF y Error Level Analysis (ELA). Util para detectar ediciones, recortes o discrepancias entre las
          dos imagenes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ExifColumn title="Imagen A" exif={exifA} elaScore={elaA ?? null} />
        <ExifColumn title="Imagen B" exif={exifB} elaScore={elaB ?? null} />

        <ForensicMatchRow
          icon={Camera}
          label="Camara"
          value={
            forensics?.camera_match == null
              ? "Datos insuficientes"
              : forensics.camera_match
                ? "Misma camara declarada"
                : "Camaras diferentes"
          }
          ok={forensics?.camera_match}
        />
        <ForensicMatchRow
          icon={Clock}
          label="Diferencia de captura"
          value={
            forensics?.timestamp_delta_seconds == null
              ? "Sin timestamp en EXIF"
              : formatTimeDelta(forensics.timestamp_delta_seconds)
          }
          ok={forensics?.timestamp_delta_seconds == null ? null : forensics.timestamp_delta_seconds < 60}
        />
        <ForensicMatchRow
          icon={MapPin}
          label="Distancia GPS"
          value={
            forensics?.gps_distance_meters == null
              ? "Sin GPS en EXIF"
              : formatDistance(forensics.gps_distance_meters)
          }
          ok={forensics?.gps_distance_meters == null ? null : forensics.gps_distance_meters < 50}
        />
        <ForensicMatchRow
          icon={PenSquare}
          label="Software"
          value={
            forensics?.any_edited
              ? "Procesada por editor de imagenes"
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

function ExifColumn({
  title,
  exif,
  elaScore,
}: {
  title: string
  exif: ExifSummary | null
  elaScore: number | null
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {elaScore != null && (
          <Badge
            variant={elaScore > 40 ? "destructive" : elaScore > 20 ? "outline" : "secondary"}
            className="text-xs"
          >
            ELA {Math.round(elaScore)}
          </Badge>
        )}
      </div>
      <ExifLine label="Camara" value={exif?.camera ?? "-"} />
      <ExifLine label="Capturada" value={exif?.taken_at ? formatDate(exif.taken_at) : "-"} />
      <ExifLine
        label="GPS"
        value={exif?.gps ? `${exif.gps.lat.toFixed(5)}, ${exif.gps.lng.toFixed(5)}` : "-"}
      />
      <ExifLine label="Software" value={exif?.software ?? "-"} />
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
  const tone =
    ok === true ? "text-success" : ok === false ? "text-destructive" : "text-muted-foreground"

  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-4 py-3">
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
  return `${Math.round(seconds / 86_400)} dias`
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
  highlight,
}: {
  label: string
  value: number
  description: string
  binary?: boolean
  highlight?: boolean
}) {
  const pct = Math.round(value)

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border p-4",
        highlight ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-serif text-base text-foreground">
          {binary ? (pct === 100 ? "Si" : "No") : `${pct}%`}
        </span>
      </div>
      {!binary && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full", highlight ? "bg-primary" : "bg-foreground/70")}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            aria-hidden
          />
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function ToneIcon({ tone }: { tone: ReturnType<typeof classificationTone> }) {
  if (tone === "danger") return <ShieldAlert className="h-5 w-5 text-destructive" />
  if (tone === "warn") return <AlertTriangle className="h-5 w-5 text-warning" />
  if (tone === "ok") return <ShieldCheck className="h-5 w-5 text-success" />
  return <Info className="h-5 w-5 text-muted-foreground" />
}

function toneBorder(tone: ReturnType<typeof classificationTone>) {
  if (tone === "danger") return "border-destructive"
  if (tone === "warn") return "border-warning"
  if (tone === "ok") return "border-success"
  return "border-border"
}

function toneText(tone: ReturnType<typeof classificationTone>) {
  if (tone === "danger") return "text-destructive"
  if (tone === "warn") return "text-warning"
  if (tone === "ok") return "text-success"
  return "text-muted-foreground"
}

function toneBackground(tone: ReturnType<typeof classificationTone>) {
  if (tone === "danger") return "bg-destructive/15 text-destructive"
  if (tone === "warn") return "bg-warning/15 text-warning"
  if (tone === "ok") return "bg-success/15 text-success"
  return "bg-secondary text-foreground"
}

function buildEvidenceCoverage(result: ComparisonResultPayload): string {
  let score = 0

  if (result.signals.pixel_similarity != null) score += 1
  if (result.ocr_a?.text || result.ocr_b?.text) score += 1
  if (result.exif_a || result.exif_b) score += 1
  if (result.brand_context?.shared_niza?.length || result.brand_context?.shared_viena?.length) score += 1

  if (score >= 4) return "Alta"
  if (score >= 2) return "Media"
  return "Basica"
}

function buildArtifactChecklist(result: ComparisonResultPayload) {
  return [
    {
      label: "Clasificacion y recomendacion",
      description: "Veredicto principal del motor para decidir la siguiente accion operativa.",
      available: Boolean(result.classification && result.recommendation),
    },
    {
      label: "Mapa de diferencias",
      description: "Overlay visual pixel a pixel para revisar zonas concretas de cambio.",
      available: Boolean(result.diff_url),
    },
    {
      label: "Error Level Analysis",
      description: "Senal forense para detectar edicion, recompresion o recortes sospechosos.",
      available: Boolean(result.ela_url_a || result.ela_url_b),
    },
    {
      label: "OCR y contexto de marca",
      description: "Texto detectado y cruces Niza o Viena listos para consulta.",
      available: Boolean(
        result.ocr_a?.text ||
          result.ocr_b?.text ||
          result.brand_context?.shared_niza?.length ||
          result.brand_context?.shared_viena?.length,
      ),
    },
    {
      label: "Metadatos EXIF",
      description: "Camara, fecha, GPS y software si la imagen los expone.",
      available: Boolean(result.exif_a || result.exif_b),
    },
  ]
}
