import Link from "next/link"
import { ChevronDown, Sparkles } from "lucide-react"
import { redirect } from "next/navigation"
import { JuanExecutiveWorkspace } from "@/components/app/juan-executive-workspace"
import { JuanProjectIdeasStrip } from "@/components/app/juan-project-ideas-strip"
import { JuanProductEvolutionStrip } from "@/components/app/juan-product-evolution-strip"
import { JuanVidentiaImprovementRadar } from "@/components/app/juan-videntia-improvement-radar"
import { createClient } from "@/lib/supabase/server"

const JUAN_EMAIL = "juan@n3uralia.com"

export default async function JuanWorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  if (user.email?.trim().toLowerCase() !== JUAN_EMAIL) redirect("/dashboard")

  return (
    <main className="pb-10">
      <JuanExecutiveWorkspace userId={user.id} />

      <section className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-[1480px] flex-col gap-3 border-y border-[#294047] py-4 sm:w-[calc(100%-3rem)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#96B5A6]">Acceso directo</p>
          <p className="mt-1 text-xs leading-5 text-[#AEB6B4]">Pregunta, investiga o convierte una recomendación en una próxima acción sin salir de tu espacio.</p>
        </div>
        <Link
          href="/mi-espacio?assistant=open"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 bg-[#173B37] px-4 text-xs font-medium text-[#E7DFCE] ring-1 ring-inset ring-[#31534D] transition-colors hover:bg-[#1A4540]"
        >
          <Sparkles className="size-3.5 text-[#96B5A6]" />
          Preguntar a VIDENTIA
        </Link>
      </section>

      <details className="group mx-auto mt-4 w-[calc(100%-2rem)] max-w-[1480px] border border-[#294047] bg-[#091F24] sm:w-[calc(100%-3rem)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-[#E7DFCE] marker:hidden hover:bg-[#0D262B]">
          <span>
            <span className="block text-[9px] font-medium uppercase tracking-[0.15em] text-[#748481]">Segundo nivel</span>
            <span className="mt-1 block">Ver radar, oportunidades e inteligencia completa</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-[#96B5A6] transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-[#294047] pb-4">
          <JuanVidentiaImprovementRadar userId={user.id} />
          <div id="oportunidades-institucionales" className="scroll-mt-20">
            <JuanProjectIdeasStrip userId={user.id} />
          </div>
          <div id="evolucion-productos" className="scroll-mt-20">
            <JuanProductEvolutionStrip userId={user.id} />
          </div>
        </div>
      </details>
    </main>
  )
}
