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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  if (!expiresAt) {
    return "Sin expiracion"
  }

  const expirationDate = new Date(expiresAt)
  if (Number.isNaN(expirationDate.getTime())) {
    return "Expiracion invalida"
  }

  return expirationDate.toLocaleString("es-CL")
}

function getQuotaPressure(usage: number, quota: number) {
  const pct = quota > 0 ? Math.round((usage / quota) * 100) : 0

  if (pct >= 90) {
    return { pct, label: "Critica", className: "bg-rose-500/20 text-rose-100" }
  }

  if (pct >= 70) {
    return { pct, label: "Alta", className: "bg-amber-500/20 text-amber-100" }
  }

  if (pct > 0) {
    return { pct, label: "Normal", className: "bg-blue-500/20 text-blue-100" }
  }

  return { pct, label: "Sin uso", className: "bg-emerald-500/20 text-emerald-100" }
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

      if (!response.ok) {
        throw new Error("No fue posible cargar las claves API")
      }

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
      if (!response.ok) {
        throw new Error(payload.error || "No fue posible crear la clave")
      }

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
      if (!response.ok) {
        throw new Error(payload.error || "No fue posible revocar la clave")
      }

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
  const pressureLabel =
    monthlyUsagePct >= 90 ? "Alta" : monthlyUsagePct >= 70 ? "Media" : activeKeys.length > 0 ? "Baja" : "Sin uso"

  return (
    <Card className="border-slate-200/10 bg-white/5 text-white backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-blue-300" />
          <CardTitle className="text-xl">Claves API</CardTitle>
        </div>
        <CardDescription className="text-slate-300">
          Genera y revoca llaves para integrar el portal con automatizaciones o clientes externos. La cuota base es de{" "}
          {DEFAULT_API_KEY_COMMERCIAL_COPY} por clave.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Claves activas</p>
            <p className="mt-2 text-2xl font-semibold text-white">{activeKeys.length}</p>
            <p className="mt-1 text-sm text-slate-400">Inventario operativo actual</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uso mensual agregado</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {aggregateMonthlyUsage}/{aggregateMonthlyQuota || 0}
            </p>
            <p className="mt-1 text-sm text-slate-400">{aggregateMonthlyRemaining} analisis restantes este mes</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uso diario agregado</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {aggregateDailyUsage}/{aggregateDailyQuota || 0}
            </p>
            <p className="mt-1 text-sm text-slate-400">Capacidad diaria combinada de las claves activas</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Presion de cuota</p>
            <p className="mt-2 text-2xl font-semibold text-white">{monthlyUsagePct}%</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={
                  pressureLabel === "Alta"
                    ? "bg-amber-500/20 text-amber-100"
                    : pressureLabel === "Media"
                      ? "bg-blue-500/20 text-blue-100"
                      : "bg-emerald-500/20 text-emerald-100"
                }
              >
                {pressureLabel}
              </Badge>
              <span className="text-sm text-slate-400">sobre el mes corriente</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Planes sugeridos</p>
            <p className="mt-1 text-sm text-slate-400">
              El plan base del MVP permite {DEFAULT_API_KEY_COMMERCIAL_COPY} por clave. Puedes usarlo tal cual o ajustarlo.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => applyPlan(plan)}
                  className={[
                    "rounded-2xl border p-4 text-left transition",
                    selected
                      ? "border-blue-400/60 bg-blue-500/10 text-white"
                      : "border-white/10 bg-slate-950/40 text-slate-200 hover:border-white/20 hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{plan.name}</p>
                    {selected ? <Badge className="bg-blue-500/20 text-blue-100">Activo</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {formatApiQuotaValue(plan.quotaDaily)}/dia · {formatApiQuotaValue(plan.quotaMonthly)}/mes
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_auto]">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la clave"
            className="border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
          />
          <Input
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="border-white/10 bg-slate-950/60 text-white"
          />
          <Input
            type="number"
            min="1"
            value={quotaDaily}
            onChange={(event) => setQuotaDaily(event.target.value)}
            placeholder="Quota diaria"
            className="border-white/10 bg-slate-950/60 text-white"
          />
          <Input
            type="number"
            min="1"
            value={quotaMonthly}
            onChange={(event) => setQuotaMonthly(event.target.value)}
            placeholder="Quota mensual"
            className="border-white/10 bg-slate-950/60 text-white"
          />
          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400"
          >
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Creando" : "Crear"}
          </Button>
        </div>

        {createdKey && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-100">Esta clave solo se muestra una vez.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <code className="rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">
                {createdKey.key}
              </code>
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={copySecret}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Claves activas</h3>
            {loading && <span className="text-xs text-slate-400">Cargando...</span>}
          </div>

          {keys.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
              No hay claves API registradas para esta cuenta.
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => {
                const expirationLabel = formatExpiration(key.expires_at)
                const expirationState =
                  key.expires_at && new Date(key.expires_at).getTime() < Date.now() ? "Vencida" : expirationLabel
                const remainingDaily = Math.max(key.quota_daily - key.usage_today, 0)
                const remainingMonthly = Math.max(key.quota_monthly - key.usage_month, 0)
                const dailyPressure = getQuotaPressure(key.usage_today, key.quota_daily)
                const monthlyPressure = getQuotaPressure(key.usage_month, key.quota_monthly)

                return (
                  <div
                    key={key.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{key.name}</p>
                        <Badge
                          className={
                            key.is_active
                              ? "bg-emerald-500/20 text-emerald-100"
                              : "bg-slate-500/20 text-slate-200"
                          }
                        >
                          {key.is_active ? "Activa" : "Revocada"}
                        </Badge>
                        <Badge className={monthlyPressure.className}>{monthlyPressure.label}</Badge>
                      </div>
                      <p className="text-sm text-slate-400">Creada {new Date(key.created_at).toLocaleString("es-CL")}</p>
                      <p className="text-sm text-slate-400">
                        Ultimo uso: {key.last_used_at ? new Date(key.last_used_at).toLocaleString("es-CL") : "Nunca"}
                      </p>
                      <p className="text-sm text-slate-400">Expiracion: {expirationState}</p>
                      <div className="space-y-2 pt-1">
                        <div>
                          <div className="flex items-center justify-between text-sm text-slate-400">
                            <span>Uso diario: {key.usage_today}/{key.quota_daily}</span>
                            <span>{remainingDaily} restantes</span>
                          </div>
                          <Progress value={dailyPressure.pct} className="mt-2 h-2 bg-white/10" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm text-slate-400">
                            <span>Uso mensual: {key.usage_month}/{key.quota_monthly}</span>
                            <span>{remainingMonthly} restantes</span>
                          </div>
                          <Progress value={monthlyPressure.pct} className="mt-2 h-2 bg-white/10" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                        onClick={() => handleRevoke(key.id)}
                        disabled={revokingId === key.id || !key.is_active}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {revokingId === key.id ? "Revocando" : "Revocar"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
