'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, HelpCircle } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState<string | null>(null)

  const steps = [
    {
      id: 'logo',
      number: '1',
      title: 'Sube tu logo',
      description: 'Carga una imagen de tu marca (PNG, JPG, SVG)',
      help: 'Usa una imagen clara de alta resolución para mejores resultados'
    },
    {
      id: 'name',
      number: '2',
      title: 'Ingresa el nombre',
      description: 'Escribe exactamente cómo se llamará tu marca',
      help: 'Usa el nombre en español como lo registrarías en Chile'
    },
    {
      id: 'results',
      number: '3',
      title: 'Obtén resultados',
      description: 'Análisis completo en segundos: disponibilidad, conflictos y clasificación',
      help: 'Resultados basados en el registro real de marcas en Chile (INAPI)'
    }
  ]

  const faqItems = [
    {
      question: '¿Qué es Viena?',
      answer: 'Sistema de clasificación visual internacional que describe elementos como formas, colores y estilos. Usamos visión artificial (GPT-4o) para detectar automáticamente los elementos de tu logo.'
    },
    {
      question: '¿Qué es Niza?',
      answer: 'Clasificación de servicios y productos (45 clases). Tu marca debe registrarse en las clases que correspondan a tu negocio. Analizamos automáticamente las clases relevantes.'
    },
    {
      question: '¿Qué es "Disponible"?',
      answer: 'Verificamos si tu marca ya existe registrada en Chile consultando directamente INAPI. Si está disponible, puedes registrarla con confianza.'
    },
    {
      question: '¿Cuánto cuesta registrar una marca en Chile?',
      answer: 'En INAPI: desde $160 UF (~$6.500 CLP) por clase de producto/servicio. Un abogado de PI puede costar $500-2.000 UF según complejidad.'
    },
    {
      question: '¿Puedo registrar una marca de otro país en Chile?',
      answer: 'Sí, pero debes hacerlo a través de INAPI o un tratado internacional (Madrid). Te recomendamos consultar con un abogado especializado.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 text-white">
      {/* Navigation — minimalista */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-blue-500/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            Visual Compare
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
              Entrar
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO — sencillo y directo */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold leading-tight text-balance">
              ¿Quieres registrar<br/>
              <span className="text-blue-400">tu marca en Chile?</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Análisis completo en segundos: verifica disponibilidad, detecta conflictos y obtén las clases de registro correctas.
            </p>
          </div>

          {/* CTA button */}
          <div className="flex justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 h-14 text-lg gap-2 shadow-lg shadow-blue-500/30">
                Analizar mi marca gratis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-8 text-sm text-slate-400 pt-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Sin tarjeta requerida
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Datos de INAPI en tiempo real
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              En menos de 3 minutos
            </div>
          </div>
        </div>
      </section>

      {/* 3-STEP VISUAL FLOW */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-center text-slate-400 text-lg">Tres pasos simples para saber si tu marca se puede registrar</p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              className="cursor-pointer group bg-slate-800/40 border border-slate-700/50 rounded-lg p-6 hover:border-blue-500/40 transition-all"
            >
              {/* Number circle */}
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-blue-500 transition-colors">
                {step.number}
              </div>

              {/* Title and description */}
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-slate-400 mb-4">{step.description}</p>

              {/* Help section */}
              <div className={`overflow-hidden transition-all ${activeStep === step.id ? 'max-h-24' : 'max-h-0'}`}>
                <div className="flex gap-2 text-sm text-slate-300 bg-blue-500/10 p-3 rounded border border-blue-500/20 mt-4">
                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                  <p>{step.help}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info boxes under steps */}
        <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-400">
          <div className="text-center">Formatos: PNG, JPG, SVG</div>
          <div className="text-center">Máx 100 caracteres</div>
          <div className="text-center">Basado en datos INAPI</div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-700/50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Qué obtendrás en tu análisis</h2>
          <p className="text-slate-400 text-lg">Toda la información que necesitas para decidir en segundos</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '✓ Disponible o no',
              description: 'Verifica si tu marca ya está registrada en Chile con datos en tiempo real de INAPI'
            },
            {
              title: 'Clasificación Viena',
              description: 'Elementos visuales detectados automáticamente: formas, colores, estilos y más'
            },
            {
              title: 'Clases Niza',
              description: 'Recomendación automática de clases de producto/servicio para tu registro'
            },
            {
              title: 'Conflictos encontrados',
              description: 'Marcas similares registradas que podrían impedir tu registro'
            },
            {
              title: 'Recomendaciones',
              description: 'Pasos claros para registrar o qué cambiar si hay conflictos'
            },
            {
              title: 'PDF descargable',
              description: 'Informe completo para presentar ante INAPI o tu abogado'
            }
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-700/50">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Preguntas frecuentes</h2>
          <p className="text-slate-400">Todo lo que necesitas saber sobre marcas en Chile</p>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {faqItems.map((faq, i) => (
            <details key={i} className="group bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 cursor-pointer">
              <summary className="font-semibold flex items-center justify-between text-lg hover:text-blue-400 transition-colors">
                {faq.question}
                <span className="group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-slate-400 mt-4">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-700/50 text-center">
        <h2 className="text-4xl font-bold mb-6">Comienza ahora</h2>
        <p className="text-slate-400 mb-8 text-lg">Sin tarjeta de crédito, resultado en menos de 3 minutos</p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 h-14 text-lg gap-2 shadow-lg shadow-blue-500/30">
            Analizar mi marca gratis
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 text-center text-slate-500 text-sm">
        <p>Visual Compare Chile • Herramienta de análisis de marcas para INAPI • © 2026</p>
      </footer>
    </div>
  )
}
