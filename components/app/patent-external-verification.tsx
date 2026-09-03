import { ExternalLink } from "lucide-react"

type PriorityClaim = { country: string | null; number: string; date: string }

type PatentExternalVerificationProps = {
  applicationNumber: string | null
  title: string
  priorityClaims: PriorityClaim[]
}

export function PatentExternalVerification({ applicationNumber, title, priorityClaims }: PatentExternalVerificationProps) {
  const primaryPriority = priorityClaims[0] ?? null
  const lookup = primaryPriority
    ? `${primaryPriority.country ? `${primaryPriority.country} ` : ""}${primaryPriority.number}`.trim()
    : applicationNumber?.trim() || title.trim()

  if (!lookup) return null

  const googleQuery = lookup
  const patentscopeQuery = `ALLNUM:(${lookup})`
  const espacenetQuery = primaryPriority
    ? `${primaryPriority.number.toUpperCase().startsWith("PCT/") ? "num" : "pr"}="${lookup.replace(/\s+/g, "")}"`
    : applicationNumber
      ? `num="${applicationNumber.replace(/\s+/g, "")}"`
      : `ta="${title.replace(/"/g, " ").slice(0, 120)}"`

  const sources = [
    { label: "Google Patents", href: `https://patents.google.com/?q=${encodeURIComponent(googleQuery)}` },
    { label: "PATENTSCOPE", href: `https://patentscope.wipo.int/search/en/result.jsf?query=${encodeURIComponent(patentscopeQuery)}` },
    { label: "Espacenet", href: `https://worldwide.espacenet.com/patent/search?q=${encodeURIComponent(espacenetQuery)}` },
  ]

  return <div className="mt-4 border-t border-border/70 pt-3">
    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#96B5A6]">Verificación internacional</p>
    <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Consulta externa preparada desde {primaryPriority ? "la prioridad observada" : applicationNumber ? "el número de solicitud" : "el título"}. Apertura manual; VIDENTIA no automatiza ni scrapea estas interfaces.</p>
    <div className="mt-2 space-y-1.5">{sources.map(source => <a key={source.label} href={source.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-[#BDBEBD] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6]">
      {source.label}<ExternalLink className="h-3 w-3" />
    </a>)}</div>
  </div>
}
