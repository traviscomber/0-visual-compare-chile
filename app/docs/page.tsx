import Link from "next/link"
import { ArrowRight, Check, Code2, Database, Fingerprint, ImageIcon, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const productRoutes = [
  {
    title: "Panel operativo",
    href: "/panel",
    summary: "Superficie principal para investigaciones, historial y seguimiento del trabajo.",
  },
  {
    title: "Comparar",
    href: "/compare",
    summary: "Comparación visual con señales técnicas, evidencia y clasificación operativa.",
  },
  {
    title: "Consulta",
    href: "/consulta",
    summary: "Búsqueda de antecedentes marcarios con filtros y contexto de investigación.",
  },
]

const apiSections = [
  {
    method: "GET",
    path: "/api/v1/health",
    auth: "Público",
    description:
      "Informa el estado del servicio y la frescura de las sincronizaciones de marcas y patentes INAPI.",
    command: "curl \"$BASE_URL/api/v1/health\"",
  },
  {
    method: "GET",
    path: "/api/v1/search",
    auth: "Público",
    description:
      "Busca registros por nombre, clase Niza o clasificación de Viena y admite filtros de estado, país y fechas.",
    command: "curl \"$BASE_URL/api/v1/search?q=$QUERY&type=nombre\"",
  },
  {
    method: "POST",
    path: "/api/v1/images",
    auth: "Bearer API key",
    description:
      "Incorpora una imagen a la organización. Calcula SHA-256, pHash, metadatos, OCR, EXIF y ELA, y deduplica archivos ya existentes.",
    command:
      "curl -X POST \"$BASE_URL/api/v1/images\" -H \"Authorization: Bearer $API_KEY\" -F \"image=@$IMAGE_PATH\"",
  },
  {
    method: "POST",
    path: "/api/v1/compare",
    auth: "Bearer API key",
    description:
      "Compara dos imágenes previamente incorporadas y devuelve similitud, clasificación, señales, recomendación y evidencia técnica disponible.",
    command:
      "curl -X POST \"$BASE_URL/api/v1/compare\" -H \"Authorization: Bearer $API_KEY\" -H \"Content-Type: application/json\" --data \"{\\\"image_a_id\\\":\\\"$IMAGE_A_ID\\\",\\\"image_b_id\\\":\\\"$IMAGE_B_ID\\\"}\"",
  },
]

const verifiedCapabilities = [
  {
    icon: Search,
    title: "Búsqueda marcaria",
    text: "Nombre, Niza y Viena con filtros de estado, país y rango de fechas.",
  },
  {
    icon: ImageIcon,
    title: "Ingesta de imágenes",
    text: "Carga controlada, deduplicación por hash y procesamiento técnico de la imagen.",
  },
  {
    icon: Fingerprint,
    title: "Comparación",
    text: "Score de similitud, clasificación, señales forenses, OCR, EXIF, ELA y contexto de marca cuando está disponible.",
  },
  {
    icon: ShieldCheck,
    title: "Control de API",
    text: "Autenticación Bearer, cuotas y registro de consumo en las operaciones protegidas verificadas.",
  },
]

const environmentVariables = [
  ["BASE_URL", "Origen real donde está desplegada la API."],
  ["API_KEY", "Clave emitida para la organización que realiza operaciones protegidas."],
  ["IMAGE_PATH", "Ruta local de una imagen real que el usuario desea procesar."],
  ["IMAGE_A_ID / IMAGE_B_ID", "Identificadores devueltos por la ingesta real de imágenes."],
]

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#111827]">
      <nav className="sticky top-0 z-50 border-b border-black/10 bg-[#F7F8F6]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <Link href="/" aria-label="VIDENTIA" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#111827] text-sm font-semibold text-white">V</span>
            <span className="leading-none">
              <span className="block text-[15px] font-semibold tracking-[0.16em]">VIDENTIA</span>
              <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-[#64748B]">by N3uralia</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/docs/clasificaciones" className="hidden text-sm text-[#667085] hover:text-[#111827] sm:block">
              Clasificaciones
            </Link>
            <Link href="/panel">
              <Button className="h-10 rounded-lg bg-[#111827] px-5 text-white shadow-none hover:bg-[#273244]">Ir al panel</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="border-b border-black/10 px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">VIDENTIA · TECHNICAL SURFACE</p>
            <h1 className="mt-6 max-w-4xl text-[clamp(3rem,6vw,6.3rem)] font-normal leading-[0.95] tracking-[-0.055em]">
              Documentación basada en lo que el producto hace hoy.
            </h1>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-lg leading-8 text-[#667085]">
              Esta superficie describe únicamente rutas y capacidades verificadas en el código actual. No contiene clientes,
              métricas, respuestas, registros ni identificadores simulados.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/panel"><Button className="h-11 gap-2 rounded-lg bg-[#0F766E] px-5 text-white shadow-none hover:bg-[#134E4A]">Abrir VIDENTIA <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/contacto"><Button variant="outline" className="h-11 rounded-lg border-black/15 bg-transparent px-5 hover:bg-black/5">Hablar con N3uralia</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-8 border-b border-black/10 pb-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 01 — PRODUCT MAP</p>
              <h2 className="mt-4 text-[clamp(2.2rem,4vw,4.2rem)] font-normal leading-[1.02] tracking-[-0.045em]">Superficies principales.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">
              El producto mantiene separadas la investigación, la comparación y la consulta para que cada tarea tenga una jerarquía clara.
            </p>
          </div>
          <div className="grid border-b border-black/10 md:grid-cols-3">
            {productRoutes.map((route, index) => (
              <Link key={route.href} href={route.href} className={`group py-9 md:px-8 ${index > 0 ? "md:border-l md:border-black/10" : ""}`}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] text-[#98A2B3]">0{index + 1}</span>
                  <ArrowRight className="h-4 w-4 text-[#0F766E] transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-10 text-xl font-medium tracking-[-0.025em]">{route.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#667085]">{route.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#111827] px-5 py-20 text-white lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#63C7B8]">SYS 02 — VERIFIED CAPABILITIES</p>
              <h2 className="mt-5 max-w-2xl text-[clamp(2.3rem,4.2vw,4.6rem)] font-normal leading-[1.02] tracking-[-0.045em]">Capacidad demostrable, no promesa.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-400 lg:justify-self-end">
              La documentación comercial debe evolucionar al mismo ritmo que estos contratos técnicos. Si una capacidad no está implementada, no aparece aquí.
            </p>
          </div>
          <div className="mt-14 grid border-y border-white/15 md:grid-cols-2 lg:grid-cols-4">
            {verifiedCapabilities.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className={`py-8 lg:px-7 ${index > 0 ? "lg:border-l lg:border-white/15" : ""}`}>
                <Icon className="h-5 w-5 text-[#63C7B8]" />
                <h3 className="mt-8 text-lg font-medium">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1480px]">
          <div className="grid gap-10 border-b border-black/10 pb-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 03 — API CONTRACT</p>
              <h2 className="mt-4 text-[clamp(2.3rem,4.2vw,4.6rem)] font-normal leading-[1.02] tracking-[-0.045em]">Rutas verificadas.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">
              Los comandos usan variables de entorno para obligar a trabajar con URLs, claves, archivos e identificadores reales del entorno del cliente.
            </p>
          </div>

          <div className="divide-y divide-black/10 border-b border-black/10">
            {apiSections.map((section, index) => (
              <article key={section.path} className="grid gap-6 py-9 lg:grid-cols-[90px_1fr_1.1fr] lg:items-start">
                <div className="font-mono text-[11px] text-[#0F766E]">0{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#111827] px-2.5 py-1 font-mono text-[11px] font-semibold text-white">{section.method}</span>
                    <span className="text-xs text-[#667085]">{section.auth}</span>
                  </div>
                  <h3 className="mt-4 font-mono text-lg font-semibold tracking-[-0.02em]">{section.path}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#667085]">{section.description}</p>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-black/10 bg-[#EEF1EE] p-4 text-xs leading-6 text-[#344054]"><code>{section.command}</code></pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">SYS 04 — REAL INPUTS</p>
            <h2 className="mt-5 text-[clamp(2.2rem,3.8vw,4rem)] font-normal leading-[1.03] tracking-[-0.045em]">Sin datos de ejemplo.</h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#667085]">
              Los comandos están diseñados para fallar si el operador no entrega un origen, credencial, archivo o identificador real.
            </p>
          </div>
          <div className="border-t border-black/10">
            {environmentVariables.map(([name, description]) => (
              <div key={name} className="grid gap-3 border-b border-black/10 py-5 sm:grid-cols-[220px_1fr]">
                <code className="text-sm font-semibold text-[#111827]">{name}</code>
                <p className="text-sm leading-6 text-[#667085]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1480px] gap-6 md:grid-cols-3">
          <article className="border-t border-black/10 pt-6">
            <Database className="h-5 w-5 text-[#0F766E]" />
            <h3 className="mt-5 text-lg font-medium">Fuente y frescura</h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">El health check expone el estado real de las sincronizaciones INAPI para evitar presentar datos antiguos como actuales.</p>
          </article>
          <article className="border-t border-black/10 pt-6">
            <ShieldCheck className="h-5 w-5 text-[#0F766E]" />
            <h3 className="mt-5 text-lg font-medium">Aislamiento organizacional</h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">Las operaciones protegidas verificadas resuelven la organización desde la API key y limitan el acceso a sus imágenes.</p>
          </article>
          <article className="border-t border-black/10 pt-6">
            <Code2 className="h-5 w-5 text-[#0F766E]" />
            <h3 className="mt-5 text-lg font-medium">Contrato antes que marketing</h3>
            <p className="mt-3 text-sm leading-6 text-[#667085]">La página técnica se mantiene deliberadamente más corta que el backend completo: sólo documenta contratos ya verificados.</p>
          </article>
        </div>
      </section>

      <footer className="border-t border-black/10 px-5 py-8 lg:px-10">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-4 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between">
          <p>VIDENTIA · by N3uralia</p>
          <div className="flex items-center gap-2 text-xs"><Check className="h-4 w-4 text-[#0F766E]" />Documentación sin mock data</div>
        </div>
      </footer>
    </main>
  )
}
