'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const RoadmapRedesigned = () => {
  const [expanded, setExpanded] = useState<number | null>(null)

  const phases = [
    {
      num: 1,
      title: "Infraestructura + API Base",
      description: "Setup inicial: Vercel, Supabase, autenticación con API keys y endpoints básicos.",
      weeks: 2,
      weekRange: "Semanas 1-2",
      deliverables: [
        "Vercel deployment + Supabase PostgreSQL",
        "Autenticación con JWT + API keys",
        "Endpoints: POST /upload, POST /compare, GET /result/:id",
        "Almacenamiento: Vercel Blob + BD Supabase",
        "Rate limiting + logging básico"
      ],
      highlights: [
        "Infraestructura cloud",
        "API endpoints",
        "Auth JWT"
      ],
      details: {
        objetivos: [
          "Establecer infraestructura cloud escalable en Vercel",
          "Configurar base de datos PostgreSQL en Supabase",
          "Implementar autenticación JWT + API keys",
          "Crear estructura base para API REST",
          "Habilitar almacenamiento con Vercel Blob"
        ],
        tecnologias: [
          "Vercel Functions para serverless compute",
          "Supabase PostgreSQL para persistencia",
          "JWT tokens para autenticación",
          "Vercel Blob para almacenamiento de imágenes",
          "Node.js API routes para endpoints"
        ],
        entregas: [
          "Infraestructura cloud totalmente operacional",
          "API REST base con 3 endpoints principales",
          "Sistema de autenticación funcional",
          "Logging y rate limiting básico",
          "Documentación de setup"
        ]
      },
      colorClass: "red"
    },
    {
      num: 2,
      title: "Motor de Comparación (3 métodos)",
      description: "Implementar SHA-256, pHash perceptual y TensorFlow.js embeddings. Scoring híbrido (60-30-10).",
      weeks: 3,
      weekRange: "Semanas 3-5",
      deliverables: [
        "SHA-256: Exactitud criptográfica (0ms overhead)",
        "pHash: Hash perceptual 64-bit (distancia Hamming)",
        "TensorFlow.js: Embeddings visuales (512-dim)",
        "Scoring ponderado: 60% pHash + 30% embeddings + 10% SHA-256",
        "5 categorías automáticas"
      ],
      highlights: [
        "3 motores funcionales",
        "Scoring híbrido",
        "&lt;100ms P95"
      ],
      details: {
        objetivos: [
          "Implementar 3 métodos de comparación independientes",
          "Diseñar algoritmo de scoring ponderado",
          "Optimizar para latencia &lt;100ms",
          "Crear 5 categorías automáticas de similitud",
          "Validar precisión con test dataset"
        ],
        tecnologias: [
          "crypto-js para SHA-256",
          "sharp para pHash perceptual",
          "TensorFlow.js para embeddings visuales",
          "Algoritmo de distancia Hamming",
          "Scoring ponderado con ML"
        ],
        entregas: [
          "3 motores de comparación completamente funcionales",
          "API endpoint /compare con resultados en &lt;100ms",
          "Dashboard de métricas de similitud",
          "5 categorías automáticas implementadas",
          "Test suite con 80%+ coverage"
        ]
      },
      colorClass: "red"
    },
    {
      num: 3,
      title: "Exportación + Auditoría + Optimización",
      description: "CSV/JSON export, audit dashboard, historial. Performance tuning, tests 80%+, Lighthouse 90+.",
      weeks: 2,
      weekRange: "Semanas 6-7",
      deliverables: [
        "Unit tests (Jest/Vitest) + integration tests",
        "Lighthouse score 90+, Core Web Vitals",
        "CSV/JSON export, Dashboard auditoría",
        "Historial búsquedas + Favoritos",
        "Latencia motor &lt;100ms P95"
      ],
      highlights: [
        "80%+ tests",
        "Lighthouse 90+",
        "Export + Audit"
      ],
      details: {
        objetivos: [
          "Alcanzar 80%+ de cobertura de tests",
          "Optimizar performance hasta Lighthouse 90+",
          "Implementar exportación de datos",
          "Crear dashboard de auditoría completo",
          "Optimizar Core Web Vitals"
        ],
        tecnologias: [
          "Jest para unit tests",
          "Vitest para integration tests",
          "Lighthouse para performance audit",
          "CSV writer para exportación",
          "React Query para caching"
        ],
        entregas: [
          "Suite de tests completa (80%+ coverage)",
          "Performance optimizado (Lighthouse 90+)",
          "Exportación CSV/JSON funcional",
          "Dashboard de auditoría con historial",
          "Métricas de Core Web Vitals &gt;90"
        ]
      },
      colorClass: "blue"
    },
    {
      num: 4,
      title: "Seguridad + Producción",
      description: "Auditoría de seguridad, documentación OpenAPI, deployment production con SLA 99.95%.",
      weeks: 1,
      weekRange: "Semana 8",
      deliverables: [
        "Auditoría de seguridad + rate limiting + DDoS protection",
        "Documentación OpenAPI completa + API Portal",
        "Monitoring: Vercel Analytics + alertas",
        "Deployment production + SLA 99.95%",
        "User guide + API guide + arquitectura"
      ],
      highlights: [
        "Seguridad audit",
        "API docs",
        "Production live"
      ],
      details: {
        objetivos: [
          "Ejecutar auditoría de seguridad completa",
          "Implementar rate limiting y DDoS protection",
          "Crear documentación OpenAPI",
          "Configurar monitoring en producción",
          "Garantizar SLA 99.95%"
        ],
        tecnologias: [
          "OWASP Security Audit",
          "Cloudflare DDoS Protection",
          "OpenAPI 3.0 specification",
          "Vercel Analytics",
          "Sentry para error tracking"
        ],
        entregas: [
          "Auditoría de seguridad completada",
          "Rate limiting y DDoS protection activos",
          "Documentación OpenAPI con API Portal",
          "Sistema de monitoring en vivo",
          "Production deployment con SLA 99.95%"
        ]
      },
      colorClass: "emerald"
    }
  ]

  const getColorStyles = (color: string) => {
    const colors: Record<string, Record<string, string>> = {
      red: {
        border: "border-blue-500/50",
        bg: "from-blue-900/20",
        badge: "text-blue-300 bg-blue-900/60",
        bullet: "text-blue-400",
        timing: "bg-blue-900/25 text-blue-300",
        highlight: "text-blue-200",
        expandBg: "from-blue-900/10",
        expandBorder: "border-blue-500/30"
      },
      blue: {
        border: "border-purple-500/50",
        bg: "from-purple-900/20",
        badge: "text-purple-300 bg-purple-900/60",
        bullet: "text-purple-400",
        timing: "bg-purple-900/25 text-purple-300",
        highlight: "text-purple-200",
        expandBg: "from-purple-900/10",
        expandBorder: "border-purple-500/30"
      },
      emerald: {
        border: "border-amber-500/50",
        bg: "from-amber-900/20",
        badge: "text-amber-300 bg-amber-900/60",
        bullet: "text-amber-400",
        timing: "bg-amber-900/25 text-amber-300",
        highlight: "text-amber-200",
        expandBg: "from-amber-900/10",
        expandBorder: "border-amber-500/30"
      }
    }
    return colors[color] || colors.red
  }

  return (
    <div className="space-y-12">
      {phases.map((phase) => {
        const colors = getColorStyles(phase.colorClass)
        const isExpanded = expanded === phase.num
        return (
          <div key={phase.num} className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-900/20 via-slate-900/10 to-transparent rounded-2xl blur-xl -z-10"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* MAIN CONTENT - 2/3 WIDTH */}
              <div className={`lg:col-span-2 glass p-8 rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} to-slate-900/50`}>
                <div className="inline-block mb-4">
                  <span className={`text-xs font-bold ${colors.badge} px-4 py-2 rounded-lg`}>
                    FASE {phase.num}
                  </span>
                </div>
                <h3 className="text-4xl font-bold text-white mb-3">{phase.title}</h3>
                <p className="text-lg text-gray-300 mb-6">{phase.description}</p>
                
                <div className="border-t border-gray-700/50 pt-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Deliverables</h4>
                  <ul className="space-y-3">
                    {phase.deliverables.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-3">
                        <span className={`${colors.bullet} font-bold flex-shrink-0`}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* EXPANDIBLE SECTION */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : phase.num)}
                  className="mt-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm group"
                >
                  Leer más
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className={`mt-6 pt-6 border-t ${colors.expandBorder} space-y-6 animate-in fade-in slide-in-from-top-2 duration-300`}>
                    {/* Objetivos */}
                    <div>
                      <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Objetivos principales</h5>
                      <ul className="space-y-2">
                        {phase.details.objetivos.map((obj, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-3">
                            <span className="text-blue-400 font-bold flex-shrink-0">→</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tecnologías */}
                    <div>
                      <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Stack tecnológico</h5>
                      <ul className="space-y-2">
                        {phase.details.tecnologias.map((tech, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-3">
                            <span className="text-emerald-400 font-bold flex-shrink-0">◆</span>
                            <span>{tech}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Entregas finales */}
                    <div>
                      <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Entregas finales</h5>
                      <ul className="space-y-2">
                        {phase.details.entregas.map((entrega, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-3">
                            <span className="text-amber-400 font-bold flex-shrink-0">✓</span>
                            <span>{entrega}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* TIMING - 1/3 WIDTH */}
              <div className={`glass p-8 rounded-lg border border-${phase.colorClass}-600/50 ${colors.timing} flex flex-col justify-center items-center`}>
                <div className="text-center w-full">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-4 font-semibold">Timing</p>
                  <p className="text-6xl font-bold mb-2">{phase.weeks}</p>
                  <p className="text-gray-200 font-semibold mb-8">
                    {phase.weeks === 1 ? 'semana' : 'semanas'}
                  </p>
                  
                  <div className="border-t border-gray-700/50 pt-6">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-4 font-semibold">
                      {phase.weekRange}
                    </p>
                    <ul className="space-y-2">
                      {phase.highlights.map((highlight, idx) => (
                        <li key={idx} className={`text-xs font-medium ${colors.highlight}`}>
                          ✓ {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RoadmapRedesigned
