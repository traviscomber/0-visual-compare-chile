'use client'

import { HelpCircle, X } from 'lucide-react'
import { useState } from 'react'

interface HelpTooltipProps {
  title?: string
  content: string
  icon?: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export function HelpTooltip({ title, content, icon, placement = 'top' }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-slate-400 hover:text-slate-300 transition-colors"
        aria-label={title || 'Ayuda'}
      >
        {icon || <HelpCircle className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className={`absolute z-50 w-72 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg ${
          placement === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' :
          placement === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' :
          placement === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' :
          'left-full ml-2 top-1/2 -translate-y-1/2'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            {title && <h4 className="font-semibold text-white text-sm">{title}</h4>}
            <button
              onClick={() => setIsOpen(false)}
              className="shrink-0 text-slate-400 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{content}</p>
          
          {/* Arrow indicator */}
          <div className={`absolute w-2 h-2 bg-slate-800 border border-slate-700 rotate-45 ${
            placement === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' :
            placement === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' :
            placement === 'left' ? '-right-1 top-1/2 -translate-y-1/2' :
            '-left-1 top-1/2 -translate-y-1/2'
          }`} />
        </div>
      )}

      {/* Overlay click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
