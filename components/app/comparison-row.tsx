import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { formatDateLong, classificationLabel, classificationTone } from "@/lib/format"
import { cn } from "@/lib/utils"
import { DeleteComparisonButton } from "@/components/app/delete-comparison-button"

type ComparisonLite = {
  id: string
  similarity_score: number
  classification: string
  recommendation: string | null
  created_at: string
}

export function ComparisonRow({ comparison }: { comparison: ComparisonLite }) {
  const tone = classificationTone(comparison.classification)
  return (
    <div className="flex items-center gap-2 -mx-3 px-3 py-2 rounded-md transition-colors hover:bg-secondary/50 group">
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
  )
}
