import { redirect } from "next/navigation"
import { KeyRound, Settings2, ShieldCheck, UserRound } from "lucide-react"
import { ApiKeyManager } from "@/components/app/api-key-manager"
import { InapiOperationsCard } from "@/components/app/inapi-operations-card"
import { InapiRecordsCard } from "@/components/app/inapi-records-card"
import { InapiSyncManager } from "@/components/app/inapi-sync-manager"
import { Phase1StatusCard } from "@/components/app/phase1-status-card"
import { ProfileForm } from "@/components/app/profile-form"
import { Badge } from "@/components/ui/badge"
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
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) redirect(`/auth/login?redirectTo=${encodeURIComponent("/settings")}`)

  try { await ensureAccountBootstrap(user) } catch (bootstrapError) { console.error("[settings] account bootstrap error", bootstrapError) }

  const { data: profile } = await supabase.from("profiles").select("full_name, company_name").eq("id", user.id).maybeSingle()
  const role = user.app_metadata?.role
  const isAdmin = role === "admin"

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
      <header className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">VIDENTIA / Configuración</p><h1 className="mt-4 max-w-[10ch] text-4xl font-normal leading-[0.96] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-6xl">Identidad, acceso e integraciones.</h1></div>
        <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-muted-foreground sm:text-lg">Gestiona los datos de tu perfil y las credenciales disponibles para tu rol. Los controles operativos de INAPI permanecen separados y restringidos a administradores.</p><div className="mt-5 flex flex-wrap gap-2"><Badge variant="outline" className="rounded-md">{user.email ?? ""}</Badge><Badge variant="outline" className="rounded-md">{roleLabel(role)}</Badge></div></div>
      </header>

      <section className="grid gap-10 border-b border-border py-10 lg:grid-cols-[0.35fr_0.65fr]">
        <div><SectionLabel icon={<UserRound className="h-4 w-4"/>}>Cuenta</SectionLabel><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Perfil de trabajo</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Nombre y organización utilizados en la experiencia y en artefactos generados desde tu cuenta.</p></div>
        <ProfileForm email={user.email ?? ""} initialFullName={profile?.full_name ?? ""} initialCompanyName={profile?.company_name ?? ""} />
      </section>

      <section className="grid gap-10 border-b border-border py-10 lg:grid-cols-[0.35fr_0.65fr]">
        <div><SectionLabel icon={<ShieldCheck className="h-4 w-4"/>}>Seguridad</SectionLabel><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Acceso y recuperación</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">La sesión usa autenticación de Supabase. El cambio de contraseña se realiza mediante el flujo de recuperación desde la pantalla de acceso.</p></div>
        <div className="border-l-2 border-primary/35 pl-5"><p className="text-sm font-medium text-foreground">Identidad autenticada</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Correo: {user.email ?? "No disponible"}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Rol de aplicación: {roleLabel(role)}</p></div>
      </section>

      <section className="border-b border-border py-10">
        <div className="mb-6"><SectionLabel icon={<KeyRound className="h-4 w-4"/>}>Integraciones</SectionLabel><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Credenciales API</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Crea y administra credenciales sólo cuando necesites integrar VIDENTIA con un sistema externo.</p></div>
        <ApiKeyManager />
      </section>

      {isAdmin ? (
        <section className="py-10" aria-labelledby="admin-controls-title">
          <div className="mb-7"><SectionLabel icon={<Settings2 className="h-4 w-4"/>}>Administración</SectionLabel><h2 id="admin-controls-title" className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Operación INAPI</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Disponibilidad, sincronización, registros y procesos restringidos. Estos controles afectan la operación de datos, no una decisión jurídica.</p></div>
          <div className="space-y-6"><Phase1StatusCard organizationId={user.id}/><InapiOperationsCard/><InapiSyncManager/><InapiRecordsCard/></div>
        </section>
      ) : (
        <section className="py-10"><SectionLabel icon={<Settings2 className="h-4 w-4"/>}>Administración</SectionLabel><h2 className="mt-2 text-2xl font-normal tracking-[-0.03em] text-foreground">Operación INAPI</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Los controles de sincronización y operación están restringidos a administradores. Tu sesión mantiene acceso únicamente a las funciones autorizadas para tu rol.</p></section>
      )}
    </div>
  )
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2 text-primary">{icon}<p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{children}</p></div>
}
