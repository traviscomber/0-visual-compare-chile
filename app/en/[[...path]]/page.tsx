import { redirect } from "next/navigation"

function buildTarget(path?: string[]) {
  if (!path || path.length === 0) return "/"
  return `/${path.join("/")}`
}

export default async function EnAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { path } = await params
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const target = buildTarget(path)
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry))
    } else if (typeof value === "string") {
      query.set(key, value)
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : ""
  redirect(`${target}${suffix}`)
}
