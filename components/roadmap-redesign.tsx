'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const RoadmapRedesigned = () => {
  const [expanded, setExpanded] = useState<number | null>(null)

  const phases = [
    {
      num: 1,
      title: 'Base Operativa',
      description: 'Alinear auth, layout protegido, env validation y flujo inicial del producto.',
      weeks: 1,
      weekRange: 'Semana 1',
      deliverables: [
        'Auth Supabase estable',
        'Rutas protegidas y redirecciones correctas',
        'Variables de entorno validadas',
        'Branding y metadata alineados al MVP'
      ],
      highlights: ['Auth', 'Routing', 'Env'],
      details: {
        objetivos: [
          'Cerrar el acceso basico al producto',
          'Evitar estados anonimos inconsistentes',
          'Tener una base lista para demo interna'
        ],
        tecnologias: [
          'Supabase Auth',
          'Next.js App Router',
          'Middleware de sesion',
          'Validacion de entorno'
        ],
        entregas: [
          'Login y signup funcionales',
          'Proteccion de paginas privadas',
          'Checklist de despliegue base'
        ]
      },
      colorClass: 'red'
    },
    {
      num: 2,
      title: 'Comparacion y Upload',
      description: 'Dejar una experiencia consistente para subir imagenes, comparar y guardar resultados.',
      weeks: 2,
      weekRange: 'Semanas 2-3',
      deliverables: [
        'Upload con limites y formatos coherentes',
        'Comparacion visual estable',
        'Hash perceptual y validaciones alineadas',
        'Mensajes claros de exito y error'
      ],
      highlights: ['Upload', 'Compare', 'Hash'],
      details: {
        objetivos: [
          'Reducir friccion en el flujo principal',
          'Unificar reglas de archivo y respuesta',
          'Hacer comprensible el resultado de comparacion'
        ],
        tecnologias: [
          'Vercel Blob',
          'pHash',
          'SHA-256',
          'API routes'
        ],
        entregas: [
          'Flujo end-to-end de comparacion',
          'Respuesta consistente de API',
          'UI lista para demo'
        ]
      },
      colorClass: 'blue'
    },
    {
      num: 3,
      title: 'Historial y Consulta',
      description: 'Conectar historial, filtros de consulta y paneles de apoyo para uso operativo.',
      weeks: 2,
      weekRange: 'Semanas 4-5',
      deliverables: [
        'Historial navegable',
        'Consulta con filtros funcionales',
        'Estados vacios y loading claros',
        'Acceso a detalle de comparaciones'
      ],
      highlights: ['History', 'Search', 'Detail'],
      details: {
        objetivos: [
          'Permitir revisitar comparaciones anteriores',
          'Hacer util la busqueda de marcas',
          'Sostener un flujo de uso recurrente'
        ],
        tecnologias: [
          'Tablas y filtros',
          'Rutas de detalle',
          'Estados de UI',
          'Persistencia en Supabase'
        ],
        entregas: [
          'Historial usable',
          'Busqueda y filtros coherentes',
          'Detalle de registro funcional'
        ]
      },
      colorClass: 'blue'
    },
    {
      num: 4,
      title: 'Piloto y Entrega',
      description: 'Cerrar documentacion, monitoreo minimo y checklist de salida para piloto o demo.',
      weeks: 1,
      weekRange: 'Semana 6',
      deliverables: [
        'Checklist de despliegue completo',
        'Documentacion corta de uso',
        'Revision de copy y errores finales',
        'Preparacion para piloto'
      ],
      highlights: ['Deploy', 'Docs', 'Pilot'],
      details: {
        objetivos: [
          'Dejar el MVP presentable',
          'Reducir riesgos de despliegue',
          'Tener un plan claro para el siguiente ciclo'
        ],
        tecnologias: [
          'Vercel',
          'Supabase',
          'Build verification',
          'Smoke tests'
        ],
        entregas: [
          'MVP listo para demo',
          'Documentacion de despliegue',
          'Roadmap de siguiente iteracion'
        ]
      },
      colorClass: 'emerald'
    }
  ]

  const getColorStyles = (color: string) => {
    const colors: Record<string, Record<string, string>> = {
      red: {
        border: 'border-blue-500/50',
        bg: 'from-blue-900/20',
        badge: 'text-blue-300 bg-blue-900/60',
        bullet: 'text-blue-400',
        timing: 'bg-blue-900/25 text-blue-300',
        highlight: 'text-blue-200',
        expandBg: 'from-blue-900/10',
        expandBorder: 'border-blue-500/30'
      },
      blue: {
        border: 'border-purple-500/50',
        bg: 'from-purple-900/20',
        badge: 'text-purple-300 bg-purple-900/60',
        bullet: 'text-purple-400',
        timing: 'bg-purple-900/25 text-purple-300',
        highlight: 'text-purple-200',
        expandBg: 'from-purple-900/10',
        expandBorder: 'border-purple-500/30'
      },
      emerald: {
        border: 'border-amber-500/50',
        bg: 'from-amber-900/20',
        badge: 'text-amber-300 bg-amber-900/60',
        bullet: 'text-amber-400',
        timing: 'bg-amber-900/25 text-amber-300',
        highlight: 'text-amber-200',
        expandBg: 'from-amber-900/10',
        expandBorder: 'border-amber-500/30'
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
            <div className="absolute -inset-1 bg-gradient-to-r from-slate-900/20 via-slate-900/10 to-transparent rounded-2xl blur-xl -z-10" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <div className={`lg:col-span-2 glass p-8 rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} to-slate-900/50`}>
                <div className="inline-block mb-4">
                  <span className={`text-xs font-bold ${colors.badge} px-4 py-2 rounded-lg`}>
                    FASE {phase.num}
                  </span>
                </div>
                <h3 className="text-4xl font-bold text-white mb-3">{phase.title}</h3>
                <p className="text-lg text-gray-300 mb-6">{phase.description}</p>

                <div className="border-t border-gray-700/50 pt-6">
                  <h4 className={`font-semibold ${colors.highlight} mb-4 text-sm uppercase tracking-wider`}>ENTREGABLES</h4>
                  <div className="grid gap-3">
                    {phase.deliverables.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className={`${colors.bullet} mt-1`}>•</span>
                        <span className="text-sm text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl border border-gray-700/50 bg-slate-900/40">
                <div className={`inline-block mb-4 ${colors.timing} px-3 py-1 rounded-full text-xs font-semibold`}>
                  {phase.weekRange}
                </div>
                <h4 className="text-white font-semibold mb-3">Resumen</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  {phase.highlights.map((item, index) => (
                    <div key={index}>• {item}</div>
                  ))}
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : phase.num)}
                  className={`mt-6 w-full flex items-center justify-between rounded-lg border ${colors.expandBorder} bg-gradient-to-br ${colors.expandBg} to-transparent px-4 py-3 text-left`}
                >
                  <span className="text-sm font-semibold text-white">Ver detalle</span>
                  <ChevronDown className={`h-4 w-4 text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-4 text-sm text-gray-300">
                    <div>
                      <p className="font-semibold text-white mb-2">Objetivos</p>
                      <ul className="space-y-1">
                        {phase.details.objetivos.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-2">Tecnologias</p>
                      <ul className="space-y-1">
                        {phase.details.tecnologias.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-2">Entregas</p>
                      <ul className="space-y-1">
                        {phase.details.entregas.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RoadmapRedesigned
