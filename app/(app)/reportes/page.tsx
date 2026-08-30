import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, FileSearch, ImageIcon, Search, ShieldCheck, Tags } from "lucide-react"
import { ComparisonRow } from "@/components/app/comparison-row"
import { HistoryFilters } from "@/components/app/history-filters"
import {
  OperationalHeader,
  OperationalMetric,
  OperationalMetricRail,
  OperationalPage,
  OperationalPanel,
  OperationalSectionHeader,
} from "@/components/app/operational-ui"
import { Button } from "@/components/ui/button"
import { resolvePrimaryBrandName } from "@/lib/comparison/context"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface SearchParams {
  classification?: string
  q?: string
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const classification = sp.classification ?? "all"
  const query = sp.q ?? ""
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user) redirect(`/auth/login?redirectTo=${encodeURIComponent("/reportes")}`)

  let request = supabase
    .from("comparisons")
    .select("id, similarity_score, classification, recommendation, created_at, result_json, brand_context")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(200)

  if (classification && classification !== "all") request = request.eq("classification", classification)
  if (query.trim()) request = request.ilike("recommendation", `%${query.trim()}%`)

  const { data: comparisons, error } = await request
  if (error) throw new Error("No pudimos cargar las evaluaciones guardadas.")

  const rows = comparisons ?? []
  const filtered = classification !== "all" || query.trim().length > 0
  const closeCount = rows.filter(
    (row) => row.classification === "exact_match" || row.classification === "near_duplicate",
  ).length
  const visualCount = rows.filter(
    (row) => row.classification === "visually_similar" || row.classification === "partially_similar",
  ).length
  const brandIndex = buildBrandIndex(rows)

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Reportes"
        title={<>Revisa la evidencia que ya quedó registrada.</>}
        description={
          <p>
            Consolida evaluaciones persistidas y vuelve al detalle técnico que las originó. Cada registro mantiene su
            clasificación, recomendación y contexto marcario disponible sin convertirlos en una conclusión jurídica.
          </p>
        }
        meta={
          <>
            <span>Registros persistidos</span>
            <span>Evidencia técnica</span>
            <span>Sin certeza jurídica automática</span>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href="/investigar">Investigar</Link>
            </Button>
            <Button asChild>
              <Link href="/evaluar">
                Nueva evaluación <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <OperationalMetricRail>
        <OperationalMetric value={rows.length} label="Evaluaciones" detail="Registros visibles con los filtros actuales" />
        <OperationalMetric value={brandIndex.length} label="Marcas recientes" detail="Nombres identificados en esta vista" />
        <OperationalMetric
          value={closeCount}
          label="Coincidencias cercanas"
          detail="Clasificadas como exactas o muy cercanas"
          tone={closeCount > 0 ? "warning" : "neutral"}
        />
        <OperationalMetric value={visualCount} label="Señales visuales" detail="Similares o parcialmente similares" />
      </OperationalMetricRail>

      <section className="grid gap-6 border-b border-border/80 py-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)] lg:py-8">
        <div>
          <OperationalSectionHeader eyebrow="Alcance" title="Qué representa este módulo" />
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/82">
            Una entrada de Reportes es, por ahora, una evaluación técnica ya guardada. Desde aquí puedes volver a la
            evidencia, revisar señales y continuar la investigación marcaria.
          </p>
        </div>
        <OperationalPanel className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" />
            <div>
              <p className="text-sm font-medium text-white">Límite explícito</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Esta versión no presenta estas evaluaciones como dictámenes, no afirma registrabilidad y no promete
                exportación PDF ni versionado documental que el producto todavía no persiste.
              </p>
            </div>
          </div>
        </OperationalPanel>
      </section>

      {brandIndex.length > 0 ? (
        <section className="border-b border-border/80 py-7">
          <OperationalSectionHeader
            eyebrow="Marcas recientes"
            title="Retoma una investigación"
            meta={`${brandIndex.length} nombre${brandIndex.length === 1 ? "" : "s"}`}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {brandIndex.map((item) => (
              <Link
                key={item.name}
                href={`/investigar?q=${encodeURIComponent(item.name)}&autorun=1`}
                className="inline-flex min-h-10 items-center gap-2 rounded-[9px] bg-[#173B37] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#203F3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Tags className="h-3.5 w-3.5 text-[#96B5A6]" />
                {item.name}
                <span className="text-xs text-[#BDBEBD]">{item.count}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-b border-border/80 py-7 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.32fr)_minmax(0,0.68fr)] lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-[#96B5A6]">
              <Search className="h-4 w-4" />
              <p className="text-[10px] font-medium uppercase tracking-[0.16em]">Filtrar evidencia</p>
            </div>
            <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">Encuentra una evaluación anterior</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Filtra por clasificación registrada o por texto de la recomendación persistida.
            </p>
          </div>
          <HistoryFilters defaultClassification={classification} defaultQuery={query} basePath="/reportes" />
        </div>
      </section>

      <section className="py-8">
        <OperationalSectionHeader
          eyebrow="Registro"
          title="Evaluaciones guardadas"
          meta={`${rows.length} resultado${rows.length === 1 ? "" : "s"}`}
        />

        {rows.length === 0 ? (
          <OperationalPanel className="mt-5 py-10 text-center sm:py-12">
            <FileSearch className="mx-auto h-6 w-6 text-[#96B5A6]" />
            <p className="mt-4 text-sm font-medium text-white">
              {filtered ? "No hay evaluaciones con esos filtros." : "Aún no hay evaluaciones guardadas."}
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {filtered
                ? "Ajusta los filtros para ampliar el registro visible."
                : "Una evaluación aparecerá aquí cuando el análisis haya sido persistido correctamente."}
            </p>
            {!filtered ? (
              <Button asChild className="mt-5">
                <Link href="/evaluar">
                  Evaluar una marca <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </OperationalPanel>
        ) : (
          <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
            {rows.map((row) => (
              <ComparisonRow key={row.id} comparison={row} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 border-t border-border/80 py-7 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-light tracking-[-0.02em] text-[#E7DFCE]">Necesitas el detalle técnico</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Abre una evaluación para revisar imágenes, señales, artefactos y contexto marcario disponibles en ese registro.
            </p>
          </div>
        </div>
      </section>
    </OperationalPage>
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
