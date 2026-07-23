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
    const keys = await listApiKeys(user.id)
    if (!keys) {
      return NextResponse.json(
        { error: "No fue posible cargar las claves API." },
        { status: 500, headers: PRIVATE_HEADERS },
      )
    }

    return NextResponse.json(
      {
        keys,
        defaults: {
          quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA,
          quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA,
        },
        plans: API_QUOTA_PLANS,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    )
  } catch (error) {
    console.error("[api-keys] list route failed", error instanceof Error ? error.name : "unknown")
    return NextResponse.json(
      { error: "Error interno al cargar las claves API." },
      { status: 500, headers: PRIVATE_HEADERS },
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
