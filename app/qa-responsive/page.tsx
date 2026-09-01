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

export default async function ResponsiveQaPage({ searchParams }: { searchParams?: Promise<{ path?: string; width?: string }> }) {
  const params = await searchParams
  const requestedPath = params?.path ?? "/"
  const requestedWidth = Number(params?.width ?? "390")
  const path = allowedPaths.has(requestedPath) ? requestedPath : "/"
  const width = allowedWidths.has(requestedWidth) ? requestedWidth : 390

  return (
    <main className="min-h-screen overflow-auto bg-neutral-950 p-6 text-white">
      <div className="mx-auto w-max">
        <div className="mb-3 flex items-center justify-between gap-8 font-mono text-xs text-neutral-400">
          <span>{path}</span>
          <span>{width}px viewport</span>
        </div>
        <iframe
          title={`${path} at ${width}px`}
          src={path}
          className="block border border-neutral-700 bg-white"
          style={{ width: `${width}px`, height: "900px" }}
        />
      </div>
    </main>
  )
}
