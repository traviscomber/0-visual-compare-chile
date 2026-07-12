'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Scale, ShoppingCart, Palette, Zap, CheckCircle2, Shield, Eye, Code2, Gauge, Database, Lock, Cpu, ArrowRight, Search, Package } from 'lucide-react'
import { MethodFlipCard } from '@/components/method-flip-card'
import { ComparisonCarousel } from '@/components/comparison-carousel'
import { ClassificationFlipCard } from '@/components/classification-flip-card'
import { UseCaseFlipCard } from '@/components/usecase-flip-card'


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
            <span className="text-xl font-bold text-white">Visual Compare Chile</span>
          </Link>

          <div className="flex items-center gap-8">
            <a href="#motor" className="text-sm text-blue-200 hover:text-white transition">Motor</a>
            <a href="#casos" className="text-sm text-blue-200 hover:text-white transition">Casos de uso</a>
            <a href="#como" className="text-sm text-blue-200 hover:text-white transition">Como funciona</a>
            <Link href="/consulta" className="text-sm text-blue-200 hover:text-white transition">Consulta de Marcas</Link>
            <a href="/docs" className="text-sm text-blue-200 hover:text-white transition">API</a>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">Entrar al panel</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 mb-6 glass-sm px-4 py-2 rounded-full border border-blue-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-medium text-blue-200">MVP operativo &middot; Chile &middot; 350K+ marcas registradas</p>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-[1.05] mb-6 text-balance">
              Protege tus marcas.<br/>
              <span className="text-blue-400">Nosotros las analizamos.</span>
            </h1>
            
            <p className="text-lg text-blue-100 mb-8 max-w-xl leading-relaxed">
              Plataforma de comparaci&oacute;n visual de marcas para abogados, examinadores y titulares. Motor h&iacute;brido con 3 m&eacute;todos: SHA-256 exacto, pHash perceptual y embeddings visuales.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 shadow-lg shadow-blue-500/25">
                  Comenzar gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/consulta">
                <Button size="lg" variant="outline" className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400">
                  Consultar marcas
                </Button>
              </Link>
            </div>

            {/* Key metrics — visible */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass p-4 rounded-xl border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-300 mb-1">&lt;100ms</div>
                <p className="text-xs text-blue-400">Latencia P95</p>
              </div>
              <div className="glass p-4 rounded-xl border border-blue-500/20">
                <div className="text-2xl font-bold text-emerald-400 mb-1">350K+</div>
                <p className="text-xs text-blue-400">Marcas registradas</p>
              </div>
              <div className="glass p-4 rounded-xl border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-300 mb-1">3</div>
                <p className="text-xs text-blue-400">M&eacute;todos de an&aacute;lisis</p>
              </div>
              <div className="glass p-4 rounded-xl border border-blue-500/20">
                <div className="text-2xl font-bold text-amber-400 mb-1">5</div>
                <p className="text-xs text-blue-400">Categor&iacute;as de similitud</p>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="glass p-3 rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/10">
            <Image
              src="/images/brand-comparison-hero.png"
              alt="Panel de comparaci&oacute;n visual de marcas mostrando 94% de similitud"
              width={600}
              height={450}
              className="w-full rounded-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* MOTOR - Technical Specs */}
      <section id="motor" className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 mb-4 glass-sm px-3 py-1.5 rounded-full border border-blue-500/30">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">Tecnolog&iacute;a</p>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">C&oacute;mo detectamos la similitud</h2>
          <p className="text-lg text-blue-200 mb-12 max-w-2xl">An&aacute;lisis simult&aacute;neo con 3 m&eacute;todos complementarios para m&aacute;xima precisi&oacute;n. Desde coincidencia exacta hasta similitud conceptual profunda.</p>

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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-white">Clasificaci&oacute;n autom&aacute;tica</h3>
              <span className="text-xs text-blue-400 glass-sm px-2 py-1 rounded-full border border-blue-500/20">5 categor&iacute;as</span>
            </div>
            <p className="text-sm text-blue-300 mb-5">Haz clic en cualquier categor&iacute;a para explorar se&ntilde;ales y casos de uso concretos</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { value: "47ms", label: "Latencia promedio", sub: "P95 en producci\u00f3n", color: "text-blue-300" },
              { value: "1.000+", label: "Req / segundo", sub: "Capacidad m\u00e1xima", color: "text-emerald-400" },
              { value: "50MB", label: "Tama\u00f1o m\u00e1ximo", sub: "Por imagen", color: "text-blue-300" },
              { value: "4", label: "Formatos", sub: "JPEG, PNG, WebP, TIFF", color: "text-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="glass p-6 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all">
                <p className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</p>
                <p className="text-sm font-medium text-white mb-0.5">{stat.label}</p>
                <p className="text-xs text-blue-400">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARRUSEL DE EJEMPLOS */}
      <section id="ejemplos" className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 glass-sm px-3 py-1.5 rounded-full border border-blue-500/30">
              <Eye className="h-3.5 w-3.5 text-blue-400" />
              <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">Motor en acci&oacute;n</p>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Comparaciones reales
            </h2>
            <p className="text-lg text-blue-200 max-w-xl mx-auto">
              As&iacute; clasifica nuestro motor cada par de im&aacute;genes. Explora los 5 niveles de similitud.
            </p>
          </div>
          
          <ComparisonCarousel />
        </div>
      </section>

      {/* EJEMPLOS NIZA Y VIENA EN ACCION */}
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




      {/* CLASIFICACIONES NIZA Y VIENA */}
      <section id="clasificaciones" className="py-24 border-t border-blue-500/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 glass-sm px-3 py-1.5 rounded-full border border-blue-500/30">
              <Package className="h-3.5 w-3.5 text-blue-400" />
              <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">Est&aacute;ndares internacionales</p>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 text-balance">
              &iquest;C&oacute;mo se organiza una marca registrada?
            </h2>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto leading-relaxed">
              Toda marca registrada en Chile tiene <strong className="text-white">dos clasificaciones</strong>: una por lo que <em>vende</em> y otra por c&oacute;mo <em>se ve</em>. Nuestro motor usa ambas para encontrar conflictos que otros sistemas pasan por alto.
            </p>
          </div>

          {/* Two columns: Niza + Viena */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* NIZA */}
            <div className="glass rounded-2xl border border-blue-500/30 overflow-hidden">
              {/* Top color band */}
              <div className="bg-blue-500/20 border-b border-blue-500/30 px-6 py-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/30 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold">Clasificaci&oacute;n Niza</p>
                  <p className="text-white font-bold text-lg leading-tight">&iquest;Qu&eacute; vende la marca?</p>
                </div>
                <div className="ml-auto glass-sm px-2.5 py-1 rounded-full border border-blue-400/30">
                  <p className="text-xs font-bold text-blue-300">45 clases</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-blue-100 leading-relaxed">
                  Agrupa los <strong className="text-white">productos y servicios</strong> que la marca cubre. Dos marcas visualmente id&eacute;nticas pueden coexistir legalmente si est&aacute;n en clases distintas.
                </p>

                {/* Example pills */}
                <div>
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold mb-3">Ejemplos de clases</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { clase: "Clase 25", desc: "Ropa y calzado" },
                      { clase: "Clase 32", desc: "Bebidas y jugos" },
                      { clase: "Clase 42", desc: "Software y tecnolog&iacute;a" },
                      { clase: "Clase 35", desc: "Publicidad y marketing" },
                    ].map((item) => (
                      <div key={item.clase} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                        <span className="text-xs font-bold text-blue-300 whitespace-nowrap">{item.clase}</span>
                        <span className="text-xs text-blue-200" dangerouslySetInnerHTML={{ __html: item.desc }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key insight */}
                <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
                  <div className="h-5 w-5 rounded-full bg-blue-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-300 text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-blue-100">
                    <strong className="text-white">Conflicto t&iacute;pico:</strong> dos marcas similares en la misma clase Niza es el principal motivo de oposici&oacute;n en el INAPI.
                  </p>
                </div>
              </div>
            </div>

            {/* VIENA */}
            <div className="glass rounded-2xl border border-violet-500/30 overflow-hidden">
              {/* Top color band */}
              <div className="bg-violet-500/20 border-b border-violet-500/30 px-6 py-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-500/30 border border-violet-500/50 flex items-center justify-center flex-shrink-0">
                  <Palette className="h-5 w-5 text-violet-300" />
                </div>
                <div>
                  <p className="text-xs text-violet-400 uppercase tracking-wider font-semibold">Clasificaci&oacute;n Viena</p>
                  <p className="text-white font-bold text-lg leading-tight">&iquest;C&oacute;mo se ve la marca?</p>
                </div>
                <div className="ml-auto glass-sm px-2.5 py-1 rounded-full border border-violet-400/30">
                  <p className="text-xs font-bold text-violet-300">29 categor&iacute;as</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-blue-100 leading-relaxed">
                  Describe los <strong className="text-white">elementos visuales</strong> del logo: formas, colores, s&iacute;mbolos, figuras. Permite detectar conflictos aunque las marcas tengan nombres completamente distintos.
                </p>

                {/* Visual examples */}
                <div>
                  <p className="text-xs text-violet-400 uppercase tracking-wider font-semibold mb-3">Tipos de elementos que clasifica</p>
                  <div className="space-y-2">
                    {[
                      { icon: "◆", label: "Formas geom&eacute;tricas", pct: 22 },
                      { icon: "Aa", label: "Texto y letras estilizadas", pct: 31 },
                      { icon: "★", label: "S&iacute;mbolos y decoraci&oacute;n", pct: 14 },
                      { icon: "●", label: "Colores y combinaciones", pct: 9 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-violet-300 w-5 text-center text-sm flex-shrink-0">{item.icon}</span>
                        <span className="text-sm text-blue-100 flex-1" dangerouslySetInnerHTML={{ __html: item.label }} />
                        <div className="w-20 h-1.5 rounded-full bg-violet-500/20 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-400" style={{ width: `${item.pct}%` }} />
                        </div>
                        <span className="text-xs text-violet-300 w-7 text-right">{item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key insight */}
                <div className="flex items-start gap-3 bg-violet-500/10 border border-violet-400/20 rounded-xl p-4">
                  <div className="h-5 w-5 rounded-full bg-violet-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-violet-300 text-xs font-bold">!</span>
                  </div>
                  <p className="text-sm text-blue-100">
                    <strong className="text-white">Ejemplo real:</strong> &ldquo;HEXATECH&rdquo; y &ldquo;HEXA PRO&rdquo; son nombres distintos, pero si ambos usan un hex&aacute;gono azul, Viena lo detecta como conflicto visual.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How we use both — 3-step flow */}
          <div className="glass rounded-2xl border border-amber-500/20 p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">C&oacute;mo lo usamos</p>
                <h3 className="text-white font-bold text-xl">Niza + Viena + IA = resultado preciso</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "Buscas una marca",
                  body: "Ingresas el nombre o subes el logo que quieres proteger o validar.",
                  color: "text-blue-300",
                  border: "border-blue-500/20",
                },
                {
                  step: "02",
                  title: "Filtramos por Niza y Viena",
                  body: "El sistema consulta registros de la misma clase de productos y con elementos visuales similares.",
                  color: "text-violet-300",
                  border: "border-violet-500/20",
                },
                {
                  step: "03",
                  title: "El motor da un veredicto",
                  body: "Score de similitud 0&ndash;100%, clasificaci&oacute;n en 5 niveles y recomendaci&oacute;n de riesgo legal.",
                  color: "text-amber-300",
                  border: "border-amber-500/20",
                },
              ].map((item) => (
                <div key={item.step} className={`glass-sm rounded-xl border ${item.border} p-5`}>
                  <p className={`text-3xl font-black mb-3 ${item.color}`}>{item.step}</p>
                  <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                  <p className="text-sm text-blue-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.body }} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* INTEGRACI✔N INAPI */}
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
                  <li>✔Ã¢â‚¬Å“ 350K+ marcas registradas</li>
                  <li>✔Ã¢â‚¬Å“ Actualizaciones regulares</li>
                  <li>✔Ã¢â‚¬Å“ Datos verificados oficialmente</li>
                  <li>✔Ã¢â‚¬Å“ Histórico de cambios</li>
                </ul>
              </div>
            </div>

            {/* INTEGRACION */}
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
                  <li>&#10004; Conexión API REST segura</li>
                  <li>&#10004; Sincronización automática</li>
                  <li>&#10004; Manejo de errores robusto</li>
                  <li>&#10004; Rate limiting y throttling</li>
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
                  <li>&#10004; Datos de fuente oficial</li>
                  <li>&#10004; Cumplimiento legal total</li>
                  <li>&#10004; Auditoría de acceso</li>
                  <li>&#10004; Encriptación en tránsito</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FLUJO DE INTEGRACION */}
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
                <p className="text-sm text-blue-100">Usuario busca o ingresa marca en Visual Compare Chile</p>
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

      {/* CTA Final */}
      <section className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="glass p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Empieza a proteger tus marcas hoy</h2>
            <p className="text-lg text-blue-100 mb-8">Crea tu cuenta y accede al motor de comparaci&oacute;n visual. Soporte disponible para abogados y titulares.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">Entrar al panel</Button>
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
              <span className="font-bold text-white">Visual Compare Chile</span>
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
            <p>&copy; 2025 Visual Compare Chile. Hecho en Chile con enfoque neural.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
