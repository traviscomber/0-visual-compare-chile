import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ComparisonRow } from "@/components/app/comparison-row"
import { HistoryFilters } from "@/components/app/history-filters"
import { GitCompareArrows } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchParams {
  classification?: string
  min?: string
  max?: string
  q?: string
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const classification = sp.classification ?? "all"
  const minScore = sp.min ?? ""
  const maxScore = sp.max ?? ""
  const query = sp.q ?? ""

  const supabase = await createClient()
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent("/history")}`)
  }

  let request = supabase
    .from("comparisons")
    .select("id, similarity_score, classification, recommendation, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (classification && classification !== "all") {
    request = request.eq("classification", classification)
  }
  const minNum = Number(minScore)
  if (minScore && !Number.isNaN(minNum)) request = request.gte("similarity_score", minNum)
  const maxNum = Number(maxScore)
  if (maxScore && !Number.isNaN(maxNum)) request = request.lte("similarity_score", maxNum)
  if (query.trim().length > 0) request = request.ilike("recommendation", `%${query.trim()}%`)

  const { data: comparisons } = await request
  const rows = comparisons ?? []
  const filtered =
    classification !== "all" || minScore !== "" || maxScore !== "" || query.length > 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Historial</h1>
          <p className="text-muted-foreground mt-1">
            {filtered
              ? `${rows.length} resultado${rows.length === 1 ? "" : "s"} con los filtros aplicados.`
              : `Tus últimas ${rows.length} comparaciones, ordenadas por fecha.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/compare">
            <GitCompareArrows className="h-4 w-4 mr-2" />
            Nueva comparación
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryFilters
            defaultClassification={classification}
            defaultMinScore={minScore}
            defaultMaxScore={maxScore}
            defaultQuery={query}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Comparaciones registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-border rounded-md">
              <p className="text-muted-foreground mb-4">
                {filtered
                  ? "No hay comparaciones que coincidan con esos filtros."
                  : "Tu historial aparecerá aquí una vez que ejecutes tu primera comparación."}
              </p>
              {!filtered && (
                <Button asChild>
                  <Link href="/compare">Hacer primera comparación</Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((row) => (
                <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                  <ComparisonRow comparison={row} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
