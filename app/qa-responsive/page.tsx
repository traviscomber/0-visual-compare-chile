import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Responsive QA",
  robots: { index: false, follow: false },
}

const allowedPaths = new Set([
  "/",
  "/trademarks",
  "/patents",
  "/technologies",
  "/es/marcas",
  "/es/patentes",
  "/es/tecnologias",
])
const allowedWidths = new Set([360, 390, 768, 1024, 1280, 1440])
const allowedAnchors = new Set(["", "patent-preview-search"])

export default async function ResponsiveQaPage({ searchParams }: { searchParams?: Promise<{ path?: string; width?: string; anchor?: string }> }) {
  const params = await searchParams
  const requestedPath = params?.path ?? "/"
  const requestedWidth = Number(params?.width ?? "390")
  const requestedAnchor = params?.anchor ?? ""
  const path = allowedPaths.has(requestedPath) ? requestedPath : "/"
  const width = allowedWidths.has(requestedWidth) ? requestedWidth : 390
  const anchor = allowedAnchors.has(requestedAnchor) ? requestedAnchor : ""
  const src = anchor ? `${path}#${anchor}` : path

  return (
    <main className="min-h-screen overflow-auto bg-neutral-950 p-6 text-white">
      <div className="mx-auto w-max">
        <div className="mb-3 flex items-center justify-between gap-8 font-mono text-xs text-neutral-400">
          <span>{src}</span>
          <span>{width}px viewport</span>
        </div>
        <iframe
          title={`${src} at ${width}px`}
          src={src}
          className="block border border-neutral-700 bg-white"
          style={{ width: `${width}px`, height: "900px" }}
        />
      </div>
    </main>
  )
}
