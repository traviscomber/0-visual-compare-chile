'use client'

import { X, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConceptModalProps {
  concept: 'viena' | 'niza' | 'disponible' | 'conflictos'
  isOpen: boolean
  onClose: () => void
}

const concepts = {
  viena: {
    title: 'Sistema Viena - Clasificación Visual',
    icon: '🎨',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Viena es un sistema internacional que describe elementos visuales de una marca. Categoriza aspectos como:
        </p>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li><strong className="text-blue-300">Formas:</strong> Círculos, cuadrados, líneas, etc.</li>
          <li><strong className="text-blue-300">Colores:</strong> Paleta de colores utilizada</li>
          <li><strong className="text-blue-300">Elementos:</strong> Animales, letras, objetos</li>
          <li><strong className="text-blue-300">Estilos:</strong> Moderno, clásico, minimalista</li>
        </ul>
        <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded border border-slate-700">
          Nuestra IA usa visión por computador (GPT-4o) para detectar automáticamente estos elementos en tu logo y asignarle códigos Viena.
        </p>
      </div>
    )
  },
  niza: {
    title: 'Sistema Niza - Clasificación de Servicios/Productos',
    icon: '🏷️',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Niza es la clasificación que define qué productos o servicios cubre tu marca. Hay 45 clases principales:
        </p>
        <ul className="grid grid-cols-2 gap-2 text-slate-300 text-sm">
          <li><strong className="text-blue-300">Clase 1-7:</strong> Químicos</li>
          <li><strong className="text-blue-300">Clase 8-14:</strong> Herramientas</li>
          <li><strong className="text-blue-300">Clase 15-19:</strong> Metales</li>
          <li><strong className="text-blue-300">Clase 20-24:</strong> Muebles</li>
          <li><strong className="text-blue-300">Clase 25-27:</strong> Ropa</li>
          <li><strong className="text-blue-300">Clase 28-32:</strong> Deportes</li>
          <li><strong className="text-blue-300">Clase 33-34:</strong> Bebidas</li>
          <li><strong className="text-blue-300">Clase 35-45:</strong> Servicios</li>
        </ul>
        <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded border border-slate-700">
          Debes registrar tu marca en TODAS las clases que apliquen a tu negocio. Recomendamos consultar con un abogado para no dejar brechas.
        </p>
      </div>
    )
  },
  disponible: {
    title: 'Disponibilidad en Chile - Consulta INAPI',
    icon: '✓',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Verificamos si tu marca ya está registrada en Chile consultando INAPI (Instituto Nacional de Propiedad Industrial) en tiempo real.
        </p>
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
            <p className="text-green-300 font-semibold text-sm mb-1">Disponible ✓</p>
            <p className="text-slate-300 text-sm">La marca no está registrada. Puedes proceder con la solicitud a INAPI.</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-red-300 font-semibold text-sm mb-1">No disponible ✗</p>
            <p className="text-slate-300 text-sm">La marca ya existe. No es registrable sin cambios o acuerdos con el titular.</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded border border-slate-700">
          Esta consulta es vinculante y refleja el estado actual de INAPI. Recomendamos hacer otra consulta meses después si esperas para registrar.
        </p>
      </div>
    )
  },
  conflictos: {
    title: 'Conflictos Detectados - Riesgo de Rechazo',
    icon: '⚠️',
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 leading-relaxed">
          Encontramos marcas similares que pueden impedir tu registro. Los niveles de riesgo son:
        </p>
        <div className="space-y-2">
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <p className="text-red-300 font-semibold text-sm mb-1">Riesgo ALTO</p>
            <p className="text-slate-300 text-sm">Marca casi idéntica. Muy probable que INAPI rechace tu solicitud.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
            <p className="text-amber-300 font-semibold text-sm mb-1">Riesgo MEDIO</p>
            <p className="text-slate-300 text-sm">Marcas similares en la misma clase. Requiere decisión del examinador.</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
            <p className="text-green-300 font-semibold text-sm mb-1">Riesgo BAJO</p>
            <p className="text-slate-300 text-sm">Diferencias significativas. Probable que INAPI acepte tu solicitud.</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm bg-slate-900/50 p-3 rounded border border-slate-700">
          Si hay conflictos, puedes: (1) cambiar tu marca, (2) negociar con el titular existente, o (3) presentar argumentos de distinción a INAPI.
        </p>
      </div>
    )
  }
}

export function ConceptModal({ concept, isOpen, onClose }: ConceptModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const conceptData = concepts[concept]

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-8 shadow-2xl transition-transform duration-300 ${isAnimating ? 'scale-100' : 'scale-95'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <span className="text-3xl">{conceptData.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{conceptData.title}</h2>
            <p className="text-slate-400 text-sm mt-1">Explicación para entender tu análisis</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {conceptData.content}
        </div>

        {/* Close button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
