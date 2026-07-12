'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap, CheckCircle, Lock, Clock, Sparkles, ChevronDown } from 'lucide-react'
import { useState } from 'react'

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
            <span className="text-sm text-blue-300">Impulsado por IA y datos reales de INAPI</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight space-y-3">
            <div>Registra tu marca</div>
            <div className="gradient-text">en Chile sin incertidumbre</div>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Analiza tu logo, verifica disponibilidad en INAPI y obtén clasificación automática. En menos de 3 minutos, sabrás si puedes registrar tu marca.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 gap-2 text-base h-12 smooth-transition hover-lift shadow-lg shadow-blue-500/30">
                Comenzar gratis <ArrowRight className="w-5 h-5" />
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
              <span>100% seguro</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white smooth-transition cursor-default">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Resultados en segundos</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white smooth-transition cursor-default">
              <CheckCircle className="w-4 h-4 text-purple-400" />
              <span>Gratis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 border-t border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 animate-slide-up">¿Qué obtienes?</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Card 1 */}
            <div className="group bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 hover-lift hover:border-blue-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/30 group-hover:scale-110 smooth-transition">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Análisis Viena</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Clasificación visual automática de tu logo: colores, formas, estilos y elementos detectados por IA.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8 hover-lift hover:border-purple-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:bg-purple-500/30 group-hover:scale-110 smooth-transition">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Clasificación Niza</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Categorización de 45 clases de productos/servicios. Sabemos exactamente dónde registrar tu marca.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-2xl p-8 hover-lift hover:border-green-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/30 group-hover:scale-110 smooth-transition">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Disponible en Chile</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Consulta INAPI en tiempo real. Sabrás si tu marca se puede registrar antes de gastar dinero.
              </p>
            </div>
          </div>

          {/* Second row */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 4 */}
            <div className="group bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8 hover-lift hover:border-amber-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/30 group-hover:scale-110 smooth-transition">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Detección de Conflictos</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Identifica marcas similares registradas. Evita rechazos y conflictos legales costosos.
              </p>
            </div>

            {/* Card 5 */}
            <div className="group bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-8 hover-lift hover:border-red-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4 group-hover:bg-red-500/30 group-hover:scale-110 smooth-transition">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Resultados Instantáneos</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                No esperes días. Obtén tu análisis completo en menos de 3 minutos. Decisión ahora.
              </p>
            </div>

            {/* Card 6 */}
            <div className="group bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8 hover-lift hover:border-cyan-500/50 cursor-default smooth-transition" style={{ animationDelay: '0.6s' }}>
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 group-hover:scale-110 smooth-transition">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Impulsado por IA</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                GPT-4o Vision analiza tu logo. Tecnología de punta para máxima precisión en clasificación.
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
              { step: '1', title: 'Sube tu logo', desc: 'Carga una imagen clara de tu logo o marca. PNG, JPG, SVG. Cualquier formato funciona.' },
              { step: '2', title: 'Escribe el nombre', desc: 'Ingresa exactamente cómo quieres registrar tu marca. Mayúsculas, acentos, símbolos especiales.' },
              { step: '3', title: 'Obtén análisis', desc: 'En segundos recibe: clasificación Viena, clases Niza, disponibilidad INAPI, conflictos detectados.' },
              { step: '4', title: 'Toma acción', desc: 'Decide registrar tu marca con confianza. Descarga tu informe y procede con el abogado.' },
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
              { q: '¿Realmente revisan INAPI?', a: 'Sí. Consultamos la base de datos en tiempo real de INAPI. Los datos son actuales y confiables.' },
              { q: '¿Es gratis?', a: 'Completamente gratis. No hay sorpresas, no hay suscripciones. Solo regístrate y analiza.' },
              { q: '¿Qué significan Viena y Niza?', a: 'Son clasificaciones internacionales de marcas. Viena es visual, Niza es por categoría de producto/servicio. Te explicamos todo.' },
              { q: '¿Puedo confiar en los resultados?', a: 'Usamos IA de GPT-4o Vision + datos oficiales INAPI. Los resultados son indicativos. Para registro oficial, consulta un abogado de PI.' },
              { q: '¿Cuánto toma el análisis?', a: 'Entre 1-3 minutos. Depende de complejidad de tu logo. Recibirás un informe descargable completo.' },
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
            Listo para registrar <span className="gradient-text">tu marca</span> en Chile?
          </h2>
          <p className="text-xl text-slate-300">No necesitas abogado para saber si es posible. Nosotros te decimos en 3 minutos.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 gap-2 text-base h-12 smooth-transition hover-lift shadow-lg shadow-blue-500/30">
                Comenzar análisis gratis <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="mailto:support@visualcompare.cl">
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white text-base h-12 smooth-transition">
                Contactar soporte
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-500">Análisis completamente confidencial. Tu logo se analiza y descarta. Nada se almacena.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div>© 2026 Visual Compare Chile. Todos los derechos reservados.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white smooth-transition">Privacidad</a>
            <a href="#" className="hover:text-white smooth-transition">Términos</a>
            <a href="#" className="hover:text-white smooth-transition">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
