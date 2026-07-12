"use client"

import { useCallback, useEffect, useState } from "react"
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ApiKeyRecord } from "@/lib/api/key-management"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CreatedKey = { id: string; key: string } | null

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

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
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

      const payload = await response.json()
      setKeys(Array.isArray(payload.keys) ? payload.keys : [])
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

  return (
    <Card className="border-slate-200/10 bg-white/5 text-white backdrop-blur-xl">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-blue-300" />
          <CardTitle className="text-xl">Claves API</CardTitle>
        </div>
        <CardDescription className="text-slate-300">
          Genera y revoca llaves para integrar el portal con automatizaciones o clientes externos.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_auto]">
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
                      </div>
                      <p className="text-sm text-slate-400">Creada {new Date(key.created_at).toLocaleString("es-CL")}</p>
                      <p className="text-sm text-slate-400">
                        Ultimo uso: {key.last_used_at ? new Date(key.last_used_at).toLocaleString("es-CL") : "Nunca"}
                      </p>
                      <p className="text-sm text-slate-400">Expiracion: {expirationState}</p>
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
