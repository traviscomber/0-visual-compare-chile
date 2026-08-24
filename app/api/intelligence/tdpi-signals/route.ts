import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SignalRow = {
  id: string
  source_kind: string
  source_date: string | null
  source_url: string
  source_title: string | null
  rol_tdpi: string | null
  application_number: string | null
  mark_name: string | null
  applicant_name: string | null
  opponent_name: string | null
  nice_classes: number[] | null
  procedural_state: string | null
  signal_status: string
  confidence: number
  first_seen_at: string
}

type AnalysisRef = { name: string; classes: number[] }

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { data: comparisons, error: comparisonError } = await auth.supabase
    .from("comparisons")
    .select("result_data")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(120)

  if (comparisonError) {
    return NextResponse.json({ error: "No pudimos cargar tus análisis." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const analyses = dedupeAnalyses((comparisons ?? []).map((row) => row.result_data))
  if (!analyses.length) {
    return NextResponse.json({ signals: [], watched_marks: 0, total_scanned: 0 }, { headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("tdpi_case_signals")
    .select("id,source_kind,source_date,source_url,source_title,rol_tdpi,application_number,mark_name,applicant_name,opponent_name,nice_classes,procedural_state,signal_status,confidence,first_seen_at")
    .order("source_date", { ascending: false, nullsFirst: false })
    .order("first_seen_at", { ascending: false })
    .limit(250)

  if (error) {
    console.error("[tdpi-signals] query failed", error)
    return NextResponse.json({ error: "No pudimos consultar las señales TDPI." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const ranked = ((data ?? []) as SignalRow[])
    .map((signal) => rankSignal(signal, analyses))
    .filter((item): item is NonNullable<typeof item> => item !== null && item.relevance >= 60)
    .sort((a, b) => b.relevance - a.relevance || dateValue(b.signal.source_date) - dateValue(a.signal.source_date))
    .slice(0, 20)
    .map(({ signal, relevance, matchedAnalysis, reasons }) => ({ ...signal, relevance, matched_analysis: matchedAnalysis, reasons }))

  return NextResponse.json({
    signals: ranked,
    watched_marks: analyses.length,
    total_scanned: data?.length ?? 0,
    notice: "Estas señales provienen de fuentes públicas TDPI y se priorizan por relación con tus análisis. No constituyen una conclusión jurídica.",
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function dedupeAnalyses(rows: unknown[]): AnalysisRef[] {
  const byName = new Map<string, AnalysisRef>()
  for (const value of rows) {
    if (!value || typeof value !== "object") continue
    const data = value as Record<string, unknown>
    const name = typeof data.marca === "string" ? data.marca.trim() : ""
    if (!name) continue
    const niza = data.niza && typeof data.niza === "object" ? (data.niza as Record<string, unknown>).clases : undefined
    const classes = Array.isArray(niza)
      ? niza.map((item) => typeof item === "object" && item ? Number((item as Record<string, unknown>).numero) : Number(item)).filter((item) => Number.isInteger(item) && item >= 1 && item <= 45)
      : []
    const key = normalize(name)
    if (!byName.has(key)) byName.set(key, { name, classes: [...new Set(classes)] })
  }
  return [...byName.values()]
}

function rankSignal(signal: SignalRow, analyses: AnalysisRef[]) {
  const mark = normalize(signal.mark_name ?? "")
  if (!mark) return null
  let best: { relevance: number; matchedAnalysis: string; reasons: string[] } | null = null
  for (const analysis of analyses) {
    const candidate = normalize(analysis.name)
    if (!candidate) continue
    let relevance = 0
    const reasons: string[] = []
    if (mark === candidate) { relevance += 85; reasons.push("misma denominación") }
    else if (mark.includes(candidate) || candidate.includes(mark)) { relevance += 68; reasons.push("denominación contenida") }
    else {
      const overlap = tokenOverlap(mark, candidate)
      if (overlap >= 0.66) { relevance += Math.round(52 + overlap * 18); reasons.push("elementos denominativos compartidos") }
    }
    const signalClasses = new Set((signal.nice_classes ?? []).map(Number))
    const classOverlap = analysis.classes.filter((item) => signalClasses.has(item)).length
    if (classOverlap > 0) { relevance += Math.min(18, classOverlap * 8); reasons.push(`${classOverlap} clase(s) Niza coincidente(s)`) }
    if (signal.application_number) relevance += 2
    relevance = Math.min(100, relevance)
    if (!best || relevance > best.relevance) best = { relevance, matchedAnalysis: analysis.name, reasons }
  }
  return best ? { signal, ...best } : null
}

function normalize(value: string) {
  return value.trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ")
}

function tokenOverlap(a: string, b: string) {
  const left = new Set(a.split(" ").filter((token) => token.length >= 3))
  const right = new Set(b.split(" ").filter((token) => token.length >= 3))
  if (!left.size || !right.size) return 0
  const shared = [...left].filter((token) => right.has(token)).length
  return shared / Math.max(left.size, right.size)
}

function dateValue(value: string | null) {
  return value ? Date.parse(`${value}T12:00:00Z`) || 0 : 0
}