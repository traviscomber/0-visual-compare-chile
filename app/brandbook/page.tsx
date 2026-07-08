'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, ChevronDown } from 'lucide-react'
import Link from 'next/link'

const colors = [
  { name: 'Primary Blue Light', hex: '#3b82f6', rgb: '59, 130, 246', usage: 'Buttons, highlights, interactive elements' },
  { name: 'Primary Blue Dark', hex: '#1e40af', rgb: '30, 64, 175', usage: 'Text, dark mode accents, borders' },
  { name: 'Secondary Purple', hex: '#a855f7', rgb: '168, 85, 247', usage: 'Highlights, decorative elements' },
  { name: 'Tertiary Amber', hex: '#f59e0b', rgb: '245, 158, 11', usage: 'Warnings, notifications, highlights' },
  { name: 'Neutral White', hex: '#ffffff', rgb: '255, 255, 255', usage: 'Foreground, text' },
  { name: 'Neutral Dark', hex: '#0f172a', rgb: '15, 23, 42', usage: 'Background, dark mode' },
]

const typography = [
  { name: 'Heading H1', size: '2.25rem (36px)', weight: '700', lineHeight: '1.2', color: 'Foreground' },
  { name: 'Heading H2', size: '1.875rem (30px)', weight: '700', lineHeight: '1.2', color: 'Foreground' },
  { name: 'Heading H3', size: '1.5rem (24px)', weight: '700', lineHeight: '1.2', color: 'Foreground' },
  { name: 'Body Text', size: '1rem (16px)', weight: '400', lineHeight: '1.5', color: 'Muted Foreground' },
  { name: 'Small Text', size: '0.875rem (14px)', weight: '400', lineHeight: '1.5', color: 'Muted Foreground' },
  { name: 'Button Text', size: '1rem (16px)', weight: '600', lineHeight: '1.5', color: 'Foreground' },
]

const components = [
  {
    name: 'Primary Button',
    description: 'Call-to-action buttons for main interactions',
    class: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg',
    preview: 'Button Primario',
  },
  {
    name: 'Secondary Button',
    description: 'Alternative actions, less prominent',
    class: 'border border-blue-700/50 bg-transparent text-blue-300 hover:bg-blue-900/20 px-6 py-3 rounded-lg',
    preview: 'Botón Secundario',
  },
  {
    name: 'Glass Card',
    description: 'Frosted glass aesthetic for content',
    class: 'glass p-8 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl',
    preview: 'Glass Card',
  },
  {
    name: 'Badge',
    description: 'Status labels and tags',
    class: 'inline-block bg-blue-900/60 text-blue-300 px-4 py-2 rounded-lg text-xs font-bold',
    preview: 'BADGE',
  },
]

export default function BrandBookPage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    colors: true,
    typography: false,
    components: false,
  })

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(`${type}-${text}`)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
      {/* Header */}
      <header className="border-b border-blue-700/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">Visual Compare Chile</h1>
              <p className="text-blue-300 mt-2">Brand Guidelines & Design System</p>
            </div>
            <Link
              href="/docs/BRANDBOOK.md"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver PDF
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Color Palette */}
        <section className="mb-16">
          <button
            onClick={() => toggleSection('colors')}
            className="flex items-center gap-3 w-full mb-6 hover:opacity-80 transition-opacity"
          >
            <h2 className="text-3xl font-bold text-white">Paleta de Colores</h2>
            <ChevronDown
              className={`h-6 w-6 text-blue-300 transition-transform duration-300 ${
                expandedSections.colors ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.colors && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {colors.map((color) => (
                <div
                  key={color.hex}
                  className="glass p-6 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl"
                >
                  <div
                    className="w-full h-24 rounded-xl mb-4 border border-white/10"
                    style={{ backgroundColor: color.hex }}
                  />
                  <h3 className="text-lg font-bold text-white mb-2">{color.name}</h3>
                  <p className="text-sm text-gray-300 mb-3">{color.usage}</p>

                  <div className="space-y-2">
                    <button
                      onClick={() => copyToClipboard(color.hex, 'hex')}
                      className="flex items-center gap-2 w-full text-left p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded text-sm font-mono text-blue-300 transition-colors"
                    >
                      {color.hex}
                      {copiedColor === `hex-${color.hex}` ? (
                        <Check className="h-4 w-4 ml-auto text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(color.rgb, 'rgb')}
                      className="flex items-center gap-2 w-full text-left p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded text-sm font-mono text-blue-300 transition-colors"
                    >
                      rgb({color.rgb})
                      {copiedColor === `rgb-${color.rgb}` ? (
                        <Check className="h-4 w-4 ml-auto text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 ml-auto" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Typography */}
        <section className="mb-16">
          <button
            onClick={() => toggleSection('typography')}
            className="flex items-center gap-3 w-full mb-6 hover:opacity-80 transition-opacity"
          >
            <h2 className="text-3xl font-bold text-white">Tipografía</h2>
            <ChevronDown
              className={`h-6 w-6 text-blue-300 transition-transform duration-300 ${
                expandedSections.typography ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.typography && (
            <div className="glass p-8 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl mb-8">
              <p className="text-lg text-gray-300 mb-6">
                <strong>Font Primaria:</strong> Montserrat (400, 500, 600, 700, 800)
              </p>

              <div className="space-y-6">
                {typography.map((typo) => (
                  <div key={typo.name} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-lg font-bold text-white mb-2">{typo.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Tamaño</p>
                        <p className="text-blue-300 font-mono">{typo.size}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Peso</p>
                        <p className="text-blue-300 font-mono">{typo.weight}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Altura de línea</p>
                        <p className="text-blue-300 font-mono">{typo.lineHeight}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Color</p>
                        <p className="text-blue-300 font-mono">{typo.color}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Components */}
        <section className="mb-16">
          <button
            onClick={() => toggleSection('components')}
            className="flex items-center gap-3 w-full mb-6 hover:opacity-80 transition-opacity"
          >
            <h2 className="text-3xl font-bold text-white">Componentes</h2>
            <ChevronDown
              className={`h-6 w-6 text-blue-300 transition-transform duration-300 ${
                expandedSections.components ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.components && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {components.map((comp) => (
                <div
                  key={comp.name}
                  className="glass p-8 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{comp.name}</h3>
                  <p className="text-sm text-gray-300 mb-4">{comp.description}</p>

                  <div className="bg-slate-800/50 p-4 rounded-lg mb-4 flex items-center justify-center min-h-16">
                    <button className={comp.class}>{comp.preview}</button>
                  </div>

                  <code className="text-xs text-blue-300 block break-words font-mono p-3 bg-slate-900/50 rounded border border-slate-700/50">
                    {comp.class}
                  </code>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Key Principles */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Principios Clave</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
            {
              title: 'Precisión',
                description: 'Comparación técnica con SHA-256, pHash y diff visual',
                color: 'blue',
              },
              {
                title: 'Velocidad',
                description: 'Flujo ligero para demo y piloto operativo',
                color: 'purple',
              },
              {
                title: 'Accesibilidad',
                description: 'Consulta y trazabilidad del flujo principal',
                color: 'emerald',
              },
              {
                title: 'Confiabilidad',
                description: 'Auth Supabase, storage privado y rutas protegidas',
                color: 'amber',
              },
            ].map((principle) => (
              <div
                key={principle.title}
                className={`glass p-8 rounded-2xl border border-${principle.color}-700/50 bg-gradient-to-br from-${principle.color}-900/20 to-slate-900/50 backdrop-blur-xl`}
              >
                <h3 className="text-xl font-bold text-white mb-2">{principle.title}</h3>
                <p className="text-gray-300">{principle.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="text-center py-16">
          <h2 className="text-3xl font-bold text-white mb-6">Recursos</h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/docs/BRANDBOOK.md"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Brandbook Completo
            </a>
            <a
              href="/comparador"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-700/50 bg-transparent hover:bg-blue-900/20 text-blue-300 rounded-lg font-semibold transition-colors"
            >
              Ir al Comparador
            </a>
            <a
              href="/consulta"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-purple-700/50 bg-transparent hover:bg-purple-900/20 text-purple-300 rounded-lg font-semibold transition-colors"
            >
              Ir al Portal
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
