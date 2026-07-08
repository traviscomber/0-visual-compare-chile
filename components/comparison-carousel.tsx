'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const comparisons = [
  {
    id: 1,
    title: 'Productos diferentes',
    similarity: 12,
    classification: 'Diferente',
    classificationColor: 'text-gray-400',
    bgColor: 'bg-gray-800/40',
    icon: X,
    iconColor: 'text-amber-400',
    image: '/images/comparison-example-3.jpg',
  },
  {
    id: 2,
    title: 'Documentos duplicados',
    similarity: 99,
    classification: 'Coincidencia exacta',
    classificationColor: 'text-purple-400',
    bgColor: 'bg-blue-900/20',
    icon: Check,
    iconColor: 'text-purple-400',
    image: '/images/comparison-example-1.jpg',
  },
  {
    id: 3,
    title: 'Interfaces de usuario',
    similarity: 45,
    classification: 'Parcialmente similar',
    classificationColor: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
    image: '/images/comparison-example-4.jpg',
  },
  {
    id: 4,
    title: 'Packaging de productos',
    similarity: 67,
    classification: 'Similaridad visual',
    classificationColor: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    icon: Check,
    iconColor: 'text-blue-400',
    image: '/images/comparison-example-2.jpg',
  },
  {
    id: 5,
    title: 'Comparación de logos',
    similarity: 94,
    classification: 'Muy similar',
    classificationColor: 'text-yellow-400',
    bgColor: 'bg-amber-900/20',
    icon: Check,
    iconColor: 'text-purple-400',
    image: '/images/logo-comparison-hero.jpg',
  },
]

// Visual components for each content type - REMOVED (using real images now)

function ComparisonContent({ image }: { image: string }) {
  return (
    <div className="w-full h-auto">
      <img
        src={image}
        alt="Comparison"
        className="w-full h-auto rounded-lg object-cover"
      />
    </div>
  )
}

export function ComparisonCarousel() {
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % comparisons.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoPlay])

  const next = () => {
    setCurrent((prev) => (prev + 1) % comparisons.length)
    setAutoPlay(false)
  }

  const prev = () => {
    setCurrent((prev) => (prev - 1 + comparisons.length) % comparisons.length)
    setAutoPlay(false)
  }

  const item = comparisons[current]
  const IconComponent = item.icon

  return (
    <div className="w-full max-w-4xl mx-auto" onMouseLeave={() => setAutoPlay(true)}>
      <div className="glass p-8 rounded-2xl">
        {/* Comparison interface */}
        <div className={`rounded-xl p-8 mb-6 ${item.bgColor}`}>
          {/* Full-width image */}
          <div className="w-full mb-6">
            <ComparisonContent image={item.image} />
          </div>

          {/* Info below image */}
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">{item.similarity}%</div>
            <div className="text-sm text-gray-400">Similitud</div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
          <p className={`text-sm font-medium ${item.classificationColor}`}>{item.classification}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant="outline"
            className="border-gray-600 text-white hover:bg-white/10"
            onClick={prev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dots */}
          <div className="flex gap-2">
            {comparisons.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrent(idx)
                  setAutoPlay(false)
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === current ? 'bg-blue-400 w-6' : 'bg-gray-600 w-2 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-gray-600 text-white hover:bg-white/10"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-xs text-gray-500">
          {current + 1} de {comparisons.length}
        </div>
      </div>
    </div>
  )
}
