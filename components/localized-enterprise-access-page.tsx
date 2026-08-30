import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, BriefcaseBusiness, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { localePath, type PublicLocale } from "@/lib/marketing-locale"
import { LocalizedEnterpriseAccessForm } from "@/components/localized-enterprise-access-form"

const copy = {
  es: {
    back: "Volver",
    eyebrow: "ACCESO EMPRESARIAL",
    title: "VIDENTIA completo para equipos que trabajan con marcas.",
    body: "La vista preliminar permite comprobar cobertura. El análisis profundo, los expedientes y la operación continua se habilitan dentro de un acceso empresarial.",
    context: "Contexto conservado",
    unlock: "Qué se habilita",
    included: ["Investigación completa y antecedentes sin recorte de preview", "Evaluación asistida y evidencia trazable", "Casos, expedientes, colaboración y reportes", "Vigilancia y seguimiento de marcas"],
    note: "No necesitas elegir entre plataforma o API en este paso. Revisamos organización, usuarios y uso esperado antes de definir la habilitación.",
  },
  en: {
    back: "Back",
    eyebrow: "ENTERPRISE ACCESS",
    title: "Full VIDENTIA for teams working with trademarks.",
    body: "The preliminary view lets you verify coverage. Deep analysis, case files and continuous operations are enabled inside an enterprise workspace.",
    context: "Context preserved",
    unlock: "What gets unlocked",
    included: ["Complete research and prior rights without preview redaction", "Assisted evaluation and traceable evidence", "Cases, files, collaboration and reports", "Trademark monitoring and follow-up"],
    note: "You do not need to choose between platform and API at this stage. We review your organization, users and expected use before defining access.",
  },
} as const

type Params = Record<string, string | string[] | undefined>
function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value }

export async function LocalizedEnterpriseAccessPage({ locale, searchParams }: { locale: PublicLocale; searchParams: Promise<Params> }) {
  const t = copy[locale]
  const params = await searchParams
  const brand = (first(params.marca) ?? "").trim().slice(0, 120)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const next = `${localePath(locale, "/acceso-empresarial")}${brand ? `?marca=${encodeURIComponent(brand)}` : ""}`
    redirect(`${localePath(locale, "/auth/sign-up")}?redirectTo=${encodeURIComponent(next)}`)
  }

  const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user.id).maybeSingle()
  const initialCompany = (profile?.company_name || user.user_metadata?.company_name || "").toString().slice(0, 160)

  return (
    <main className="min-h-svh bg-[#0F2A33] text-white">
      <header className="border-b border-[#263D44] bg-[#091A20]">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 lg:px-8">
          <Link href={localePath(locale, "/demo")} className="inline-flex items-center gap-2 text-sm text-[#BDBEBD] hover:text-white"><ArrowLeft className="h-4 w-4" /> {t.back}</Link>
          <Link href={localePath(locale)} className="text-[15px] font-light tracking-[0.22em] text-[#E7DFCE]">ViDENTiA</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8 lg:py-24">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#96B5A6]">{t.eyebrow}</p>
          <h1 className="mt-5 max-w-[11ch] text-5xl font-light leading-[0.98] tracking-[-0.05em] text-[#E7DFCE] sm:text-6xl">{t.title}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#BDBEBD]">{t.body}</p>
          {brand ? <p className="mt-5 text-sm text-[#96B5A6]">{t.context}: {brand}</p> : null}
          <div className="mt-10 border-y border-[#263D44] py-7">
            <div className="flex items-center gap-3 text-[#E7DFCE]"><BriefcaseBusiness className="h-5 w-5 text-[#96B5A6]" /><h2 className="text-xl font-light tracking-[-0.03em]">{t.unlock}</h2></div>
            <div className="mt-5 divide-y divide-[#263D44] border-y border-[#263D44]">{t.included.map((item) => <div key={item} className="flex items-start gap-3 py-4 text-sm leading-6 text-[#BDBEBD]"><Check className="mt-1 h-4 w-4 shrink-0 text-[#96B5A6]" /><span>{item}</span></div>)}</div>
          </div>
        </div>
        <div className="lg:mt-2"><LocalizedEnterpriseAccessForm locale={locale} initialCompany={initialCompany} brandContext={brand} /><p className="mt-4 max-w-lg text-xs leading-5 text-[#83908F]">{t.note}</p></div>
      </section>
    </main>
  )
}
