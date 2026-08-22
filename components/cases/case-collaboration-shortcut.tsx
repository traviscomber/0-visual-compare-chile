"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CaseCollaborationShortcut({ caseId }: { caseId: string }) {
  const pathname = usePathname()
  if (pathname.endsWith("/equipo")) return null
  return <div className="fixed bottom-16 right-5 z-40 print:hidden"><Button asChild variant="secondary" className="shadow-lg"><Link href={`/casos/${caseId}/equipo`}><Users className="mr-2 h-4 w-4"/>Equipo</Link></Button></div>
}
