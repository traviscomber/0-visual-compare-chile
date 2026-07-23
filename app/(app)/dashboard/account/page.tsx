"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Eye, EyeOff, Zap } from "lucide-react"
import Link from "next/link"

interface ApiKey {
  id: string
  name: string
  key: string
  plan_id: string
  created_at: string
  last_used_at?: string
  is_active: boolean
}

export default function AccountPage() {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [loadingKeys, setLoadingKeys] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
      return
    }
    
    if (!isLoading && user) {
      loadApiKeys()
    }
  }, [user, isLoading, router])

  const loadApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch("/api/account/api-keys")
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.keys || [])
      }
    } catch (e) {
      console.error("Error loading API keys:", e)
    } finally {
      setLoadingKeys(false)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Visual Compare</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout()
                router.push("/")
              }}
              className="text-slate-300 hover:text-white"
            >
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">Cuenta</h1>
        <p className="text-slate-400 mb-8">Gestiona tu acceso a la API</p>

        {/* API Keys Section */}
        <Card className="bg-slate-900/40 border-white/10 rounded-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-white">Claves de API</h2>
            <span className="text-xs bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full border border-blue-500/20">
              {apiKeys.length} {apiKeys.length === 1 ? "clave" : "claves"}
            </span>
          </div>

          {loadingKeys ? (
            <div className="text-center py-8 text-slate-400">
              <p>Cargando...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="mb-4">No hay claves de API aún.</p>
              <p className="text-sm">Las claves se crearán cuando establezca un plan en la configuración.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((keyItem) => (
                <div
                  key={keyItem.id}
                  className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-medium text-white">{keyItem.name}</span>
                      {keyItem.is_active && (
                        <span className="text-xs bg-green-900/40 text-green-300 px-2 py-1 rounded border border-green-500/20">
                          Activa
                        </span>
                      )}
                      <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded border border-purple-500/20">
                        {keyItem.plan_id.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      <code className="text-xs text-slate-400 bg-slate-900/50 px-3 py-2 rounded font-mono whitespace-nowrap flex-shrink-0">
                        {visibleKeys.has(keyItem.id) ? keyItem.key : "sc_" + "*".repeat(32)}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(keyItem.id)}
                        className="text-slate-500 hover:text-slate-300 transition p-1 flex-shrink-0"
                        title={visibleKeys.has(keyItem.id) ? "Ocultar" : "Mostrar"}
                      >
                        {visibleKeys.has(keyItem.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(keyItem.key)}
                        className="text-slate-500 hover:text-slate-300 transition p-1 flex-shrink-0"
                        title="Copiar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Creada: {new Date(keyItem.created_at).toLocaleDateString("es-CL")}
                      {keyItem.last_used_at && ` • Última vez: ${new Date(keyItem.last_used_at).toLocaleDateString("es-CL")}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Instructions */}
        <Card className="bg-slate-900/40 border-white/10 rounded-xl p-8 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Cómo usar la API</h3>
          <div className="space-y-4 text-slate-300 text-sm">
            <div>
              <p className="font-medium text-white mb-2">1. Headers requerido</p>
              <code className="block bg-slate-800/50 px-4 py-2 rounded border border-slate-700 text-xs font-mono text-blue-300">
                Authorization: Bearer sc_tu_clave
              </code>
            </div>
            <div>
              <p className="font-medium text-white mb-2">2. Endpoints disponibles</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="text-blue-300">POST /api/search</code> - Buscar marcas</li>
                <li><code className="text-blue-300">GET /api/classifications</code> - Clasificaciones</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
