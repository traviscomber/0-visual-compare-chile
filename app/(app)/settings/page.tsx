import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/app/profile-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user!.id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">Gestiona los datos de tu cuenta y empresa.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Perfil</CardTitle>
          <CardDescription>Tus datos identificativos para reportes y exportaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            email={user!.email ?? ""}
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
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para cambiar tu contraseña, cierra sesión e inicia el flujo de recuperación desde la pantalla
            de inicio de sesión. Próximamente podrás hacerlo directamente desde aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
