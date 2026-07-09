import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/app/profile-form"
import { ApiKeyManager } from "@/components/app/api-key-manager"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent("/settings")}`)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Configuración</h1>
        <p className="mt-1 text-muted-foreground">Gestiona los datos de tu cuenta y empresa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Cuenta</CardTitle>
          <CardDescription>Resumen de identidad y alcance de tu sesión.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline" className="border-slate-200/20 bg-slate-100/5 text-foreground">
            Usuario: {user.email ?? ""}
          </Badge>
          <Badge variant="outline" className="border-slate-200/20 bg-slate-100/5 text-foreground">
            Organization ID: {user.id}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Perfil</CardTitle>
          <CardDescription>Tus datos identificativos para reportes y exportaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            email={user.email ?? ""}
            initialFullName={profile?.full_name ?? ""}
            initialCompanyName={profile?.company_name ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Seguridad</CardTitle>
          <CardDescription>Tu sesión está protegida con autenticación de Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para cambiar tu contraseña, cierra sesión e inicia el flujo de recuperación desde la pantalla
            de inicio de sesión. Próximamente podrás hacerlo directamente desde aquí.
          </p>
        </CardContent>
      </Card>

      <ApiKeyManager />
    </div>
  )
}
