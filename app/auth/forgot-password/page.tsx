import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-3">Recuperación de contraseña</h1>
        <p className="text-muted-foreground mb-6">
          Si necesitas restablecer acceso, usa el flujo de recuperación de Supabase o contacta soporte mientras
          dejamos esta vista lista para producción.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Volver al inicio de sesión</Link>
        </Button>
      </Card>
    </div>
  )
}
