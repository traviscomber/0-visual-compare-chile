'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap, CheckCircle, Lock, Clock, Sparkles, ChevronDown } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 min-h-screen text-white overflow-hidden">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-slate-950/80 smooth-transition">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold gradient-text">Visual Compare</div>
          <Link href="/auth/login">
            <Button className="bg-blue-600 hover:bg-blue-500 gap-2 smooth-transition hover-lift">
              Inicia sesión <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm hover-glow smooth-transition cursor-default">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300">Análisis asistido por IA con consulta de antecedentes INAPI</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight space-y-3">
            <div>Evalúa tu marca</div>
            <div className="gradient-text">antes de solicitar su registro en Chile</div>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Analiza elementos visuales, clases relevantes y antecedentes marcarios para obtener una evaluación preliminar que apoye tu decisión.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 gap-2 text-base h-12 smooth-transition hover-lift shadow-lg shadow-blue-500/30">
                Comenzar análisis <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#como-funciona">
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white gap-2 text-base h-12 smooth-transition">
                Conoce cómo funciona <ChevronDown className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 justify-center text-sm text-slate-400 pt-4">
            <div className="flex items-center gap-2 hover:text-white smooth-transition cursor-default">
              <Lock className="w-4 h-4 text-green-400" />
              <span>Acceso autenticado</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white smooth-transition cursor-default">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Tiempo estimado: 1–3 minutos</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white smooth-transition cursor-default">
              <CheckCircle className="w-4 h-4 text-purple-400" />
              <span>Resultado orientativo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 animate-slide-up">¿Qué obtienes?</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="group bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 hover-lift hover:border-blue-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 group-hover:scale-110 smooth-transition">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Análisis Viena</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Clasificación preliminar de elementos figurativos, formas y composiciones visuales detectadas en el signo.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 hover-lift hover:border-purple-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 group-hover:scale-110 smooth-transition">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Clasificación Niza</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Sugerencia de clases de productos y servicios que deben ser revisadas antes de presentar una solicitud.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-2xl p-8 hover-lift hover:border-green-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/30 group-hover:scale-110 smooth-transition">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Antecedentes en Chile</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Consulta de antecedentes disponibles para identificar coincidencias y similitudes relevantes para una revisión posterior.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 hover-lift hover:border-amber-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/30 group-hover:scale-110 smooth-transition">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Detección de similitudes</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Señala antecedentes potencialmente relacionados para que puedan ser evaluados con criterio marcario y jurídico.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-8 hover-lift hover:border-red-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/30 group-hover:scale-110 smooth-transition">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Proceso rápido</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                La mayoría de los análisis se completa en 1–3 minutos, según la imagen y la disponibilidad de las fuentes consultadas.
              </p>
            </div>

            <div className="group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 hover-lift hover:border-cyan-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.6s' }}>
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 group-hover:scale-110 smooth-transition">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Asistencia automatizada</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Modelos de visión y clasificación organizan la información para facilitar una revisión humana más eficiente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 animate-slide-up">Cómo funciona</h2>

          <div className="space-y-8">
            {[
              { step: '1', title: 'Sube tu logo', desc: 'Carga una imagen clara del signo que quieres analizar en un formato compatible.' },
              { step: '2', title: 'Describe la marca', desc: 'Ingresa el nombre y los productos o servicios asociados para contextualizar la evaluación.' },
              { step: '3', title: 'Revisa el análisis', desc: 'Consulta clasificaciones sugeridas, antecedentes encontrados y posibles similitudes.' },
              { step: '4', title: 'Decide el siguiente paso', desc: 'Usa el informe como apoyo preliminar y solicita revisión profesional cuando corresponda.' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start group cursor-default hover-lift smooth-transition">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg font-bold group-hover:shadow-lg group-hover:shadow-blue-500/50 group-hover:scale-110 smooth-transition">
                    {item.step}
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 animate-slide-up">Preguntas frecuentes</h2>

          <div className="space-y-4">
            {[
              { q: '¿La herramienta consulta INAPI?', a: 'La plataforma consulta antecedentes disponibles mediante su integración configurada. La disponibilidad y actualización de los resultados depende de la fuente y del estado de la integración.' },
              { q: '¿El análisis garantiza el registro?', a: 'No. El resultado es preliminar y orientativo. La aceptación de una solicitud depende de INAPI y puede requerir evaluación jurídica especializada.' },
              { q: '¿Qué significan Viena y Niza?', a: 'Son clasificaciones internacionales usadas para organizar elementos figurativos y categorías de productos o servicios en materia de marcas.' },
              { q: '¿Cómo debo interpretar los resultados?', a: 'Como apoyo para identificar antecedentes y preparar una revisión más informada, no como una opinión legal definitiva.' },
              { q: '¿Cuánto toma el análisis?', a: 'La mayoría de los análisis se completa en 1–3 minutos, aunque el tiempo puede variar según la imagen y las fuentes consultadas.' },
            ].map((item, idx) => (
              <details key={idx} className="group border border-white/10 rounded-lg p-4 hover:border-blue-500/30 smooth-transition cursor-pointer hover:bg-blue-500/5">
                <summary className="font-semibold flex justify-between items-center text-lg group-open:text-blue-400 smooth-transition">
                  <span>{item.q}</span>
                  <span className="group-open:rotate-180 smooth-transition text-blue-400">
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </summary>
                <p className="text-slate-400 mt-4 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
          <h2 className="text-5xl font-bold">
            Evalúa tu marca <span className="gradient-text">antes de presentar la solicitud</span>
          </h2>
          <p className="text-xl text-slate-300">Obtén una revisión preliminar de antecedentes, clasificaciones y similitudes relevantes.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 gap-2 text-base h-12 smooth-transition hover-lift shadow-lg shadow-blue-500/30">
                Comenzar análisis <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="mailto:support@visualcompare.cl">
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white text-base h-12 smooth-transition">
                Contactar soporte
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500">La plataforma puede conservar información necesaria para historial, trazabilidad e informes. Revisa las condiciones aplicables antes de cargar material confidencial.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
          <div>© 2026 Visual Compare Chile. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <a href="mailto:support@visualcompare.cl" className="hover:text-white smooth-transition">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
