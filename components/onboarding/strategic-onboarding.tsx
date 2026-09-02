"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DISCOVERY_GOALS,
  STRATEGIC_FOCUS_OPTIONS,
  type OrganizationIntelligenceProfile,
} from "@/lib/onboarding/profile"
import { cn } from "@/lib/utils"

type Organization = {
  id: string
  name: string
  slug: string
  role: string | null
}

type SiteAnalysis = {
  website: string
  analysis: {
    company_name: string
    summary: string
    industry: string
    country: string
    offerings: string[]
    capabilities: string[]
  }
}

export function StrategicOnboarding({
  organization,
  initialProfile,
}: {
  organization: Organization
  initialProfile: OrganizationIntelligenceProfile
}) {
  const router = useRouter()
  const [step, setStep] = useState(Math.min(4, Math.max(1, initialProfile.onboarding_step || 1)))
  const [website, setWebsite] = useState(initialProfile.website ?? "")
  const [companyName, setCompanyName] = useState(organization.name ?? "")
  const [summary, setSummary] = useState(initialProfile.company_summary ?? "")
  const [industry, setIndustry] = useState(initialProfile.industry ?? "")
  const [country, setCountry] = useState(initialProfile.country ?? "")
  const [offerings, setOfferings] = useState(initialProfile.offerings ?? [])
  const [capabilities, setCapabilities] = useState(initialProfile.capabilities ?? [])
  const [goals, setGoals] = useState(initialProfile.discovery_goals ?? [])
  const [focus, setFocus] = useState(initialProfile.strategic_focus ?? "")
  const [analyzed, setAnalyzed] = useState(Boolean(initialProfile.company_summary || initialProfile.industry || initialProfile.offerings.length || initialProfile.capabilities.length))
  const [busy, setBusy] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const progress = step * 25
  const canContinue = useMemo(() => {
    if (step === 1) return website.trim().length >= 3 || companyName.trim().length >= 2
    if (step === 3) return goals.length > 0
    if (step === 4) return Boolean(focus)
    return true
  }, [step, website, companyName, goals, focus])

  async function analyzeSite() {
    if (!website.trim()) return
    setAnalyzing(true)
    setError(null)
    try {
      const response = await fetch("/api/onboarding/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website }),
      })
      const data = await response.json() as SiteAnalysis & { error?: string }
      if (!response.ok) throw new Error(data.error || "No pudimos analizar el sitio.")

      setWebsite(data.website || website)
      setCompanyName(data.analysis.company_name || companyName)
      setSummary(data.analysis.summary || summary)
      setIndustry(data.analysis.industry || industry)
      setCountry(data.analysis.country || country)
      if (data.analysis.offerings.length) setOfferings(data.analysis.offerings)
      if (data.analysis.capabilities.length) setCapabilities(data.analysis.capabilities)
      setAnalyzed(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos analizar el sitio. Puedes continuar manualmente.")
    } finally {
      setAnalyzing(false)
    }
  }

  async function save(nextStep: number, completed = false) {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/onboarding/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website,
          company_name: companyName,
          company_summary: summary,
          industry,
          country,
          offerings,
          capabilities,
          discovery_goals: goals,
          strategic_focus: focus,
          onboarding_step: Math.min(4, Math.max(1, nextStep)),
          completed,
        }),
      })
      const data = await response.json() as { error?: string; profile?: OrganizationIntelligenceProfile }
      if (!response.ok) throw new Error(data.error || "No pudimos guardar los cambios.")

      if (completed) {
        router.push("/dashboard")
        router.refresh()
        return
      }
      setStep(Math.min(4, Math.max(1, nextStep)))
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar los cambios.")
    } finally {
      setBusy(false)
    }
  }

  function toggleGoal(value: string) {
    setGoals(current => current.includes(value)
      ? current.filter(item => item !== value)
      : current.length < 5 ? [...current, value] : current)
  }

  return (
    <main className="min-h-screen bg-[#08181D] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1380px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-white/8 px-5 py-5 sm:px-8 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#96B5A6]">VIDENTIA</p>
              <p className="mt-1 text-sm text-white/58">Perfil estratégico</p>
            </div>
            <p className="text-xs tabular-nums text-white/45 lg:mt-10">{String(step).padStart(2, "0")} / 04</p>
          </div>

          <div className="mt-5 h-px w-full bg-white/10 lg:mt-4">
            <div className="h-px bg-[#96B5A6] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>

          <nav aria-label="Progreso del onboarding" className="mt-7 hidden space-y-5 lg:block">
            {[
              "Tu empresa",
              "Qué haces",
              "Qué quieres descubrir",
              "Tu foco",
            ].map((label, index) => {
              const itemStep = index + 1
              const active = itemStep === step
              const complete = itemStep < step
              return (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    "flex size-6 items-center justify-center rounded-full border text-[10px] tabular-nums",
                    active ? "border-[#96B5A6] text-[#C8DED4]" : complete ? "border-[#96B5A6]/40 bg-[#96B5A6]/10 text-[#96B5A6]" : "border-white/10 text-white/30",
                  )}>
                    {complete ? <Check className="size-3" /> : itemStep}
                  </span>
                  <span className={active ? "text-white" : complete ? "text-white/60" : "text-white/28"}>{label}</span>
                </div>
              )
            })}
          </nav>
        </aside>

        <section className="flex min-h-0 items-start justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-14 lg:py-16 xl:px-20">
          <div className="w-full max-w-[780px]">
            {step === 1 ? (
              <StepCompany
                website={website}
                companyName={companyName}
                summary={summary}
                industry={industry}
                country={country}
                analyzed={analyzed}
                analyzing={analyzing}
                onWebsite={setWebsite}
                onCompanyName={setCompanyName}
                onSummary={setSummary}
                onIndustry={setIndustry}
                onCountry={setCountry}
                onAnalyze={analyzeSite}
              />
            ) : null}

            {step === 2 ? (
              <StepCapabilities
                offerings={offerings}
                capabilities={capabilities}
                onOfferings={setOfferings}
                onCapabilities={setCapabilities}
              />
            ) : null}

            {step === 3 ? (
              <StepDiscovery goals={goals} onToggle={toggleGoal} />
            ) : null}

            {step === 4 ? (
              <StepFocus focus={focus} onFocus={setFocus} />
            ) : null}

            {error ? (
              <div role="alert" className="mt-7 border-l border-[#D6A46F] pl-4 text-sm leading-6 text-[#E7C79F]">
                {error}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-6">
              <Button
                type="button"
                variant="ghost"
                className={cn("-ml-3", step === 1 && "invisible")}
                disabled={busy || analyzing || step === 1}
                onClick={() => setStep(current => Math.max(1, current - 1))}
              >
                <ArrowLeft /> Atrás
              </Button>

              {step < 4 ? (
                <Button type="button" size="lg" disabled={!canContinue || busy || analyzing} onClick={() => save(step + 1)}>
                  {busy ? <LoaderCircle className="animate-spin" /> : null}
                  Continuar <ArrowRight />
                </Button>
              ) : (
                <Button type="button" size="lg" disabled={!canContinue || busy} onClick={() => save(4, true)}>
                  {busy ? <LoaderCircle className="animate-spin" /> : null}
                  Iniciar investigación <ArrowRight />
                </Button>
              )}
            </div>

            <p className="mt-5 text-xs leading-5 text-white/35">
              Sólo pedimos lo necesario para empezar. Podrás mejorar este perfil después mientras Videntia aprende qué contexto falta.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function StepCompany({
  website,
  companyName,
  summary,
  industry,
  country,
  analyzed,
  analyzing,
  onWebsite,
  onCompanyName,
  onSummary,
  onIndustry,
  onCountry,
  onAnalyze,
}: {
  website: string
  companyName: string
  summary: string
  industry: string
  country: string
  analyzed: boolean
  analyzing: boolean
  onWebsite: (value: string) => void
  onCompanyName: (value: string) => void
  onSummary: (value: string) => void
  onIndustry: (value: string) => void
  onCountry: (value: string) => void
  onAnalyze: () => void
}) {
  return (
    <div>
      <StepHeading
        index="01"
        title="Tu empresa"
        description="Partamos por lo más simple. Ingresa tu sitio y Videntia intentará entender el resto por ti."
      />

      <label className="mt-9 block text-xs font-medium uppercase tracking-[0.14em] text-white/48" htmlFor="company-website">Sitio web</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="company-website"
          type="url"
          value={website}
          onChange={event => onWebsite(event.target.value)}
          placeholder="empresa.cl"
          autoComplete="url"
          className="h-12 min-w-0 flex-1 rounded-[10px] border border-white/10 bg-white/[0.035] px-4 text-base text-white outline-none transition placeholder:text-white/24 focus:border-[#96B5A6]/60 focus:ring-2 focus:ring-[#96B5A6]/15"
        />
        <Button type="button" variant="outline" size="lg" disabled={!website.trim() || analyzing} onClick={onAnalyze}>
          {analyzing ? <LoaderCircle className="animate-spin" /> : <Search />}
          {analyzing ? "Analizando" : "Analizar sitio"}
        </Button>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/35">Nada se acepta automáticamente. Tú confirmas lo que Videntia detecte.</p>

      {analyzed ? (
        <div className="mt-9 border-t border-white/8 pt-7">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">Esto entendimos</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Empresa" value={companyName} onChange={onCompanyName} />
            <Field label="Industria" value={industry} onChange={onIndustry} />
            <Field label="País" value={country} onChange={onCountry} />
          </div>
          <label className="mt-5 block text-xs text-white/48" htmlFor="company-summary">Descripción breve</label>
          <textarea
            id="company-summary"
            value={summary}
            onChange={event => onSummary(event.target.value)}
            rows={3}
            maxLength={1200}
            className="mt-2 w-full resize-none rounded-[10px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/24 focus:border-[#96B5A6]/60 focus:ring-2 focus:ring-[#96B5A6]/15"
          />
        </div>
      ) : (
        <p className="mt-8 text-sm leading-6 text-white/35">Si prefieres, continúa y completa los datos más adelante.</p>
      )}
    </div>
  )
}

function StepCapabilities({
  offerings,
  capabilities,
  onOfferings,
  onCapabilities,
}: {
  offerings: string[]
  capabilities: string[]
  onOfferings: (value: string[]) => void
  onCapabilities: (value: string[]) => void
}) {
  return (
    <div>
      <StepHeading
        index="02"
        title="Qué haces"
        description="Confirma lo que ofreces y lo que tu organización ya sabe hacer. Esto ayuda a descartar oportunidades que no tienen sentido para ti."
      />
      <div className="mt-9 space-y-9">
        <TagEditor
          label="Productos y servicios"
          hint="Lo que entregas hoy"
          items={offerings}
          placeholder="Agregar producto o servicio"
          onChange={onOfferings}
        />
        <TagEditor
          label="Capacidades"
          hint="Lo que podrías reutilizar"
          items={capabilities}
          placeholder="Agregar capacidad"
          onChange={onCapabilities}
        />
      </div>
    </div>
  )
}

function StepDiscovery({ goals, onToggle }: { goals: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <StepHeading
        index="03"
        title="Qué quieres descubrir"
        description="Elige las señales que más te interesa encontrar. Puedes cambiarlas después."
      />
      <p className="mt-8 text-xs uppercase tracking-[0.14em] text-white/35">Selecciona hasta 5</p>
      <div className="mt-3 divide-y divide-white/8 border-y border-white/8">
        {DISCOVERY_GOALS.map(option => {
          const selected = goals.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(option.value)}
              className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]/50"
            >
              <span className={cn("text-[15px]", selected ? "text-white" : "text-white/62")}>{option.label}</span>
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-[#96B5A6] bg-[#96B5A6] text-[#08181D]" : "border-white/14 text-transparent",
              )}>
                <Check className="size-3.5" />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepFocus({ focus, onFocus }: { focus: string; onFocus: (value: string) => void }) {
  return (
    <div>
      <StepHeading
        index="04"
        title="Tu foco"
        description="¿Qué quieres conseguir principalmente? Esta respuesta orienta cómo Videntia prioriza lo que encuentre."
      />
      <div className="mt-9 grid gap-px overflow-hidden rounded-[10px] bg-white/8 sm:grid-cols-2">
        {STRATEGIC_FOCUS_OPTIONS.map(option => {
          const selected = focus === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onFocus(option.value)}
              className={cn(
                "flex min-h-[82px] items-center justify-between gap-4 bg-[#0D2025] px-5 py-4 text-left transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]/60",
                selected ? "bg-[#17342F] text-white" : "text-white/62 hover:bg-[#11272C] hover:text-white",
              )}
            >
              <span className="text-[15px] leading-5">{option.label}</span>
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-[#96B5A6] bg-[#96B5A6] text-[#08181D]" : "border-white/14 text-transparent",
              )}>
                <Check className="size-3.5" />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepHeading({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <header>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">{index} / 04</p>
      <h1 className="mt-3 max-w-[12ch] text-[clamp(2.5rem,6vw,4.7rem)] font-light leading-[0.98] tracking-[-0.045em] text-[#E7DFCE]">{title}</h1>
      <p className="mt-5 max-w-[620px] text-[15px] leading-7 text-white/58 sm:text-base">{description}</p>
    </header>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs text-white/48">{label}</span>
      <input
        id={id}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-[10px] border border-white/10 bg-white/[0.035] px-3.5 text-sm text-white outline-none transition focus:border-[#96B5A6]/60 focus:ring-2 focus:ring-[#96B5A6]/15"
      />
    </label>
  )
}

function TagEditor({
  label,
  hint,
  items,
  placeholder,
  onChange,
}: {
  label: string
  hint: string
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}) {
  const [draft, setDraft] = useState("")

  function add() {
    const value = draft.trim()
    if (!value || items.some(item => item.toLowerCase() === value.toLowerCase()) || items.length >= 20) return
    onChange([...items, value])
    setDraft("")
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-white">{label}</h2>
        <span className="text-xs text-white/32">{hint}</span>
      </div>
      {items.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map(item => (
            <span key={item} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#173036] px-3 text-sm text-white/78">
              {item}
              <button
                type="button"
                aria-label={`Quitar ${item}`}
                className="rounded-full p-0.5 text-white/40 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]/60"
                onClick={() => onChange(items.filter(current => current !== item))}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/30">Todavía no hay elementos. Puedes seguir y completarlos después.</p>
      )}
      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              add()
            }
          }}
          maxLength={160}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-white/10 bg-white/[0.035] px-3.5 text-sm text-white outline-none transition placeholder:text-white/24 focus:border-[#96B5A6]/60 focus:ring-2 focus:ring-[#96B5A6]/15"
        />
        <Button type="button" variant="outline" size="icon" aria-label={placeholder} disabled={!draft.trim()} onClick={add}>
          <Plus />
        </Button>
      </div>
    </section>
  )
}
