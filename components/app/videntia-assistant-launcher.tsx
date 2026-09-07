import Link from "next/link"
import { Bot } from "lucide-react"

export function VidentiaAssistantLauncher() {
  return <Link
    href="/asistente"
    aria-label="Abrir Asistente VIDENTIA"
    className="fixed bottom-5 right-5 z-40 hidden items-center gap-2 border border-[#355C55] bg-[#091A20] px-4 py-2.5 text-xs font-medium text-[#E7DFCE] shadow-xl transition-colors hover:bg-[#132E34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] md:inline-flex"
  >
    <Bot className="size-4 text-[#96B5A6]" />
    Asistente
  </Link>
}
