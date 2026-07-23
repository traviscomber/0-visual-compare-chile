import { redirect } from "next/navigation"
import { ApiKeyManager } from "@/components/app/api-key-manager"
import { InapiOperationsCard } from "@/components/app/inapi-operations-card"
import { InapiRecordsCard } from "@/components/app/inapi-records-card"
import { InapiSyncManager } from "@/components/app/inapi-sync-manager"
import { Phase1StatusCard } from "@/components/app/phase1-status-card"
import { ProfileForm } from "@/components/app/profile-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ensureAccountBootstrap } from "@/lib/supabase/bootstrap-account"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function roleLabel(value: unknown) {
  if (value === "admin") return "Administrador"
  if (value === "auditor") return "Auditor"
  return "Analista"
}

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

  try {
    await ensureAccountBootstrap(user)
  } catch (bootstrapError) {
    console.error("[settings] account bootstrap error", bootstrapError)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle()

  const role = user.app_metadata?.role
  const isAdmin = role === "admin"

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Configuración</h1>
        <p className="mt-1 text-muted-foreground">Gestiona tu perfil, credenciales y controles habilitados para tu rol.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Cuenta</CardTitle>
          <CardDescription>Identidad y alcance de la sesión actual.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline" className="border-slate-200/20 bg-slate-100/5 text-foreground">
            Usuario: {user.email ?? ""}
          </Badge>
          <Badge variant="outline" className="border-slate-200/20 bg-slate-100/5 text-foreground">
            Rol: {roleLabel(role)}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Perfil</CardTitle>
          <CardDescription>Datos identificativos utilizados en reportes y exportaciones.</CardDescription>
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
          <CardDescription>La sesión está protegida con autenticación de Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para cambiar tu contraseña, cierra sesión e inicia el flujo de recuperación desde la pantalla de acceso.
          </p>
        </CardContent>
      </Card>

      <ApiKeyManager />

      {isAdmin ? (
        <section className="space-y-6" aria-labelledby="admin-controls-title">
          <div>
            <h2 id="admin-controls-title" className="font-serif text-2xl text-foreground">Operación administrativa</h2>
            <p className="mt-1 text-sm text-muted-foreground">Controles restringidos para supervisar y ejecutar procesos INAPI.</p>
          </div>
          <Phase1StatusCard organizationId={user.id} />
          <InapiOperationsCard />
          <InapiSyncManager />
          <InapiRecordsCard />
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Operación INAPI</CardTitle>
            <CardDescription>Los controles de sincronización y operación están restringidos a administradores.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
