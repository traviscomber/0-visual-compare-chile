'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ClassificationFlipCardProps {
  tag: string
  tagColor: string
  tagBgColor: string
  title: string
  description: string
  percentageRange: string
  percentageColor: string
  expandedContent: {
    title: string
    definition: string
    characteristics: string[]
    whenToUse: string[]
  }
}

export function ClassificationFlipCard({
  tag,
  tagColor,
  tagBgColor,
  title,
  description,
  percentageRange,
  percentageColor,
  expandedContent,
}: ClassificationFlipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      className={`glass p-4 rounded-lg transition-all duration-300 cursor-pointer hover:border-white/20 ${
        isExpanded ? 'ring-2 ring-white/20' : 'border border-white/10'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {!isExpanded ? (
        // Front side - collapsed
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`px-2 py-1 ${tagBgColor} ${tagColor} text-xs font-mono rounded border ${tagColor} border-opacity-50`}
            >
              {tag}
            </div>
          </div>
          <p className="text-white font-bold text-sm mb-1">{title}</p>
          <p className="text-xs text-gray-400 mb-2">{description}</p>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className={`inline-block px-2 py-0.5 bg-opacity-30 rounded text-xs font-semibold ${percentageColor}`}>
              {percentageRange}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>
      ) : (
        // Back side - expanded
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-white mb-2">
              {expandedContent.title}
            </h3>
            <p className="text-sm text-gray-400 mb-3">{expandedContent.definition}</p>

            {expandedContent.characteristics.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 font-semibold mb-2">CARACTERÍSTICAS:</p>
                <div className="space-y-1">
                  {expandedContent.characteristics.map((char, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5 text-xs">•</span>
                      <p className="text-gray-400 text-xs">{char}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expandedContent.whenToUse.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-2">CUÁNDO USAR:</p>
                <div className="space-y-1">
                  {expandedContent.whenToUse.map((use, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5 text-xs">✓</span>
                      <p className="text-gray-400 text-xs">{use}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs text-gray-500">Clic para cerrar</span>
            <ChevronDown className="h-4 w-4 text-gray-400 rotate-180" />
          </div>
        </div>
      )}
    </div>
  )
}
