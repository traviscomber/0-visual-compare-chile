"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ExternalLink, GitBranch, Loader2, ShieldCheck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Organization = { id: string; name: string; slug: string; role: string }
type ReuseAsset = { title?: string; url?: string; reuse?: string }
type Handoff = {
  id: string
  idea_key: string
  idea_title: string
  score: number
  status: "ready_for_n3uralia" | "accepted" | "paused" | "closed"
  rationale: string
  capability_summary: string | null
  evidence_snapshot: Record<string, unknown> | null
  updated_at: string
}

export function ProjectHandoffDecisionBanner() {
  const [ideaKey, setIdeaKey] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [handoff, setHandoff] = useState<Handoff | null>(null)
  const [loading, setLoading] = useState(false)
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setIdeaKey(params.get("ideaKey")?.trim() || "")
    void loadOrganization()
  }, [])

  useEffect(() => {
    if (organizationId && ideaKey) void loadHandoff(organizationId, ideaKey)
  }, [organizationId, ideaKey])

  async function loadOrganization() {
    try {
      const response = await fetch("/api/intelligence/portfolio-binding", { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar la organización.")
      const organizations = (payload.organizations ?? []) as Organization[]
      setOrganizationId(organizations[0]?.id ?? "")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar la organización.")
    }
  }

  async function loadHandoff(nextOrganizationId: string, nextIdeaKey: string) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/intelligence/project-handoffs?organizationId=${encodeURIComponent(nextOrganizationId)}&ideaKey=${encodeURIComponent(nextIdeaKey)}`, { cache: "no-store" })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos cargar el estudio automático.")
      setHandoff((payload.handoff ?? null) as Handoff | null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos cargar el estudio automático.")
    } finally {
      setLoading(false)
    }
  }

  async function decide(decision: "approve" | "reject") {
    if (!organizationId || !ideaKey || deciding) return
    setDeciding(decision)
    setError(null)
    try {
      const response = await fetch("/api/intelligence/project-handoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, ideaKey, decision }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "No pudimos registrar tu decisión.")
      setHandoff(payload.handoff as Handoff)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos registrar tu decisión.")
    } finally {
      setDeciding(null)
    }
  }

  const snapshot = handoff?.evidence_snapshot && typeof handoff.evidence_snapshot === "object" ? handoff.evidence_snapshot : {}
  const researchSummary = useMemo(() => {
    const value = snapshot.research_summary
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
  }, [snapshot])
  const reuseAssets = useMemo(() => {
    const value = snapshot.reuse_assets
    return Array.isArray(value) ? value.filter(item => item && typeof item === "object") as ReuseAsset[] : []
  }, [snapshot])

  if (!ideaKey) return null
  if (loading && !handoff) return <div className="border-b border-border/80 bg-[#0E2428] px-4 py-3 text-xs text-muted-foreground"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />Cargando estudio automático…</div>
  if (!handoff) return error ? <div className="border-b border-[#7A5B41]/45 bg-[#332C24]/35 px-4 py-3 text-xs text-[#D6C3A8]">{error}</div> : null

  const approved = handoff.status === "accepted"
  const rejected = handoff.status === "closed"
  const waiting = handoff.status === "ready_for_n3uralia"
  const papers = Number(researchSummary.papers ?? 0)
  const patents = Number(researchSummary.patents ?? 0)
  const signals = Number(researchSummary.signals ?? 0)
  const codeAssets = Number(researchSummary.reuse_assets ?? reuseAssets.length)

  return <section className={`border-b ${approved ? "border-[#4C7565]/50 bg-[#102A2C]" : rejected ? "border-[#70514A]/45 bg-[#2A2020]" : "border-[#96B5A6]/35 bg-[#102A2C]"}`}>
    <div className="mx-auto flex w-[calc(100%-2rem)] max-w-[1480px] flex-col gap-4 py-5 sm:w-[calc(100%-3rem)] lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#96B5A6]">
          {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : rejected ? <XCircle className="h-3.5 w-3.5 text-[#C89D8D]" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {approved ? "Aprobado por Juan" : rejected ? "Rechazado por Juan" : "Estudio automático listo para decisión"}
        </div>
        <h2 className="mt-2 text-base font-medium text-white">{handoff.idea_title} <span className="font-normal text-[#96B5A6]">· {handoff.score}</span></h2>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-[#B8C4C1]">{handoff.rationale}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>{papers} papers</span><span>{patents} patentes</span><span>{signals} señales</span><span>{codeAssets} activos de código N3uralia</span>
        </div>
        {reuseAssets.length ? <div className="mt-3 flex flex-wrap gap-2">
          {reuseAssets.slice(0, 6).map((asset, index) => asset.url ? <a key={`${asset.url}:${index}`} href={asset.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#294047] px-2.5 py-1.5 text-[11px] text-[#B8D5C6] hover:border-[#4C7565] hover:text-white"><GitBranch className="h-3 w-3" />{asset.title || "Código reutilizable"}<ExternalLink className="h-3 w-3" /></a> : null)}
        </div> : null}
        {error ? <p className="mt-2 text-xs text-[#E0B987]">{error}</p> : null}
      </div>

      {waiting ? <div className="flex shrink-0 gap-2">
        <Button type="button" onClick={() => void decide("approve")} disabled={Boolean(deciding)}>{deciding === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Aprobar</Button>
        <Button type="button" variant="outline" onClick={() => void decide("reject")} disabled={Boolean(deciding)}>{deciding === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}Rechazar</Button>
      </div> : null}
    </div>
  </section>
}
