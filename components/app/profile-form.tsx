"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileForm({
  email,
  initialFullName,
  initialCompanyName,
}: {
  email: string
  initialFullName: string
  initialCompanyName: string
}) {
  const [fullName, setFullName] = useState(initialFullName)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error("Supabase no esta configurado en este entorno")
      }
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      if (!userId) {
        throw new Error("Sesion expirada")
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName,
          company_name: companyName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )

      if (error) {
        throw error
      }

      toast.success("Perfil actualizado")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo electronico</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">El correo se gestiona desde tu cuenta de autenticacion.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Nombre completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nombre y apellido"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Empresa</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Razon social"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  )
}
