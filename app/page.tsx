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
      <section className="max-w-6xl mx-auto px-6 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge pill - HIDDEN */}
            {/* <div className="inline-block mb-6">
              <div className="glass-sm px-4 py-2">
                <p className="text-sm font-medium text-blue-300">N3uralia style ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Deteccion visual ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ CLP $5M Presupuesto</p>
              </div>
            </div> */}
            
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
              Protege tus marcas.<br/>Nosotros las analizamos
            </h1>
            
            <p className="text-lg text-blue-100 mb-4 max-w-2xl leading-relaxed">
              Plataforma neural para comparacion visual de marcas y consulta operativa de registros. Motor hibrido de 3 metodos: SHA-256 exacto, pHash perceptual y embeddings visuales.
            </p>
            
            <p className="text-sm text-blue-200 mb-8 max-w-2xl leading-relaxed">
              MVP operativo: comparacion en &lt;<span className="text-blue-300 font-semibold">100ms</span>, 350K+ registros consultables y foco en trazabilidad. Construido en Next.js 16 + React 19 + Supabase.
            </p>

            <div className="flex gap-4 mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">Entrar al panel</Button>
              </Link>
              <Link href="/consulta">
                <Button size="lg" variant="outline" className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20">Abrir consulta</Button>
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
                <div className="text-2xl font-bold text-blue-300 mb-1">3 mÃƒÆ’Ã‚Â©todos</div>
                <p className="text-xs text-blue-200">AnÃƒÆ’Ã‚Â¡lisis hÃƒÆ’Ã‚Â­brido</p>
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
              alt="Visual comparison for brand review"
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
          <h2 className="text-4xl font-bold text-white mb-4">Motor neural de comparacion</h2>
          <p className="text-lg text-blue-200 mb-12 max-w-2xl">Analisis simultaneo usando SHA-256, pHash perceptual y embeddings visuales para maxima precision. Haz clic en cada metodo para ver el criterio operativo.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MethodFlipCard
              icon={Lock}
              title="SHA-256 Exacto"
              shortDescription="DetecciÃƒÆ’Ã‚Â³n bit-perfecta de duplicados exactos. Zero falsos positivos."
              metric="MÃƒÆ’Ã‚Â©trica: Coincidencia al 100% o nada"
              metricColor="text-blue-400"
              backgroundColor="bg-blue-500/50"
              expandedContent={{
                title: "Hash CriptogrÃƒÆ’Ã‚Â¡fico SHA-256",
                details: [
                  "Genera un hash criptogrÃƒÆ’Ã‚Â¡fico de 256 bits ÃƒÆ’Ã‚Âºnico para cada imagen. Si dos imÃƒÆ’Ã‚Â¡genes tienen el mismo hash, son idÃƒÆ’Ã‚Â©nticas bit por bit.",
                  "Velocidad de procesamiento: <10ms por imagen",
                  "Tasa de coincidencia: 100% o 0% (sin casos intermedios)",
                  "Ideal para detectar copias exactas y clones de archivos",
                ],
                useCases: [
                  "Detectar duplicados exactos en bases de datos de contenido",
                  "Verificar integridad de archivos en almacenamiento",
                  "AuditorÃƒÆ’Ã‚Â­a de derechos de autor (copias perfectas)",
                  "Control de versiones de documentos",
                ],
              }}
            />

            <MethodFlipCard
              icon={Cpu}
              title="pHash Perceptual"
              shortDescription="Hash perceptual (64-bit). Detecta similitudes visuales con distancia Hamming."
              metric="MÃƒÆ’Ã‚Â©trica: Distancia <5 = similar"
              metricColor="text-amber-400"
              backgroundColor="bg-purple-500/50"
              expandedContent={{
                title: "Hash Perceptual - AnÃƒÆ’Ã‚Â¡lisis Visual",
                details: [
                  "Reduce la imagen a una firma visual de 64 bits que captura caracterÃƒÆ’Ã‚Â­sticas esenciales ignorando cambios menores como compresiÃƒÆ’Ã‚Â³n, rotaciÃƒÆ’Ã‚Â³n o cambios de brillo.",
                  "Distancia Hamming: Cuenta diferencias de bits entre dos hashes (mÃƒÆ’Ã‚Â¡ximo 64)",
                  "Velocidad de procesamiento: 15-30ms por imagen",
                  "Detecta desde cambios sutiles hasta ediciones menores (compresiÃƒÆ’Ã‚Â³n JPEG, rotaciÃƒÆ’Ã‚Â³n ligera, recortes pequeÃƒÆ’Ã‚Â±os)",
                ],
                useCases: [
                  "Encontrar versiones alteradas de la misma imagen",
                  "Detectar compresiÃƒÆ’Ã‚Â³n o cambios de formato",
                  "Identificar rotaciones, espejos y redimensionamientos",
                  "Buscar imÃƒÆ’Ã‚Â¡genes similares en galerÃƒÆ’Ã‚Â­as grandes",
                ],
              }}
            />

            <MethodFlipCard
              icon={Gauge}
              title="Embeddings Visuales"
              shortDescription="Red neural para anÃƒÆ’Ã‚Â¡lisis de composiciÃƒÆ’Ã‚Â³n visual profunda."
              metric="MÃƒÆ’Ã‚Â©trica: Similitud coseno 0-1"
              metricColor="text-blue-300"
              backgroundColor="bg-blue-950/50"
              expandedContent={{
                title: "Redes Neuronales - AnÃƒÆ’Ã‚Â¡lisis Profundo",
                details: [
                  "Utiliza TensorFlow.js para extraer caracterÃƒÆ’Ã‚Â­sticas visuales complejas (composiciÃƒÆ’Ã‚Â³n, paleta de colores, objetos, textura) en un vector de 512 dimensiones.",
                  "Calcula la similitud coseno entre vectores (0 = completamente diferentes, 1 = idÃƒÆ’Ã‚Â©nticos)",
                  "Velocidad de procesamiento: 50-100ms por imagen (dependiendo del dispositivo)",
                  "Excelente para detectar imÃƒÆ’Ã‚Â¡genes conceptualmente similares aunque visualmente distintas",
                ],
                useCases: [
                  "Encontrar imÃƒÆ’Ã‚Â¡genes con similar composiciÃƒÆ’Ã‚Â³n o estilo",
                  "Detectar fotogramas similares en videos",
                  "BÃƒÆ’Ã‚Âºsqueda semÃƒÆ’Ã‚Â¡ntica de imÃƒÆ’Ã‚Â¡genes (mismo contenido, diferente perspectiva)",
                  "ComparaciÃƒÆ’Ã‚Â³n de diseÃƒÆ’Ã‚Â±os y layouts",
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
            <h3 className="text-lg font-bold text-white mb-5">Clasificacion automatica (5 categorias)</h3>
            <p className="text-xs text-blue-200 mb-4">Haz clic en cualquier categoria para explorar seÃƒÂ±ales y casos de uso</p>
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
                  definition: "Dos imÃƒÆ’Ã‚Â¡genes son idÃƒÆ’Ã‚Â©nticas bit por bit. El hash SHA-256 coincide perfectamente, lo que significa que no hay diferencias en absoluto.",
                  characteristics: [
                    "Coincidencia perfecta de todos los bits de la imagen",
                    "Cero falsos positivos - si dice 100%, es 100%",
                    "Detecta copias exactas incluso si tienen metadatos distintos",
                    "No es afectado por compresiÃƒÆ’Ã‚Â³n o cambios de formato",
                  ],
                  whenToUse: [
                    "Verificar duplicados exactos en bases de datos",
                    "Detectar archivos idÃƒÆ’Ã‚Â©nticos clonados",
                    "AuditorÃƒÆ’Ã‚Â­a de derechos de autor (copias perfectas)",
                    "ValidaciÃƒÆ’Ã‚Â³n de integridad de archivos",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="near_duplicate"
                tagColor="text-amber-300"
                tagBgColor="bg-amber-900/50"
                title="Muy similar"
                description="CompresiÃƒÆ’Ã‚Â³n, rotaciÃƒÆ’Ã‚Â³n o ediciones menores detectadas."
                percentageRange="85-99%"
                percentageColor="text-yellow-400"
                expandedContent={{
                  title: "Casi duplicado (85-99%)",
                  definition: "Las imÃƒÆ’Ã‚Â¡genes son casi idÃƒÆ’Ã‚Â©nticas. Hay cambios muy menores como compresiÃƒÆ’Ã‚Â³n JPEG, rotaciÃƒÆ’Ã‚Â³n ligera, o ediciones mÃƒÆ’Ã‚Â­nimas, pero la esencia visual es la misma.",
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
                    "Control de calidad de imagen en galerÃƒÆ’Ã‚Â­as",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="visually_similar"
                tagColor="text-blue-300"
                tagBgColor="bg-blue-500/50"
                title="Similaridad visual"
                description="Mismo layout, colores y tipografÃƒÆ’Ã‚Â­a pero con diferencias notables."
                percentageRange="60-84%"
                percentageColor="text-blue-400"
                expandedContent={{
                  title: "Visualmente similar (60-84%)",
                  definition: "Las imÃƒÆ’Ã‚Â¡genes comparten caracterÃƒÆ’Ã‚Â­sticas visuales similares como layout, paleta de colores o composiciÃƒÆ’Ã‚Â³n, pero tienen diferencias notables en contenido o detalles.",
                  characteristics: [
                    "Mismo estilo visual pero contenido diferente",
                    "ComposiciÃƒÆ’Ã‚Â³n y layout similar",
                    "Paleta de colores comparable",
                    "Diferencias moderadas en elementos",
                  ],
                  whenToUse: [
                    "BÃƒÆ’Ã‚Âºsqueda de imÃƒÆ’Ã‚Â¡genes con estilo similar",
                    "DetecciÃƒÆ’Ã‚Â³n de plagios de diseÃƒÆ’Ã‚Â±o",
                    "ComparaciÃƒÆ’Ã‚Â³n de interfaces de usuario",
                    "BÃƒÆ’Ã‚Âºsqueda semÃƒÆ’Ã‚Â¡ntica de contenido visual",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="partially_similar"
                tagColor="text-orange-300"
                tagBgColor="bg-orange-900/50"
                title="Parcialmente similar"
                description="Algunos elementos visuales en comÃƒÆ’Ã‚Âºn pero diferencias significativas."
                percentageRange="30-59%"
                percentageColor="text-orange-400"
                expandedContent={{
                  title: "Parcialmente similar (30-59%)",
                  definition: "Las imÃƒÆ’Ã‚Â¡genes comparten algunos elementos visuales como objetos, textura o colores, pero tienen diferencias significativas en composiciÃƒÆ’Ã‚Â³n, tamaÃƒÆ’Ã‚Â±o o contenido general.",
                  characteristics: [
                    "Algunos objetos o elementos en comÃƒÆ’Ã‚Âºn",
                    "Diferencias significativas en composiciÃƒÆ’Ã‚Â³n",
                    "Posibles cambios de contexto o escala",
                    "CaracterÃƒÆ’Ã‚Â­sticas parciales coinciden",
                  ],
                  whenToUse: [
                    "Encontrar imÃƒÆ’Ã‚Â¡genes relacionadas temÃƒÆ’Ã‚Â¡ticamente",
                    "DetecciÃƒÆ’Ã‚Â³n de objetos similares",
                    "BÃƒÆ’Ã‚Âºsqueda aproximada de conceptos",
                    "AnÃƒÆ’Ã‚Â¡lisis de contenido relacionado",
                  ],
                }}
              />

              <ClassificationFlipCard
                tag="different"
                tagColor="text-blue-200"
                tagBgColor="bg-gray-700/50"
                title="Diferente"
                description="Sin similitud significativa. ImÃƒÆ’Ã‚Â¡genes completamente distintas."
                percentageRange="0-29%"
                percentageColor="text-blue-200"
                expandedContent={{
                  title: "Completamente diferente (0-29%)",
                  definition: "Las imÃƒÆ’Ã‚Â¡genes no comparten caracterÃƒÆ’Ã‚Â­sticas visuales significativas. Son conceptualmente distintas, tienen layouts diferentes y no hay coincidencia en composiciÃƒÆ’Ã‚Â³n ni objetos.",
                  characteristics: [
                    "Sin coincidencia visual significativa",
                    "ComposiciÃƒÆ’Ã‚Â³n y contexto completamente distinto",
                    "Posiblemente diferentes tipos de contenido",
                    "No hay elementos visuales en comÃƒÆ’Ã‚Âºn",
                  ],
                  whenToUse: [
                    "Validar que imÃƒÆ’Ã‚Â¡genes son completamente distintas",
                    "Filtrar resultados no relevantes",
                    "ConfirmaciÃƒÆ’Ã‚Â³n negativa en bÃƒÆ’Ã‚Âºsquedas",
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
              <p className="text-xs text-blue-200 mb-2">Capacidad mÃƒÆ’Ã‚Â¡xima</p>
              <p className="text-2xl font-bold text-blue-300">1000+</p>
              <p className="text-xs text-blue-400">req/seg</p>
            </div>
            <div className="glass p-6">
              <p className="text-xs text-blue-200 mb-2">TamaÃƒÆ’Ã‚Â±o mÃƒÆ’Ã‚Â¡ximo imagen</p>
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
              Ejemplos en acciÃƒÆ’Ã‚Â³n
            </h2>
            <p className="text-lg text-blue-100">
              Explora diferentes tipos de comparaciones y clasificaciones
            </p>
          </div>
          
          <ComparisonCarousel />
        </div>
      </section>

      {/* EJEMPLOS NIZA Y VIENA EN ACCIÃƒÆ’Ã¢â‚¬Å“N */}
      <NizaVienExamples />

      {/* CASOS DE USO */}
  <section id="casos" className="py-24 relative z-10 border-t border-blue-500/20">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-white mb-3">Casos de uso reales</h2>
    <p className="text-blue-200 mb-12">Haz clic en cada caso para explorar implementaciÃƒÆ’Ã‚Â³n y beneficios</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
      <UseCaseFlipCard
        icon={<Scale className="w-5 h-5" />}
        title="ProtecciÃƒÆ’Ã‚Â³n de marca (Legal)"
        description="Detecta conflictos de marca antes de registro INAPI."
        expandedContent={{
          overview: "Estudios jurÃƒÆ’Ã‚Â­dicos y departamentos legales usan el API para evaluar similitud visual de marcas antes de litigio. Sistema automatizado para anÃƒÆ’Ã‚Â¡lisis de conflictividad de marcas.",
          features: [
            "ComparaciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica con base de marcas existentes",
            "Score de similitud para asesorÃƒÆ’Ã‚Â­a legal",
            "Reportes exportables para trÃƒÆ’Ã‚Â¡mites INAPI",
            "AnÃƒÆ’Ã‚Â¡lisis histÃƒÆ’Ã‚Â³rico de comparaciones",
          ],
          implementation: [
            "IntegraciÃƒÆ’Ã‚Â³n en plataforma legal (REST API)",
            "Usuarios con acceso basado en roles (abogados/asistentes)",
            "Almacenamiento seguro de reportes (RLS habilitado)",
            "AuditorÃƒÆ’Ã‚Â­a completa de cada comparaciÃƒÆ’Ã‚Â³n",
          ],
          benefits: [
            "Reduce tiempo de anÃƒÆ’Ã‚Â¡lisis preliminar en 80%",
            "Minimiza rechazos por similitud en INAPI",
            "Proporciona evidencia tÃƒÆ’Ã‚Â©cnica para litigio",
            "ROI en primeras 2-3 comparaciones",
          ],
        }}
      />

      <UseCaseFlipCard
        icon={<ShoppingCart className="w-5 h-5" />}
        title="DetecciÃƒÆ’Ã‚Â³n de falsificaciÃƒÆ’Ã‚Â³n (E-commerce)"
        description="Detecta productos falsificados comparando con catÃƒÆ’Ã‚Â¡logo original."
        expandedContent={{
          overview: "Marketplaces de e-commerce validan autenticidad de productos comparando fotografÃƒÆ’Ã‚Â­as con catÃƒÆ’Ã‚Â¡logos oficiales. PrevenciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica de venta de contrabandy.",
          features: [
            "Alertas automÃƒÆ’Ã‚Â¡ticas de productos similares sospechosos",
            "ValidaciÃƒÆ’Ã‚Â³n de autenticidad antes de venta",
            "ProtecciÃƒÆ’Ã‚Â³n del catÃƒÆ’Ã‚Â¡logo original",
            "Score de riesgo de falsificaciÃƒÆ’Ã‚Â³n",
          ],
          implementation: [
            "Webhook integrado en pipeline de carga de productos",
            "Auto-reject de productos con similitud >70%",
            "Dashboard de moderaciÃƒÆ’Ã‚Â³n para casos borderline",
            "IntegraciÃƒÆ’Ã‚Â³n con sistema de reputaciÃƒÆ’Ã‚Â³n de vendedores",
          ],
          benefits: [
            "Reduce falsificaciones detectadas en 95%",
            "Evita chargebacks y devoluciones de clientes",
            "Protege marca de sellers legÃƒÆ’Ã‚Â­timos",
            "Aumenta confianza de consumidores",
          ],
        }}
      />

      <UseCaseFlipCard
        icon={<Palette className="w-5 h-5" />}
        title="ValidaciÃƒÆ’Ã‚Â³n de diseÃƒÆ’Ã‚Â±o (Creative)"
        description="Verifica originalidad de diseÃƒÆ’Ã‚Â±os comparando con referencias e inspiraciones."
        expandedContent={{
          overview: "Agencias de diseÃƒÆ’Ã‚Â±o y creativos validan que sus trabajos sean ÃƒÆ’Ã‚Âºnicos vs. referencias externas. ProtecciÃƒÆ’Ã‚Â³n de propiedad intelectual creativa.",
          features: [
            "ComparaciÃƒÆ’Ã‚Â³n contra referencias de inspiraciÃƒÆ’Ã‚Â³n",
            "Score de diferenciaciÃƒÆ’Ã‚Â³n visual",
            "DocumentaciÃƒÆ’Ã‚Â³n de proceso creativo",
            "Reports para defensa de IP",
          ],
          implementation: [
            "IntegraciÃƒÆ’Ã‚Â³n en herramientas de diseÃƒÆ’Ã‚Â±o (plugin/API)",
            "AnÃƒÆ’Ã‚Â¡lisis automÃƒÆ’Ã‚Â¡tico durante etapa de concepto",
            "HistÃƒÆ’Ã‚Â³rico de evoluciÃƒÆ’Ã‚Â³n del diseÃƒÆ’Ã‚Â±o",
            "Alertas de similitud excesiva vs. mercado",
          ],
          benefits: [
            "Demuestra originalidad del trabajo creativo",
            "Protege contra acusaciones de plagio",
            "Facilita defensa legal de diseÃƒÆ’Ã‚Â±os",
            "Automatiza validaciÃƒÆ’Ã‚Â³n de briefs",
          ],
        }}
      />

      <UseCaseFlipCard
        icon={<Eye className="w-5 h-5" />}
        title="QA visual (IngenierÃƒÆ’Ã‚Â­a)"
        description="Equipos QA detectan regresiones visuales en interfaces automÃƒÆ’Ã‚Â¡ticamente."
        expandedContent={{
          overview: "Equipos de QA comparan screenshots de builds para detectar cambios visuales no intencionales. Regression testing visual integrado en CI/CD.",
          features: [
            "DetecciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica de cambios en UI",
            "IntegraciÃƒÆ’Ã‚Â³n en pipeline CI/CD",
            "PrevenciÃƒÆ’Ã‚Â³n de bugs visuales",
            "Reports visuales para developers",
          ],
          implementation: [
            "Screenshots de baseline vs. nueva build",
            "Auto-fail en similitud <95%",
            "IntegraciÃƒÆ’Ã‚Â³n con GitHub Actions/GitLab CI",
            "Diferencias visuales destacadas en reports",
          ],
          benefits: [
            "Detecta bugs visuales pre-producciÃƒÆ’Ã‚Â³n",
            "Reduce tiempo de testing manual en 70%",
            "Cero regresiones visuales en producciÃƒÆ’Ã‚Â³n",
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
            <span className="text-xs font-bold text-blue-300 bg-purple-500/50 px-4 py-2 rounded-lg">MOTOR IA DE COMPARACIÃƒÆ’Ã¢â‚¬Å“N</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Roadmap MVP: 2 Meses</h2>
            <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">Plan MVP con presupuesto CLP $5M. API de comparaciÃƒÆ’Ã‚Â³n visual con 3 mÃƒÆ’Ã‚Â©todos (SHA-256, pHash, Embeddings IA). Portal de Consulta en Fase 2.</p>
            <div className="flex gap-6 mt-8">
              <div className="glass px-6 py-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold">CLP $5M</p>
              </div>
              <div className="glass px-6 py-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold">8 semanas ejecuciÃƒÆ’Ã‚Â³n</p>
              </div>
              <div className="glass px-6 py-3 rounded-lg border border-blue-500/20">
                <p className="text-blue-300 font-semibold">API production-ready</p>
              </div>
            </div>
          </div>

          <RoadmapRedesigned />
        </div>
      </section>

      {/* PANEL OPERATIVO - FRONTEND GLASSMORPHISM */}
      <section id="panel" className="py-24 relative z-10 border-t border-blue-500/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <div className="inline-block mb-6">
              <span className="text-xs font-bold text-blue-300 bg-blue-500/50 px-4 py-2 rounded-lg">PANEL OPERATIVO</span>
            </div>
            <h2 className="text-5xl font-bold text-white mb-4">Panel interactivo</h2>
            <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">Accede a los modulos activos del MVP. Motor de comparacion y visualizador de marcas con interfaz glassmorphism.</p>
          </div>

          {/* Panel Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Comparador Card */}
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

                <p className="text-blue-100 mb-6 flex-1">Compara imÃƒÆ’Ã‚Â¡genes con nuestro motor hÃƒÆ’Ã‚Â­brido de 3 mÃƒÆ’Ã‚Â©todos: SHA-256 (exactitud), pHash (perceptual) y Embeddings (IA visual).</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">Sube 2 imÃƒÆ’Ã‚Â¡genes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">AnÃƒÆ’Ã‚Â¡lisis &lt;100ms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">5 categorÃƒÆ’Ã‚Â­as automÃƒÆ’Ã‚Â¡ticas</span>
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

            {/* Consulta Card */}
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

                <p className="text-blue-100 mb-6 flex-1">Busca en la base completa de marcas chilenas. Filtra por nombre, clasificaciÃƒÆ’Ã‚Â³n Niza, Viena, solicitante y mÃƒÆ’Ã‚Â¡s.</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">7 mÃƒÆ’Ã‚Â³dulos funcionales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-blue-100">BÃƒÆ’Ã‚Âºsqueda fuzzy</span>
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
              <p className="text-blue-200 mb-4">Ãƒâ€šÃ‚Â¿Necesitas acceso administrativo?</p>
              <Button asChild variant="outline" className="border-blue-700/50 hover:bg-blue-500/20">
              <Link href="/panel" className="flex items-center gap-2">
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
          <h2 className="text-4xl font-bold text-white mb-4 font-montserrat text-center">ClasificaciÃƒÆ’Ã‚Â³n de Marcas</h2>
          <p className="text-xl text-blue-200 text-center mb-16 max-w-3xl mx-auto">
            Visual Compare Chile utiliza los sistemas internacionales de clasificaciÃƒÆ’Ã‚Â³n Niza y Viena para organizar y buscar marcas registradas con precisiÃƒÆ’Ã‚Â³n
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* NIZA */}
            <div className="group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-transparent to-transparent rounded-2xl blur-xl -z-10 group-hover:blur-2xl transition-all"></div>
              <div className="glass p-8 rounded-2xl border border-blue-500/50 bg-gradient-to-br from-blue-900/20 to-slate-900/50 backdrop-blur-xl hover:border-blue-400/70 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">ClasificaciÃƒÆ’Ã‚Â³n Niza</h3>
                    <p className="text-sm text-blue-300">Sistema de clasificaciÃƒÆ’Ã‚Â³n de productos y servicios</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                </div>

                <p className="text-blue-100 mb-6">
                  La ClasificaciÃƒÆ’Ã‚Â³n Niza agrupa los productos y servicios en 45 clases internacionales. Es el sistema estÃƒÆ’Ã‚Â¡ndar para clasificar marcas en registros de propiedad intelectual a nivel mundial.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>45 clases:</strong> Productos (1-34) y Servicios (35-45)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>BÃƒÆ’Ã‚Âºsqueda granular:</strong> Encuentra marcas por industria especÃƒÆ’Ã‚Â­fica</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>EstÃƒÆ’Ã‚Â¡ndar internacional:</strong> Usado por EUIPO, USPTO, OMPI</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>Actualizaciones regulares:</strong> Refleja nuevas clases y servicios</span>
                  </div>
                </div>

                <Link href="/docs/clasificaciones" className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 font-semibold transition">
                  Aprende mÃƒÆ’Ã‚Â¡s sobre Niza
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
                    <h3 className="text-2xl font-bold text-white mb-2 font-montserrat">ClasificaciÃƒÆ’Ã‚Â³n Viena</h3>
                    <p className="text-sm text-purple-300">Sistema de clasificaciÃƒÆ’Ã‚Â³n visual de diseÃƒÆ’Ã‚Â±os</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-purple-400" />
                  </div>
                </div>

                <p className="text-blue-100 mb-6">
                  La ClasificaciÃƒÆ’Ã‚Â³n Viena organiza diseÃƒÆ’Ã‚Â±os grÃƒÆ’Ã‚Â¡ficos y logotipos en 29 categorÃƒÆ’Ã‚Â­as basadas en sus caracterÃƒÆ’Ã‚Â­sticas visuales. Facilita la bÃƒÆ’Ã‚Âºsqueda visual y comparaciÃƒÆ’Ã‚Â³n de elementos grÃƒÆ’Ã‚Â¡ficos similares.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>29 categorÃƒÆ’Ã‚Â­as:</strong> Organizadas por tipo de elemento visual</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>BÃƒÆ’Ã‚Âºsqueda visual:</strong> Encuentra diseÃƒÆ’Ã‚Â±os por caracterÃƒÆ’Ã‚Â­sticas grÃƒÆ’Ã‚Â¡ficas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>ComparaciÃƒÆ’Ã‚Â³n de logotipos:</strong> Ideal para anÃƒÆ’Ã‚Â¡lisis de similitud visual</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¸</span>
                    <span className="text-sm text-blue-100"><strong>Integrado en motor IA:</strong> AmplÃƒÆ’Ã‚Â­a precisiÃƒÆ’Ã‚Â³n de comparaciones</span>
                  </div>
                </div>

                <Link href="/docs/clasificaciones" className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 font-semibold transition">
                  Aprende mÃƒÆ’Ã‚Â¡s sobre Viena
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Uso en Visual Compare Chile */}
          <div className="glass p-8 border border-amber-500/30 bg-gradient-to-br from-amber-900/10 to-slate-900/50 rounded-2xl">
            <h3 className="text-2xl font-bold text-white mb-4 font-montserrat flex items-center gap-3">
              <Zap className="h-6 w-6 text-amber-400" />
              Como se usan en Visual Compare Chile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-amber-300 font-bold mb-2">Portal de Consulta</h4>
                <p className="text-blue-100 text-sm">
                  Busca marcas registradas filtrando por clasificaciÃƒÆ’Ã‚Â³n Niza (industria) o Viena (caracterÃƒÆ’Ã‚Â­sticas visuales). Accede a 350K+ registros organizados por estos sistemas.
                </p>
              </div>
              <div>
                <h4 className="text-amber-300 font-bold mb-2">Comparador IA</h4>
                <p className="text-blue-100 text-sm">
                  El motor combina clasificaciÃƒÆ’Ã‚Â³n Niza/Viena con anÃƒÆ’Ã‚Â¡lisis visual (SHA-256, pHash, Embeddings) para determinar similitud. Aumenta precisiÃƒÆ’Ã‚Â³n y reduce falsos positivos.
                </p>
              </div>
              <div>
                <h4 className="text-amber-300 font-bold mb-2">AnÃƒÆ’Ã‚Â¡lisis Legal</h4>
                <p className="text-blue-100 text-sm">
                  Identifica potenciales conflictos de marca dentro de clases Niza similares. EvalÃƒÆ’Ã‚Âºa riesgo de infracciÃƒÆ’Ã‚Â³n basÃƒÆ’Ã‚Â¡ndose en clasificaciÃƒÆ’Ã‚Â³n + similitud visual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTEGRACIÃƒÆ’Ã¢â‚¬Å“N INAPI */}
      <section className="py-20 border-t border-blue-500/10 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-4 font-montserrat text-center">IntegraciÃƒÆ’Ã‚Â³n INAPI</h2>
          <p className="text-xl text-blue-200 text-center mb-16 max-w-3xl mx-auto">
            ConexiÃƒÆ’Ã‚Â³n con el Instituto Nacional de Propiedad Industrial de Chile para acceso a datos de marcas registradas
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
                  Acceso a mÃƒÆ’Ã‚Â¡s de 350.000 marcas registradas en Chile desde INAPI. Datos actualizados regularmente con nuevos registros y cambios de estado.
                </p>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ 350K+ marcas registradas</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Actualizaciones regulares</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Datos verificados oficialmente</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ HistÃƒÆ’Ã‚Â³rico de cambios</li>
                </ul>
              </div>
            </div>

            {/* INTEGRACIÃƒÆ’Ã¢â‚¬Å“N */}
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
                  ConexiÃƒÆ’Ã‚Â³n segura y escalable con los servidores de INAPI. SincronizaciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica de datos para mantener la base de datos actualizada.
                </p>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ ConexiÃƒÆ’Ã‚Â³n API REST segura</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ SincronizaciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Manejo de errores robusto</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Rate limiting y throttling</li>
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
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Datos de fuente oficial</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Cumplimiento legal total</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ AuditorÃƒÆ’Ã‚Â­a de acceso</li>
                  <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ EncriptaciÃƒÆ’Ã‚Â³n en trÃƒÆ’Ã‚Â¡nsito</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FLUJO DE INTEGRACIÃƒÆ’Ã¢â‚¬Å“N */}
          <div className="glass p-8 border border-blue-500/30 rounded-2xl bg-gradient-to-br from-blue-900/10 to-slate-900/50">
            <h3 className="text-2xl font-bold text-white mb-8 font-montserrat">CÃƒÆ’Ã‚Â³mo Funciona</h3>
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
                <h4 className="text-amber-300 font-semibold mb-2">AnÃƒÆ’Ã‚Â¡lisis</h4>
                <p className="text-sm text-blue-100">Motor IA analiza similitud con registros INAPI</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-14 w-14 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-300">4</span>
                  </div>
                </div>
                <h4 className="text-blue-300 font-semibold mb-2">Reporte</h4>
                <p className="text-sm text-blue-100">Usuario recibe anÃƒÆ’Ã‚Â¡lisis detallado y verificado</p>
              </div>
            </div>
          </div>
        </div>
      </section>


  <section id="como" className="py-32 relative z-10 border-t border-blue-500/20">
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-4xl font-bold text-white mb-3">IntegraciÃƒÆ’Ã‚Â³n en 3 pasos</h2>
    <p className="text-blue-200 mb-12">Haz clic en cada paso para ver detalles tÃƒÆ’Ã‚Â©cnicos, parÃƒÆ’Ã‚Â¡metros y ejemplos</p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <IntegrationStepCard
        step={1}
        title="Cargar imÃƒÆ’Ã‚Â¡genes"
        description="Sube hasta 2 imÃƒÆ’Ã‚Â¡genes (JPEG, PNG, WebP, TIFF) max 50MB cada una."
        expandedContent={{
          technicalDetails: [
            "Endpoint: POST /api/v1/images",
            "Content-Type: multipart/form-data",
            "Formatos soportados: JPEG, PNG, WebP, TIFF",
            "TamaÃƒÆ’Ã‚Â±o mÃƒÆ’Ã‚Â¡ximo: 50MB por imagen",
            "Respuesta: image_id ÃƒÆ’Ã‚Âºnico para cada imagen",
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
        description="El motor analiza ambas con los 3 mÃƒÆ’Ã‚Â©todos en paralelo. Respuesta en <100ms."
        expandedContent={{
          technicalDetails: [
            "Endpoint: POST /api/v1/compare",
            "Procesa en paralelo: SHA-256, pHash, Embeddings",
            "SLA de respuesta: <100ms (p95)",
            "Requiere ambos image_ids vÃƒÆ’Ã‚Â¡lidos",
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
              description: "Incluir scores por mÃƒÆ’Ã‚Â©todo (opcional)",
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
        description="Score 0-100% + clasificaciÃƒÆ’Ã‚Â³n + recomendaciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica."
        expandedContent={{
          technicalDetails: [
            "Score de similitud: 0-100% con 1 decimal de precisiÃƒÆ’Ã‚Â³n",
            "5 clasificaciones: exact_match, near_duplicate, visually_similar, partially_similar, different",
            "RecomendaciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica: approve/review/reject",
            "Detalles por mÃƒÆ’Ã‚Â©todo: SHA-256, pHash (con distancia Hamming), Embeddings",
            "Metadatos: timestamps, processing time, versiÃƒÆ’Ã‚Â³n del modelo",
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
              description: "CategorÃƒÆ’Ã‚Â­a: exact_match | near_duplicate | visually_similar | partially_similar | different",
            },
            {
              name: "recommendation",
              type: "string",
              description: "AcciÃƒÆ’Ã‚Â³n sugerida: approve | review | reject",
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
    <p className="text-blue-100 mb-6">DocumentaciÃƒÆ’Ã‚Â³n completa con ejemplos en Python, cURL y JavaScript</p>
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
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ EncriptaciÃƒÆ’Ã‚Â³n en trÃƒÆ’Ã‚Â¡nsito (TLS 1.3)</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Almacenamiento encriptado</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ AutenticaciÃƒÆ’Ã‚Â³n Bearer token</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Rate limiting por API key</li>
              </ul>
            </div>

            <div className="glass p-8">
              <Code2 className="h-8 w-8 text-blue-300 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">API-First Design</h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Endpoints REST cleanos</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Respuestas JSON estÃƒÆ’Ã‚Â¡ndar</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Batch processing disponible</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Webhooks para eventos</li>
              </ul>
            </div>

            <div className="glass p-8">
              <Database className="h-8 w-8 text-blue-300 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-3">Reliability</h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ 99.95% SLA</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Auto-scaling infraestructura</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Backup redundante</li>
                <li>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ Soporte tÃƒÆ’Ã‚Â©cnico 24/7</li>
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
            <p className="text-lg text-blue-100 mb-8">ObtÃƒÆ’Ã‚Â©n tu clave API y comienza hoy. Soporte tÃƒÆ’Ã‚Â©cnico disponible para integraciÃƒÆ’Ã‚Â³n.</p>
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
              <p className="text-sm text-blue-200 mt-2">Motor de comparaciÃƒÆ’Ã‚Â³n visual para desarrolladores.</p>
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
                <li><a href="#" className="hover:text-white">TÃƒÆ’Ã‚Â©rminos</a></li>
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
