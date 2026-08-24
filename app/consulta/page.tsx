import { redirect } from "next/navigation"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function LegacyConsultaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q.trim() : ""
  const type = typeof params.type === "string" ? params.type.trim() : ""
  const next = new URLSearchParams()

  if (q) next.set("q", q)
  if (type === "nombre" || type === "niza" || type === "viena") next.set("type", type)
  if (q) next.set("autorun", "1")

  redirect(`/consulta-inapi${next.size ? `?${next.toString()}` : ""}`)
}
