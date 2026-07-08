import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShieldCheck } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:py-28 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Badge
            variant="outline"
            className="mb-6 gap-2 rounded-full border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Plataforma chilena para evidencia visual trazable
          </Badge>
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            <span className="text-primary">Evidencia visual trazable</span> para procesos críticos.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Comparación visual auditable con trazabilidad completa. Para seguros, minería, construcción, municipios y retail.
            Cada análisis genera un registro verificable con fecha, usuario, resultado y decisión final.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/auth/sign-up">
                Iniciar comparación
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="#como-funciona">Ver cómo funciona</Link>
            </Button>
          </div>

          <div className="mt-8 inline-flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-primary/5 px-4 py-3 backdrop-blur-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary flex-shrink-0" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              Análisis técnico auditable. Resultados con fecha, usuario y firma SHA256. Cumple LPDP Chile, LGPD Brasil, GDPR UE.
            </p>
          </div>
        </div>

        <div className="flex-1">
          <HeroPreview />
        </div>
      </div>
    </section>
  )
}

function HeroPreview() {
  return (
    <div className="rounded-2xl md:rounded-3xl border border-border bg-white p-4 md:p-6 shadow-lg">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-start gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-1" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground truncate">Comparación de productos</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Verificación de duplicados</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-primary border border-blue-500/30 flex-shrink-0">
          ✓ Mismo
        </span>
      </div>

      {/* Image Comparison */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5 md:mb-6">
        <ImagePreviewTile label="Producto A" type="a" />
        <ImagePreviewTile label="Producto B" type="b" />
      </div>

      {/* Score Section */}
      <div className="rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-900/10 to-slate-900/30 border border-blue-500/30 p-4 md:p-6 mb-4 md:mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
          {/* Score */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground leading-tight">Similitud</p>
            <p className="text-4xl md:text-3xl font-black text-primary mt-2">96.8%</p>
            <div className="mt-3 h-2 md:h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "96.8%" }} />
            </div>
          </div>

          {/* pHash */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground leading-tight">pHash</p>
            <p className="text-4xl md:text-3xl font-black text-primary mt-2">97.3</p>
            <p className="text-[10px] text-muted-foreground mt-2">Perceptual</p>
          </div>

          {/* Metadata */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground leading-tight">Metadata</p>
            <p className="text-4xl md:text-3xl font-black text-primary mt-2">94.5%</p>
            <p className="text-[10px] text-muted-foreground mt-2">EXIF Match</p>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DetailBox 
          icon="📦"
          label="Producto" 
          status="Idéntico"
          statusColor="text-primary"
        />
        <DetailBox 
          icon="📏"
          label="Dimensiones" 
          status="1920×1080"
          statusColor="text-primary"
        />
        <DetailBox 
          icon="✓"
          label="Veredicto" 
          status="Duplicado"
          statusColor="text-primary"
          highlight
        />
      </div>
    </div>
  )
}

function ImagePreviewTile({ label, type }: { label: string; type: "a" | "b" }) {
  const imageUrl = type === "a" ? "/product-a.jpg" : "/product-b.jpg"
  
  return (
    <div className="rounded-lg md:rounded-xl border border-border overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 shadow-sm">
      {/* Image Area */}
      <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center min-h-[140px] md:min-h-auto">
        <img 
          src={imageUrl} 
          alt={label}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          loading="lazy"
        />
      </div>

      {/* Info Footer */}
      <div className="border-t border-border bg-white px-2 md:px-3 py-2 md:py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">1920×1080</p>
        </div>
        <div className="text-xs font-mono text-primary font-bold flex-shrink-0">JPG</div>
      </div>
    </div>
  )
}

function DetailBox({ icon, label, status, statusColor, highlight = false }: { 
  icon: string
  label: string
  status: string
  statusColor: string
  highlight?: boolean 
}) {
  return (
    <div className={`rounded-lg border p-3 md:p-3 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/40'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground leading-tight min-w-0">{label}</p>
        <span className="text-base md:text-sm flex-shrink-0">{icon}</span>
      </div>
      <p className={`text-base md:text-sm font-bold break-words ${statusColor}`}>{status}</p>
    </div>
  )
}
