import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { formatDateLong, classificationLabel, classificationTone } from "@/lib/format"
import { cn } from "@/lib/utils"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"
import { resolveBrandContext, resolvePrimaryBrandName } from "@/lib/comparison/context"

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
  const tone = classificationTone(comparison.classification)
  return (
    <div className="group -mx-3 rounded-md px-3 py-2 transition-colors hover:bg-secondary/50">
      <div className="flex items-center gap-2">
        <Link href={`/comparisons/${comparison.id}`} className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={cn(
              "h-12 w-12 shrink-0 rounded-md flex items-center justify-center font-serif text-base",
              tone === "danger" && "bg-destructive/15 text-destructive",
              tone === "warn" && "bg-warning/15 text-warning",
              tone === "ok" && "bg-success/15 text-success",
              tone === "neutral" && "bg-secondary text-muted-foreground",
            )}
          >
            {Math.round(Number(comparison.similarity_score))}
            <span className="text-xs">%</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  tone === "danger" && "border-destructive text-destructive",
                  tone === "warn" && "border-warning text-warning",
                  tone === "ok" && "border-success text-success",
                  tone === "neutral" && "border-border text-muted-foreground",
                )}
              >
                {classificationLabel(comparison.classification)}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDateLong(comparison.created_at)}</span>
            </div>
            {comparison.recommendation && (
              <p className="text-sm text-foreground mt-1 line-clamp-1">{comparison.recommendation}</p>
            )}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <DeleteComparisonButton id={comparison.id} size="icon" iconOnly variant="ghost" />
        </div>
      </div>
      <ComparisonContext comparison={comparison} />
    </div>
  )
}

function ComparisonContext({ comparison }: { comparison: ComparisonLite }) {
  const brandContext = resolveBrandContext(comparison as Parameters<typeof resolveBrandContext>[0])
  const primary = resolvePrimaryBrandName(comparison as Parameters<typeof resolvePrimaryBrandName>[0])
  const niza = Array.from(
    new Set([
      ...(brandContext?.image_a?.hints?.niza ?? []),
      ...(brandContext?.image_b?.hints?.niza ?? []),
    ]),
  ).slice(0, 2)
  const viena = Array.from(
    new Set([
      ...(brandContext?.image_a?.hints?.viena ?? []),
      ...(brandContext?.image_b?.hints?.viena ?? []),
    ]),
  ).slice(0, 2)

  if (!primary && niza.length === 0 && viena.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {primary && (
        <Link href={`/consulta?q=${encodeURIComponent(primary)}&type=nombre`}>
          <Badge variant="secondary" className="text-[10px]">
            Marca probable: {primary}
          </Badge>
        </Link>
      )}
      {niza.map((code) => (
        <Link key={`niza-${comparison.id}-${code}`} href={`/consulta?q=${encodeURIComponent(code)}&type=niza`}>
          <Badge variant="outline" className="text-[10px]">
            Niza {code}
          </Badge>
        </Link>
      ))}
      {viena.map((code) => (
        <Link key={`viena-${comparison.id}-${code}`} href={`/consulta?q=${encodeURIComponent(code)}&type=viena`}>
          <Badge variant="outline" className="text-[10px]">
            Viena {code}
          </Badge>
        </Link>
      ))}
    </div>
  )
}
