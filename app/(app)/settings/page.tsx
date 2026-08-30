import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, KeyRound, LockKeyhole, Settings2, ShieldCheck, UserRound } from "lucide-react"
import { ApiKeyManager } from "@/components/app/api-key-manager"
import { InapiOperationsCard } from "@/components/app/inapi-operations-card"
import { InapiRecordsCard } from "@/components/app/inapi-records-card"
import { InapiSyncManager } from "@/components/app/inapi-sync-manager"
import {
  OperationalHeader,
  OperationalMetric,
  OperationalMetricRail,
  OperationalPage,
  OperationalPanel,
  OperationalSectionHeader,
} from "@/components/app/operational-ui"
import { Phase1StatusCard } from "@/components/app/phase1-status-card"
import { ProfileForm } from "@/components/app/profile-form"
import { Button } from "@/components/ui/button"
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
  const organizationLabel = profile?.company_name?.trim() || "Sin definir"

  return (
    <OperationalPage>
      <OperationalHeader
        eyebrow="VIDENTIA / Configuración"
        title={<>Configura tu espacio sin mezclarlo con operación sensible.</>}
        description={
          <p>
            Gestiona identidad, seguridad e integraciones desde una sola superficie. Los controles que afectan la
            operación de datos INAPI permanecen separados y sólo aparecen con privilegios de administrador.
          </p>
        }
        meta={
          <>
            <span>{user.email ?? "Correo no disponible"}</span>
            <span>{roleLabel(role)}</span>
            <span>Permisos aplicados en servidor</span>
          </>
        }
      />

      <OperationalMetricRail>
        <OperationalMetric value="Activa" label="Sesión" detail="Identidad autenticada" tone="success" />
        <OperationalMetric value={roleLabel(role)} label="Rol" detail="Permisos de aplicación vigentes" />
        <OperationalMetric value={organizationLabel} label="Organización" detail="Perfil de trabajo actual" />
        <OperationalMetric
          value={isAdmin ? "Habilitada" : "Restringida"}
          label="Operación INAPI"
          detail={isAdmin ? "Controles administrativos disponibles" : "Sólo para administradores"}
          tone={isAdmin ? "success" : "neutral"}
        />
      </OperationalMetricRail>

      <section className="grid gap-7 border-b border-border/80 py-8 lg:grid-cols-[minmax(240px,0.34fr)_minmax(0,0.66fr)] lg:gap-12 lg:py-10">
        <div>
          <OperationalSectionHeader eyebrow="01 / Cuenta" title="Perfil de trabajo" />
          <div className="mt-3 flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <UserRound className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" />
            <p>Nombre y organización utilizados en la experiencia asociada a tu cuenta.</p>
          </div>
        </div>
        <OperationalPanel>
          <ProfileForm
            email={user.email ?? ""}
            initialFullName={profile?.full_name ?? ""}
            initialCompanyName={profile?.company_name ?? ""}
          />
        </OperationalPanel>
      </section>

      <section className="grid gap-7 border-b border-border/80 py-8 lg:grid-cols-[minmax(240px,0.34fr)_minmax(0,0.66fr)] lg:gap-12 lg:py-10">
        <div>
          <OperationalSectionHeader eyebrow="02 / Seguridad" title="Acceso y recuperación" />
          <div className="mt-3 flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" />
            <p>La identidad autenticada y el rol determinan qué superficies y operaciones están disponibles.</p>
          </div>
        </div>

        <OperationalPanel>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Identidad</p>
              <p className="mt-2 break-all text-sm font-medium text-white">{user.email ?? "No disponible"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Correo asociado a la sesión actual.</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Rol de aplicación</p>
              <p className="mt-2 text-sm font-medium text-white">{roleLabel(role)}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Aplicado a las superficies restringidas.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-4 border-t border-border/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" />
              <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                El cambio de contraseña utiliza el flujo de recuperación de la pantalla de acceso; no se gestiona en
                este formulario de perfil.
              </p>
            </div>
            <Button asChild variant="secondary" className="shrink-0">
              <Link href="/auth/forgot-password">
                Recuperar acceso <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </OperationalPanel>
      </section>

      <section className="grid gap-7 border-b border-border/80 py-8 lg:grid-cols-[minmax(240px,0.26fr)_minmax(0,0.74fr)] lg:gap-12 lg:py-10">
        <div>
          <OperationalSectionHeader eyebrow="03 / Integraciones" title="Credenciales API" />
          <div className="mt-3 flex items-start gap-3 text-sm leading-6 text-muted-foreground">
            <KeyRound className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" />
            <p>Crea y administra credenciales sólo cuando necesites integrar VIDENTIA con un sistema externo.</p>
          </div>
        </div>
        <div className="min-w-0">
          <ApiKeyManager />
        </div>
      </section>

      <section className="py-8 lg:py-10" aria-labelledby="admin-controls-title">
        <OperationalSectionHeader
          eyebrow="04 / Administración"
          title={<span id="admin-controls-title">Operación INAPI</span>}
          meta={isAdmin ? "Acceso administrativo" : "Acceso restringido"}
        />

        {isAdmin ? (
          <>
            <OperationalPanel className="mt-5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" />
                <div>
                  <p className="text-sm font-medium text-white">Controles operativos restringidos</p>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
                    Disponibilidad, sincronización, registros y procesos administrativos. Estas acciones afectan la
                    operación de datos; no producen una decisión jurídica ni modifican el criterio de INAPI.
                  </p>
                </div>
              </div>
            </OperationalPanel>
            <div className="mt-6 space-y-6">
              <Phase1StatusCard organizationId={user.id} />
              <InapiOperationsCard />
              <InapiSyncManager />
              <InapiRecordsCard />
            </div>
          </>
        ) : (
          <OperationalPanel className="mt-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" />
              <div>
                <p className="text-sm font-medium text-white">Sin controles administrativos en esta sesión</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  La sincronización y la operación INAPI están restringidas a administradores. Tu sesión mantiene sólo
                  las funciones autorizadas para el rol {roleLabel(role).toLowerCase()}.
                </p>
              </div>
            </div>
          </OperationalPanel>
        )}
      </section>
    </OperationalPage>
  )
}
