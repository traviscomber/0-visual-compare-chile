import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, Cloud, Lock, Zap } from "lucide-react"

export function TecnologiaAvanzada() {
  const technologies = [
    {
      category: "Frontend",
      icon: Zap,
      items: ["Next.js", "React 19", "TypeScript", "Tailwind CSS", "shadcn/ui"]
    },
    {
      category: "Backend & Procesamiento",
      icon: Cloud,
      items: ["Supabase Auth", "Supabase Storage", "SHA-256", "pHash", "Diff visual"]
    },
    {
      category: "Base de Datos",
      icon: Cpu,
      items: ["PostgreSQL en Supabase", "RLS", "Historial de comparaciones"]
    },
    {
      category: "Seguridad",
      icon: Lock,
      items: ["Bucket privado", "Auditoría de accesos", "Rutas protegidas"]
    }
  ]

  return (
    <section id="tecnologia" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-foreground">Arquitectura Técnica</h2>
          <p className="mt-3 text-lg text-muted-foreground">Stack actual, estable y listo para piloto</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {technologies.map((tech, idx) => {
            const Icon = tech.icon
            return (
              <Card key={idx} className="border-border bg-card p-6">
                <Icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-4">{tech.category}</h3>
                <div className="space-y-2">
                  {tech.items.map((item, i) => (
                    <Badge key={i} variant="outline" className="w-full justify-start text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        <div className="rounded-xl border border-border bg-secondary/30 p-8">
          <h3 className="text-2xl font-semibold text-foreground mb-6">Características Clave</h3>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Visual Compare Chile - Procesamiento técnico</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>SHA-256 identifica duplicados exactos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>pHash y diff visual comparan similitud perceptual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Score de similitud + recomendación auditada</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Portabilidad & Escalabilidad</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Supabase mantiene sesiones, storage y datos compartidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Despliegue directo a Vercel con variables de entorno</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Carga enfocada en demo y piloto operativo</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Auditoría & Compliance</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Registro de usuario, fecha, acción y resultado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Firma SHA-256 para trazabilidad técnica</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Control de cambios y revisiones del flujo</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Seguridad de Datos</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔐</span>
                  <span>Bucket privado y acceso por sesión</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔐</span>
                  <span>RLS (Row Level Security) en base de datos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔐</span>
                  <span>Acceso por usuario y protección de datos del piloto</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
