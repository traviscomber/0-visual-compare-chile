import { headers } from "next/headers"
import { resolveBuildEnvironment, resolveBuildRevision, shortRevision } from "@/lib/build-info"

export async function BuildStamp() {
  const revision = resolveBuildRevision()
  const environment = resolveBuildEnvironment()
  const headerStore = await headers()
  const host = headerStore.get("host") ?? "unknown-host"

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span className="rounded-full border border-border px-2 py-0.5">env {environment}</span>
      <span className="rounded-full border border-border px-2 py-0.5">rev {shortRevision(revision)}</span>
      <span className="rounded-full border border-border px-2 py-0.5">host {host}</span>
    </div>
  )
}
