'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface UseCaseFlipCardProps {
  icon: React.ReactNode
  title: string
  description: string
  expandedContent: {
    overview: string
    features: string[]
    implementation: string[]
    benefits: string[]
  }
}

export function UseCaseFlipCard({
  icon,
  title,
  description,
  expandedContent,
}: UseCaseFlipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="w-full">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full glass-hover p-4 rounded-lg border transition-all duration-300 text-left ${
          isExpanded ? 'border-blue-400/50 bg-blue-900/20' : 'border-white/10 hover:border-blue-400/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-white/70">{icon}</div>
              <h4 className="text-white font-bold text-sm">{title}</h4>
            </div>
            <p className="text-xs text-gray-400 mb-2">{description}</p>
            {!isExpanded && <div className="text-xs text-blue-400">Haz clic para más detalles</div>}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-blue-400 transition-transform duration-300 flex-shrink-0 mt-1 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 glass rounded-lg border border-blue-400/30 p-4 bg-blue-900/10">
          <div className="space-y-3">
            <div>
              <h5 className="text-white font-bold text-sm mb-1">Descripción general</h5>
              <p className="text-xs text-gray-400">{expandedContent.overview}</p>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm mb-2">Características principales</h5>
              <ul className="space-y-1">
                {expandedContent.features.map((feature, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm mb-2">Implementación</h5>
              <ul className="space-y-1">
                {expandedContent.implementation.map((impl, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">✓</span>
                    <span>{impl}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm mb-2">Beneficios</h5>
              <ul className="space-y-1">
                {expandedContent.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⭐</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
