import type { User } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

function normalizeRole(value: unknown): "admin" | "user" {
  return value === "admin" ? "admin" : "user"
}

function buildDisplayName(user: User) {
  const metadata = user.user_metadata ?? {}
  if (typeof metadata.full_name === "string" && metadata.full_name.trim()) {
    return metadata.full_name.trim()
  }

  if (user.email) {
    return user.email.split("@")[0] || "Usuario"
  }

  return "Usuario"
}

function buildOrganizationName(user: User) {
  const metadata = user.user_metadata ?? {}
  if (typeof metadata.company_name === "string" && metadata.company_name.trim()) {
    return metadata.company_name.trim()
  }

  return buildDisplayName(user)
}

function buildOrganizationSlug(user: User) {
  const base = buildOrganizationName(user)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const fallback = user.id.slice(0, 8)
  return `${base || "org"}-${fallback}`.slice(0, 64)
}

export async function ensureAccountBootstrap(user: User) {
  const admin = createAdminClient()
  const displayName = buildDisplayName(user)
  const organizationName = buildOrganizationName(user)
  const organizationSlug = buildOrganizationSlug(user)
  const profileMetadata = user.user_metadata ?? {}

  const { error: userError } = await admin.from("users").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      name: displayName,
      role: normalizeRole(profileMetadata.role),
    },
    { onConflict: "id" },
  )

  if (userError) throw userError

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: typeof profileMetadata.full_name === "string" ? profileMetadata.full_name.trim() : null,
      company_name: typeof profileMetadata.company_name === "string" ? profileMetadata.company_name.trim() : null,
      role: normalizeRole(profileMetadata.role),
    },
    { onConflict: "id" },
  )

  if (profileError) throw profileError

  const { error: organizationError } = await admin.from("organizations").upsert(
    {
      id: user.id,
      name: organizationName,
      slug: organizationSlug,
      created_by: user.id,
    },
    { onConflict: "id" },
  )

  if (organizationError) throw organizationError

  const { error: memberError } = await admin.from("organization_members").upsert(
    {
      organization_id: user.id,
      user_id: user.id,
      role: "admin",
    },
    { onConflict: "organization_id,user_id" },
  )

  if (memberError) throw memberError
}
