'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, Plus, Eye, Download, ChevronRight, Zap } from 'lucide-react'
import Link from 'next/link'

interface ComparisonResult {
  id: string
  similarity: number
  marca: string
  solicitante: string
  fecha: string
  riesgo: 'alto' | 'medio' | 'bajo'
}

// Simulación de resultados de comparación
const MOCK_RESULTS: ComparisonResult[] = [
  {
    id: '1',
    similarity: 92,
    marca: 'VISUAL COMPARE',
    solicitante: 'Visual Compare Ltd',
    fecha: '2023-06-15',
    riesgo: 'alto'
  },
  {
    id: '2',
    similarity: 78,
    marca: 'COMPARE PRO',
    solicitante: 'Software Innovations Inc',
    fecha: '2023-03-22',
    riesgo: 'medio'
  },
  {
    id: '3',
    similarity: 65,
    marca: 'LOGO MATCH',
    solicitante: 'Design Studio Chile',
    fecha: '2024-01-10',
    riesgo: 'medio'
  },
  {
    id: '4',
    similarity: 45,
    marca: 'MARCA SHIELD',
    solicitante: 'IP Protection Services',
    fecha: '2022-11-05',
    riesgo: 'bajo'
  }
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
    // Simulación de análisis
    setTimeout(() => {
      setResults(MOCK_RESULTS)
      setIsAnalyzing(false)
    }, 2000)
  }

  const getRiskColor = (riesgo: string) => {
    switch (riesgo) {
      case 'alto':
        return 'bg-blue-500/10 text-amber-400 border-red-500/20'
      case 'medio':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'bajo':
        return 'bg-green-500/10 text-purple-400 border-green-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/demo" className="flex items-center gap-2 hover:opacity-80 transition">
            <Zap className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Comparador de Logos</span>
          </Link>
          <Link href="/demo" className="text-sm text-slate-400 hover:text-white transition">
            Volver al Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            Comparador Visual de Logos
          </h1>
          <p className="text-slate-400 text-lg">
            Sube un logo y compáralo contra la base de datos de marcas registradas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="border-slate-700 bg-slate-800/50 p-8">
            <h2 className="text-xl font-bold text-white mb-6">Sube tu logo</h2>
            
            <div className="space-y-6">
              {!uploadedImage ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-800 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-12 w-12 text-slate-400 mb-2" />
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold">Haz clic para cargar</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF hasta 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-contain rounded-lg bg-slate-900 p-4"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
                  >
                    ✕
                  </button>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={!uploadedImage || isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">⚙️</span>
                    Analizando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Analizar Logo
                  </>
                )}
              </Button>

              {results.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Reporte
                </Button>
              )}
            </div>
          </Card>

          {/* Results Section */}
          <Card className="border-slate-700 bg-slate-800/50 p-8">
            <h2 className="text-xl font-bold text-white mb-6">Resultados</h2>

            {results.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-700/50 border border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">Marcas similares encontradas</p>
                  <p className="text-3xl font-bold text-blue-400">{results.length}</p>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {results.map((result) => (
                    <div key={result.id} className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-blue-500/50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{result.marca}</h3>
                          <p className="text-xs text-slate-400">{result.solicitante}</p>
                        </div>
                        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${getRiskColor(result.riesgo)}`}>
                          {result.similarity}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-600/50 rounded-full h-2 mb-3">
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
                        <button className="text-blue-400 hover:text-blue-300 transition text-sm">
                          Ver detalles <ChevronRight className="h-3 w-3 inline" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <Eye className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400">
                  {uploadedImage
                    ? 'Haz clic en "Analizar Logo" para ver resultados'
                    : 'Carga un logo para comenzar el análisis'}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Info Section */}
        <Card className="border-slate-700 bg-slate-800/50 p-8 mt-12">
          <h3 className="text-lg font-bold text-white mb-4">Cómo funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-semibold text-white">Carga tu logo</h4>
              </div>
              <p className="text-sm text-slate-400">
                Sube una imagen de tu logo en PNG, JPG o GIF
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-semibold text-white">Análisis IA</h4>
              </div>
              <p className="text-sm text-slate-400">
                Nuestro sistema analiza y compara contra la base de datos
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-semibold text-white">Resultados</h4>
              </div>
              <p className="text-sm text-slate-400">
                Obtén un análisis detallado de similitud y riesgos
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
