"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ProfileForm({ email, initialFullName, initialCompanyName }: { email: string; initialFullName: string; initialCompanyName: string }) {
  const [fullName, setFullName] = useState(initialFullName)
  const [companyName, setCompanyName] = useState(initialCompanyName)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const supabase = createClient()
      if (!supabase) throw new Error("La conexión de autenticación no está disponible en este entorno.")
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.")

      const { error } = await supabase.from("profiles").upsert({ id: userId, full_name: fullName, company_name: companyName, updated_at: new Date().toISOString() }, { onConflict: "id" })
      if (error) throw error
      toast.success("Perfil actualizado")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar tu perfil.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" value={email} disabled />
        <p className="text-xs leading-5 text-muted-foreground">El correo pertenece a tu identidad de acceso y no se modifica desde este perfil.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><Label htmlFor="fullName">Nombre completo</Label><Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nombre y apellido" /></div>
        <div className="flex flex-col gap-2"><Label htmlFor="companyName">Organización</Label><Input id="companyName" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Razón social u organización" /></div>
      </div>
      <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving?<><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"/>Guardando</>:"Guardar cambios"}</Button></div>
    </form>
  )
}
