import Link from "next/link"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CaseCollaborationShortcut({ caseId }: { caseId: string }) {
  return <div className="fixed bottom-5 right-5 z-40 print:hidden"><Button asChild variant="secondary" className="shadow-lg"><Link href={`/casos/${caseId}/equipo`}><Users className="mr-2 h-4 w-4"/>Equipo</Link></Button></div>
}
