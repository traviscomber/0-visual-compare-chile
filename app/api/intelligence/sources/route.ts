import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { SOURCE_NETWORK, runtimeSourceStatus } from "@/lib/intelligence/source-network"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("intelligence_sources")
    .select("source_key,name,authority,base_url,source_type,license,freshness_policy,is_active,metadata")
    .order("source_key", { ascending: true })

  if (error) {
    console.error("[intelligence:sources]", error)
    return NextResponse.json({ error: "No pudimos cargar las fuentes de inteligencia." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const stored = new Map((data ?? []).map(row => [String(row.source_key), row]))
  const sources = SOURCE_NETWORK.map(definition => {
    const row = stored.get(definition.key)
    return {
      key: definition.key,
      name: row?.name ?? definition.key,
      authority: row?.authority ?? null,
      base_url: row?.base_url ?? null,
      source_type: row?.source_type ?? null,
      license: row?.license ?? null,
      freshness_policy: row?.freshness_policy ?? null,
      active: Boolean(row?.is_active),
      layer: definition.layer,
      purpose: definition.purpose,
      automation_policy: definition.automationPolicy,
      note: definition.note ?? null,
      runtime: runtimeSourceStatus(definition),
      metadata: row?.metadata ?? {},
    }
  })

  return NextResponse.json({
    sources,
    summary: {
      total: sources.length,
      active: sources.filter(item => item.active).length,
      ready: sources.filter(item => item.runtime.status === "ready" || item.runtime.status === "ready_basic").length,
      credentials_required: sources.filter(item => item.runtime.status === "credentials_required").length,
      manual_only: sources.filter(item => item.runtime.status === "manual_only").length,
    },
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}
