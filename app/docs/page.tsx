import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Fingerprint, ImageIcon, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "API empresarial",
  description: "Documentación técnica de VIDENTIA API para integrar búsqueda, imágenes y comparación marcaria en sistemas empresariales.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "VIDENTIA API | Documentación empresarial",
    description: "Integra capacidades verificadas de búsqueda, imágenes y comparación marcaria mediante VIDENTIA API.",
    url: "https://videntia.app/docs",
    siteName: "VIDENTIA",
    locale: "es_CL",
    type: "website",
  },
}

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/health",
    auth: "Público",
    description: "Estado del servicio y frescura de sincronizaciones INAPI.",
    command: "curl \"$BASE_URL/api/v1/health\"",
  },
  {
    method: "GET",
    path: "/api/v1/trademarks/search",
    auth: "Bearer API key",
    description: "Búsqueda comercial de marcas por nombre, Niza o Viena, con filtros, cuota y medición de uso.",
    command: "curl \"$BASE_URL/api/v1/trademarks/search?q=$QUERY&type=nombre\" -H \"Authorization: Bearer $API_KEY\"",
  },
  {
    method: "POST",
    path: "/api/v1/images",
    auth: "Bearer API key",
    description: "Ingesta de una imagen real con SHA-256, pHash, metadatos, OCR, EXIF, ELA y deduplicación.",
    command: "curl -X POST \"$BASE_URL/api/v1/images\" -H \"Authorization: Bearer $API_KEY\" -F \"image=@$IMAGE_PATH\"",
  },
  {
    method: "POST",
    path: "/api/v1/compare",
    auth: "Bearer API key",
    description: "Compara dos imágenes previamente incorporadas y devuelve señales técnicas y contexto disponible.",
    command: "curl -X POST \"$BASE_URL/api/v1/compare\" -H \"Authorization: Bearer $API_KEY\" -H \"Content-Type: application/json\" --data \"{\\\"image_a_id\\\":\\\"$IMAGE_A_ID\\\",\\\"image_b_id\\\":\\\"$IMAGE_B_ID\\\"}\"",
  },
]

const capabilities = [
  [Search, "Búsqueda marcaria", "Nombre, Niza y Viena con filtros verificables."],
  [ImageIcon, "Ingesta de imágenes", "Procesamiento técnico y deduplicación por hash."],
  [Fingerprint, "Comparación", "Similitud, OCR, EXIF, ELA y señales forenses disponibles."],
  [ShieldCheck, "Control comercial", "API key, cuotas y registro de consumo en operaciones protegidas."],
] as const

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#F7F8F6] text-[#111827]">
      <nav className="sticky top-0 z-50 border-b border-black/10 bg-[#F7F8F6]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1480px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#111827] text-sm font-semibold text-white">V</span><span><span className="block text-[15px] font-semibold tracking-[0.16em]">VIDENTIA</span><span className="mt-1 block text-[9px] uppercase tracking-[0.18em] text-[#64748B]">by N3uralia</span></span></Link>
          <Button asChild className="h-10 rounded-lg bg-[#111827] px-5 text-white shadow-none hover:bg-[#273244]"><Link href="/contacto">Contratar API</Link></Button>
        </div>
      </nav>

      <section className="border-b border-black/10 px-5 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1480px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">VIDENTIA API · CHILE</p><h1 className="mt-6 max-w-4xl text-[clamp(3rem,6vw,6.2rem)] font-normal leading-[0.95] tracking-[-0.055em]">Integra inteligencia marcaria sin depender de la interfaz.</h1></div>
          <div className="max-w-2xl lg:justify-self-end"><p className="text-lg leading-8 text-[#667085]">Esta documentación publica únicamente contratos técnicos presentes en el código actual. No contiene registros, clientes, métricas ni respuestas simuladas.</p><div className="mt-7 flex gap-3"><Button asChild className="h-11 gap-2 rounded-lg bg-[#0F766E] px-5 text-white shadow-none hover:bg-[#134E4A]"><Link href="/contacto">Cotizar integración <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" className="h-11 rounded-lg border-black/15 bg-transparent px-5"><Link href="/demo">Probar VIDENTIA</Link></Button></div></div>
        </div>
      </section>

      <section className="bg-[#111827] px-5 py-20 text-white lg:px-10 lg:py-24"><div className="mx-auto max-w-[1480px]"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#63C7B8]">CAPACIDADES VERIFICADAS</p><div className="mt-10 grid border-y border-white/15 md:grid-cols-2 lg:grid-cols-4">{capabilities.map(([Icon, title, text], index) => <article key={title} className={`py-8 lg:px-7 ${index > 0 ? 'lg:border-l lg:border-white/15' : ''}`}><Icon className="h-5 w-5 text-[#63C7B8]" /><h2 className="mt-7 text-lg font-medium">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></article>)}</div></div></section>

      <section className="px-5 py-20 lg:px-10 lg:py-28"><div className="mx-auto max-w-[1480px]"><div className="grid gap-8 border-b border-black/10 pb-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F766E]">CONTRATO API</p><h2 className="mt-4 text-[clamp(2.3rem,4vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.045em]">Rutas que puedes contratar hoy.</h2></div><p className="max-w-2xl text-lg leading-8 text-[#667085] lg:justify-self-end">Las operaciones comerciales protegidas usan API key, cuota y medición. La búsqueda web interna de VIDENTIA no forma parte de este contrato público.</p></div><div className="divide-y divide-black/10 border-b border-black/10">{endpoints.map((item, index) => <article key={item.path} className="grid gap-6 py-8 lg:grid-cols-[70px_1fr_1.2fr]"><span className="font-mono text-[11px] text-[#0F766E]">0{index + 1}</span><div><div className="flex items-center gap-2"><span className="rounded-md bg-[#111827] px-2.5 py-1 font-mono text-[11px] font-semibold text-white">{item.method}</span><span className="text-xs text-[#667085]">{item.auth}</span></div><h3 className="mt-4 font-mono text-lg font-semibold">{item.path}</h3><p className="mt-3 text-sm leading-6 text-[#667085]">{item.description}</p></div><pre className="overflow-x-auto rounded-xl border border-black/10 bg-[#EEF1EE] p-4 text-xs leading-6 text-[#344054]"><code>{item.command}</code></pre></article>)}</div></div></section>

      <footer className="border-t border-black/10 px-5 py-8 lg:px-10"><div className="mx-auto flex max-w-[1480px] flex-col gap-3 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between"><span>VIDENTIA · API empresarial para Chile</span><span>Un desarrollo de N3uralia</span></div></footer>
    </main>
  )
}
