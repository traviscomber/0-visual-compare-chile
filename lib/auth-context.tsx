"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClientAsync } from "@/lib/supabase/client"

export type UserRole = "admin" | "analista" | "auditor"

interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role?: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function roleFromAppMetadata(value: unknown): UserRole {
  return value === "admin" || value === "auditor" ? value : "analista"
}

function buildDisplayName(email: string, fullName?: string | null): string {
  return fullName || email.split("@")[0] || "Usuario"
}

function buildUser(sessionUser: {
  id: string
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}, fullName?: string | null): User {
  const email = sessionUser.email ?? ""
  const metadataName = typeof sessionUser.user_metadata?.full_name === "string"
    ? sessionUser.user_metadata.full_name
    : null

  return {
    id: sessionUser.id,
    email,
    name: buildDisplayName(email, fullName ?? metadataName),
    role: roleFromAppMetadata(sessionUser.app_metadata?.role),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | null = null

    const init = async () => {
      const supabase = await createClientAsync()

      if (!active) return
      if (!supabase) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return
        setUser(session?.user ? buildUser(session.user) : null)
        setIsLoading(false)
      })
      unsubscribe = () => data.subscription.unsubscribe()

      try {
        const { data: { user: sessionUser } } = await supabase.auth.getUser()
        if (!active) return

        if (!sessionUser) {
          setUser(null)
          setIsLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", sessionUser.id)
          .maybeSingle()

        if (!active) return
        setUser(buildUser(sessionUser, profile?.full_name ?? null))
        setIsLoading(false)
      } catch {
        if (active) {
          setUser(null)
          setIsLoading(false)
        }
      }
    }

    void init()
    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const supabase = await createClientAsync()

    if (!supabase) {
      setIsLoading(false)
      throw new Error("Supabase no está configurado. Verifica las variables de entorno.")
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setIsLoading(false)
      throw error
    }

    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    setUser(sessionUser ? buildUser(sessionUser) : null)
    setIsLoading(false)
  }

  const logout = async () => {
    setUser(null)
    const supabase = await createClientAsync()
    if (supabase) await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
