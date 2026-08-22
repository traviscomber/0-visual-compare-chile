import type { ReactNode } from "react"
import Link from "next/link"
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CasesLayout({ children }: { children: ReactNode }) {
  return <><div className="fixed bottom-5 left-5 z-40 print:hidden"><Button asChild variant="outline" className="bg-background/95 shadow-lg backdrop-blur"><Link href="/casos/pendientes"><Inbox className="mr-2 h-4 w-4"/>Mis pendientes</Link></Button></div>{children}</>
}
