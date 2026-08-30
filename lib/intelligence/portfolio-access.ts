import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

export type PortfolioOrganization = {
  id: string
  name: string
  slug: string
  role: string
  binding: null | {
    id: string
    identity_id: string
    canonical_name: string
    country: string | null
    resolution_confidence: number
    updated_at: string
  }
}

type MembershipRow = { organization_id: string; role: string | null }
type OrganizationRow = { id: string; name: string; slug: string }
type BindingRow = { id: string; organization_id: string; identity_id: string; updated_at: string }
type IdentityRow = { id: string; canonical_name: string; country: string | null; resolution_confidence: number | string }

export async function listPortfolioOrganizations(admin: SupabaseClient, userId: string): Promise<PortfolioOrganization[]> {
  const membershipResult = await admin
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", userId)
  if (membershipResult.error) throw new Error(`No pudimos cargar las organizaciones: ${membershipResult.error.message}`)

  const memberships = (membershipResult.data ?? []) as MembershipRow[]
  const organizationIds = [...new Set(memberships.map(item => String(item.organization_id)))]
  if (!organizationIds.length) return []

  const [organizationResult, bindingResult] = await Promise.all([
    admin.from("organizations").select("id,name,slug").in("id", organizationIds),
    admin
      .from("intelligence_portfolio_bindings")
      .select("id,organization_id,identity_id,updated_at")
      .in("organization_id", organizationIds)
      .eq("is_primary", true),
  ])
  if (organizationResult.error) throw new Error(`No pudimos cargar las organizaciones: ${organizationResult.error.message}`)
  if (bindingResult.error) throw new Error(`No pudimos cargar los portafolios vinculados: ${bindingResult.error.message}`)

  const organizations = (organizationResult.data ?? []) as OrganizationRow[]
  const bindings = (bindingResult.data ?? []) as BindingRow[]
  const identityIds = [...new Set(bindings.map(item => String(item.identity_id)))]
  let identities: IdentityRow[] = []
  if (identityIds.length) {
    const identityResult = await admin
      .from("intelligence_company_identities")
      .select("id,canonical_name,country,resolution_confidence")
      .in("id", identityIds)
    if (identityResult.error) throw new Error(`No pudimos cargar las identidades vinculadas: ${identityResult.error.message}`)
    identities = (identityResult.data ?? []) as IdentityRow[]
  }

  const roleByOrg = new Map(memberships.map(item => [String(item.organization_id), String(item.role ?? "member")]))
  const bindingByOrg = new Map(bindings.map(item => [String(item.organization_id), item]))
  const identityById = new Map(identities.map(item => [String(item.id), item]))

  return organizations
    .map(organization => {
      const binding = bindingByOrg.get(String(organization.id))
      const identity = binding ? identityById.get(String(binding.identity_id)) : undefined
      return {
        id: String(organization.id),
        name: String(organization.name),
        slug: String(organization.slug),
        role: roleByOrg.get(String(organization.id)) ?? "member",
        binding: binding && identity ? {
          id: String(binding.id),
          identity_id: String(identity.id),
          canonical_name: String(identity.canonical_name),
          country: identity.country ? String(identity.country) : null,
          resolution_confidence: Number(identity.resolution_confidence ?? 0),
          updated_at: String(binding.updated_at),
        } : null,
      }
    })
    .sort((a, b) => Number(Boolean(b.binding)) - Number(Boolean(a.binding)) || a.name.localeCompare(b.name))
}

export async function assertPortfolioOrganizationAccess(
  admin: SupabaseClient,
  userId: string,
  organizationId: string,
  requireAdmin = false,
) {
  const { data, error } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error(`No pudimos verificar la membresía: ${error.message}`)
  if (!data) return { ok: false as const, reason: "not_member" as const }
  const role = String(data.role ?? "member")
  if (requireAdmin && role !== "admin") return { ok: false as const, reason: "not_admin" as const }
  return { ok: true as const, role }
}
