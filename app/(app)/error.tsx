"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[videntia] app segment error", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1480px] items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-10 border-y border-[#263D44] py-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:py-14">
        <div>
          <div className="grid size-11 place-items-center rounded-[10px] bg-[#C46A61]/10 text-[#D8897F] ring-1 ring-inset ring-[#C46A61]/20">
            <AlertTriangle className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <p className="mt-6 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#83908F]">VIDENTIA / SISTEMA</p>
          <h1 className="mt-3 max-w-[9ch] text-4xl font-light leading-[0.98] tracking-[-0.045em] text-[#E7DFCE] sm:text-5xl">
            Esta vista no pudo cargarse.
          </h1>
        </div>

        <div className="max-w-2xl lg:justify-self-end">
          <p className="text-base leading-7 text-white">
            Reintenta la carga. Si el problema continúa, conserva la referencia técnica para poder identificar el fallo sin perder contexto.
          </p>
          {error.digest ? (
            <div className="mt-5 rounded-[9px] bg-[#13272D] px-4 py-3 ring-1 ring-inset ring-white/[0.04]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#738180]">Referencia técnica</p>
              <p className="mt-1 break-all font-mono text-xs text-[#BDBEBD]">{error.digest}</p>
            </div>
          ) : null}
          <Button
            onClick={reset}
            className="mt-6 h-10 rounded-[9px] bg-[#4A7F74] px-5 font-medium text-white shadow-[0_0_22px_rgba(74,127,116,0.12)] hover:bg-[#568D81]"
          >
            <RotateCcw data-icon="inline-start" className="size-4" strokeWidth={1.7} />
            Reintentar
          </Button>
        </div>
      </div>
    </div>
  )
}
