import type { User } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type AppRole = "admin" | "analista" | "auditor"

export const PRIVATE_NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }

export function resolveAppRole(user: User): AppRole {
  const role = user.app_metadata?.role
  return role === "admin" || role === "auditor" ? role : "analista"
}

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No autorizado.", code: "UNAUTHENTICATED" },
        { status: 401, headers: PRIVATE_NO_STORE_HEADERS },
      ),
    }
  }

  return { ok: true as const, user, role: resolveAppRole(user), supabase }
}

export async function requireRole(allowedRoles: AppRole[]) {
  const auth = await requireUser()
  if (!auth.ok) return auth

  if (!allowedRoles.includes(auth.role)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "No tienes permisos para realizar esta operación.", code: "FORBIDDEN" },
        { status: 403, headers: PRIVATE_NO_STORE_HEADERS },
      ),
    }
  }

  return auth
}

export async function requireAdmin() {
  return requireRole(["admin"])
}
