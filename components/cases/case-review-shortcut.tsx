"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CaseReviewShortcut({ caseId }: { caseId: string }) {
  const pathname = usePathname()
  if (pathname.endsWith("/revision") || pathname.endsWith("/brief") || pathname.endsWith("/equipo")) return null
  return <div className="fixed bottom-5 right-56 z-40 print:hidden"><Button asChild variant="outline" className="shadow-lg"><Link href={`/casos/${caseId}/revision`}><ShieldCheck className="mr-2 h-4 w-4"/>Revisión</Link></Button></div>
}
