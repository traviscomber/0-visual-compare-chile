"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, Check, ImageIcon, Loader2, RotateCcw, Search, ShieldCheck, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { localePath, type PublicLocale } from "@/lib/marketing-locale"

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const MAX_FILE_BYTES = 4_500_000
const REQUEST_TIMEOUT_MS = 55_000

const copy = {
  es: {
    back: "Volver",
    tagline: "Inteligencia y protección de marcas",
    login: "Iniciar sesión",
    enterprise: "Acceso empresarial",
    eyebrow: "INVESTIGACIÓN REAL · EVIDENCIA TRAZABLE",
    title: "Entrega la marca. Revisa la evidencia.",
    lead: "Empieza con un nombre, una imagen o ambos. Puedes agregar productos o servicios para contextualizar la búsqueda sin convertir esta vista preliminar en asesoría jurídica.",
    signals: ["Chile primero", "INAPI identificable", "Niza + Viena", "Sin veredictos automáticos"],
    query: "01 / Consulta",
    question: "¿Qué quieres investigar?",
    uploadReady: "Imagen lista para investigar",
    uploadReplace: "Haz clic para reemplazarla",
    uploadTitle: "Arrastra un logo o una fotografía",
    uploadBody: "La imagen puede aportar denominación visible y señales figurativas cuando la evidencia permite inferirlas.",
    name: "Nombre de la marca",
    activity: "Productos o servicios (opcional)",
    activityHelp: "Ayuda a contextualizar clases Niza. No genera una recomendación legal.",
    run: "Investigar marca",
    running: "Investigando",
    stages: ["Preparando consulta", "Consultando fuentes", "Organizando evidencia", "Contextualizando clases"],
    retry: "Reintentar",
    clear: "Limpiar consulta",
    fileType: "Usa PNG, JPEG, WebP o GIF.",
    fileSize: "La imagen supera el máximo de 4,5 MB.",
    fileRead: "No pudimos leer la imagen.",
    genericError: "No pudimos completar la búsqueda.",
    timeout: "La consulta tardó más de lo esperado. Puedes reintentar sin volver a cargar los datos.",
    connection: "No pudimos conectar con el servicio. Puedes reintentar sin perder la consulta.",
    resultsEyebrow: "02 / Vista preliminar",
    resultsTitle: "Señales encontradas para revisión.",
    resultsBody: "Esta vista muestra cobertura y coincidencias principales. No incluye estrategia, recomendaciones jurídicas ni expediente completo.",
    source: "Fuente",
    results: "Resultados",
    active: "Activos",
    niza: "Clases Niza",
    vienna: "Códigos Viena",
    antecedents: "Coincidencias visibles",
    holderHidden: "Titular reservado para acceso empresarial",
    registrationHidden: "Registro reservado",
    classes: "Clases",
    noAntecedents: "No se mostraron coincidencias en esta vista preliminar.",
    locked: "antecedentes adicionales quedan disponibles en el workspace empresarial.",
    continue: "Continuar para mi organización",
    enterpriseCta: "Solicitar acceso empresarial",
    newSearch: "Nueva búsqueda",
    disclaimer: "VIDENTIA organiza evidencia para revisión. No reemplaza las fuentes oficiales ni la evaluación jurídica profesional.",
  },
  en: {
    back: "Back",
    tagline: "Trademark intelligence and protection",
    login: "Sign in",
    enterprise: "Enterprise access",
    eyebrow: "REAL RESEARCH · TRACEABLE EVIDENCE",
    title: "Provide the trademark. Review the evidence.",
    lead: "Start with a name, an image, or both. Add goods or services to provide context without turning this preliminary view into legal advice.",
    signals: ["Chile first", "Identifiable INAPI source", "Nice + Vienna", "No automated verdicts"],
    query: "01 / Query",
    question: "What do you want to investigate?",
    uploadReady: "Image ready for research",
    uploadReplace: "Click to replace it",
    uploadTitle: "Drop a logo or photograph",
    uploadBody: "The image may contribute visible wording and figurative signals when the evidence supports them.",
    name: "Trademark name",
    activity: "Goods or services (optional)",
    activityHelp: "Helps contextualize Nice classes. It does not generate legal advice.",
    run: "Research trademark",
    running: "Researching",
    stages: ["Preparing query", "Checking sources", "Organizing evidence", "Contextualizing classes"],
    retry: "Try again",
    clear: "Clear query",
    fileType: "Use PNG, JPEG, WebP or GIF.",
    fileSize: "The image exceeds the 4.5 MB limit.",
    fileRead: "We could not read the image.",
    genericError: "We could not complete the search.",
    timeout: "The query took longer than expected. You can retry without entering the data again.",
    connection: "We could not connect to the service. You can retry without losing the query.",
    resultsEyebrow: "02 / Preliminary view",
    resultsTitle: "Signals found for review.",
    resultsBody: "This view shows coverage and the main matches. It does not include strategy, legal recommendations or the complete case file.",
    source: "Source",
    results: "Results",
    active: "Active",
    niza: "Nice classes",
    vienna: "Vienna codes",
    antecedents: "Visible matches",
    holderHidden: "Owner reserved for enterprise access",
    registrationHidden: "Registration reserved",
    classes: "Classes",
    noAntecedents: "No matches were shown in this preliminary view.",
    locked: "additional records remain available in the enterprise workspace.",
    continue: "Continue for my organization",
    enterpriseCta: "Request enterprise access",
    newSearch: "New search",
    disclaimer: "VIDENTIA organizes evidence for review. It does not replace official sources or professional legal assessment.",
  },
} as const

type Preview = {
  marca: string
  analysis_mode?: string
  visual?: { viena?: Array<{ code: string }> }
  niza?: Array<{ numero: string; titulo?: string }>
  evidencia?: { fuente?: string; resultados_totales?: number; resultados_activos?: number; advertencias?: string[] }
  lectura?: { resumen?: string }
  antecedentes?: Array<{ id: string; nombre: string; titular?: string; estado?: string; clases?: string[]; numero_registro?: string; numero_solicitud?: string }>
  locked_count?: number
}

export function LocalizedDemoPage({ locale }: { locale: PublicLocale }) {
  const t = copy[locale]
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [activity, setActivity] = useState("")
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  const canRun = Boolean((image || name.trim()) && !loading)

  useEffect(() => {
    const initialName = new URLSearchParams(window.location.search).get("marca")?.trim()
    if (initialName) setName(initialName)
  }, [])

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  function handleFile(file: File) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return setError(t.fileType)
    if (file.size > MAX_FILE_BYTES) return setError(t.fileSize)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return setError(t.fileRead)
      setImage(reader.result)
      setImagePreview(reader.result)
      setPreview(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  async function run() {
    if (!canRun) return
    clearTimers()
    setLoading(true)
    setStage(0)
    setError(null)
    setPreview(null)
    timers.current = [
      window.setTimeout(() => setStage(1), 1200),
      window.setTimeout(() => setStage(2), 3500),
      ...(activity.trim() ? [window.setTimeout(() => setStage(3), 6500)] : []),
    ]

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch("/api/v1/public/trademark-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ nombre: name.trim(), ...(activity.trim() ? { actividad: activity.trim() } : {}), ...(image ? { image } : {}) }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(typeof data?.error === "string" ? data.error : t.genericError)
      setPreview(data as Preview)
      if (!name.trim() && data?.marca) setName(String(data.marca))
    } catch (requestError) {
      const timedOut = requestError instanceof DOMException && requestError.name === "AbortError"
      setError(timedOut ? t.timeout : requestError instanceof Error && requestError.message !== t.genericError ? requestError.message : t.connection)
    } finally {
      window.clearTimeout(timeout)
      clearTimers()
      setLoading(false)
      setStage(0)
    }
  }

  function reset() {
    clearTimers()
    setImage(null)
    setImagePreview(null)
    setName("")
    setActivity("")
    setPreview(null)
    setError(null)
  }

  const brand = (preview?.marca || name).trim()
  const niza = preview?.niza ?? []
  const viennaCodes = Array.from(new Set((preview?.visual?.viena ?? []).map((item) => item.code).filter(Boolean)))
  const antecedents = (preview?.antecedentes ?? []).slice(0, 5)
  const lockedCount = Math.max(Number(preview?.locked_count ?? 0), 0)

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0F2A33] text-white selection:bg-[#4A7F74]/45">
      <nav className="sticky top-0 z-40 border-b border-[#BDBEBD]/10 bg-[#091A20]">
        <div className="mx-auto flex h-[76px] max-w-[1480px] items-center justify-between gap-5 px-5 lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <Link href={localePath(locale)} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#172F34] text-[#B7D3D1]" aria-label={t.back}><ArrowLeft className="h-4 w-4" /></Link>
            <Link href={localePath(locale)} className="min-w-0">
              <span className="block truncate text-[18px] font-light tracking-[0.16em] text-[#E7DFCE]">ViDENTiA</span>
              <span className="mt-1 hidden text-[8px] uppercase tracking-[0.11em] text-[#BDBEBD] sm:block">{t.tagline}</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="ghost" className="hidden h-10 text-[#D8DDDB] hover:bg-[#172F34] hover:text-white sm:inline-flex"><Link href={localePath(locale, "/auth/login")} prefetch={false}>{t.login}</Link></Button>
            <Button asChild className="h-10 bg-[#4A7F74] px-4 text-white shadow-none hover:bg-[#416F66]"><Link href={localePath(locale, `/acceso-empresarial${brand ? `?marca=${encodeURIComponent(brand)}` : ""}`)}>{t.enterprise}</Link></Button>
          </div>
        </div>
      </nav>

      {!preview ? (
        <section className="px-5 py-12 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-[1380px]">
            <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
              <div><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">{t.eyebrow}</p><h1 className="mt-5 max-w-[10ch] text-[clamp(3rem,5.8vw,6.3rem)] font-light leading-[0.98] tracking-[-0.045em] text-[#E7DFCE]">{t.title}</h1></div>
              <div className="max-w-2xl lg:justify-self-end"><p className="text-base leading-7 text-white sm:text-lg sm:leading-8">{t.lead}</p><div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.12em] text-[#BDBEBD]">{t.signals.map((signal) => <span key={signal}>{signal}</span>)}</div></div>
            </div>

            <div className="mt-12 overflow-hidden rounded-[10px] bg-[#13272D]">
              <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
                <div className="p-5 sm:p-8 lg:p-10">
                  <div className="mb-6"><p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">{t.query}</p><h2 className="mt-2 text-2xl font-normal tracking-[-0.025em] text-[#E7DFCE]">{t.question}</h2></div>
                  <button type="button" disabled={loading} onClick={() => fileRef.current?.click()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) handleFile(file) }} onDragOver={(event) => event.preventDefault()} className="flex min-h-[230px] w-full items-center justify-center rounded-[10px] border border-dashed border-[#96B5A6]/35 bg-[#091A20] p-7 text-center transition hover:border-[#B7D3D1]/65 hover:bg-[#172F34] disabled:opacity-60">
                    <input ref={fileRef} type="file" disabled={loading} accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file) }} />
                    {imagePreview ? <div><div className="mx-auto flex h-36 w-52 max-w-full items-center justify-center rounded-lg bg-[#20393A] p-4"><img src={imagePreview} alt="" className="max-h-full max-w-full object-contain" /></div><p className="mt-4 text-sm font-medium text-[#E7DFCE]">{t.uploadReady}</p><p className="mt-1 text-xs text-[#BDBEBD]">{t.uploadReplace}</p></div> : <div className="max-w-md"><span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#20393A] text-[#B7D3D1]"><Upload className="h-5 w-5" /></span><p className="mt-5 text-base font-medium text-[#E7DFCE]">{t.uploadTitle}</p><p className="mt-2 text-sm leading-6 text-[#BDBEBD]">{t.uploadBody}</p></div>}
                  </button>

                  <div className="mt-6 space-y-3">
                    <Input disabled={loading} value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} placeholder={t.name} aria-label={t.name} className="h-12 rounded-lg border-[#BDBEBD]/20 bg-[#091A20] text-base text-white shadow-none placeholder:text-[#BDBEBD]" />
                    <Input disabled={loading} value={activity} onChange={(event) => setActivity(event.target.value.slice(0, 400))} onKeyDown={(event) => event.key === "Enter" && canRun && void run()} placeholder={t.activity} aria-label={t.activity} className="h-12 rounded-lg border-[#BDBEBD]/20 bg-[#091A20] text-base text-white shadow-none placeholder:text-[#BDBEBD]" />
                    <p className="text-xs leading-5 text-[#83908F]">{t.activityHelp}</p>
                    <Button onClick={() => void run()} disabled={!canRun} size="lg" className="h-12 gap-2 rounded-lg bg-[#4A7F74] px-6 text-white shadow-none hover:bg-[#416F66] disabled:bg-[#20393A] disabled:text-[#BDBEBD]">{loading ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />{t.running}</> : <><Search className="h-4 w-4" />{t.run}</>}</Button>
                  </div>
                  {error ? <div role="alert" className="mt-5 border-l-2 border-red-300/70 bg-red-950/20 px-4 py-3"><p className="text-sm text-red-100">{error}</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => void run()} disabled={!canRun} variant="secondary"><RotateCcw className="mr-2 h-4 w-4" />{t.retry}</Button><Button onClick={reset} variant="ghost">{t.clear}</Button></div></div> : null}
                </div>

                <aside className="border-t border-[#BDBEBD]/10 bg-[#0B222A] p-6 lg:border-l lg:border-t-0 lg:p-10">
                  <div className="flex items-center gap-3 text-[#96B5A6]"><ShieldCheck className="h-5 w-5" /><span className="text-[10px] font-medium uppercase tracking-[0.16em]">VIDENTIA</span></div>
                  <div className="mt-8 divide-y divide-[#BDBEBD]/10 border-y border-[#BDBEBD]/10">{t.signals.map((signal) => <div key={signal} className="flex items-center gap-3 py-4 text-sm text-[#D8DDDB]"><Check className="h-4 w-4 shrink-0 text-[#96B5A6]" />{signal}</div>)}</div>
                  {loading ? <div className="mt-8"><p className="text-sm text-[#E7DFCE]">{t.stages[stage]}</p><div className="mt-3 h-px overflow-hidden bg-[#263D44]"><div className="h-full w-2/3 animate-pulse bg-[#4A7F74] motion-reduce:animate-none" /></div></div> : null}
                </aside>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-5 py-12 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
              <div className="lg:sticky lg:top-28"><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">{t.resultsEyebrow}</p><h1 className="mt-5 text-[clamp(2.8rem,5vw,5.2rem)] font-light leading-[0.98] tracking-[-0.045em] text-[#E7DFCE]">{t.resultsTitle}</h1><p className="mt-6 max-w-lg text-sm leading-7 text-[#BDBEBD]">{t.resultsBody}</p>{preview.lectura?.resumen ? <p className="mt-5 border-l border-[#4A7F74] pl-4 text-sm leading-7 text-[#D8DDDB]">{preview.lectura.resumen}</p> : null}<div className="mt-8 flex flex-wrap gap-3"><Button asChild className="bg-[#4A7F74] text-white hover:bg-[#416F66]"><Link href={localePath(locale, `/auth/sign-up?marca=${encodeURIComponent(brand)}`)}>{t.continue}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="secondary"><Link href={localePath(locale, `/acceso-empresarial?marca=${encodeURIComponent(brand)}`)}>{t.enterpriseCta}</Link></Button><Button onClick={reset} variant="ghost">{t.newSearch}</Button></div></div>

              <div className="min-w-0">
                <div className="grid gap-px bg-[#263D44] sm:grid-cols-4">{[[t.source, preview.evidencia?.fuente || "INAPI"], [t.results, String(preview.evidencia?.resultados_totales ?? antecedents.length)], [t.active, String(preview.evidencia?.resultados_activos ?? "—")], [t.niza, niza.length ? niza.map((item) => item.numero).join(", ") : "—"]].map(([label, value]) => <div key={label} className="bg-[#13272D] p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#83908F]">{label}</p><p className="mt-2 break-words text-sm text-[#E7DFCE]">{value}</p></div>)}</div>
                {viennaCodes.length ? <div className="mt-5 border-y border-[#263D44] py-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#83908F]">{t.vienna}</p><p className="mt-2 text-sm text-[#D8DDDB]">{viennaCodes.join(" · ")}</p></div> : null}
                <div className="mt-8"><div className="flex items-end justify-between gap-4"><h2 className="text-2xl font-light tracking-[-0.03em] text-[#E7DFCE]">{t.antecedents}</h2><span className="text-xs text-[#83908F]">{antecedents.length}</span></div><div className="mt-4 divide-y divide-[#263D44] border-y border-[#263D44]">{antecedents.length ? antecedents.map((item) => <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto]"><div><h3 className="text-lg font-medium text-[#E7DFCE]">{item.nombre || "—"}</h3><p className="mt-2 text-xs text-[#83908F]">{item.titular || t.holderHidden}</p><p className="mt-1 text-xs text-[#83908F]">{item.numero_registro || item.numero_solicitud || t.registrationHidden}</p></div><div className="text-left sm:text-right"><p className="text-xs text-[#96B5A6]">{item.estado || "—"}</p><p className="mt-2 text-xs text-[#BDBEBD]">{t.classes}: {(item.clases ?? []).join(", ") || "—"}</p></div></article>) : <p className="py-6 text-sm text-[#BDBEBD]">{t.noAntecedents}</p>}</div>{lockedCount > 0 ? <p className="mt-5 text-sm text-[#96B5A6]">+{lockedCount} {t.locked}</p> : null}</div>
              </div>
            </div>
            <p className="mt-14 border-t border-[#263D44] pt-5 text-xs leading-6 text-[#83908F]">{t.disclaimer}</p>
          </div>
        </section>
      )}
    </main>
  )
}
