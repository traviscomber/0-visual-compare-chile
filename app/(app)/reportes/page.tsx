import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ReportesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Card className="border-slate-700 bg-slate-800/50 p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Reportes y auditoría</h1>
        <p className="text-slate-300 mb-6">
          Esta vista queda como base para el historial de comparaciones y exportación de reportes.
        </p>
        <Button asChild>
          <Link href="/dashboard">Volver al resumen</Link>
        </Button>
      </Card>
    </div>
  )
}
