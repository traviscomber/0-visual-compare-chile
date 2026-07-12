import Link from "next/link"
import { redirect } from "next/navigation"
import { GitCompareArrows, Tags } from "lucide-react"
import { ComparisonRow } from "@/components/app/comparison-row"
import { HistoryFilters } from "@/components/app/history-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { resolvePrimaryBrandName } from "@/lib/comparison/context"
import { createClient } from "@/lib/supabase/server"

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
    .select("id, similarity_score, classification, recommendation, created_at, result_json, brand_context")
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
  const averageScore =
    rows.length > 0
      ? Math.round(rows.reduce((sum, row) => sum + Number(row.similarity_score), 0) / rows.length)
      : 0
  const highRiskCount = rows.filter(
    (row) =>
      row.classification === "exact_match" ||
      row.classification === "near_duplicate" ||
      Number(row.similarity_score) >= 85,
  ).length
  const brandIndex = buildBrandIndex(rows)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Historial</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered
              ? `${rows.length} resultado${rows.length === 1 ? "" : "s"} con los filtros aplicados.`
              : `Tus ultimas ${rows.length} comparaciones, ordenadas por fecha.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/compare">
            <GitCompareArrows className="mr-2 h-4 w-4" />
            Nueva comparacion
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Comparaciones visibles</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Promedio de similitud</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{averageScore}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Casos de alto riesgo</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{highRiskCount}</p>
          </CardContent>
        </Card>
      </div>

      {brandIndex.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 font-serif text-lg">
              <Tags className="h-4 w-4 text-muted-foreground" />
              Indice de marcas detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brandIndex.map((item) => (
                <Button key={item.name} variant="outline" size="sm" asChild className="h-auto py-2">
                  <Link href={`/consulta?q=${encodeURIComponent(item.name)}&type=nombre`}>
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{item.count}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="rounded-md border border-dashed border-border px-4 py-12 text-center">
              <p className="mb-4 text-muted-foreground">
                {filtered
                  ? "No hay comparaciones que coincidan con esos filtros."
                  : "Tu historial aparecera aqui una vez que ejecutes tu primera comparacion."}
              </p>
              {!filtered && (
                <Button asChild>
                  <Link href="/compare">Hacer primera comparacion</Link>
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

function buildBrandIndex(rows: Array<{ result_json?: unknown; brand_context?: unknown }>) {
  const counts = new Map<string, number>()

  for (const row of rows) {
    const primary = resolvePrimaryBrandName(row as Parameters<typeof resolvePrimaryBrandName>[0])
    if (!primary) continue
    counts.set(primary, (counts.get(primary) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 8)
}
