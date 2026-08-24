import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveCompanyInRes } from "@/lib/intelligence/resolver-res"
import { refreshCmfOwnerSignal } from "@/lib/intelligence/cmf"
import { buildOwnerInsights, type OwnerInsight } from "@/lib/intelligence/owner-insights"

const QuerySchema = z.object({ application: z.string().trim().min(1).max(40) })

export const runtime = "nodejs"

type TimelineItem = {
  id: string
  source: string
  source_key: string
  type: string
  title: string
  summary: string | null
  date: string | null
  url: string | null
}

type OwnerContext = {
  found?: boolean
  owner?: null | {
    id?: string
    name?: string
    rut?: string | null
    identity_confidence?: number
    identity_status?: string
  }
  portfolio?: { total?: number; registered?: number; pending?: number }
  top_classes?: Array<{ class: number; count: number }>
  recent_marks?: Array<{ name: string; status: string | null; filed_at: string | null; application: string | null; niza: number[] }>
  portfolio_growth?: Array<{ year: number; count: number }>
  tdpi_events?: Array<{ title: string; summary: string | null; url: string | null; date: string | null; type: string; source: string }>
  timeline?: TimelineItem[]
  insights?: OwnerInsight[]
  [key: string]: unknown
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({ application: url.searchParams.get("application") ?? "" })
  if (!parsed.success) return NextResponse.json({ error: "Número de solicitud inválido." }, { status: 400 })

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })

  const context = await loadContext(parsed.data.application)
  if (!context.ok) return context.response

  let current = context.data
  const unresolved = current.owner?.id && current.owner?.name && !current.owner?.rut

  if (unresolved) {
    try {
      const match = await resolveCompanyInRes(current.owner?.name ?? "")
      if (match) {
        await persistVerifiedIdentity({
          entityId: current.owner?.id ?? "",
          ownerName: current.owner?.name ?? match.legalName,
          match,
        })
        const refreshed = await loadContext(parsed.data.application)
        if (!refreshed.ok) return refreshed.response
        current = refreshed.data
      }
    } catch (error) {
      console.warn("[owner-context:res]", error)
    }
  }

  const verifiedOwner = current.owner
  if (verifiedOwner?.id && verifiedOwner.rut && verifiedOwner.identity_status === "res_verified") {
    try {
      await refreshCmfOwnerSignal(verifiedOwner.id, verifiedOwner.rut)
    } catch (error) {
      console.warn("[owner-context:cmf]", error)
    }
  }

  const enriched = await withTimeline(current)
  const withInsights: OwnerContext = {
    ...enriched,
    insights: buildOwnerInsights(enriched),
  }

  return NextResponse.json(withInsights ?? { found: false }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=1800" },
  })
}

async function loadContext(application: string): Promise<
  | { ok: true; data: OwnerContext }
  | { ok: false; response: NextResponse }
> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("get_trademark_owner_context_by_application", {
    p_application_number: application,
  })

  if (error) {
    console.error("[owner-context]", error)
    return {
      ok: false,
      response: NextResponse.json({ error: "No pudimos cargar el contexto del titular." }, { status: 500 }),
    }
  }

  return { ok: true, data: (data ?? { found: false }) as OwnerContext }
}

async function withTimeline(context: OwnerContext): Promise<OwnerContext> {
  const ownerId = context.owner?.id
  if (!ownerId) return { ...context, timeline: normalizeTdpiEvents(context.tdpi_events ?? []) }

  const admin = createAdminClient()
  const entityIds = new Set<string>([ownerId])

  const { data: relationships, error: relationshipError } = await admin
    .from("intelligence_relationships")
    .select("from_entity_id,to_entity_id,relationship_type")
    .eq("relationship_type", "same_rut")
    .or(`from_entity_id.eq.${ownerId},to_entity_id.eq.${ownerId}`)

  if (relationshipError) console.warn("[owner-context:timeline:relationships]", relationshipError)
  for (const relation of relationships ?? []) {
    if (relation.from_entity_id) entityIds.add(String(relation.from_entity_id))
    if (relation.to_entity_id) entityIds.add(String(relation.to_entity_id))
  }

  const { data: links, error: linksError } = await admin
    .from("intelligence_entity_evidence")
    .select("evidence_id")
    .in("entity_id", [...entityIds])
    .limit(100)

  if (linksError) console.warn("[owner-context:timeline:links]", linksError)
  const evidenceIds = [...new Set((links ?? []).map(item => String(item.evidence_id)).filter(Boolean))]

  const evidenceItems: TimelineItem[] = []
  if (evidenceIds.length) {
    const { data: evidence, error: evidenceError } = await admin
      .from("intelligence_evidence")
      .select("id,source_id,evidence_type,title,summary,source_url,occurred_at,observed_at")
      .in("id", evidenceIds)
      .order("occurred_at", { ascending: false, nullsFirst: false })
      .limit(50)

    if (evidenceError) {
      console.warn("[owner-context:timeline:evidence]", evidenceError)
    } else {
      const sourceIds = [...new Set((evidence ?? []).map(item => String(item.source_id)).filter(Boolean))]
      const sourceMap = new Map<string, { key: string; name: string }>()
      if (sourceIds.length) {
        const { data: sources, error: sourcesError } = await admin
          .from("intelligence_sources")
          .select("id,source_key,name")
          .in("id", sourceIds)
        if (sourcesError) console.warn("[owner-context:timeline:sources]", sourcesError)
        for (const source of sources ?? []) sourceMap.set(String(source.id), { key: String(source.source_key), name: String(source.name) })
      }

      for (const item of evidence ?? []) {
        const source = sourceMap.get(String(item.source_id))
        evidenceItems.push({
          id: String(item.id),
          source: source?.name ?? "Fuente oficial",
          source_key: source?.key ?? "official",
          type: String(item.evidence_type),
          title: String(item.title),
          summary: item.summary ? String(item.summary) : null,
          date: item.occurred_at ? String(item.occurred_at) : item.observed_at ? String(item.observed_at) : null,
          url: item.source_url ? String(item.source_url) : null,
        })
      }
    }
  }

  const combined = [...evidenceItems, ...normalizeTdpiEvents(context.tdpi_events ?? [])]
  const deduped = [...new Map(combined.map(item => [`${item.source_key}:${item.type}:${item.title}:${item.date ?? ""}`, item])).values()]
    .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
    .slice(0, 20)

  return { ...context, timeline: deduped }
}

function normalizeTdpiEvents(events: NonNullable<OwnerContext["tdpi_events"]>): TimelineItem[] {
  return events.map((item, index) => ({
    id: `tdpi-${index}-${item.date ?? "unknown"}`,
    source: item.source || "TDPI",
    source_key: "tdpi",
    type: item.type || "case_law",
    title: item.title,
    summary: item.summary,
    date: item.date,
    url: item.url,
  }))
}

async function persistVerifiedIdentity({
  entityId,
  ownerName,
  match,
}: {
  entityId: string
  ownerName: string
  match: Awaited<ReturnType<typeof resolveCompanyInRes>> & {}
}) {
  if (!match) return
  const admin = createAdminClient()

  const { data: entity, error: entityError } = await admin
    .from("intelligence_entities")
    .select("id,metadata,rut")
    .eq("id", entityId)
    .maybeSingle()

  if (entityError || !entity) {
    console.warn("[owner-context:res:entity]", entityError)
    return
  }

  if (entity.rut && entity.rut !== match.rut) {
    console.warn("[owner-context:res:conflict]", { entityId, existingRut: entity.rut, candidateRut: match.rut })
    return
  }

  const metadata = {
    ...(entity.metadata && typeof entity.metadata === "object" ? entity.metadata : {}),
    identity_status: "res_verified",
    identity_source: "registro_empresas",
    identity_verified_at: new Date().toISOString(),
    res_resource_id: match.resourceId,
    res_legal_name: match.legalName,
  }

  const { error: updateError } = await admin
    .from("intelligence_entities")
    .update({ rut: match.rut, metadata, updated_at: new Date().toISOString() })
    .eq("id", entityId)
    .is("rut", null)

  if (updateError) {
    console.warn("[owner-context:res:update]", updateError)
    return
  }

  const { data: source } = await admin
    .from("intelligence_sources")
    .select("id")
    .eq("source_key", "registro_empresas")
    .maybeSingle()

  if (!source?.id) return

  const { data: evidence, error: evidenceError } = await admin
    .from("intelligence_evidence")
    .upsert({
      source_id: source.id,
      source_record_id: match.rut,
      evidence_type: "company_identity",
      title: `Identidad societaria verificada: ${ownerName}`,
      summary: `Coincidencia exacta de razón social en el Registro de Empresas y Sociedades. RUT ${match.rut}.`,
      source_url: match.sourceUrl,
      observed_at: new Date().toISOString(),
      payload: {
        rut: match.rut,
        legal_name: match.legalName,
        resource_id: match.resourceId,
        resource_name: match.resourceName,
      },
      confidence: "official",
      updated_at: new Date().toISOString(),
    }, { onConflict: "source_id,source_record_id,evidence_type" })
    .select("id")
    .single()

  if (evidenceError || !evidence?.id) {
    console.warn("[owner-context:res:evidence]", evidenceError)
    return
  }

  const { error: linkError } = await admin
    .from("intelligence_entity_evidence")
    .upsert({ entity_id: entityId, evidence_id: evidence.id, role: "identity" }, {
      onConflict: "entity_id,evidence_id,role",
    })

  if (linkError) console.warn("[owner-context:res:evidence-link]", linkError)
}