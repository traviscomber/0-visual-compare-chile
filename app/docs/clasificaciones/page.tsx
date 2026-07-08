'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Eye, FileText, Grid3x3, Tag, ArrowRight, CheckCircle } from 'lucide-react'

export default function ClassificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 relative overflow-hidden">
      {/* Background gradient accents */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-sm border-b border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white font-montserrat">Visual Compare</span>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="sm" className="border-blue-500/50 text-blue-300 hover:bg-blue-900/30">Volver a Docs</Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        {/* Hero */}
        <section className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 font-montserrat">Clasificaciones de Marcas</h1>
          <p className="text-xl text-blue-200">Comprende los sistemas internacionales de clasificación: Niza (Nice) y Viena (Vienna)</p>
        </section>

        {/* Two Main Classifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* NIZA CLASSIFICATION */}
          <div className="glass p-8 border border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 rounded-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
                <Grid3x3 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white font-montserrat mb-1">Clasificación Niza</h2>
                <p className="text-sm text-blue-200">(Nice Classification)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-100 mb-2">¿Qué es?</h3>
                <p className="text-sm text-blue-50">
                  Sistema internacional de clasificación de marcas que organiza bienes y servicios en 45 clases: 34 clases de productos (clase 1-34) y 11 clases de servicios (clase 35-45).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-100 mb-2">Propósito</h3>
                <p className="text-sm text-blue-50">
                  Facilita la búsqueda, registro y gestión de marcas comerciales a nivel internacional, proporcionando un marco estándar para clasificar productos y servicios.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-100 mb-2">Adoptado por</h3>
                <p className="text-sm text-blue-50">
                  Oficina Europea de Propiedad Intelectual (EUIPO), WIPO y sistemas de propiedad intelectual en más de 200 países.
                </p>
              </div>

              <div className="pt-4 border-t border-blue-500/20">
                <Link href="#niza-clases">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2">
                    Ver 45 Clases <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* VIENNA CLASSIFICATION */}
          <div className="glass p-8 border border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-slate-900/50 rounded-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-12 w-12 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                <Eye className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white font-montserrat mb-1">Clasificación Viena</h2>
                <p className="text-sm text-purple-200">(Vienna Classification)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-purple-100 mb-2">¿Qué es?</h3>
                <p className="text-sm text-purple-50">
                  Sistema internacional para clasificar elementos figurativos de marcas (logotipos, símbolos, imágenes). Organiza marcas visuales por su forma y características gráficas.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-purple-100 mb-2">Propósito</h3>
                <p className="text-sm text-purple-50">
                  Facilita la búsqueda y recuperación de marcas figurativas mediante clasificación jerárquica de elementos visuales, desde lo general a lo particular.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-purple-100 mb-2">Establecido por</h3>
                <p className="text-sm text-purple-50">
                  WIPO (Organización Mundial de la Propiedad Intelectual) en 1973. Administrado por WIPO y utilizado por EUIPO con versión modificada.
                </p>
              </div>

              <div className="pt-4 border-t border-purple-500/20">
                <Link href="#vienna-categorias">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white gap-2">
                    Ver Categorías <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* NIZA DETAILED SECTION */}
        <section id="niza-clases" className="mb-12">
          <div className="glass p-8 border border-blue-500/30 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 font-montserrat flex items-center gap-3">
              <Grid3x3 className="h-7 w-7 text-blue-400" />
              45 Clases Niza: Productos y Servicios
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CLASES 1-34: PRODUCTOS */}
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-4 pb-3 border-b border-blue-500/20">Clases 1-34: Productos</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-900/20 rounded border border-blue-500/20">
                    <p className="text-sm"><span className="font-semibold text-blue-300">Clases 1-4:</span> Químicos, pinturas, lubricantes</p>
                  </div>
                  <div className="p-3 bg-blue-900/20 rounded border border-blue-500/20">
                    <p className="text-sm"><span className="font-semibold text-blue-300">Clases 5-11:</span> Farmacéuticos, metales, máquinas, herramientas</p>
                  </div>
                  <div className="p-3 bg-blue-900/20 rounded border border-blue-500/20">
                    <p className="text-sm"><span className="font-semibold text-blue-300">Clases 12-21:</span> Vehículos, joyas, mobiliario, vidrio</p>
                  </div>
                  <div className="p-3 bg-blue-900/20 rounded border border-blue-500/20">
                    <p className="text-sm"><span className="font-semibold text-blue-300">Clases 22-34:</span> Textiles, alimentos, bebidas, tabaco</p>
                  </div>
                </div>
              </div>

              {/* CLASES 35-45: SERVICIOS */}
              <div>
                <h3 className="text-lg font-semibold text-amber-300 mb-4 pb-3 border-b border-amber-500/20">Clases 35-45: Servicios</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-900/20 rounded border border-amber-500/20">
                    <p className="text-sm"><span className="font-semibold text-amber-300">Clase 35:</span> Publicidad, gestión empresarial</p>
                  </div>
                  <div className="p-3 bg-amber-900/20 rounded border border-amber-500/20">
                    <p className="text-sm"><span className="font-semibold text-amber-300">Clase 36:</span> Servicios financieros e inmobiliarios</p>
                  </div>
                  <div className="p-3 bg-amber-900/20 rounded border border-amber-500/20">
                    <p className="text-sm"><span className="font-semibold text-amber-300">Clases 37-40:</span> Construcción, transporte, tratamiento de materiales</p>
                  </div>
                  <div className="p-3 bg-amber-900/20 rounded border border-amber-500/20">
                    <p className="text-sm"><span className="font-semibold text-amber-300">Clases 41-45:</span> Educación, salud, alimentación, servicios legales</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-semibold text-blue-200 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Importancia para Tu Negocio
              </h4>
              <p className="text-sm text-blue-100">
                Al registrar una marca, debes especificar en cuáles clases Niza deseas protección. Cada clase representa un área diferente de negocio. Esto determina qué competidores no pueden usar marcas similares en tus categorías.
              </p>
            </div>
          </div>
        </section>

        {/* VIENNA DETAILED SECTION */}
        <section id="vienna-categorias" className="mb-12">
          <div className="glass p-8 border border-purple-500/30 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 font-montserrat flex items-center gap-3">
              <Eye className="h-7 w-7 text-purple-400" />
              Clasificación Viena: Elementos Figurativos
            </h2>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                <h3 className="font-semibold text-purple-300 mb-2">Estructura Jerárquica</h3>
                <p className="text-sm text-purple-100">
                  La Clasificación Viena funciona como un árbol de categorías que va de lo general (categorías) a lo particular (divisiones y secciones).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-300 uppercase mb-2">Categorías</p>
                  <p className="text-sm text-purple-100">
                    Nivel más alto: clasificación amplia de elementos visuales (ej: figuras geométricas, plantas, animales)
                  </p>
                </div>

                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-300 uppercase mb-2">Divisiones</p>
                  <p className="text-sm text-purple-100">
                    Subcategorías: desglose más específico (ej: dentro de animales: mamíferos, aves, peces)
                  </p>
                </div>

                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                  <p className="text-xs font-semibold text-purple-300 uppercase mb-2">Secciones</p>
                  <p className="text-sm text-purple-100">
                    Nivel más detallado: clasificación específica de características visuales
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <h4 className="font-semibold text-purple-200 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Uso en Búsqueda de Marcas
              </h4>
              <p className="text-sm text-purple-100 mb-3">
                La Clasificación Viena es fundamental para buscar marcas figurativas similares. Puedes filtrar tu búsqueda por:
              </p>
              <ul className="text-sm text-purple-100 space-y-2 ml-4">
                <li>• Forma y diseño visual del logo</li>
                <li>• Elementos específicos (colores, patrones, objetos)</li>
                <li>• Características de la representación gráfica</li>
              </ul>
            </div>
          </div>
        </section>

        {/* EJEMPLOS EN ACCIÓN */}
        <section className="mb-12">
          <div className="glass p-8 border border-amber-500/30 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 font-montserrat">Ejemplos en Acción</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* EJEMPLO NIZA */}
              <div>
                <h3 className="text-xl font-bold text-blue-300 mb-6 pb-3 border-b border-blue-500/20">Ejemplo: Visual Compare (Niza)</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-400 font-semibold uppercase mb-2">Nombre Marca</p>
                    <p className="text-lg font-bold text-white">VISUAL COMPARE</p>
                  </div>

                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-400 font-semibold uppercase mb-2">Clases Niza Solicitadas</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm text-blue-300">42 - Servicios IT</span>
                      <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm text-blue-300">35 - Publicidad</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-400 font-semibold uppercase mb-2">Qué Significa</p>
                    <ul className="text-sm text-blue-100 space-y-2">
                      <li>• <strong>Clase 42:</strong> Software de análisis, servicios de comparación</li>
                      <li>• <strong>Clase 35:</strong> Publicidad de servicios tecnológicos</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
                    <p className="text-xs text-amber-400 font-semibold uppercase mb-2">Protección Legal</p>
                    <p className="text-sm text-amber-100">
                      Nadie más en Chile puede registrar "VISUAL COMPARE" como marca en clases 35 y 42 sin autorización.
                    </p>
                  </div>
                </div>
              </div>

              {/* EJEMPLO VIENA */}
              <div>
                <h3 className="text-xl font-bold text-purple-300 mb-6 pb-3 border-b border-purple-500/20">Ejemplo: Logo Visual Compare (Viena)</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <p className="text-xs text-purple-400 font-semibold uppercase mb-2">Elemento Visual</p>
                    <p className="text-lg font-bold text-white">Ícono: Ojo estilizado (símbolo de visión)</p>
                  </div>

                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <p className="text-xs text-purple-400 font-semibold uppercase mb-2">Clasificación Viena</p>
                    <div className="space-y-2">
                      <span className="block px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-sm text-purple-300">26.03.01 - Órganos del cuerpo (especialmente cabeza, ojo)</span>
                      <span className="text-xs text-purple-200 ml-3">○ Categoría: 26 - Figuras humanas y partes del cuerpo</span>
                      <span className="text-xs text-purple-200 ml-3">○ División: 03 - Partes específicas</span>
                      <span className="text-xs text-purple-200 ml-3">○ Sección: 01 - Ojos y visión</span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <p className="text-xs text-purple-400 font-semibold uppercase mb-2">Búsqueda por Similitud Visual</p>
                    <p className="text-sm text-purple-100 mb-3">Con esta clasificación, puedes encontrar:</p>
                    <ul className="text-sm text-purple-100 space-y-2">
                      <li>✓ Logos con ojos estilizados</li>
                      <li>✓ Símbolos de visión/vigilancia</li>
                      <li>✓ Diseños minimalistas con ojos</li>
                      <li>✓ Íconos de partes del cuerpo similares</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
                    <p className="text-xs text-amber-400 font-semibold uppercase mb-2">Detección de Conflictos</p>
                    <p className="text-sm text-amber-100">
                      Si alguien registra un logo de ojo en la clase 26.03.01, podría detectarse como marca similar o conflictiva.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="mb-12">
          <div className="glass p-8 border border-blue-500/30 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 font-montserrat">Comparativa: Niza vs Viena</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-500/20">
                    <th className="text-left py-3 px-4 font-semibold text-blue-300">Aspecto</th>
                    <th className="text-left py-3 px-4 font-semibold text-blue-300">Clasificación Niza</th>
                    <th className="text-left py-3 px-4 font-semibold text-purple-300">Clasificación Viena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/10">
                  <tr>
                    <td className="py-3 px-4 text-blue-100 font-semibold">Qué Clasifica</td>
                    <td className="py-3 px-4 text-blue-100">Productos y Servicios (contenido)</td>
                    <td className="py-3 px-4 text-purple-100">Elementos visuales/figurativos (forma)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-blue-100 font-semibold">Clases</td>
                    <td className="py-3 px-4 text-blue-100">45 clases (34 productos + 11 servicios)</td>
                    <td className="py-3 px-4 text-purple-100">Categorías, divisiones y secciones</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-blue-100 font-semibold">Propósito</td>
                    <td className="py-3 px-4 text-blue-100">Definir áreas de negocio protegidas</td>
                    <td className="py-3 px-4 text-purple-100">Buscar logotipos y marcas visuales</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-blue-100 font-semibold">Entrada en Registro</td>
                    <td className="py-3 px-4 text-blue-100">Obligatoria al registrar marca</td>
                    <td className="py-3 px-4 text-purple-100">Opcional, utilizada en búsquedas</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-blue-100 font-semibold">Usuarios Principales</td>
                    <td className="py-3 px-4 text-blue-100">Empresas, marcas, propietarios</td>
                    <td className="py-3 px-4 text-purple-100">Oficinas de PI, abogados, investigadores</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* HOW VISUAL COMPARE HELPS */}
        <section className="mb-12">
          <div className="glass p-8 border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-slate-900/50 rounded-2xl">
            <h2 className="text-3xl font-bold text-white mb-6 font-montserrat flex items-center gap-3">
              <Tag className="h-7 w-7 text-amber-400" />
              Cómo Visual Compare Utiliza Estas Clasificaciones
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-300 text-lg">Motor de Comparación</h3>
                <p className="text-sm text-amber-50">
                  Utiliza la Clasificación Viena para analizar elementos visuales de marcas y compararlas con tu historial y flujo de piloto.
                </p>
                <div className="p-3 bg-amber-900/30 rounded border border-amber-500/20">
                  <p className="text-xs text-amber-200 font-mono">SHA-256 + pHash + Embeddings Visuales</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-amber-300 text-lg">Portal de Consulta</h3>
                <p className="text-sm text-amber-50">
                  Permite buscar marcas por Clasificación Niza (qué productos/servicios protege) y Viena (cómo se ve el logo).
                </p>
                <div className="p-3 bg-amber-900/30 rounded border border-amber-500/20">
                  <p className="text-xs text-amber-200">45 clases Niza + búsqueda visual Viena</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-amber-500/20">
              <Link href="/consulta">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  Explorar Portal de Consulta <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* RECURSOS EXTERNOS */}
        <section>
          <div className="glass p-8 border border-blue-500/30 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 font-montserrat">Recursos Oficiales</h2>

            <div className="space-y-4">
              <a 
                href="https://www.euipo.europa.eu/en/help-centre/searches/faq-vienna-classification" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">EUIPO - FAQ Clasificación Viena</h3>
                    <p className="text-sm text-blue-100">Información oficial sobre la Clasificación Viena y su aplicación en marcas figurativas</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                </div>
              </a>

              <a 
                href="https://euipo.europa.eu/ec2/classheadings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg hover:border-blue-400/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-blue-300 mb-1">TMclass - Clasificación Niza Completa</h3>
                    <p className="text-sm text-blue-100">Portal oficial de TMclass con todas las 45 clases Niza, términos y definiciones</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                </div>
              </a>

              <a 
                href="https://www.wipo.int/classifications/nivilo/vienna.htm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg hover:border-purple-400/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-purple-300 mb-1">WIPO - Clasificación Viena Oficial</h3>
                    <p className="text-sm text-purple-100">Organización Mundial de la Propiedad Intelectual - Administrador de la Clasificación Viena</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-400 flex-shrink-0 mt-1" />
                </div>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
