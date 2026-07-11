'use client'

import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { Eye, Upload, X, Loader2, GitCompareArrows, RotateCcw, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ComparisonResultView } from '@/components/app/comparison-result-view'
import type { ComparisonResultPayload } from '@/types/comparison'

type UploadedImage = {
  id: string
  filename: string
  size_bytes: number
  width: number | null
  height: number | null
  url: string
}

function ImageZone({
  label,
  image,
  onChange,
  disabled,
}: {
  label: string
  image: UploadedImage | null
  onChange: (img: UploadedImage | null) => void
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/images/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/auth/signup?redirect=/comparador'
            return
          }
          throw new Error(json.error ?? 'Error al subir imagen')
        }
        onChange(json as UploadedImage)
      } catch (err) {
        console.error('[v0] upload error:', err)
      } finally {
        setUploading(false)
      }
    },
    [onChange],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {image && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Quitar
          </button>
        )}
      </div>

      {image ? (
        <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt={image.filename} className="w-full aspect-[4/3] object-contain bg-slate-950 p-2" />
          <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-400 truncate">{image.filename}</div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
          disabled={disabled}
          className={cn(
            'w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3',
            dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-blue-500/70 hover:bg-slate-800/50',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              <span className="text-sm text-slate-400">Subiendo...</span>
            </>
          ) : (
            <>
              <span className="h-14 w-14 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                <Upload className="h-6 w-6 text-slate-400" />
              </span>
              <span className="text-sm text-slate-300">Arrastra o haz clic para subir</span>
              <span className="text-xs text-slate-500">JPG, PNG, WebP, TIFF · hasta 50MB</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
        </button>
      )}
    </div>
  )
}

export default function ComparadorPage() {
  const [imageA, setImageA] = useState<UploadedImage | null>(null)
  const [imageB, setImageB] = useState<UploadedImage | null>(null)
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResultPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    if (!imageA || !imageB) return
    setComparing(true)
    setError(null)
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image_a_id: imageA.id, image_b_id: imageB.id }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/auth/signup?redirect=/comparador'
          return
        }
        throw new Error(json.error ?? 'Error al comparar')
      }
      setResult(json as ComparisonResultPayload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setComparing(false)
    }
  }

  const handleReset = () => {
    setImageA(null)
    setImageB(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Visual Compare Chile</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/consulta" className="text-sm text-slate-400 hover:text-white transition">Consulta INAPI</Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">Crear cuenta</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <GitCompareArrows className="h-3.5 w-3.5" />
            Motor SHA-256 + pHash + GPT-4o mini
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Comparador visual de marcas</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Sube dos logos y analiza su similitud visual con nuestro motor híbrido de 3 métodos. Resultado en menos de 100ms.
          </p>
        </div>

        {result ? (
          /* Results view */
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-slate-400">Resultado del análisis — guardado en tu historial</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nueva comparación
                </Button>
                <Link href={`/comparisons/${result.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Ver detalle completo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <ComparisonResultView
              result={result}
              imageA={imageA ? { url: imageA.url, filename: imageA.filename } : null}
              imageB={imageB ? { url: imageB.url, filename: imageB.filename } : null}
            />
          </div>
        ) : (
          /* Upload + Compare UI */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload area */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageZone label="Logo A" image={imageA} onChange={setImageA} />
                <ImageZone label="Logo B" image={imageB} onChange={setImageB} />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleCompare}
                  disabled={!imageA || !imageB || comparing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
                >
                  {comparing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <GitCompareArrows className="h-5 w-5 mr-2" />
                      Comparar logos
                    </>
                  )}
                </Button>
                {(imageA || imageB) && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 h-12"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Auth notice */}
              <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <Lock className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-400">
                  Necesitas una cuenta para comparar.{' '}
                  <Link href="/auth/signup?redirect=/comparador" className="text-blue-400 hover:text-blue-300 underline">
                    Crear cuenta gratis
                  </Link>
                  {' '}o{' '}
                  <Link href="/auth/login?redirect=/comparador" className="text-blue-400 hover:text-blue-300 underline">
                    iniciar sesión
                  </Link>
                  . Tus comparaciones quedan guardadas con historial completo.
                </p>
              </div>
            </div>

            {/* How it works sidebar */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-white">Como funciona</h2>

              <div className="flex flex-col gap-3">
                {[
                  { n: 1, title: 'Sube los logos', desc: 'JPG, PNG, WebP o TIFF hasta 50MB cada uno.' },
                  { n: 2, title: 'Motor analiza', desc: 'SHA-256 exacto + pHash perceptual en paralelo.' },
                  { n: 3, title: 'IA enriquece', desc: 'GPT-4o mini detecta colores, estilo y riesgo de confusión.' },
                  { n: 4, title: 'Resultado', desc: 'Score 0-100%, clasificación, overlay de diferencias y recomendación.' },
                ].map(({ n, title, desc }) => (
                  <div key={n} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <span className="h-7 w-7 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm font-bold flex items-center justify-center shrink-0">
                      {n}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 mt-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Capacidades</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Latencia', value: '<100ms' },
                    { label: 'Formatos', value: '4 tipos' },
                    { label: 'Max. imagen', value: '50MB' },
                    { label: 'IA Score', value: '0-100' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-bold text-blue-300">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/consulta" className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-blue-500/40 transition group">
                <div>
                  <p className="text-sm font-semibold text-white">Portal de consulta INAPI</p>
                  <p className="text-xs text-slate-400 mt-0.5">350K+ marcas registradas en Chile</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
