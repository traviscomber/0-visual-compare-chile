import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Cpu, Cloud, Lock, Zap } from "lucide-react"

export function TecnologiaAvanzada() {
  const technologies = [
    {
      category: "Frontend",
      icon: Zap,
      items: ["HTML5", "CSS3", "JavaScript ES6+", "TensorFlow.js", "SQL.js"]
    },
    {
      category: "Backend & Procesamiento",
      icon: Cloud,
      items: ["Node.js", "PHP", "MobileNetV2 (IA)", "Similitud de Coseno"]
    },
    {
      category: "Base de Datos",
      icon: Cpu,
      items: ["SQLite (local)", "PostgreSQL (Cloud)", "Sincronización automática"]
    },
    {
      category: "Seguridad",
      icon: Lock,
      items: ["Encriptación end-to-end", "Auditoría de accesos", "RLS (Row Level Security)"]
    }
  ]

  return (
    <section id="tecnologia" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-foreground">Arquitectura Técnica</h2>
          <p className="mt-3 text-lg text-muted-foreground">Stack moderno, escalable y seguro</p>
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
              <h4 className="font-semibold text-foreground mb-4">LogoCompare - Procesamiento IA</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>MobileNetV2 extrae características visuales de logos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Similitud de coseno compara embeddings en tiempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Score de similitud + decisión humana auditada</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Portabilidad & Escalabilidad</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>SQLite embebido para funcionamiento offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Migración automática: XAMPP → Cloud (CICLO DEV→QA→Producción)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Carga de 5,000 imágenes/mes sin downtime</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Auditoría & Compliance</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Registro completo de: usuario, fecha, IP, acción, resultado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Firma SHA256 para no-repudio de decisiones</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span>Control de versiones y RFC para cambios</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Seguridad de Datos</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔐</span>
                  <span>Encriptación end-to-end para imágenes y datos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔐</span>
                  <span>RLS (Row Level Security) en base de datos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔐</span>
                  <span>Cumplimiento regulatorio INAPI y OMPI</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
