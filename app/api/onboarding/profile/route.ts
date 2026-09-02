import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DISCOVERY_GOALS, STRATEGIC_FOCUS_OPTIONS } from "@/lib/onboarding/profile"
import {
  getOrCreatePrimaryOrganization,
  ensureOrganizationIntelligenceProfile,
  normalizeWebsite,
  saveOrganizationIntelligenceProfile,
} from "@/lib/onboarding/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PatchSchema = z.object({
  website: z.string().trim().max(500).optional(),
  company_name: z.string().trim().max(160).optional(),
  company_summary: z.string().trim().max(1200).optional(),
  industry: z.string().trim().max(160).optional(),
  country: z.string().trim().max(120).optional(),
  offerings: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  capabilities: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  discovery_goals: z.array(z.string().trim().min(1).max(80)).max(5).optional(),
  strategic_focus: z.string().trim().max(80).optional(),
  onboarding_step: z.number().int().min(1).max(4).optional(),
  completed: z.boolean().optional(),
}).strict()

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  try {
    const organization = await getOrCreatePrimaryOrganization(auth.user)
    const profile = await ensureOrganizationIntelligenceProfile(auth.user, organization)
    return NextResponse.json({ organization, profile }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[onboarding:profile:get]", error)
    return NextResponse.json({ error: "No pudimos cargar tu perfil estratégico." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de onboarding inválidos." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  if (parsed.data.discovery_goals && !parsed.data.discovery_goals.every(goal => DISCOVERY_GOALS.some(option => option.value === goal))) {
    return NextResponse.json({ error: "Objetivo de investigación inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (parsed.data.strategic_focus && !STRATEGIC_FOCUS_OPTIONS.some(option => option.value === parsed.data.strategic_focus)) {
    return NextResponse.json({ error: "Foco estratégico inválido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const website = parsed.data.website === undefined ? undefined : normalizeWebsite(parsed.data.website)
  if (parsed.data.website && !website) {
    return NextResponse.json({ error: "Ingresa un sitio web válido." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }

  try {
    const organization = await getOrCreatePrimaryOrganization(auth.user)
    let nextOrganization = organization

    if (parsed.data.company_name) {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from("organizations")
        .update({ name: parsed.data.company_name, updated_at: new Date().toISOString() })
        .eq("id", organization.id)
        .select("id, name, slug")
        .single()
      if (error) throw error
      nextOrganization = { ...data, role: organization.role }
    }

    const profile = await saveOrganizationIntelligenceProfile({
      user: auth.user,
      organization: nextOrganization,
      completed: parsed.data.completed,
      input: {
        ...(website !== undefined ? { website } : {}),
        ...(parsed.data.company_summary !== undefined ? { company_summary: parsed.data.company_summary } : {}),
        ...(parsed.data.industry !== undefined ? { industry: parsed.data.industry } : {}),
        ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
        ...(parsed.data.offerings !== undefined ? { offerings: parsed.data.offerings } : {}),
        ...(parsed.data.capabilities !== undefined ? { capabilities: parsed.data.capabilities } : {}),
        ...(parsed.data.discovery_goals !== undefined ? { discovery_goals: parsed.data.discovery_goals } : {}),
        ...(parsed.data.strategic_focus !== undefined ? { strategic_focus: parsed.data.strategic_focus } : {}),
        ...(parsed.data.onboarding_step !== undefined ? { onboarding_step: parsed.data.onboarding_step } : {}),
      },
    })

    await auth.supabase.from("usage_logs").insert({
      user_id: auth.user.id,
      organization_id: nextOrganization.id,
      action: parsed.data.completed ? "onboarding.completed" : "onboarding.profile_updated",
      metadata: {
        onboarding_step: profile.onboarding_step,
        profile_completeness: profile.profile_completeness,
      },
    })

    return NextResponse.json({ organization: nextOrganization, profile }, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[onboarding:profile:patch]", error)
    return NextResponse.json({ error: "No pudimos guardar tu perfil estratégico." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
