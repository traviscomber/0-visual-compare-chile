import { NextResponse } from "next/server"
import { createApiKey, listApiKeys } from "@/lib/api/key-management"
import {
  API_QUOTA_PLANS,
  DEFAULT_API_KEY_DAILY_QUOTA,
  DEFAULT_API_KEY_MONTHLY_QUOTA,
  findApiQuotaPlan,
} from "@/lib/api/quotas"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }

async function logUsage(userId: string, action: string, metadata: Record<string, unknown>) {
  const supabase = await createClient()
  await supabase.from("usage_logs").insert({
    user_id: userId,
    organization_id: null,
    action,
    metadata,
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    await ensureAccountBootstrap(user)

    // Get user's organizations
    const { data: orgsData, error: orgsError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)

    if (orgsError || !orgsData || orgsData.length === 0) {
      console.log("[api-keys] No organizations found for user", user.id)
      return NextResponse.json(
        { keys: [], defaults: { quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA, quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA }, plans: API_QUOTA_PLANS },
        { status: 200, headers: PRIVATE_HEADERS },
      )
    }

    // Get keys from first organization
    const organizationId = orgsData[0].organization_id
    
    // Query keys directly with only existing columns
    const { data: keys, error: keysError } = await supabase
      .from("api_keys")
      .select("id, name, is_active, created_at, last_used_at, expires_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })

    if (keysError) {
      console.error("[api-keys] keys query failed", keysError)
      return NextResponse.json(
        { keys: [], defaults: { quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA, quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA }, plans: API_QUOTA_PLANS },
        { status: 200, headers: PRIVATE_HEADERS },
      )
    }
    
    return NextResponse.json(
      {
        keys: keys || [],
        defaults: {
          quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA,
          quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA,
        },
        plans: API_QUOTA_PLANS,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    )
  } catch (error) {
    console.error("[api-keys] list route failed", error instanceof Error ? error.message : "unknown")
    return NextResponse.json(
      { keys: [], defaults: { quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA, quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA }, plans: API_QUOTA_PLANS },
      { status: 200, headers: PRIVATE_HEADERS },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    await ensureAccountBootstrap(user)

    const body = await request.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const planId = typeof body?.planId === "string" ? body.planId.trim() : "mvp-base"
    const plan = findApiQuotaPlan(planId)
    const expiresAtValue = typeof body?.expiresAt === "string" ? body.expiresAt.trim() : ""
    const expiresAt = expiresAtValue ? new Date(expiresAtValue) : undefined

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 1 y 80 caracteres." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    if (!plan) {
      return NextResponse.json(
        { error: "El plan de cuota no es válido." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    if (expiresAt && (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) {
      return NextResponse.json(
        { error: "La fecha de expiración debe ser válida y futura." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    const created = await createApiKey(user.id, user.id, name, expiresAt, {
      daily: plan.quotaDaily,
      monthly: plan.quotaMonthly,
    })
    if (!created) {
      return NextResponse.json(
        { error: "No fue posible crear la clave API." },
        { status: 500, headers: PRIVATE_HEADERS },
      )
    }

    await logUsage(user.id, "api_key.created", {
      target_api_key_id: created.id,
      name,
      plan_id: plan.id,
      plan_name: plan.name,
      expires_at: expiresAt?.toISOString() ?? null,
      quota_daily: plan.quotaDaily,
      quota_monthly: plan.quotaMonthly,
    })

    return NextResponse.json(
      { key: created.key, id: created.id },
      { status: 201, headers: PRIVATE_HEADERS },
    )
  } catch (error) {
    console.error("[api-keys] create route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al crear la clave API." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    const url = new URL(request.url)
    const keyId = url.searchParams.get("id")

    if (!keyId) {
      return NextResponse.json(
        { error: "ID de clave requerido." },
        { status: 400, headers: PRIVATE_HEADERS },
      )
    }

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Delete error:", error)
      return NextResponse.json(
        { error: "No fue posible eliminar la clave API." },
        { status: 500, headers: PRIVATE_HEADERS },
      )
    }

    await logUsage(user.id, "api_key.deleted", { target_api_key_id: keyId })

    return NextResponse.json({ success: true }, { status: 200, headers: PRIVATE_HEADERS })
  } catch (error) {
    console.error("[api-keys] delete route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al eliminar la clave API." },
      { status: 500, headers: PRIVATE_HEADERS },
    )
  }
}
