'use client'

import { useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'

interface MethodFlipCardProps {
  icon: LucideIcon
  title: string
  shortDescription: string
  metric: string
  metricColor: string
  backgroundColor: string
  expandedContent: {
    title: string
    details: string[]
    useCases: string[]
  }
}

export function MethodFlipCard({
  icon: Icon,
  title,
  shortDescription,
  metric,
  metricColor,
  backgroundColor,
  expandedContent,
}: MethodFlipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`glass p-8 rounded-lg transition-all duration-300 cursor-pointer ${
        isExpanded ? 'ring-2 ring-white/20' : ''
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {!isExpanded ? (
        // Front side
        <div className="space-y-4">
          <div
            className={`h-12 w-12 rounded-lg ${backgroundColor} flex items-center justify-center`}
          >
            <Icon className="h-6 w-6 text-white/80" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
            <p className="text-gray-400 text-sm mb-4">{shortDescription}</p>
            <p className={`text-xs ${metricColor} font-mono`}>{metric}</p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-gray-500">Clic para más detalles</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      ) : (
        // Back side - expanded
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {expandedContent.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{expandedContent.details[0]}</p>

            {expandedContent.details.length > 1 && (
              <div className="space-y-2 mb-4">
                {expandedContent.details.slice(1).map((detail, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <p className="text-gray-400 text-sm">{detail}</p>
                  </div>
                ))}
              </div>
            )}

            {expandedContent.useCases.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-2">CASOS DE USO:</p>
                <div className="space-y-1">
                  {expandedContent.useCases.map((useCase, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5 text-xs">✓</span>
                      <p className="text-gray-400 text-xs">{useCase}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-gray-500">Clic para cerrar</span>
            <ChevronDown className="h-4 w-4 text-gray-400 rotate-180" />
          </div>
        </div>
      )}
    </div>
  )
}
