import { BriefcaseBusiness } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { EnterpriseRequestStatus } from "@/components/app/enterprise-request-status"
import { OperationalPanel, OperationalSectionHeader } from "@/components/app/operational-ui"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(value))
}

export async function EnterpriseAccessRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("enterprise_access_requests")
    .select("id, email, company_name, user_count, use_case, brand_context, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return (
      <OperationalPanel className="mt-5">
        <p className="text-sm font-medium text-white">No pudimos cargar las solicitudes empresariales.</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Revisa permisos y conexión antes de volver a intentar.</p>
      </OperationalPanel>
    )
  }

  return (
    <section className="border-b border-border/80 py-8 lg:py-10" aria-labelledby="enterprise-requests-title">
      <OperationalSectionHeader
        eyebrow="04 / Comercial"
        title={<span id="enterprise-requests-title">Solicitudes empresariales</span>}
        meta={`${data?.length ?? 0} recientes`}
      />

      {!data?.length ? (
        <OperationalPanel className="mt-5">
          <div className="flex items-start gap-3">
            <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-[#96B5A6]" />
            <div>
              <p className="text-sm font-medium text-white">Sin solicitudes pendientes</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Las solicitudes enviadas desde Acceso empresarial aparecerán aquí.</p>
            </div>
          </div>
        </OperationalPanel>
      ) : (
        <div className="mt-5 divide-y divide-border/80 border-y border-border/80">
          {data.map((request) => (
            <article key={request.id} className="grid gap-4 py-5 lg:grid-cols-[minmax(220px,0.34fr)_minmax(0,0.66fr)] lg:gap-8">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{request.company_name}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{request.email}</p>
                <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-[#96B5A6]">
                  {request.user_count ? `${request.user_count} usuarios` : "Usuarios por definir"}
                </p>
                <EnterpriseRequestStatus id={request.id} initialStatus={request.status} />
              </div>

              <div className="min-w-0">
                {request.brand_context ? (
                  <p className="text-xs text-[#96B5A6]">Marca revisada: {request.brand_context}</p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#D8DDDB]">{request.use_case}</p>
                <p className="mt-3 text-[11px] text-muted-foreground">Recibida {formatDate(request.created_at)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
