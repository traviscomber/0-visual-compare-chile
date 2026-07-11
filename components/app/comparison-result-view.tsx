"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Camera,
  MapPin,
  Clock,
  PenSquare,
  Fingerprint,
  Sparkles,
} from "lucide-react"
import { classificationLabel, classificationTone, formatDate } from "@/lib/format"
import type { AiAnalysis, ComparisonResultPayload, ExifSummary, ForensicSignals } from "@/types/comparison"

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

  return (
    <div className="flex flex-col gap-4">
      <Card className={cn("overflow-hidden border-2", toneBorder(tone))}>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-20 w-20 rounded-lg flex items-center justify-center font-serif text-3xl",
                toneBackground(tone),
              )}
            >
              {score}
              <span className="text-base">%</span>
            </div>
            <div>
              <CardTitle className="font-serif text-2xl flex items-center gap-2">
                <ToneIcon tone={tone} />
                {classificationLabel(result.classification)}
              </CardTitle>
              <CardDescription className="mt-1 leading-relaxed max-w-prose">
                {result.recommendation ?? "Análisis completado correctamente."}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {forensics?.ela_alert && (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="h-3 w-3" />
                ELA: posible edición
              </Badge>
            )}
            {forensics?.any_edited && !forensics?.ela_alert && (
              <Badge variant="outline" className="gap-1 text-warning border-warning">
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

      <ImageReview
        imageA={imageA}
        imageB={imageB}
        diffUrl={result.diff_url}
        elaUrlA={result.ela_url_a}
        elaUrlB={result.ela_url_b}
      />

      {result.ai_analysis && <AiAnalysisCard analysis={result.ai_analysis} />}

      <ForensicsCard exifA={result.exif_a} exifB={result.exif_b} forensics={forensics} />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Detalle por dimensión</CardTitle>
          <CardDescription>Cada señal aporta evidencia independiente al puntaje final.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.signals.pixel_similarity != null && (
            <SignalRow
              label="Diferencia píxel a píxel"
              value={result.signals.pixel_similarity}
              description="Comparación directa en una grilla normalizada de 768px. Es la señal más sensible a manipulaciones locales."
              highlight
            />
          )}
          <SignalRow
            label="Hash perceptual DCT"
            value={result.signals.phash_similarity}
            description="Captura la estructura visual general (formas, regiones) y resiste recompresión y cambios menores de tono."
          />
          <SignalRow
            label="Histograma de color"
            value={result.signals.color_similarity}
            description="Compara la distribución de tonos y luminancia entre ambas imágenes."
          />
          <SignalRow
            label="Relación de aspecto"
            value={result.signals.aspect_ratio_similarity}
            description="Diferencia de proporción entre ancho y alto."
          />
          <SignalRow
            label="Coincidencia exacta de bytes"
            value={result.signals.exact_match ? 100 : 0}
            description={
              result.signals.exact_match
                ? "Las dos imágenes son binariamente idénticas (mismo SHA-256)."
                : "Las imágenes no son idénticas a nivel de archivo."
            }
            binary
          />
        </CardContent>
      </Card>
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
    { id: "original", label: "Imágenes originales", available: true },
    { id: "diff", label: "Diferencias visuales", available: Boolean(diffUrl) },
    { id: "ela_a", label: "ELA imagen A", available: Boolean(elaUrlA) },
    { id: "ela_b", label: "ELA imagen B", available: Boolean(elaUrlB) },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3">
        <div>
          <CardTitle className="font-serif text-xl">Visualización forense</CardTitle>
          <CardDescription>
            Alterna entre las imágenes originales, el mapa de diferencias y los mapas ELA por imagen.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs
            .filter((t) => t.available)
            .map((t) => (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={tab === t.id ? "default" : "outline"}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {tab === "original" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ImagePane label="Imagen A" image={imageA} />
            <ImagePane label="Imagen B" image={imageB} />
          </div>
        )}
        {tab === "diff" && diffUrl && (
          <ImagePane
            label="Las zonas en rojo marcan los píxeles que difieren entre A y B"
            image={{ url: diffUrl, filename: "Mapa de diferencias" }}
            full
            accent
          />
        )}
        {tab === "ela_a" && elaUrlA && (
          <ImagePane
            label="ELA — imagen A. Zonas brillantes indican posibles ediciones."
            image={{ url: elaUrlA, filename: "ELA imagen A" }}
            full
          />
        )}
        {tab === "ela_b" && elaUrlB && (
          <ImagePane
            label="ELA — imagen B. Zonas brillantes indican posibles ediciones."
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
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      <div
        className={cn(
          "rounded-md overflow-hidden border bg-muted flex items-center justify-center",
          full ? "aspect-video" : "aspect-[4/3]",
          accent ? "border-destructive" : "border-border",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url || "/placeholder.svg"}
            alt={image.filename}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-muted-foreground px-3 text-center">Imagen no disponible</span>
        )}
      </div>
      {image && full && <div className="text-[11px] text-muted-foreground mt-1.5">{image.filename}</div>}
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
    (forensics?.ela_score_a != null && forensics?.ela_score_a !== undefined) ||
    (forensics?.ela_score_b != null && forensics?.ela_score_b !== undefined)

  if (!hasAny) return null

  const elaA = forensics?.ela_score_a
  const elaB = forensics?.ela_score_b

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-muted-foreground" />
          Análisis forense
        </CardTitle>
        <CardDescription>
          Metadatos EXIF y Error Level Analysis (ELA). Útil para detectar ediciones, recortes o discrepancias entre las
          dos imágenes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ExifColumn title="Imagen A" exif={exifA} elaScore={elaA ?? null} />
        <ExifColumn title="Imagen B" exif={exifB} elaScore={elaB ?? null} />

        <ForensicMatchRow
          icon={Camera}
          label="Cámara"
          value={
            forensics?.camera_match == null
              ? "Datos insuficientes"
              : forensics.camera_match
                ? "Misma cámara declarada"
                : "Cámaras diferentes"
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
          ok={
            forensics?.timestamp_delta_seconds == null
              ? null
              : forensics.timestamp_delta_seconds < 60
          }
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
    <div className="rounded-md border border-border p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {elaScore != null && (
          <Badge variant={elaScore > 40 ? "destructive" : elaScore > 20 ? "outline" : "secondary"} className="text-xs">
            ELA {Math.round(elaScore)}
          </Badge>
        )}
      </div>
      <ExifLine label="Cámara" value={exif?.camera ?? "—"} />
      <ExifLine label="Capturada" value={exif?.taken_at ? formatDate(exif.taken_at) : "—"} />
      <ExifLine
        label="GPS"
        value={exif?.gps ? `${exif.gps.lat.toFixed(5)}, ${exif.gps.lng.toFixed(5)}` : "—"}
      />
      <ExifLine label="Software" value={exif?.software ?? "—"} />
    </div>
  )
}

function ExifLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right truncate">{value}</span>
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
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-sm truncate", tone)}>{value}</div>
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
        "rounded-md border p-4 flex flex-col gap-2",
        highlight ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="font-serif text-base text-foreground">
          {binary ? (pct === 100 ? "Sí" : "No") : `${pct}%`}
        </span>
      </div>
      {!binary && (
        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn("h-full", highlight ? "bg-primary" : "bg-foreground/70")}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            aria-hidden
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
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

function AiAnalysisCard({ analysis }: { analysis: AiAnalysis }) {
  const riskColor =
    analysis.confusion_risk === "high"
      ? "text-destructive"
      : analysis.confusion_risk === "medium"
        ? "text-warning"
        : "text-success"

  const riskBorder =
    analysis.confusion_risk === "high"
      ? "border-destructive/40"
      : analysis.confusion_risk === "medium"
        ? "border-warning/40"
        : "border-success/40"

  return (
    <Card className={cn("border-2", riskBorder)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análisis GPT-4o mini
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("gap-1.5 text-xs", riskColor, riskBorder)}>
              Riesgo de confusión: {analysis.confusion_risk === "high" ? "Alto" : analysis.confusion_risk === "medium" ? "Medio" : "Bajo"}
            </Badge>
            <span className={cn("font-serif text-2xl font-bold", riskColor)}>
              {analysis.ai_score}
              <span className="text-sm font-normal text-muted-foreground ml-0.5">/ 100</span>
            </span>
          </div>
        </div>
        {analysis.summary && (
          <CardDescription className="mt-1 leading-relaxed">{analysis.summary}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.similarities.length > 0 && (
            <div className="rounded-md border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Similitudes detectadas</p>
              <ul className="flex flex-col gap-1.5">
                {analysis.similarities.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.differences.length > 0 && (
            <div className="rounded-md border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Diferencias detectadas</p>
              <ul className="flex flex-col gap-1.5">
                {analysis.differences.map((d, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {(analysis.colors_a.length > 0 || analysis.colors_b.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {analysis.colors_a.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Colores imagen A</p>
                <div className="flex gap-2 flex-wrap">
                  {analysis.colors_a.map((hex, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="h-5 w-5 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: hex }}
                        aria-label={hex}
                      />
                      <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.colors_b.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Colores imagen B</p>
                <div className="flex gap-2 flex-wrap">
                  {analysis.colors_b.map((hex, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="h-5 w-5 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: hex }}
                        aria-label={hex}
                      />
                      <span className="text-xs text-muted-foreground font-mono">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {analysis.tokens_used > 0 && (
          <p className="text-xs text-muted-foreground text-right">
            {analysis.tokens_used} tokens — ~${((analysis.tokens_used * 0.00000015)).toFixed(5)} USD
          </p>
        )}
      </CardContent>
    </Card>
  )
}
