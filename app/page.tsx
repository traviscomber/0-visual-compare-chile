'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Scale, ShoppingCart, Palette, Zap, CheckCircle2, Shield, Eye, Code2, Gauge, Database, Lock, Cpu, ArrowRight, Search, Package } from 'lucide-react'
import { MethodFlipCard } from '@/components/method-flip-card'
import { ComparisonCarousel } from '@/components/comparison-carousel'
import { ClassificationFlipCard } from '@/components/classification-flip-card'
import { UseCaseFlipCard } from '@/components/usecase-flip-card'
import { IntegrationStepCard } from '@/components/integration-step-card'
import RoadmapRedesigned from '@/components/roadmap-redesign'
import { FrontendShowcase } from '@/components/frontend-showcase'
import { NizaVienExamples } from '@/components/niza-viena-examples'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-30"></div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Visual Compare</span>
          </Link>

          <div className="flex items-center gap-8">
            <a href="#motor" className="text-sm text-blue-200 hover:text-white transition">Motor</a>
            <a href="#casos" className="text-sm text-blue-200 hover:text-white transition">Casos de uso</a>
            <a href="#como" className="text-sm text-blue-200 hover:text-white transition">Cómo funciona</a>
            <Link href="/consulta" className="text-sm text-blue-200 hover:text-white transition">Consulta de Marcas</Link>
            <a href="/docs" className="text-sm text-blue-200 hover:text-white transition">API</a>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">Obtener acceso</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge pill - HIDDEN */}
            {/* <div className="inline-block mb-6">
              <div className="glass-sm px-4 py-2">
                <p className="text-sm font-medium text-blue-300">API-first • Detección de similitud visual • CLP $5M Presupuesto</p>
              </div>
            </div> */}
            
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
              Protege tus marcas.<br/>Nosotros las analizamos
            </h1>
            
            <p className="text-lg text-blue-100 mb-4 max-w-2xl leading-relaxed">
              Plataforma integral para comparación visual de logos y consulta de marcas registradas. Motor híbrido de 3 métodos: SHA-256 exacto, pHash perceptual y embeddings visuales.
            </p>
            
            <p className="text-sm text-blue-200 mb-8 max-w-2xl leading-relaxed">
              Fase MVP: Comparación en &lt;<span className="text-blue-300 font-semibold">100ms</span>, 350K+ registros consultables, 99.95% uptime SLA. Desarrollado en 8 semanas con stack Next.js 16 + React 19 + Supabase.
            </p>

            <div className="flex gap-4 mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">Obtener acceso</Button>
              </Link>
              <Link href="/consulta">
                <Button size="lg" variant="outline" className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20">Explorar Consulta</Button>
              </Link>
            </div>


            {/* Key metrics - HIDDEN */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass p-4">
                <div className="text-2xl font-bold text-blue-300 mb-1">&lt;100ms</div>
                <p className="text-xs text-blue-200">Latencia P95</p>
              </div>
              <div className="glass p-4">
                <div className="text-2xl font-bold text-emerald-400 mb-1">350K+</div>
                <p className="text-xs text-blue-200">Marcas</p>
              </div>
              <div className="glass p-4">
                <div className="text-2xl font-bold text-blue-300 mb-1">3 métodos</div>
                <p className="text-xs text-blue-200">Análisis híbrido</p>
              </div>
              <div className="glass p-4">
                <div className="text-2xl font-bold text-blue-300 mb-1">99.95%</div>
                <p className="text-xs text-blue-200">SLA uptime</p>
              </div>
            </div> */}
          </div>

          {/* Hero Image */}
          <div className="glass p-6">
            <Image
              src="/images/logo-comparison-hero.jpg"
              alt="Comparación de logos similar"
              width={500}
              height={400}
              className="w-full rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* MOTOR - Technical Specs */}
      <section id="motor" className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4">Motor de 3 métodos</h2>
          <p className="text-lg text-blue-200 mb-12 max-w-2xl">Análisis simultáneo usando SHA-256, pHash perceptual y embeddings visuales para máxima precisión. Haz clic en cualquier método para explorar detalles técnicos y casos de uso.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MethodFlipCard
              icon={Lock}
              title="SHA-256 Exacto"
              shortDescription="Detección bit-perfecta de duplicados exactos. Zero falsos positivos."
              metric="Métrica: Coincidencia al 100% o nada"
              metricColor="text-blue-400"
              backgroundColor="bg-blue-500/50"
              expandedContent={{
                title: "Hash Criptográfico SHA-256",
                details: [
                  "Genera un hash criptográfico de 256 bits único para cada imagen. Si dos imágenes tienen el mismo hash, son idénticas bit por bit.",
                  "Velocidad de procesamiento: <10ms por imagen",
                  "Tasa de coincidencia: 100% o 0% (sin casos intermedios)",
                  "Ideal para detectar copias exactas y clones de archivos",
                ],
                useCases: [
                  "Detectar duplicados exactos en bases de datos de contenido",
                  "Verificar integridad de archivos en almacenamiento",
                  "Auditoría de derechos de autor (copias perfectas)",
                  "Control de versiones de documentos",
                ],
              }}
            />

            <MethodFlipCard
              icon={Cpu}
              title="pHash Perceptual"
              shortDescription="Hash perceptual (64-bit). Detecta similitudes visuales con distancia Hamming."
              metric="Métrica: Distancia <5 = similar"
              metricColor="text-amber-400"
              backgroundColor="bg-purple-500/50"
              expandedContent={{
                title: "Hash Perceptual - Análisis Visual",
                details: [
                  "Reduce la imagen a una firma visual de 64 bits que captura características esenciales ignorando cambios menores como compresión, rotación o cambios de brillo.",
                  "Distancia Hamming: Cuenta diferencias de bits entre dos hashes (máximo 64)",
                  "Velocidad de procesamiento: 15-30ms por imagen",
                  "Detecta desde cambios sutiles hasta ediciones menores (compresión JPEG, rotación ligera, recortes pequeños)",
                ],
                useCases: [
                  "Encontrar versiones alteradas de la misma imagen",
                  "Detectar compresión o cambios de formato",
                  "Identificar rotaciones, espejos y redimensionamientos",
                  "Buscar imágenes similares en galerías grandes",
                ],
              }}
            />

            <MethodFlipCard
              icon={Gauge}
              title="Embeddings Visuales"
              shortDescription="Red neural para análisis de composición visual profunda."
              metric="Métrica: Similitud coseno 0-1"
              metricColor="text-blue-300"
              backgroundColor="bg-blue-950/50"
              expandedContent={{
                title: "Redes Neuronales - Análisis Profundo",
                details: [
                  "Utiliza TensorFlow.js para extraer características visuales complejas (composición, paleta de colores, objetos, textura) en un vector de 512 dimensiones.",
                  "Calcula la similitud coseno entre vectores (0 = completamente diferentes, 1 = idénticos)",
                  "Velocidad de procesamiento: 50-100ms por imagen (dependiendo del dispositivo)",
                  "Excelente para detectar imágenes conceptualmente similares aunque visualmente distintas",
                ],
                useCases: [
                  "Encontrar imágenes con similar composición o estilo",
                  "Detectar fotogramas similares en videos",
                  "Búsqueda semántica de imágenes (mismo contenido, diferente perspectiva)",
                  "Comparación de diseños y layouts",
                ],
              }}
            />
          </div>

          {/* Algorithm Diagram */}
          <div className="glass p-6 mb-12 border-blue-500/50 hover:border-blue-400/70 transition-all">
            <h3 className="text-2xl font-bold text-white mb-6 font-montserrat flex items-center gap-3">
              <Cpu className="h-6 w-6 text-blue-400" />
              Flujo de procesamiento del motor
            </h3>
            <div className="flex justify-center">
              <Image
                src="/images/algorithm-flowchart.jpg"
                alt="Diagrama del flujo del algoritmo - Flujo de procesamiento del motor con SHA-256, pHash y Embeddings Visuales"
                width={540}
                height={300}
                className="rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all shadow-lg shadow-blue-500/10"
                priority
              />
            </div>
          </div>

          <div className="glass p-5 mb-8">
            <h3 className="text-lg font-bold text-white mb-5">Clasificación automática (5 categorías)</h3>
            <p className="text-xs text-blue-200 mb-4">Haz clic en cualquier categoría para explorar características y casos de uso</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ClassificationFlipCard
                tag="exact_match"
                tagColor="text-purple-300"
                tagBgColor="bg-blue-900/50"
                title="Coincidencia exacta"
                description="SHA-256 coincide perfectamente. Duplicado confirmado."
                percentageRange="100%"
                percentageColor="text-purple-400"
                expandedContent={{
                  title: "Duplicado exacto (100%)",
                  definition: "Dos imágenes son idénticas bit por bit. El hash SHA-256 coincide perfectamente, lo que significa que no hay diferencias en absoluto.",
                  characteristics: [
                    "Coincidencia perfecta de todos los bits de la imagen",
                    "Cero falsos positivos - si dice 100%, es 100%",
                    "Detecta copias exactas incluso si tienen metadatos distintos",
                    "No es afectado por compresión o cambios de formato",
                  ],
                  whenToUse: [
                    "Verificar duplicados exactos en bases de datos",
                    "Detectar archivos idénticos clonados",
                    "Auditoría de derechos de autor (copias perfectas)",
                    "Validación de integridad de archivos",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="near_duplicate"
                tagColor="text-amber-300"
                tagBgColor="bg-amber-900/50"
                title="Muy similar"
                description="Compresión, rotación o ediciones menores detectadas."
                percentageRange="85-99%"
                percentageColor="text-yellow-400"
                expandedContent={{
                  title: "Casi duplicado (85-99%)",
                  definition: "Las imágenes son casi idénticas. Hay cambios muy menores como compresión JPEG, rotación ligera, o ediciones mínimas, pero la esencia visual es la misma.",
                  characteristics: [
                    "Detecta versiones comprimidas de la misma imagen",
                    "Identifica rotaciones, espejos y redimensionamientos",
                    "Muy bajo margen de diferencia visual",
                    "Ideal para encontrar versiones alteradas",
                  ],
                  whenToUse: [
                    "Encontrar versiones comprimidas o recodificadas",
                    "Detectar rotaciones y cambios de formato",
                    "Buscar copias ligeramente modificadas",
                    "Control de calidad de imagen en galerías",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="visually_similar"
                tagColor="text-blue-300"
                tagBgColor="bg-blue-500/50"
                title="Similaridad visual"
                description="Mismo layout, colores y tipografía pero con diferencias notables."
                percentageRange="60-84%"
                percentageColor="text-blue-400"
                expandedContent={{
                  title: "Visualmente similar (60-84%)",
                  definition: "Las imágenes comparten características visuales similares como layout, paleta de colores o composición, pero tienen diferencias notables en contenido o detalles.",
                  characteristics: [
                    "Mismo estilo visual pero contenido diferente",
                    "Composición y layout similar",
                    "Paleta de colores comparable",
                    "Diferencias moderadas en elementos",
                  ],
                  whenToUse: [
                    "Búsqueda de imágenes con estilo similar",
                    "Detección de plagios de diseño",
                    "Comparación de interfaces de usuario",
                    "Búsqueda semántica de contenido visual",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="partially_similar"
                tagColor="text-orange-300"
                tagBgColor="bg-orange-900/50"
                title="Parcialmente similar"
                description="Algunos elementos visuales en común pero diferencias significativas."
                percentageRange="30-59%"
                percentageColor="text-orange-400"
                expandedContent={{
                  title: "Parcialmente similar (30-59%)",
                  definition: "Las imágenes comparten algunos elementos visuales como objetos, textura o colores, pero tienen diferencias significativas en composición, tamaño o contenido general.",
                  characteristics: [
                    "Algunos objetos o elementos en común",
                    "Diferencias significativas en composición",
                    "Posibles cambios de contexto o escala",
                    "Características parciales coinciden",
                  ],
                  whenToUse: [
                    "Encontrar imágenes relacionadas temáticamente",
                    "Detección de objetos similares",
                    "Búsqueda aproximada de conceptos",
                    "Análisis de contenido relacionado",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="different"
                tagColor="text-blue-200"
                tagBgColor="bg-gray-700/50"
                title="Diferente"
                description="Sin similitud significativa. Imágenes completamente distintas."
                percentageRange="0-29%"
                percentageColor="text-blue-200"
                expandedContent={{
                  title: "Completamente diferente (0-29%)",
                  definition: "Las imágenes no comparten características visuales significativas. Son conceptualmente distintas, tienen layouts diferentes y no hay coincidencia en composición ni objetos.",
                  characteristics: [
                    "Sin coincidencia visual significativa",
                    "Composición y contexto completamente distinto",
                    "Posiblemente diferentes tipos de contenido",
                    "No hay elementos visuales en común",
                  ],
                  whenToUse: [
                    "Validar que imágenes son completamente distintas",
                    "Filtrar resultados no relevantes",
                    "Confirmación negativa en búsquedas",
                    "Control de calidad de matching",
                  ],
                }}
              />
            </div>
          </div>

          {/* Performance specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-6">
              <p className="text-xs text-blue-200 mb-2">Latencia promedio</p>
              <p className="text-2xl font-bold text-blue-300">47ms</p>
            </div>
            <div className="glass p-6">
              <p className="text-xs text-blue-200 mb-2">Capacidad máxima</p>
              <p className="text-2xl font-bold text-blue-300">1000+</p>
              <p className="text-xs text-blue-400">req/seg</p>
            </div>
            <div className="glass p-6">
              <p className="text-xs text-blue-200 mb-2">Tamaño máximo imagen</p>
              <p className="text-2xl font-bold text-blue-300">50MB</p>
            </div>
            <div className="glass p-6">
              <p className="text-xs text-blue-200 mb-2">Formatos soportados</p>
              <p className="text-xs text-blue-300">JPEG, PNG, WebP, TIFF</p>
            </div>
          </div>
        </div>
      </section>

      {/* CARRUSEL DE EJEMPLOS */}
      <section className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ejemplos en acción
            </h2>
            <p className="text-lg text-blue-100">
              Explora diferentes tipos de comparaciones y clasificaciones
            </p>
          </div>
          
          <ComparisonCarousel />
        </div>
      </section>

      {/* EJEMPLOS NIZA Y VIENA EN ACCIÓN */}
      <NizaVienExamples />

      {/* CASOS DE USO */}
  <section id="casos" className="py-24 relative z-10 border-t border-blue-500/20">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-white mb-3">Casos de uso reales</h2>
    <p className="text-blue-200 mb-12">Haz clic en cada caso para explorar implementación y beneficios</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
      <UseCaseFlipCard
        icon={<Scale className="w-5 h-5" />}
        title="Protección de marca (Legal)"
        description="Detecta conflictos de marca antes de registro INAPI."
        expandedContent={{
          overview: "Estudios jurídicos y departamentos legales usan el API para evaluar similitud visual de marcas antes de litigio. Sistema automatizado para análisis de conflictividad de marcas.",
          features: [
            "Comparación automática con base de marcas existentes",
            "Score de similitud para asesoría legal",
            "Reportes exportables para trámites INAPI",
            "Análisis histórico de comparaciones",
          ],
          implementation: [
            "Integración en plataforma legal (REST API)",
            "Usuarios con acceso basado en roles (abogados/asistentes)",
            "Almacenamiento seguro de reportes (RLS habilitado)",
            "Auditoría completa de cada comparación",
          ],
          benefits: [
            "Reduce tiempo de análisis preliminar en 80%",
            "Minimiza rechazos por similitud en INAPI",
            "Proporciona evidencia técnica para litigio",
            "ROI en primeras 2-3 comparaciones",
          ],
        }}
      />

      <UseCaseFlipCard
        icon={<ShoppingCart className="w-5 h-5" />}
        title="Detección de falsificación (E-commerce)"
        description="Detecta productos falsificados comparando con catálogo original."
        expandedContent={{
          overview: "Marketplaces de e-commerce validan autenticidad de productos comparando fotografías con catálogos oficiales. Prevención automática de venta de contrabandy.",
          features: [
            "Alertas automáticas de productos similares sospechosos",
            "Validación de autenticidad antes de venta",
            "Protección del catálogo original",
            "Score de riesgo de falsificación",
          ],
          implementation: [
            "Webhook integrado en pipeline de carga de productos",
            "Auto-reject de productos con similitud >70%",
            "Dashboard de moderación para casos borderline",
            "Integración con sistema de reputación de vendedores",
          ],
          benefits: [
            "Reduce falsificaciones detectadas en 95%",
            "Evita chargebacks y devoluciones de clientes",
            "Protege marca de sellers legítimos",
            "Aumenta confianza de consumidores",
          ],
        }}
      />

      <UseCaseFlipCard
        icon={<Palette className="w-5 h-5" />}
        title="Validación de diseño (Creative)"
        description="Verifica originalidad de diseños comparando con referencias e inspiraciones."
        expandedContent={{
          overview: "Agencias de diseño y creativos validan que sus trabajos sean únicos vs. referencias externas. Protección de propiedad intelectual creativa.",
          features: [
            "Comparación contra referencias de inspiración",
            "Score de diferenciación visual",
            "Documentación de proceso creativo",
            "Reports para defensa de IP",
          ],
          implementation: [
            "Integración en herramientas de diseño (plugin/API)",
            "Análisis automático durante etapa de concepto",
            "Histórico de evolución del diseño",
            "Alertas de similitud excesiva vs. mercado",
          ],
          benefits: [
            "Demuestra originalidad del trabajo creativo",
            "Protege contra acusaciones de plagio",
            "Facilita defensa legal de diseños",
            "Automatiza validación de briefs",
          ],
        }}
      />

      <UseCaseFlipCard
        icon={<Eye className="w-5 h-5" />}
        title="QA visual (Ingeniería)"
        description="Equipos QA detectan regresiones visuales en interfaces automáticamente."
        expandedContent={{
          overview: "Equipos de QA comparan screenshots de builds para detectar cambios visuales no intencionales. Regression testing visual integrado en CI/CD.",
          features: [
            "Detección automática de cambios en UI",
            "Integración en pipeline CI/CD",
            "Prevención de bugs visuales",
            "Reports visuales para developers",
          ],
          implementation: [
            "Screenshots de baseline vs. nueva build",
            "Auto-fail en similitud <95%",
            "Integración con GitHub Actions/GitLab CI",
            "Diferencias visuales destacadas en reports",
          ],
          benefits: [
            "Detecta bugs visuales pre-producción",
            "Reduce tiempo de testing manual en 70%",
            "Cero regresiones visuales en producción",
            "Acelera velocity de development",
          ],
        }}
      />
    </div>
  </div>
  </section>
      {/* FASES Y PRESUPUESTO - STACKED CARD DESIGN */}
      <section id="fases" className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <div className="inline-block mb-6">
            <span className="text-xs font-bold text-blue-300 bg-purple-500/50 px-4 py-2 rounded-lg">MOTOR IA DE COMPARACIÓN</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Roadmap MVP: 2 Meses</h2>
            <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">Plan MVP con presupuesto CLP $5M. API de comparación visual con 3 métodos (SHA-256, pHash, Embeddings IA). Portal de Consulta en Fase 2.</p>
            <div className="flex gap-6 mt-8">
              <div className="glass px-6 py-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold">CLP $5M</p>
              </div>
              <div className="glass px-6 py-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold">8 semanas ejecución</p>
              </div>
              <div className="glass px-6 py-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold">API production-ready</p>
              </div>
            </div>
          </div>

          <RoadmapRedesigned />
        </div>
      </section>

      {/* LIVE DEMO - FRONTEND GLASSMORPHISM */}
      <section id="demo" className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <div className="inline-block mb-6">
              <span className="text-xs font-bold text-blue-300 bg-blue-500/50 px-4 py-2 rounded-lg">DEMOSTRACIÓN EN VIVO</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Frontend interactivo</h2>
            <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">Accede ahora a los módulos en vivo. Motor de Comparación e visualizador de marcas con interfaz glassmorphism.</p>
          </div>

          {/* Demo Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comparador Demo Card */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-900/40 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all duration-300"></div>
              <div className="glass p-8 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl hover:border-blue-500/50/70 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Comparador IA</h3>
                    <p className="text-sm text-blue-300">Motor visual avanzado</p>
                  </div>
                </div>

                <p className="text-blue-100 mb-6 flex-1">Compara imágenes con nuestro motor híbrido de 3 métodos: SHA-256 (exactitud), pHash (perceptual) y Embeddings (IA visual).</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">Sube 2 imágenes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">Análisis &lt;100ms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">5 categorías automáticas</span>
                  </div>
                </div>

                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <Link href="/comparador" className="flex items-center justify-center gap-2">
                    Abrir comparador
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Consulta Demo Card */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-900/40 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all duration-300"></div>
              <div className="glass p-8 rounded-2xl border border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl hover:border-blue-600/70 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <Search className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Portal Consulta</h3>
                    <p className="text-sm text-blue-300">350K+ marcas registradas</p>
                  </div>
                </div>

                <p className="text-blue-100 mb-6 flex-1">Busca en la base completa de marcas chilenas. Filtra por nombre, clasificación Niza, Viena, solicitante y más.</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">7 módulos funcionales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">Búsqueda fuzzy</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">Exportar CSV/JSON</span>
                  </div>
                </div>

                <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 font-semibold">
                  <Link href="/consulta" className="flex items-center justify-center gap-2">
                    Explorar portal
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Dashboard Link */}
          <div className="mt-12 text-center">
            <p className="text-blue-200 mb-4">¿Necesitas acceso administrativo?</p>
            <Button asChild variant="outline" className="border-blue-700/50 hover:bg-blue-500/20">
              <Link href="/demo" className="flex items-center gap-2">
                Ver panel de piloto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <FrontendShowcase />

      {/* CLASIFICACIONES NIZA Y VIENA */}
      <section className="py-20 border-t border-blue-500/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4 font-montserrat text-center">Clasificación de Marcas</h2>
          <p className="text-xl text-blue-200 text-center mb-16 max-w-3xl mx-auto">
            Visual Compare Chile utiliza los sistemas internacionales de clasificación Niza y Viena para organizar y buscar marcas registradas con precisión
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* NIZA */}
            <div className="group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              <div className="glass p-8 rounded-2xl border border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl hover:border-blue-400/70 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">Clasificación Niza</h3>
                    <p className="text-sm text-blue-300">Sistema de clasificación de productos y servicios</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                </div>

                <p className="text-blue-100 mb-6">
                  La Clasificación Niza agrupa los productos y servicios en 45 clases internacionales. Es el sistema estándar para clasificar marcas en registros de propiedad intelectual a nivel mundial.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>45 clases:</strong> Productos (1-34) y Servicios (35-45)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>Búsqueda granular:</strong> Encuentra marcas por industria específica</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>Estándar internacional:</strong> Usado por EUIPO, USPTO, OMPI</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>Actualizaciones regulares:</strong> Refleja nuevas clases y servicios</span>
                  </div>
                </div>

                <Link href="/docs/clasificaciones" className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 font-semibold transition">
                  Aprende más sobre Niza
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* VIENA */}
            <div className="group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              <div className="glass p-8 rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-slate-900/50 backdrop-blur-xl hover:border-purple-400/70 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">Clasificación Viena</h3>
                    <p className="text-sm text-purple-300">Sistema de clasificación visual de diseños</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-purple-400" />
                  </div>
                </div>

                <p className="text-blue-100 mb-6">
                  La Clasificación Viena organiza diseños gráficos y logotipos en 29 categorías basadas en sus características visuales. Facilita la búsqueda visual y comparación de elementos gráficos similares.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>29 categorías:</strong> Organizadas por tipo de elemento visual</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>Búsqueda visual:</strong> Encuentra diseños por características gráficas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>Comparación de logotipos:</strong> Ideal para análisis de similitud visual</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">▸</span>
                    <span className="text-sm text-blue-100"><strong>Integrado en motor IA:</strong> Amplía precisión de comparaciones</span>
                  </div>
                </div>

                <Link href="/docs/clasificaciones" className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 font-semibold transition">
                  Aprende más sobre Viena
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Uso en Visual Compare */}
          <div className="glass p-8 border border-amber-500/30 bg-gradient-to-br from-amber-900/10 to-slate-900/50 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4 font-montserrat flex items-center gap-3">
              <Zap className="h-6 w-6 text-amber-400" />
              Cómo se usan en Visual Compare Chile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-amber-300 font-bold mb-2">Portal de Consulta</h4>
                <p className="text-blue-100 text-sm">
                  Busca marcas registradas filtrando por clasificación Niza (industria) o Viena (características visuales). Accede a 350K+ registros organizados por estos sistemas.
                </p>
              </div>
              <div>
                <h4 className="text-amber-300 font-bold mb-2">Comparador IA</h4>
                <p className="text-blue-100 text-sm">
                  El motor combina clasificación Niza/Viena con análisis visual (SHA-256, pHash, Embeddings) para determinar similitud. Aumenta precisión y reduce falsos positivos.
                </p>
              </div>
              <div>
                <h4 className="text-amber-300 font-bold mb-2">Análisis Legal</h4>
                <p className="text-blue-100 text-sm">
                  Identifica potenciales conflictos de marca dentro de clases Niza similares. Evalúa riesgo de infracción basándose en clasificación + similitud visual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRACIÓN INAPI */}
      <section className="py-20 border-t border-blue-500/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4 font-montserrat text-center">Integración INAPI</h2>
          <p className="text-xl text-blue-200 text-center mb-16 max-w-3xl mx-auto">
            Conexión con el Instituto Nacional de Propiedad Industrial de Chile para acceso a datos de marcas registradas
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* DATOS */}
            <div className="group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              <div className="glass p-8 rounded-2xl border border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl hover:border-blue-400/70 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <Database className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-montserrat">Base de Datos</h3>
                </div>
                <p className="text-blue-100 mb-4">
                  Acceso a más de 350.000 marcas registradas en Chile desde INAPI. Datos actualizados regularmente con nuevos registros y cambios de estado.
                </p>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>✓ 350K+ marcas registradas</li>
                  <li>✓ Actualizaciones regulares</li>
                  <li>✓ Datos verificados oficialmente</li>
                  <li>✓ Histórico de cambios</li>
                </ul>
              </div>
            </div>

            {/* INTEGRACIÓN */}
            <div className="group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              <div className="glass p-8 rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-slate-900/50 backdrop-blur-xl hover:border-purple-400/70 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-montserrat">API Integration</h3>
                </div>
                <p className="text-blue-100 mb-4">
                  Conexión segura y escalable con los servidores de INAPI. Sincronización automática de datos para mantener la base de datos actualizada.
                </p>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>✓ Conexión API REST segura</li>
                  <li>✓ Sincronización automática</li>
                  <li>✓ Manejo de errores robusto</li>
                  <li>✓ Rate limiting y throttling</li>
                </ul>
              </div>
            </div>

            {/* CONFIABILIDAD */}
            <div className="group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              <div className="glass p-8 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-slate-900/50 backdrop-blur-xl hover:border-amber-400/70 transition-all">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-montserrat">Confiabilidad</h3>
                </div>
                <p className="text-blue-100 mb-4">
                  Datos verificados directamente de la fuente oficial. Cumplimiento normativo total con requisitos de INAPI para aplicaciones autorizadas.
                </p>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>✓ Datos de fuente oficial</li>
                  <li>✓ Cumplimiento legal total</li>
                  <li>✓ Auditoría de acceso</li>
                  <li>✓ Encriptación en tránsito</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FLUJO DE INTEGRACIÓN */}
          <div className="glass p-8 border border-blue-500/30 rounded-2xl bg-gradient-to-br from-blue-900/10 to-slate-900/50">
            <h3 className="text-2xl font-bold text-white mb-8 font-montserrat">Cómo Funciona</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-300">1</span>
                  </div>
                </div>
                <h4 className="text-blue-300 font-semibold mb-2">Solicitud</h4>
                <p className="text-sm text-blue-100">Usuario busca o ingresa marca en Visual Compare</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-purple-300">2</span>
                  </div>
                </div>
                <h4 className="text-purple-300 font-semibold mb-2">Consulta INAPI</h4>
                <p className="text-sm text-blue-100">API conecta con base de INAPI en tiempo real</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-300">3</span>
                  </div>
                </div>
                <h4 className="text-amber-300 font-semibold mb-2">Análisis</h4>
                <p className="text-sm text-blue-100">Motor IA analiza similitud con registros INAPI</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-300">4</span>
                  </div>
                </div>
                <h4 className="text-blue-300 font-semibold mb-2">Reporte</h4>
                <p className="text-sm text-blue-100">Usuario recibe análisis detallado y verificado</p>
              </div>
            </div>
          </div>
        </div>
      </section>


  <section id="como" className="py-32 relative z-10 border-t border-blue-500/20">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-white mb-3">Integración en 3 pasos</h2>
    <p className="text-blue-200 mb-12">Haz clic en cada paso para ver detalles técnicos, parámetros y ejemplos</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <IntegrationStepCard
        step={1}
        title="Cargar imágenes"
        description="Sube hasta 2 imágenes (JPEG, PNG, WebP, TIFF) max 50MB cada una."
        expandedContent={{
          technicalDetails: [
            "Endpoint: POST /api/v1/images",
            "Content-Type: multipart/form-data",
            "Formatos soportados: JPEG, PNG, WebP, TIFF",
            "Tamaño máximo: 50MB por imagen",
            "Respuesta: image_id único para cada imagen",
          ],
          parameters: [
            {
              name: "file",
              type: "binary",
              description: "Archivo de imagen a subir",
            },
            {
              name: "filename",
              type: "string",
              description: "Nombre del archivo (opcional)",
            },
          ],
          response: `{
  "image_id": "img_abc123def456",
  "filename": "screenshot.png",
  "size": 2048576,
  "uploaded_at": "2024-05-20T14:32:00Z"
}`,
          examples: [
            {
              label: "cURL",
              code: `curl -X POST https://api.visualcompare.cl/v1/images \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@screenshot.png"`,
            },
            {
              label: "JavaScript",
              code: `const formData = new FormData();
formData.append('file', imageFile);
const response = await fetch('https://api.visualcompare.cl/v1/images', {
  method: 'POST',
  headers: { 'Authorization': \`Bearer \${apiKey}\` },
  body: formData
});`,
            },
          ],
        }}
      />

      <IntegrationStepCard
        step={2}
        title="Comparar"
        description="El motor analiza ambas con los 3 métodos en paralelo. Respuesta en <100ms."
        expandedContent={{
          technicalDetails: [
            "Endpoint: POST /api/v1/compare",
            "Procesa en paralelo: SHA-256, pHash, Embeddings",
            "SLA de respuesta: <100ms (p95)",
            "Requiere ambos image_ids válidos",
            "Retorna score ponderado 0-100%",
          ],
          parameters: [
            {
              name: "image_a_id",
              type: "string",
              description: "ID de la primera imagen (requerido)",
            },
            {
              name: "image_b_id",
              type: "string",
              description: "ID de la segunda imagen (requerido)",
            },
            {
              name: "detailed",
              type: "boolean",
              description: "Incluir scores por método (opcional)",
            },
          ],
          response: `{
  "comparison_id": "cmp_xyz789",
  "similarity_score": 67.5,
  "classification": "visually_similar",
  "methods": {
    "sha256": 0,
    "phash": 68,
    "embeddings": 65
  },
  "processing_time_ms": 45
}`,
          examples: [
            {
              label: "cURL",
              code: `curl -X POST https://api.visualcompare.cl/v1/compare \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_a_id": "img_abc123",
    "image_b_id": "img_xyz789",
    "detailed": true
  }'`,
            },
            {
              label: "Python",
              code: `import requests

response = requests.post(
  'https://api.visualcompare.cl/v1/compare',
  headers={'Authorization': f'Bearer {api_key}'},
  json={
    'image_a_id': 'img_abc123',
    'image_b_id': 'img_xyz789'
  }
)
result = response.json()`,
            },
          ],
        }}
      />

      <IntegrationStepCard
        step={3}
        title="Obtener resultado"
        description="Score 0-100% + clasificación + recomendación automática."
        expandedContent={{
          technicalDetails: [
            "Score de similitud: 0-100% con 1 decimal de precisión",
            "5 clasificaciones: exact_match, near_duplicate, visually_similar, partially_similar, different",
            "Recomendación automática: approve/review/reject",
            "Detalles por método: SHA-256, pHash (con distancia Hamming), Embeddings",
            "Metadatos: timestamps, processing time, versión del modelo",
          ],
          parameters: [
            {
              name: "similarity_score",
              type: "number",
              description: "Porcentaje de similitud 0-100",
            },
            {
              name: "classification",
              type: "string",
              description: "Categoría: exact_match | near_duplicate | visually_similar | partially_similar | different",
            },
            {
              name: "recommendation",
              type: "string",
              description: "Acción sugerida: approve | review | reject",
            },
          ],
          response: `{
  "similarity_score": 67.5,
  "classification": "visually_similar",
  "recommendation": "review",
  "confidence": 0.94,
  "methods": {
    "sha256": { "match": false },
    "phash": { "distance": 12, "similar": true },
    "embeddings": { "similarity": 0.65 }
  },
  "created_at": "2024-05-20T14:32:15Z"
}`,
          examples: [
            {
              label: "Interpretar resultado",
              code: `if score >= 85 && classification == "near_duplicate":
  # Rechazar (producto falsificado o duplicado)
  action = "reject"
elif score >= 60 && score < 85:
  # Revisar manualmente (revisor humano valida)
  action = "review_manual"
else:
  # Aprobar (diferente o no similar)
  action = "approve"`,
            },
          ],
        }}
      />
    </div>
  </div>
  </section>

  <div className="glass p-8 text-center mb-24">
    <p className="text-blue-100 mb-6">Documentación completa con ejemplos en Python, cURL y JavaScript</p>
    <Link href="/docs">
      <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">Ver API Documentation</Button>
    </Link>
  </div>

  {/* API Features */}
      <section className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12">Construido para scale</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-8">
              <Shield className="h-8 w-8 text-blue-300 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">Enterprise Security</h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>✓ Encriptación en tránsito (TLS 1.3)</li>
                <li>✓ Almacenamiento encriptado</li>
                <li>✓ Autenticación Bearer token</li>
                <li>✓ Rate limiting por API key</li>
              </ul>
            </div>

            <div className="glass p-8">
              <Code2 className="h-8 w-8 text-blue-300 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">API-First Design</h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>✓ Endpoints REST cleanos</li>
                <li>✓ Respuestas JSON estándar</li>
                <li>✓ Batch processing disponible</li>
                <li>✓ Webhooks para eventos</li>
              </ul>
            </div>

            <div className="glass p-8">
              <Database className="h-8 w-8 text-blue-300 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">Reliability</h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>✓ 99.95% SLA</li>
                <li>✓ Auto-scaling infraestructura</li>
                <li>✓ Backup redundante</li>
                <li>✓ Soporte técnico 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Listo para comparar</h2>
            <p className="text-lg text-blue-100 mb-8">Obtén tu clave API y comienza hoy. Soporte técnico disponible para integración.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">Obtener acceso</Button>
              </Link>
              <a href="mailto:ventas@visualcompare.cl">
                <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-white/10">Hablar con ventas</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-500/20 py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div>
              <span className="font-bold text-white">Visual Compare</span>
              <p className="text-sm text-blue-200 mt-2">Motor de comparación visual para desarrolladores.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#motor" className="hover:text-white">Motor</a></li>
                <li><a href="/docs" className="hover:text-white">API Docs</a></li>
                <li><a href="#casos" className="hover:text-white">Casos de uso</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white">Términos</a></li>
                <li><a href="#" className="hover:text-white">Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="mailto:ventas@visualcompare.cl" className="hover:text-white">ventas@visualcompare.cl</a></li>
                <li><a href="mailto:soporte@visualcompare.cl" className="hover:text-white">soporte@visualcompare.cl</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-500/20 pt-8 text-center text-sm text-blue-200">
            <p>&copy; 2025 Visual Compare. Hecho en Chile.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
