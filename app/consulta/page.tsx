import { redirect } from "next/navigation"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function LegacyConsultaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : ""
  const type = typeof params.type === "string" ? params.type.trim() : ""

  if (type === "niza" || type === "viena") {
    const next = new URLSearchParams()
    if (q) next.set("q", q)
    redirect(`/investigar${next.size ? `?${next.toString()}` : ""}`)
  }

  const next = new URLSearchParams()
  if (q) next.set("q", q)
  next.set("type", "nombre")
  if (q) {
    next.set("match", "3")
    next.set("autorun", "1")
  }

  redirect(`/consulta-inapi${next.size ? `?${next.toString()}` : ""}`)
}
