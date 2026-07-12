'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Eye, Download, ChevronRight, Zap } from 'lucide-react'

interface ComparisonResult {
  id: string
  similarity: number
  marca: string
  solicitante: string
  fecha: string
  riesgo: 'alto' | 'medio' | 'bajo'
}

const mockResults: ComparisonResult[] = [
  {
    id: '1',
    similarity: 92,
    marca: 'VISUAL COMPARE',
    solicitante: 'Visual Compare Chile',
    fecha: '2023-06-15',
    riesgo: 'alto',
  },
  {
    id: '2',
    similarity: 78,
    marca: 'COMPARE PRO',
    solicitante: 'Software Innovations Inc',
    fecha: '2023-03-22',
    riesgo: 'medio',
  },
  {
    id: '3',
    similarity: 65,
    marca: 'LOGO MATCH',
    solicitante: 'Design Studio Chile',
    fecha: '2024-01-10',
    riesgo: 'medio',
  },
  {
    id: '4',
    similarity: 45,
    marca: 'MARCA SHIELD',
    solicitante: 'IP Protection Services',
    fecha: '2022-11-05',
    riesgo: 'bajo',
  },
]

export default function ComparadorPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [results, setResults] = useState<ComparisonResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    window.setTimeout(() => {
      setResults(mockResults)
      setIsAnalyzing(false)
    }, 2000)
  }

  const getRiskColor = (riesgo: string) => {
    switch (riesgo) {
      case 'alto':
        return 'border-red-500/20 bg-red-500/10 text-red-300'
      case 'medio':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-300'
      case 'bajo':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      default:
        return 'border-slate-500/20 bg-slate-500/10 text-slate-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/panel" className="flex items-center gap-2 transition hover:opacity-80">
            <Zap className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Comparador visual</span>
          </Link>
          <Link href="/panel" className="text-sm text-slate-400 transition hover:text-white">
            Volver al panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12">
          <h1 className="mb-3 text-4xl font-bold text-white">Comparador visual de marcas</h1>
          <p className="text-lg text-slate-400">
            Esta vista sirve como apoyo comercial del MVP. Para el flujo real con auth, historial y persistencia usa{' '}
            <Link href="/compare" className="text-blue-300 underline-offset-4 hover:underline">
              /compare
            </Link>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="border-slate-700 bg-slate-800/50 p-8">
            <h2 className="mb-6 text-xl font-bold text-white">Sube una imagen de referencia</h2>

            <div className="space-y-6">
              {!uploadedImage ? (
                <label className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-600 transition-all hover:border-blue-500 hover:bg-slate-800">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="mb-2 h-12 w-12 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold">Haz clic para cargar</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-slate-500">JPG, PNG, WebP o TIFF hasta 50 MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/tiff"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="h-64 w-full rounded-lg bg-slate-900 p-4 object-contain"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700"
                  >
                    x
                  </button>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!uploadedImage || isAnalyzing}
                className="h-10 w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <span className="mr-2 animate-spin">o</span>
                    Analizando...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Analizar logo
                  </>
                )}
              </Button>

              {results.length > 0 && (
                <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar reporte
                </Button>
              )}
            </div>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 p-8">
            <h2 className="mb-6 text-xl font-bold text-white">Resultados simulados</h2>

            {results.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-4">
                  <p className="mb-2 text-sm text-slate-400">Marcas similares encontradas</p>
                  <p className="text-3xl font-bold text-blue-400">{results.length}</p>
                </div>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="rounded-lg border border-slate-600 bg-slate-700/50 p-4 transition-all hover:border-blue-500/50"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">{result.marca}</h3>
                          <p className="text-xs text-slate-400">{result.solicitante}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(result.riesgo)}`}>
                          {result.similarity}%
                        </span>
                      </div>
                      <div className="mb-3 h-2 w-full rounded-full bg-slate-600/50">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            result.similarity >= 80
                              ? 'bg-blue-500'
                              : result.similarity >= 60
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${result.similarity}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{result.fecha}</p>
                        <button className="text-sm text-blue-400 transition hover:text-blue-300">
                          Ver detalles <ChevronRight className="inline h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-80 flex-col items-center justify-center text-center">
                <Eye className="mb-4 h-12 w-12 text-slate-600" />
                <p className="text-slate-400">
                  {uploadedImage
                    ? 'Haz clic en "Analizar logo" para ver resultados'
                    : 'Carga un logo para comenzar el analisis'}
                </p>
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-12 border-slate-700 bg-slate-800/50 p-8">
          <h3 className="mb-4 text-lg font-bold text-white">Como funciona esta vista</h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400">
                  1
                </div>
                <h4 className="font-semibold text-white">Carga tu logo</h4>
              </div>
              <p className="text-sm text-slate-400">Sube una imagen de tu logo en JPG, PNG, WebP o TIFF.</p>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400">
                  2
                </div>
                <h4 className="font-semibold text-white">Simula el analisis</h4>
              </div>
              <p className="text-sm text-slate-400">
                Esta vista muestra una simulacion comercial del resultado para explicar el producto.
              </p>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400">
                  3
                </div>
                <h4 className="font-semibold text-white">Pasa al flujo real</h4>
              </div>
              <p className="text-sm text-slate-400">
                Usa{' '}
                <Link href="/compare" className="text-blue-300 underline-offset-4 hover:underline">
                  /compare
                </Link>{' '}
                para la comparacion autenticada y persistente del MVP.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
