"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

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
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function roleFromMetadata(value: unknown): UserRole {
  return value === "admin" || value === "auditor" ? value : "analista"
}

function buildDisplayName(email: string, fullName?: string | null): string {
  return fullName || email.split("@")[0] || "Usuario"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    if (!supabase) {
      setIsLoading(false)
      return
    }

    const syncSession = async () => {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!sessionUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", sessionUser.id)
        .maybeSingle()

      if (!active) return

      const metadata = sessionUser.user_metadata ?? {}
      const email = sessionUser.email ?? ""

      setUser({
        id: sessionUser.id,
        email,
        name: buildDisplayName(email, profile?.full_name ?? (typeof metadata.full_name === "string" ? metadata.full_name : null)),
        role: roleFromMetadata(metadata.role),
      })
      setIsLoading(false)
    }

    void syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return

      if (!session?.user) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const metadata = session.user.user_metadata ?? {}
      const email = session.user.email ?? ""

      setUser({
        id: session.user.id,
        email,
        name: buildDisplayName(email, typeof metadata.full_name === "string" ? metadata.full_name : null),
        role: roleFromMetadata(metadata.role),
      })
      setIsLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true)
    const supabase = createClient()
    
    if (!supabase) {
      setIsLoading(false)
      throw new Error("Supabase is not configured")
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setIsLoading(false)
      throw error
    }

    setUser((current) => (current ? { ...current, role } : current))
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    const supabase = createClient()
    if (supabase) {
      void supabase.auth.signOut()
    }
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
