"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ApiKeyRecord } from "@/lib/api/key-management"
import type { ApiQuotaPlan } from "@/lib/api/quotas"
import {
  DEFAULT_API_KEY_COMMERCIAL_COPY,
  DEFAULT_API_KEY_DAILY_QUOTA,
  DEFAULT_API_KEY_MONTHLY_QUOTA,
  formatApiQuotaValue,
} from "@/lib/api/quotas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

type CreatedKey = { id: string; key: string } | null
type ApiKeyPayload = {
  keys?: ApiKeyRecord[]
  defaults?: {
    quotaDaily?: number
    quotaMonthly?: number
  }
  plans?: ApiQuotaPlan[]
}

function formatExpiration(expiresAt: string | null) {
  if (!expiresAt) return "Sin expiración"
  const expirationDate = new Date(expiresAt)
  if (Number.isNaN(expirationDate.getTime())) return "Expiración inválida"
  return expirationDate.toLocaleString("es-CL")
}

function getQuotaPressure(usage: number, quota: number) {
  const pct = quota > 0 ? Math.round((usage / quota) * 100) : 0

  if (pct >= 90) return { pct, label: "Crítica", className: "bg-[#3A2525] text-[#E8AAA3]" }
  if (pct >= 70) return { pct, label: "Alta", className: "bg-[#332C24] text-[#D6A46F]" }
  if (pct > 0) return { pct, label: "Normal", className: "bg-[#17313D] text-[#B7D3D1]" }
  return { pct, label: "Sin uso", className: "bg-[#173B37] text-[#96B5A6]" }
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [plans, setPlans] = useState<ApiQuotaPlan[]>([])
  const [name, setName] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [quotaDaily, setQuotaDaily] = useState(String(DEFAULT_API_KEY_DAILY_QUOTA))
  const [quotaMonthly, setQuotaMonthly] = useState(String(DEFAULT_API_KEY_MONTHLY_QUOTA))
  const [selectedPlanId, setSelectedPlanId] = useState("mvp-base")
  const [createdKey, setCreatedKey] = useState<CreatedKey>(null)

  const loadKeys = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/account/api-keys")
      if (response.status === 401) {
        window.location.href = "/auth/login?redirectTo=/settings"
        return
      }

      if (!response.ok) throw new Error("No fue posible cargar las claves API")

      const payload = (await response.json()) as ApiKeyPayload
      setKeys(Array.isArray(payload.keys) ? payload.keys : [])
      setPlans(Array.isArray(payload.plans) ? payload.plans : [])

      const defaultDaily = payload.defaults?.quotaDaily ?? DEFAULT_API_KEY_DAILY_QUOTA
      const defaultMonthly = payload.defaults?.quotaMonthly ?? DEFAULT_API_KEY_MONTHLY_QUOTA
      setQuotaDaily((current) => (current ? current : String(defaultDaily)))
      setQuotaMonthly((current) => (current ? current : String(defaultMonthly)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar claves API")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Escribe un nombre para la clave")
      return
    }

    setCreating(true)

    try {
      const response = await fetch("/api/account/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          expiresAt: expiresAt || undefined,
          planId: selectedPlanId || undefined,
          quotaDaily: Number(quotaDaily),
          quotaMonthly: Number(quotaMonthly),
        }),
      })

      if (response.status === 401) {
        window.location.href = "/auth/login?redirectTo=/settings"
        return
      }

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No fue posible crear la clave")

      setCreatedKey({ id: payload.id, key: payload.key })
      setName("")
      setExpiresAt("")
      setQuotaDaily(String(DEFAULT_API_KEY_DAILY_QUOTA))
      setQuotaMonthly(String(DEFAULT_API_KEY_MONTHLY_QUOTA))
      setSelectedPlanId("mvp-base")
      toast.success("Clave API creada")
      await loadKeys()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear clave API")
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    setRevokingId(keyId)

    try {
      const response = await fetch(`/api/account/api-keys/${keyId}`, { method: "DELETE" })
      if (response.status === 401) {
        window.location.href = "/auth/login?redirectTo=/settings"
        return
      }

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "No fue posible revocar la clave")

      toast.success("Clave API revocada")
      await loadKeys()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al revocar clave API")
    } finally {
      setRevokingId(null)
    }
  }

  const copySecret = async () => {
    if (!createdKey?.key) return
    await navigator.clipboard.writeText(createdKey.key)
    toast.success("Clave copiada")
  }

  const applyPlan = (plan: ApiQuotaPlan) => {
    setSelectedPlanId(plan.id)
    setQuotaDaily(String(plan.quotaDaily))
    setQuotaMonthly(String(plan.quotaMonthly))
  }

  const activeKeys = keys.filter((key) => key.is_active)
  const aggregateMonthlyQuota = activeKeys.reduce((sum, key) => sum + key.quota_monthly, 0)
  const aggregateMonthlyUsage = activeKeys.reduce((sum, key) => sum + key.usage_month, 0)
  const aggregateDailyQuota = activeKeys.reduce((sum, key) => sum + key.quota_daily, 0)
  const aggregateDailyUsage = activeKeys.reduce((sum, key) => sum + key.usage_today, 0)
  const aggregateMonthlyRemaining = Math.max(aggregateMonthlyQuota - aggregateMonthlyUsage, 0)
  const monthlyUsagePct = aggregateMonthlyQuota > 0 ? Math.round((aggregateMonthlyUsage / aggregateMonthlyQuota) * 100) : 0
  const pressure = getQuotaPressure(aggregateMonthlyUsage, aggregateMonthlyQuota)

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#96B5A6]">
            <KeyRound className="h-4 w-4" />
            <p className="text-[10px] font-medium uppercase tracking-[0.16em]">Acceso programático</p>
          </div>
          <h3 className="mt-2 text-xl font-light tracking-[-0.025em] text-[#E7DFCE]">Claves API</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Genera y revoca credenciales para automatizaciones o clientes externos. La cuota base es de {DEFAULT_API_KEY_COMMERCIAL_COPY} por clave.
          </p>
        </div>
        {loading ? <span className="text-xs text-muted-foreground">Actualizando inventario…</span> : null}
      </div>

      <div className="grid gap-px overflow-hidden rounded-[10px] bg-border/70 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Claves activas" value={String(activeKeys.length)} detail="Inventario operativo actual" />
        <Metric
          label="Uso mensual"
          value={`${aggregateMonthlyUsage}/${aggregateMonthlyQuota || 0}`}
          detail={`${aggregateMonthlyRemaining} análisis restantes`}
        />
        <Metric
          label="Uso diario"
          value={`${aggregateDailyUsage}/${aggregateDailyQuota || 0}`}
          detail="Capacidad combinada activa"
        />
        <Metric label="Presión de cuota" value={`${monthlyUsagePct}%`} detail={pressure.label} toneClass={pressure.className} />
      </div>

      {plans.length > 0 ? (
        <section>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Plan de capacidad</p>
            <h4 className="mt-2 text-lg font-light text-[#E7DFCE]">Selecciona una base y ajústala si es necesario</h4>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              El plan base del MVP permite {DEFAULT_API_KEY_COMMERCIAL_COPY} por clave.
            </p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyPlan(plan)}
                  className={[
                    "min-h-[132px] rounded-[10px] p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
                    selected
                      ? "bg-[#173B37] text-white"
                      : "bg-[#13272D] text-white hover:bg-[#172F34]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{plan.name}</p>
                    {selected ? <Badge className="bg-[#203F3A] text-[#B7D3D1]">Seleccionado</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{plan.description}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[#96B5A6]">
                    {formatApiQuotaValue(plan.quotaDaily)}/día · {formatApiQuotaValue(plan.quotaMonthly)}/mes
                  </p>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-[10px] bg-[#13272D] p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Nueva credencial</p>
          <p className="mt-1 text-sm text-muted-foreground">Define un nombre, vencimiento opcional y límites de uso.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_auto] xl:items-end">
          <Field label="Nombre">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej: Integración CRM" />
          </Field>
          <Field label="Vencimiento opcional">
            <Input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </Field>
          <Field label="Cuota diaria">
            <Input type="number" min="1" value={quotaDaily} onChange={(event) => setQuotaDaily(event.target.value)} />
          </Field>
          <Field label="Cuota mensual">
            <Input type="number" min="1" value={quotaMonthly} onChange={(event) => setQuotaMonthly(event.target.value)} />
          </Field>
          <Button type="button" onClick={handleCreate} disabled={creating} className="h-10 xl:min-w-28">
            <Plus className="h-4 w-4" />
            {creating ? "Creando" : "Crear"}
          </Button>
        </div>
      </section>

      {createdKey ? (
        <div className="rounded-[10px] bg-[#332C24] p-4 sm:p-5" role="status">
          <p className="text-sm font-medium text-[#E7DFCE]">Guarda esta clave ahora. Sólo se muestra una vez.</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-[8px] bg-[#091A20] px-3 py-2 text-sm text-white">
              {createdKey.key}
            </code>
            <Button type="button" variant="secondary" onClick={copySecret} className="shrink-0">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        </div>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">Inventario</p>
            <h4 className="mt-2 text-lg font-light text-[#E7DFCE]">Credenciales registradas</h4>
          </div>
          <span className="text-xs text-muted-foreground">{keys.length} total</span>
        </div>

        {keys.length === 0 ? (
          <div className="mt-4 rounded-[10px] bg-[#13272D] p-6 text-sm text-muted-foreground">
            No hay claves API registradas para esta cuenta.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/80 border-y border-border/80">
            {keys.map((key) => {
              const expirationLabel = formatExpiration(key.expires_at)
              const expirationState = key.expires_at && new Date(key.expires_at).getTime() < Date.now() ? "Vencida" : expirationLabel
              const remainingDaily = Math.max(key.quota_daily - key.usage_today, 0)
              const remainingMonthly = Math.max(key.quota_monthly - key.usage_month, 0)
              const dailyPressure = getQuotaPressure(key.usage_today, key.quota_daily)
              const monthlyPressure = getQuotaPressure(key.usage_month, key.quota_monthly)

              return (
                <div key={key.id} className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{key.name}</p>
                      <Badge className={key.is_active ? "bg-[#173B37] text-[#96B5A6]" : "bg-[#26363A] text-[#BDBEBD]"}>
                        {key.is_active ? "Activa" : "Revocada"}
                      </Badge>
                      <Badge className={monthlyPressure.className}>{monthlyPressure.label}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <span>Creada {new Date(key.created_at).toLocaleString("es-CL")}</span>
                      <span>Último uso: {key.last_used_at ? new Date(key.last_used_at).toLocaleString("es-CL") : "Nunca"}</span>
                      <span>Expiración: {expirationState}</span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <QuotaBar
                        label="Uso diario"
                        used={key.usage_today}
                        quota={key.quota_daily}
                        remaining={remainingDaily}
                        pressure={dailyPressure}
                      />
                      <QuotaBar
                        label="Uso mensual"
                        used={key.usage_month}
                        quota={key.quota_monthly}
                        remaining={remainingMonthly}
                        pressure={monthlyPressure}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokingId === key.id || !key.is_active}
                    className="justify-self-start lg:justify-self-end"
                  >
                    <Trash2 className="h-4 w-4" />
                    {revokingId === key.id ? "Revocando" : "Revocar"}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  toneClass,
}: {
  label: string
  value: string
  detail: string
  toneClass?: string
}) {
  return (
    <div className="min-h-[118px] bg-[#0F2A33] p-4 sm:p-5">
      <p className="text-2xl font-light tracking-[-0.035em] text-[#E7DFCE]">{value}</p>
      <p className="mt-2 text-sm font-medium text-white">{label}</p>
      {toneClass ? <Badge className={`mt-2 ${toneClass}`}>{detail}</Badge> : <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <span className="mt-1.5 block">{children}</span>
    </label>
  )
}

function QuotaBar({
  label,
  used,
  quota,
  remaining,
  pressure,
}: {
  label: string
  used: number
  quota: number
  remaining: number
  pressure: ReturnType<typeof getQuotaPressure>
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>{label}: {used}/{quota}</span>
        <span>{remaining} restantes</span>
      </div>
      <Progress value={pressure.pct} className="mt-2 h-1.5 bg-[#091A20]" />
    </div>
  )
}
