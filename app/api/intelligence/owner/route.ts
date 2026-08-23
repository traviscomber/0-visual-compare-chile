import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resolveCompanyInRes } from "@/lib/intelligence/resolver-res"

const QuerySchema = z.object({ application: z.string().trim().min(1).max(40) })

type OwnerContext = {
  found?: boolean
  owner?: null | {
    id?: string
    name?: string
    rut?: string | null
    identity_confidence?: number
    identity_status?: string
  }
  [key: string]: unknown
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse({ application: url.searchParams.get("application") ?? "" })
  if (!parsed.success) return NextResponse.json({ error: "Número de solicitud inválido." }, { status: 400 })

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 })

  let context = await loadContext(supabase, parsed.data.application)
  if (!context.ok) return context.response

  const current = context.data
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
        context = await loadContext(supabase, parsed.data.application)
        if (!context.ok) return context.response
      }
    } catch (error) {
      console.warn("[owner-context:res]", error)
    }
  }

  return NextResponse.json(context.data ?? { found: false }, {
    headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=1800" },
  })
}

async function loadContext(supabase: Awaited<ReturnType<typeof createClient>>, application: string): Promise<
  | { ok: true; data: OwnerContext }
  | { ok: false; response: NextResponse }
> {
  const { data, error } = await supabase.rpc("get_trademark_owner_context_by_application", {
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
