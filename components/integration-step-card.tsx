'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface IntegrationStepCardProps {
  step: number
  title: string
  description: string
  expandedContent: {
    technicalDetails: string[]
    parameters: {
      name: string
      type: string
      description: string
    }[]
    response: string
    examples: {
      label: string
      code: string
    }[]
  }
}

export function IntegrationStepCard({
  step,
  title,
  description,
  expandedContent,
}: IntegrationStepCardProps) {
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
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                {step}
              </div>
              <h4 className="text-white font-bold text-sm">{title}</h4>
            </div>
            <p className="text-xs text-gray-400 mb-2">{description}</p>
            {!isExpanded && <div className="text-xs text-blue-400">Haz clic para detalles técnicos</div>}
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
              <h5 className="text-white font-bold text-sm mb-2">Detalles técnicos</h5>
              <ul className="space-y-1">
                {expandedContent.technicalDetails.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm mb-2">Parámetros</h5>
              <div className="space-y-2">
                {expandedContent.parameters.map((param, idx) => (
                  <div key={idx} className="text-xs bg-gray-900/50 rounded p-2 border border-gray-700/50">
                    <div className="text-gray-300">
                      <span className="text-purple-400">{param.name}</span>
                      <span className="text-gray-500 mx-1">:</span>
                      <span className="text-yellow-400">{param.type}</span>
                    </div>
                    <div className="text-gray-500 mt-1">{param.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-white font-bold text-sm mb-2">Respuesta</h5>
              <div className="text-xs bg-gray-900/50 rounded p-3 border border-gray-700/50 font-mono">
                <div className="text-gray-400">{expandedContent.response}</div>
              </div>
            </div>

            {expandedContent.examples.length > 0 && (
              <div>
                <h5 className="text-white font-bold text-sm mb-2">Ejemplos</h5>
                {expandedContent.examples.map((example, idx) => (
                  <div key={idx} className="mb-2">
                    <p className="text-xs text-blue-400 mb-1 font-semibold">{example.label}</p>
                    <pre className="text-xs bg-gray-900/50 rounded p-2 border border-gray-700/50 overflow-x-auto">
                      <code className="text-gray-300">{example.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
