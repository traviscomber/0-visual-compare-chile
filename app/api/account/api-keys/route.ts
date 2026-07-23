import { NextResponse } from "next/server"
import { createApiKey } from "@/lib/api/key-management"
import {
  API_QUOTA_PLANS,
  DEFAULT_API_KEY_DAILY_QUOTA,
  DEFAULT_API_KEY_MONTHLY_QUOTA,
  findApiQuotaPlan,
} from "@/lib/api/quotas"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" }
const PLAYGROUND_KEY_NAME = "API Playground Test"

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
  let pgClient: any = null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401, headers: PRIVATE_HEADERS })
    }

    await ensureAccountBootstrap(user)

    const dbUrl = process.env.POSTGRES_URL_4
    if (!dbUrl) {
      console.error("[api-keys] No database URL")
      return NextResponse.json(
        {
          keys: [],
          defaults: {
            quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA,
            quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA,
          },
          plans: API_QUOTA_PLANS,
        },
        { status: 200, headers: PRIVATE_HEADERS },
      )
    }

    const { Client } = require("pg")
    pgClient = new Client({ connectionString: dbUrl, ssl: false })
    await pgClient.connect()

    const result = await pgClient.query("SELECT * FROM get_user_api_keys($1)", [user.id])
    const keys = result.rows || []

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
    console.error("[api-keys] list route failed:", error instanceof Error ? error.message : "unknown")
    return NextResponse.json(
      {
        keys: [],
        defaults: {
          quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA,
          quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA,
        },
        plans: API_QUOTA_PLANS,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    )
  } finally {
    if (pgClient) {
      await pgClient.end().catch(() => {})
    }
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

    let rotatedKeyIds: string[] = []
    if (name === PLAYGROUND_KEY_NAME) {
      const admin = createAdminClient()
      const { data: existingKeys, error: lookupError } = await admin
        .from("api_keys")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", PLAYGROUND_KEY_NAME)
        .eq("is_active", true)

      if (lookupError) {
        console.error("[api-keys] playground lookup failed", lookupError.code)
        return NextResponse.json(
          { error: "No fue posible verificar las claves de Playground existentes." },
          { status: 503, headers: PRIVATE_HEADERS },
        )
      }

      rotatedKeyIds = (existingKeys ?? []).map((key) => key.id)
      if (rotatedKeyIds.length > 0) {
        const { error: revokeError } = await admin
          .from("api_keys")
          .update({ is_active: false })
          .in("id", rotatedKeyIds)
          .eq("user_id", user.id)

        if (revokeError) {
          console.error("[api-keys] playground rotation failed", revokeError.code)
          return NextResponse.json(
            { error: "No fue posible revocar la clave de Playground anterior." },
            { status: 503, headers: PRIVATE_HEADERS },
          )
        }
      }
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

    await logUsage(user.id, name === PLAYGROUND_KEY_NAME ? "api_key.rotated" : "api_key.created", {
      target_api_key_id: created.id,
      revoked_api_key_ids: rotatedKeyIds,
      name,
      plan_id: plan.id,
      plan_name: plan.name,
      expires_at: expiresAt?.toISOString() ?? null,
      quota_daily: plan.quotaDaily,
      quota_monthly: plan.quotaMonthly,
    })

    return NextResponse.json(
      { key: created.key, id: created.id, rotated: rotatedKeyIds.length },
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

    const { data: deleted, error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle()

    if (error) {
      console.error("[api-keys] delete failed", error.code)
      return NextResponse.json(
        { error: "No fue posible eliminar la clave API." },
        { status: 500, headers: PRIVATE_HEADERS },
      )
    }

    if (!deleted) {
      return NextResponse.json(
        { error: "La clave API no existe o no pertenece al usuario." },
        { status: 404, headers: PRIVATE_HEADERS },
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
