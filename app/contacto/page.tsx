import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Braces,
  Check,
  Mail,
  MessageCircle,
  Search,
  Waypoints,
} from "lucide-react"
import { PublicLegalFooter } from "@/components/public-legal-footer"

export const metadata: Metadata = {
  title: "Contacto comercial",
  description: "Conversemos sobre VIDENTIA Plataforma o una integración mediante VIDENTIA API en Chile.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto comercial | VIDENTIA",
    description: "Conversemos sobre VIDENTIA Plataforma o una integración mediante VIDENTIA API en Chile.",
    url: "https://videntia.app/contacto",
    siteName: "VIDENTIA",
    locale: "es_CL",
    type: "website",
  },
}

const apiMail =
  "mailto:info@n3uralia.com?subject=VIDENTIA%20API&body=Hola%20N3uralia%2C%20quiero%20evaluar%20VIDENTIA%20API.%20Empresa%3A%20%20%7C%20Volumen%20estimado%3A%20%20%7C%20Integraci%C3%B3n%20prevista%3A%20"

const platformPoints = [
  "Operación completa dentro de VIDENTIA",
  "Búsqueda, evaluación, casos y vigilancia",
  "Onboarding y configuración empresarial",
]

const apiPoints = [
  "Integración con sistemas propios",
  "Búsqueda e inteligencia marcaria autenticada",
  "Consumo medido según volumen contratado",
]

const processSteps = [
  ["01", "Contexto", "Entendemos operación, usuarios y volumen."],
  ["02", "Alcance", "Definimos plataforma, API o una combinación."],
  ["03", "Activación", "Acordamos configuración, soporte y puesta en marcha."],
] as const

type ContactSearchParams = Record<string, string | string[] | undefined>

export default async function ContactoPage({ searchParams }: { searchParams: Promise<ContactSearchParams> }) {
  const params = await searchParams
  const marca = cleanText(firstValue(params.marca), 120)
  const resultados = cleanResultCount(firstValue(params.resultados))
  const fromDemo = firstValue(params.origen) === "demo" && Boolean(marca)

  const enterpriseMail = buildEnterpriseMail({ marca, resultados, fromDemo })
  const generalMail = buildGeneralMail({ marca, resultados, fromDemo })
  const whatsapp = buildWhatsApp({ marca, resultados, fromDemo })

  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-[#0F2A33] text-white selection:bg-[#4A7F74]/45">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[44rem]"
          style={{
            background:
              "radial-gradient(circle at 76% 8%, rgba(69,110,142,0.12), transparent 31rem), radial-gradient(circle at 18% 18%, rgba(74,127,116,0.09), transparent 27rem)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-10rem] top-[13rem] size-[26rem] rounded-full border border-[#96B5A6]/[0.07] shadow-[0_0_0_4rem_rgba(69,110,142,0.018),0_0_0_8rem_rgba(74,127,116,0.012)]"
        />

        <header className="relative z-20 border-b border-[#B7D3D1]/10 bg-[#091A20]">
          <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
            <Link
              href={fromDemo ? "/demo" : "/"}
              className="inline-flex min-h-11 items-center gap-3 rounded-[9px] px-2 text-sm text-[#BDBEBD] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]"
            >
              <ArrowLeft className="size-4" strokeWidth={1.6} />
              <span className="hidden sm:inline">{fromDemo ? "Volver a la investigación" : "Volver al inicio"}</span>
            </Link>

            <Link href="/" className="text-right leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]" aria-label="VIDENTIA, inicio">
              <span className="block text-[17px] font-light tracking-[0.2em] text-[#E7DFCE]">ViDENTiA</span>
              <span className="mt-1.5 hidden text-[7px] font-medium uppercase tracking-[0.16em] text-[#8F9998] sm:block">
                Inteligencia y protección de marcas
              </span>
            </Link>
          </div>
        </header>

        <section className="relative z-10 px-5 py-14 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1480px]">
            <div className="grid gap-12 lg:grid-cols-[1.08fr_0.72fr] lg:items-end lg:gap-20">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#96B5A6]">Contratación · Chile</p>
                <h1 className="mt-5 max-w-[12ch] text-[clamp(3.2rem,6.2vw,6.7rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE]">
                  {fromDemo ? "Continúa la investigación sin perder contexto." : "Incorpora VIDENTIA a tu operación."}
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-7 text-white sm:text-lg sm:leading-8">
                  {fromDemo
                    ? "La marca y el volumen observado en la demo viajan en esta solicitud. Desde ahí definimos alcance, usuarios, vigilancia y modalidad de acceso."
                    : "Primero entendemos cómo trabaja tu organización. Después definimos modalidad, alcance e integración con la evidencia y la trazabilidad al centro."}
                </p>
              </div>

              <aside className="border-y border-[#B7D3D1]/10 py-2">
                <p className="py-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7D8B89]">Cómo avanzamos</p>
                {processSteps.map(([number, title, copy]) => (
                  <div key={number} className="grid grid-cols-[38px_1fr] gap-4 border-t border-[#B7D3D1]/10 py-4">
                    <span className="font-mono text-[10px] text-[#96B5A6]">{number}</span>
                    <div>
                      <p className="text-sm font-medium text-[#E7DFCE]">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#BDBEBD]">{copy}</p>
                    </div>
                  </div>
                ))}
              </aside>
            </div>

            {fromDemo ? (
              <div className="mt-12 grid gap-6 rounded-[10px] bg-[#13272D] p-5 ring-1 ring-inset ring-white/[0.04] sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[9px] bg-[#173B37] text-[#96B5A6]">
                    <Search className="size-4" strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#96B5A6]">Investigación iniciada en la demo</p>
                    <p className="mt-2 truncate text-xl font-medium tracking-[-0.02em] text-[#E7DFCE]">{marca}</p>
                    <p className="mt-1 text-sm leading-6 text-[#BDBEBD]">
                      {resultados != null
                        ? `${resultados} resultados observados en la cobertura de la consulta.`
                        : "Contexto de la consulta conservado para continuar."}
                    </p>
                  </div>
                </div>
                <Link href="/demo" className="text-sm font-medium text-[#B7D3D1] transition-colors hover:text-white">
                  Cambiar investigación
                </Link>
              </div>
            ) : null}

            <section className="mt-16 border-y border-[#B7D3D1]/10 lg:grid lg:grid-cols-2">
              <CommercialOption
                eyebrow="Plataforma empresarial"
                signal="Operación completa"
                icon={<Waypoints className="size-4" strokeWidth={1.6} />}
                title="VIDENTIA Plataforma"
                description="Para estudios jurídicos, áreas legales y empresas que quieren centralizar investigación, casos y vigilancia en un mismo sistema."
                points={platformPoints}
                href={enterpriseMail}
                cta={fromDemo ? "Continuar esta investigación" : "Solicitar propuesta empresarial"}
                price="Desde $5.000.000 CLP"
                primary
              />
              <CommercialOption
                eyebrow="API empresarial"
                signal="Integración"
                icon={<Braces className="size-4" strokeWidth={1.6} />}
                title="VIDENTIA API"
                description="Para organizaciones que necesitan incorporar capacidades de VIDENTIA en sus sistemas, productos o procesos existentes."
                points={apiPoints}
                href={apiMail}
                cta="Conversar sobre la API"
                price="Desde $500.000 CLP/mes + consumo"
              />
            </section>

            <section className="mt-14 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96B5A6]">Contacto directo</p>
                <h2 className="mt-3 max-w-[10ch] text-3xl font-light leading-[1.05] tracking-[-0.04em] text-[#E7DFCE] sm:text-4xl">
                  Habla con el equipo que implementa VIDENTIA.
                </h2>
              </div>

              <div className="border-y border-[#B7D3D1]/10">
                <DirectContact
                  href={generalMail}
                  icon={<Mail className="size-4" strokeWidth={1.6} />}
                  label="Correo"
                  value="info@n3uralia.com"
                />
                <DirectContact
                  href={whatsapp}
                  icon={<MessageCircle className="size-4" strokeWidth={1.6} />}
                  label="WhatsApp"
                  value="+56 9 9382 6127"
                  external
                />
              </div>
            </section>

            <p className="mt-10 max-w-3xl text-xs leading-6 text-[#83908F]">
              Los valores son referencias comerciales. Usuarios, volumen, integraciones, SLA, migraciones, soporte y despliegues especiales se definen según alcance.
            </p>
          </div>
        </section>
      </main>
      <PublicLegalFooter />
    </>
  )
}

function CommercialOption({
  eyebrow,
  signal,
  icon,
  title,
  description,
  points,
  href,
  cta,
  price,
  primary = false,
}: {
  eyebrow: string
  signal: string
  icon: React.ReactNode
  title: string
  description: string
  points: string[]
  href: string
  cta: string
  price: string
  primary?: boolean
}) {
  return (
    <article className="relative px-0 py-9 lg:min-h-[34rem] lg:px-10 lg:py-11 lg:first:border-r lg:first:border-[#B7D3D1]/10 lg:first:pl-0 lg:last:pr-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7D8B89]">{eyebrow}</p>
        <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#96B5A6]">
          {icon}
          {signal}
        </span>
      </div>

      <h2 className="mt-8 text-3xl font-light tracking-[-0.04em] text-[#E7DFCE] sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-white">{description}</p>

      <div className="mt-8 border-t border-[#B7D3D1]/10">
        {points.map((item) => (
          <div key={item} className="flex items-center gap-3 border-b border-[#B7D3D1]/10 py-4 text-sm text-[#BDBEBD]">
            <Check className="size-4 shrink-0 text-[#96B5A6]" strokeWidth={1.6} />
            {item}
          </div>
        ))}
      </div>

      <a
        href={href}
        className={`mt-8 inline-flex min-h-11 items-center gap-2 rounded-[9px] px-5 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] ${
          primary ? "bg-[#4A7F74] hover:bg-[#568D81]" : "bg-[#173B37] hover:bg-[#203F3A]"
        }`}
      >
        {cta}
        <ArrowRight className="size-4" strokeWidth={1.6} />
      </a>

      <div className="mt-9 flex flex-col gap-2 border-t border-[#B7D3D1]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7D8B89]">Referencia comercial</span>
        <span className="text-sm text-[#E7DFCE]">{price}</span>
      </div>
    </article>
  )
}

function DirectContact({
  href,
  icon,
  label,
  value,
  external = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  value: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group grid min-h-20 grid-cols-[40px_1fr_auto] items-center gap-4 border-b border-[#B7D3D1]/10 py-4 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]"
    >
      <span className="grid size-10 place-items-center rounded-[9px] bg-[#13272D] text-[#96B5A6] transition-colors group-hover:bg-[#173B37]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-[#7D8B89]">{label}</span>
        <span className="mt-1 block truncate text-sm font-medium text-[#E7DFCE]">{value}</span>
      </span>
      <ArrowRight className="size-4 text-[#83908F] transition-transform group-hover:translate-x-0.5 group-hover:text-[#B7D3D1]" strokeWidth={1.6} />
    </a>
  )
}

function buildEnterpriseMail({ marca, resultados, fromDemo }: { marca: string; resultados: number | null; fromDemo: boolean }) {
  const subject = fromDemo ? `VIDENTIA — continuar investigación ${marca}` : "VIDENTIA Plataforma Enterprise"
  const body = fromDemo
    ? [
        `Hola N3uralia, hice una investigación en la demo de VIDENTIA.`,
        `Marca: ${marca}`,
        resultados != null ? `Resultados observados: ${resultados}` : null,
        `Quiero evaluar acceso completo para conservar el caso, revisar evidencia y activar vigilancia.`,
        `Empresa:`,
        `Necesidad principal:`,
      ]
        .filter(Boolean)
        .join("\n")
    : "Hola N3uralia, quiero evaluar VIDENTIA Plataforma para mi empresa.\nEmpresa:\nUsuarios estimados:\nNecesidad principal:"
  return `mailto:info@n3uralia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildGeneralMail({ marca, resultados, fromDemo }: { marca: string; resultados: number | null; fromDemo: boolean }) {
  if (!fromDemo) return "mailto:info@n3uralia.com"
  const subject = `VIDENTIA — consulta sobre ${marca}`
  const body = [
    `Hola N3uralia, vengo desde la demo de VIDENTIA.`,
    `Marca: ${marca}`,
    resultados != null ? `Resultados observados: ${resultados}` : null,
    `Quiero continuar esta investigación.`,
  ]
    .filter(Boolean)
    .join("\n")
  return `mailto:info@n3uralia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildWhatsApp({ marca, resultados, fromDemo }: { marca: string; resultados: number | null; fromDemo: boolean }) {
  const text = fromDemo
    ? [
        `Hola N3uralia, vengo desde la demo de VIDENTIA.`,
        `Marca: ${marca}.`,
        resultados != null ? `La consulta observó ${resultados} resultados.` : null,
        `Quiero continuar la investigación.`,
      ]
        .filter(Boolean)
        .join(" ")
    : "Hola N3uralia, quiero conversar sobre VIDENTIA."
  return `https://wa.me/56993826127?text=${encodeURIComponent(text)}`
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

function cleanText(value: string, maxLength: number) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function cleanResultCount(value: string) {
  if (!/^\d{1,4}$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
}
