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
      <JuanVidentiaImprovementRadar userId={user.id} />
      <div id="oportunidades-institucionales" className="scroll-mt-20">
        <JuanProjectIdeasStrip userId={user.id} />
      </div>
      <div id="evolucion-productos" className="scroll-mt-20">
        <JuanProductEvolutionStrip userId={user.id} />
      </div>
    </main>
  )
}
