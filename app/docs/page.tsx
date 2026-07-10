'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Copy, Check, Eye } from 'lucide-react'
import { useState } from 'react'

export default function APIDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 relative overflow-hidden">
      {/* Background gradient accents */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-sm border-b border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-montserrat">Visual Compare Chile</span>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-300 hover:bg-blue-900/30">Volver al inicio</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 border-b border-blue-500/20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-white mb-4 font-montserrat">Documentación del MVP</h1>
          <p className="text-lg text-blue-200">Referencia práctica de los flujos activos de Visual Compare Chile.</p>
        </div>
      </section>

      <section className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Panel operativo", href: "/panel" },
              { label: "Comparar", href: "/compare" },
              { label: "Consulta", href: "/consulta" },
            ].map((route) => (
              <a
                key={route.href}
                href={route.href}
                className="rounded-2xl border border-blue-500/20 bg-slate-900/40 px-5 py-4 text-blue-100 transition hover:border-blue-400/50 hover:bg-slate-900/60"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-blue-300 mb-1">Ruta MVP</div>
                <div className="text-lg font-semibold">{route.label}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-20 space-y-8">
              <div>
                <h3 className="font-semibold text-white mb-4 font-montserrat">API Endpoints</h3>
                <ul className="space-y-2 text-sm">
                  {[
                    { name: 'Salud', id: 'health' },
                    { name: 'Cargar imágenes', id: 'upload' },
                    { name: 'Comparar', id: 'compare' },
                    { name: 'Listar', id: 'list' },
                    { name: 'Obtener detalles', id: 'details' },
                    { name: 'Uso', id: 'usage' },
                  ].map(item => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-blue-300 hover:text-blue-200 transition font-medium">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-blue-500/20">
                <h3 className="font-semibold text-white mb-4 font-montserrat">Documentación</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/docs/clasificaciones" className="text-purple-300 hover:text-purple-200 transition font-medium flex items-center gap-2">
                      📚 Clasificaciones Niza & Viena
                    </a>
                  </li>
                  <li>
                    <a href="/brandbook" className="text-amber-300 hover:text-amber-200 transition font-medium flex items-center gap-2">
                      🎨 Brandbook
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-3 space-y-12">
            {/* Authentication */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 font-montserrat">Autenticación</h2>
              <div className="glass p-6 border border-blue-500/30">
                <p className="text-blue-100 mb-4">
                  Todos los endpoints protegidos requieren autenticación Bearer. Incluye tu clave API en el header de Autorización:
                </p>
                <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                  <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`Authorization: Bearer YOUR_API_KEY`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY")}
                    className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition"
                  >
                    {copiedCode === "Authorization: Bearer YOUR_API_KEY" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Health */}
            <section id="health">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900/60 text-blue-300 text-xs font-mono rounded font-semibold">GET</span>
                <h2 className="text-2xl font-bold text-white font-montserrat">/api/v1/health</h2>
              </div>
              <p className="text-blue-100 mb-6">Verifica el estado de la API. No requiere autenticación.</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2 font-montserrat">Ejemplo de solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`curl https://api.visualcompare.cl/api/v1/health`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard("curl https://api.visualcompare.cl/api/v1/health")}
                      className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300 transition"
                    >
                      {copiedCode === "curl https://api.visualcompare.cl/api/v1/health" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2 font-montserrat">Respuesta (200 OK):</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-05-11T12:34:56Z"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Upload */}
            <section id="upload">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900 text-blue-300 text-xs font-mono rounded">POST</span>
                <h2 className="text-2xl font-bold text-white font-montserrat">/api/v1/images</h2>
              </div>
              <p className="text-blue-100 mb-6">Carga una imagen para comparar. Retorna metadatos e ID de imagen.</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Parámetros:</h3>
                  <ul className="space-y-2 text-sm text-blue-100">
                    <li><strong>image</strong> (requerido): Archivo de imagen (JPEG, PNG, WebP, TIFF, máx 50MB)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Ejemplo de solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`curl -X POST https://api.visualcompare.cl/api/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@logo.jpg"`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST https://api.visualcompare.cl/api/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@logo.jpg"`)}
                      className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-300 transition"
                    >
                      {copiedCode?.includes('images') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Respuesta (201 Creado):</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "filename": "logo.jpg",
    "size_bytes": 25600,
    "width": 512,
    "height": 512,
    "mime_type": "image/jpeg",
    "sha256": "abc123def456...",
    "phash": "8f5c3a1b9d7e2f4c"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Compare */}
            <section id="compare">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900 text-blue-300 text-xs font-mono rounded">POST</span>
                <h2 className="text-2xl font-bold text-white font-montserrat">/api/v1/compare</h2>
              </div>
              <p className="text-blue-100 mb-6">Compara dos imágenes y obtén puntuación de similitud. Retorna puntuación 0-100% con clasificación.</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Body de la solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300">
{`{
  "image_a_id": "uuid-1234",
  "image_b_id": "uuid-5678"
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Ejemplo de solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`curl -X POST https://api.visualcompare.cl/api/v1/compare \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_a_id":"uuid-1234","image_b_id":"uuid-5678"}'`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`curl -X POST https://api.visualcompare.cl/api/v1/compare \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_a_id":"uuid-1234","image_b_id":"uuid-5678"}'`)}
                      className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-300 transition"
                    >
                      {copiedCode?.includes('compare') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Respuesta (200 OK):</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "comp-uuid-9999",
    "similarity_score": 94.2,
    "classification": "near_duplicate",
    "recommendation": "REVIEW"
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Niveles de clasificación:</h3>
                  <ul className="space-y-2 text-sm text-blue-100">
                    <li><strong className="text-blue-300">exact_match</strong> (95-100%): Imágenes idénticas</li>
                    <li><strong className="text-blue-300">near_duplicate</strong> (85-94%): Casi idénticas</li>
                    <li><strong className="text-blue-300">visually_similar</strong> (60-84%): Similitud significativa</li>
                    <li><strong className="text-blue-300">partially_similar</strong> (20-59%): Cierta similitud</li>
                    <li><strong className="text-blue-300">different</strong> (&lt;20%): Sin relación</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* List */}
            <section id="list">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900/60 text-blue-300 text-xs font-mono rounded">GET</span>
                <h2 className="text-2xl font-bold text-white font-montserrat">/api/v1/comparisons</h2>
              </div>
              <p className="text-blue-100 mb-6">Lista todas las comparaciones con soporte de paginación.</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Parámetros de query:</h3>
                  <ul className="space-y-2 text-sm text-blue-100">
                    <li><strong>limit</strong> (opcional): Resultados por página (default: 50, máx: 100)</li>
                    <li><strong>offset</strong> (opcional): Offset de paginación (default: 0)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Ejemplo de solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`curl https://api.visualcompare.cl/api/v1/comparisons?limit=20 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`curl https://api.visualcompare.cl/api/v1/comparisons?limit=20 \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                      className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-300 transition"
                    >
                      {copiedCode?.includes('comparisons') && copiedCode?.includes('limit') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Respuesta (200 OK):</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`{
  "data": [{"id": "comp-1", "similarity_score": 94.2}],
  "limit": 20,
  "offset": 0,
  "count": 1
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Get Details */}
            <section id="details">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900/60 text-blue-300 text-xs font-mono rounded">GET</span>
                <h2 className="text-2xl font-bold text-white font-montserrat">/api/v1/comparisons/:id</h2>
              </div>
              <p className="text-blue-100 mb-6">Obtén detalles completos de una comparación específica.</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Ejemplo de solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`curl https://api.visualcompare.cl/api/v1/comparisons/comp-uuid-1 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`curl https://api.visualcompare.cl/api/v1/comparisons/comp-uuid-1 \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                      className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-300 transition"
                    >
                      {copiedCode?.includes('comp-uuid-1') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Respuesta (200 OK):</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "comp-uuid-1",
    "similarity_score": 94.2,
    "classification": "near_duplicate"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Usage */}
            <section id="usage">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-900/60 text-blue-300 text-xs font-mono rounded">GET</span>
                <h2 className="text-2xl font-bold text-white font-montserrat">/api/v1/usage</h2>
              </div>
              <p className="text-blue-100 mb-6">Obtén estadísticas de uso de tu cuenta API.</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Ejemplo de solicitud:</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4 relative">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`curl https://api.visualcompare.cl/api/v1/usage \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`curl https://api.visualcompare.cl/api/v1/usage \\
  -H "Authorization: Bearer YOUR_API_KEY"`)}
                      className="absolute top-3 right-3 p-2 hover:bg-blue-500/20 rounded text-blue-300 hover:text-blue-300 transition"
                    >
                      {copiedCode?.includes('/usage') ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Respuesta (200 OK):</h3>
                  <div className="bg-slate-900/40 border border-blue-500/20 rounded p-4">
                    <pre className="text-sm font-mono text-blue-300 overflow-x-auto">
{`{
  "uploads_today": 42,
  "comparisons_today": 89,
  "storage_gb": 12.5,
  "api_calls_today": 250
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Error handling */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Manejo de errores</h2>
              <div className="space-y-3">
                <div className="glass p-4">
                  <p className="font-mono text-sm text-blue-300 mb-2">401 No autorizado</p>
                  <pre className="text-xs text-blue-300">
{`{"error": "Invalid API key"}`}
                  </pre>
                </div>
                <div className="glass p-4">
                  <p className="font-mono text-sm text-amber-300 mb-2">400 Solicitud inválida</p>
                  <pre className="text-xs text-blue-300">
{`{"error": "Missing or invalid image_a_id"}`}
                  </pre>
                </div>
                <div className="glass p-4">
                  <p className="font-mono text-sm text-orange-300 mb-2">404 No encontrado</p>
                  <pre className="text-xs text-blue-300">
{`{"error": "Image not found"}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="glass p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-3">¿Listo para integrar?</h2>
              <p className="text-blue-100 mb-6">Obtén tu clave API y comienza a comparar imágenes en minutos.</p>
              <Link href="/auth/sign-up">
                <Button size="lg" className="bg-blue-900 hover:bg-blue-800 text-white">Obtén tu clave API</Button>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
