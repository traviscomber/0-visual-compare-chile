import Link from "next/link"
import { ArrowRight, Gauge, Lightbulb, ShieldCheck } from "lucide-react"
import { loadAssistantJuanWorkspace } from "@/lib/intelligence/assistant-juan-workspace"
import { buildVidentiaImprovementRadar, type VidentiaImprovementCandidate } from "@/lib/intelligence/videntia-improvement-radar"

export async function JuanVidentiaImprovementRadar({ userId }: { userId: string }) {
  const snapshot = await loadAssistantJuanWorkspace(userId)
  const radar = buildVidentiaImprovementRadar(snapshot)
  const primary = radar.candidates[0]
  const rest = radar.candidates.slice(1)

  return (
    <section id="mejorar-videntia" className="mx-auto mt-5 w-[calc(100%-2rem)] max-w-[1480px] scroll-mt-20 border border-[#294047] bg-[#091D22] sm:w-[calc(100%-3rem)]">
      <div className="grid border-b border-[#294047] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="px-4 py-5 sm:px-5">
          <div className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">
            <Lightbulb className="h-3.5 w-3.5" />
            Mejora continua · producto interno
          </div>
          <h2 className="mt-2 text-xl font-normal tracking-[-0.02em] text-[#E7DFCE] sm:text-2xl">Cómo mejorar VIDENTIA</h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#AEB6B4]">Convierte fricción operacional, gaps de evidencia, frescura de ejecución y telemetría del Assistant en mejoras concretas del producto. Cada propuesta debe demostrar impacto antes de incorporarse al sistema.</p>
        </div>
        <div className="grid min-w-[310px] grid-cols-3 border-t border-[#294047] lg:border-l lg:border-t-0">
          <MiniMetric label="Señales" value={String(radar.observedSignalCount)} note="internas observadas" />
          <MiniMetric label="Mejoras" value={String(radar.candidates.length)} note="para validar" />
          <MiniMetric label="Auto-decisión" value="0" note="siempre humana" />
        </div>
      </div>

      {primary ? (
        <div className="grid border-b border-[#294047] xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="bg-[#0C2327] px-4 py-5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityLabel priority={primary.priority} />
              <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">confianza de recomendación {primary.confidence}</span>
            </div>
            <p className="mt-3 text-[9px] font-medium uppercase tracking-[0.12em] text-[#83908F]">Hallazgo</p>
            <p className="mt-1.5 text-sm leading-6 text-[#E7DFCE]">{primary.finding}</p>
            <p className="mt-3 text-[9px] leading-4 text-[#748481]">Fuente: {primary.source}</p>
          </div>
          <div className="grid sm:grid-cols-3">
            <ImprovementCell label="Mejora propuesta" value={primary.proposal} />
            <ImprovementCell label="Impacto esperado" value={primary.expectedImpact} />
            <ImprovementCell label="Cómo validarla" value={primary.validation} last />
          </div>
        </div>
      ) : null}

      {rest.length ? (
        <div className="divide-y divide-[#294047]">
          {rest.map(item => <ImprovementRow key={item.id} item={item} />)}
        </div>
      ) : (
        <p className="px-5 py-6 text-[11px] leading-5 text-[#83908F]">No hay nuevas brechas observadas en las fuentes disponibles. El radar conserva ese vacío como estado válido.</p>
      )}

      <div className="flex flex-col gap-3 border-t border-[#294047] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex max-w-4xl items-start gap-2 text-[10px] leading-4 text-[#83908F]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#719B8D]" />
          <span>{radar.boundary}</span>
        </div>
        <Link href="/mi-espacio?assistant=open" className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-[#173B37] px-3 text-xs font-medium text-[#DCE8E2] ring-1 ring-inset ring-[#31534D] hover:bg-[#1A4540]">
          Analizar con VIDENTIA <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

function ImprovementRow({ item }: { item: VidentiaImprovementCandidate }) {
  return (
    <article className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityLabel priority={item.priority} />
          <span className="text-[9px] uppercase tracking-[0.1em] text-[#748481]">{item.sourceKind === "product_observability" ? "observabilidad" : "señal canónica interna"}</span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#D6DDDA]">{item.finding}</p>
        <p className="mt-2 text-[9px] leading-4 text-[#748481]">{item.source}</p>
      </div>
      <div>
        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Mejora propuesta</p>
        <p className="mt-1.5 text-[11px] leading-5 text-[#D2D8D6]">{item.proposal}</p>
      </div>
      <div>
        <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#83908F]">Validación</p>
        <p className="mt-1.5 text-[10px] leading-4 text-[#AEB6B4]">{item.validation}</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.09em] text-[#748481]">Impacto: {item.expectedImpact}</p>
      </div>
    </article>
  )
}

function ImprovementCell({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`px-4 py-5 sm:px-5 ${last ? "" : "border-b border-[#294047] sm:border-b-0 sm:border-r"}`}>
      <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">{label}</p>
      <p className="mt-2 text-[11px] leading-5 text-[#D2D8D6]">{value}</p>
    </div>
  )
}

function MiniMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-r border-[#294047] px-3 py-4 last:border-r-0 sm:px-4">
      <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-[#748481]">{label}</p>
      <div className="mt-1 flex items-center gap-1.5"><Gauge className="h-3 w-3 text-[#719B8D]" /><span className="text-lg font-normal text-[#E7DFCE]">{value}</span></div>
      <p className="mt-0.5 text-[8px] leading-3 text-[#748481]">{note}</p>
    </div>
  )
}

function PriorityLabel({ priority }: { priority: VidentiaImprovementCandidate["priority"] }) {
  const className = priority === "alta" ? "text-[#D8C99D]" : priority === "media" ? "text-[#96B5A6]" : "text-[#83908F]"
  return <span className={`text-[9px] font-medium uppercase tracking-[0.12em] ${className}`}>Prioridad {priority}</span>
}
