import Link from "next/link"
import { ArrowRight, ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"
import { resolveBrandContext, resolvePrimaryBrandName } from "@/lib/comparison/context"
import { classificationLabel, formatDateLong } from "@/lib/format"

type ComparisonLite = {
  id: string
  similarity_score: number
  classification: string
  recommendation: string | null
  created_at: string
  brand_context?: {
    image_a?: { primary_match?: { nombre?: string | null } | null; hints?: { niza?: string[]; viena?: string[] } }
    image_b?: { primary_match?: { nombre?: string | null } | null; hints?: { niza?: string[]; viena?: string[] } }
  } | null
  result_json?: {
    brand_context?: {
      image_a?: { primary_match?: { nombre?: string | null } | null; hints?: { niza?: string[]; viena?: string[] } }
      image_b?: { primary_match?: { nombre?: string | null } | null; hints?: { niza?: string[]; viena?: string[] } }
    } | null
  } | null
}

export function ComparisonRow({ comparison }: { comparison: ComparisonLite }) {
  const primary = resolvePrimaryBrandName(comparison as Parameters<typeof resolvePrimaryBrandName>[0])
  return (
    <div className="group grid gap-4 py-5 sm:grid-cols-[36px_1fr_auto] sm:items-start">
      <span className="flex h-9 w-9 items-center justify-center border border-border bg-card/40 text-muted-foreground"><ImageIcon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-md">{classificationLabel(comparison.classification)}</Badge>
          {primary ? <span className="text-xs font-medium text-foreground">{primary}</span> : null}
          <span className="text-xs text-muted-foreground">{formatDateLong(comparison.created_at)}</span>
        </div>
        {comparison.recommendation ? <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/90">{comparison.recommendation}</p> : <p className="mt-2 text-sm text-muted-foreground">Sin recomendación registrada.</p>}
        <ComparisonContext comparison={comparison} />
      </div>
      <div className="flex items-center gap-2 sm:justify-self-end">
        <Link href={`/comparisons/${comparison.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline">Abrir evaluación <ArrowRight className="h-3.5 w-3.5" /></Link>
        <div className="opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><DeleteComparisonButton id={comparison.id} size="icon" iconOnly variant="ghost" /></div>
      </div>
    </div>
  )
}

function ComparisonContext({ comparison }: { comparison: ComparisonLite }) {
  const brandContext = resolveBrandContext(comparison as Parameters<typeof resolveBrandContext>[0])
  const primary = resolvePrimaryBrandName(comparison as Parameters<typeof resolvePrimaryBrandName>[0])
  const niza = Array.from(new Set([...(brandContext?.image_a?.hints?.niza ?? []), ...(brandContext?.image_b?.hints?.niza ?? [])])).slice(0, 3)
  const viena = Array.from(new Set([...(brandContext?.image_a?.hints?.viena ?? []), ...(brandContext?.image_b?.hints?.viena ?? [])])).slice(0, 3)

  if (!primary && niza.length === 0 && viena.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {primary && <Link href={`/investigar?q=${encodeURIComponent(primary)}&mode=brand`}><Badge variant="secondary" className="rounded-md text-[10px]">Investigar {primary}</Badge></Link>}
      {niza.map((code) => <Badge key={`niza-${comparison.id}-${code}`} variant="outline" className="rounded-md text-[10px]">Niza {code}</Badge>)}
      {viena.map((code) => <Badge key={`viena-${comparison.id}-${code}`} variant="outline" className="rounded-md text-[10px]">Viena {code}</Badge>)}
    </div>
  )
}
