import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { safeInternalRedirect } from "@/lib/redirect"
import { localePath } from "@/lib/marketing-locale"

export default async function SpanishSignUpSuccessPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const params = await searchParams
  const next = safeInternalRedirect(params?.next)
  return <main className="min-h-svh bg-background px-5 py-8 text-foreground sm:px-8"><div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-xl flex-col justify-center"><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">VIDENTIA / Confirmar acceso</p><CheckCircle2 className="mt-6 h-6 w-6 text-primary" /><h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Revisa tu correo.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Te enviamos un enlace de confirmación. Al validarlo, volverás a VIDENTIA y podrás usar la vista preliminar asociada a tu organización.</p><div className="mt-8 border-y border-border py-5"><p className="text-sm text-foreground">Este paso confirma la dirección de correo del acceso preliminar.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">La evaluación completa, los expedientes y la vigilancia se habilitan únicamente con acceso empresarial.</p></div><Button asChild variant="outline" className="mt-6 w-full sm:w-auto"><Link href={`${localePath("es", "/auth/login")}?redirectTo=${encodeURIComponent(next)}`}>Volver al acceso</Link></Button></div></main>
}
