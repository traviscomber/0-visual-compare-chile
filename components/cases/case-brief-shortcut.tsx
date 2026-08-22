"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CaseBriefShortcut({ caseId }: { caseId: string }) {
  const pathname = usePathname()
  if (pathname.endsWith("/brief")) return null

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      <Button asChild className="shadow-lg">
        <Link href={`/casos/${caseId}/brief`}>
          <FileText className="mr-2 h-4 w-4" />
          Decision Brief
        </Link>
      </Button>
    </div>
  )
}
