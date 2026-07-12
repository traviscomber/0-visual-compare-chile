import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, Palette, AlertCircle } from "lucide-react"

export function ClasificacionesNizaViena() {
  return (
    <section id="clasificaciones" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <Badge variant="outline" className="mb-4 gap-1.5 rounded-full border-border bg-card px-3 py-1 text-xs font-medium">
            <Package className="h-3 w-3" />
            Est&aacute;ndares internacionales
          </Badge>
          <h2 className="text-4xl font-bold text-foreground text-balance">Clasificaciones que usamos</h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            El sistema de marcas en Chile opera bajo dos clasificaciones internacionales. Entenderlas es clave para detectar conflictos correctamente.
          </p>
        </div>

        <Tabs defaultValue="niza" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="niza">Sistema Niza</TabsTrigger>
            <TabsTrigger value="viena">Sistema Viena</TabsTrigger>
          </TabsList>

          <TabsContent value="niza">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-2xl font-semibold text-foreground">Clasificaci&oacute;n de Niza</h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Organiza los <strong className="text-foreground">productos y servicios</strong> que una marca protege.
                  45 clases (1&ndash;34 productos, 35&ndash;45 servicios). Dos marcas pueden coexistir si est&aacute;n en clases distintas.
                </p>

                <div className="space-y-3">
                  <InfoCard
                    title="Qu&eacute; clasifica"
                    description="Productos y servicios protegidos por la marca registrada."
                    tone="amber"
                  />
                  <InfoCard
                    title="Estructura"
                    description="45 clases: 1&ndash;34 productos, 35&ndash;45 servicios."
                    tone="amber"
                  />
                  <InfoCard
                    title="Por qu&eacute; importa"
                    description="Determina el alcance legal de protecci&oacute;n y los conflictos potenciales."
                    tone="amber"
                  />
                </div>

                <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Conflicto frecuente:</strong> marcas similares en la misma clase Niza son el principal motivo de oposici&oacute;n en el INAPI.
                  </p>
                </div>
              </div>

              <Card className="border-amber-500/30 bg-amber-500/10 p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">Ejemplo pr&aacute;ctico</p>
                <p className="mb-4 font-semibold text-foreground">Caso real: marca &ldquo;TROPICAL&rdquo;</p>
                <div className="space-y-4 text-sm">
                  <div className="rounded-lg bg-background/30 p-3">
                    <p className="font-medium text-foreground">Jugo de frutas &rarr; <span className="text-amber-400">Clase 32</span></p>
                    <p className="text-muted-foreground text-xs mt-1">Bebidas sin alcohol, jugos, aguas minerales</p>
                  </div>
                  <div className="rounded-lg bg-background/30 p-3">
                    <p className="font-medium text-foreground">Ropa deportiva &rarr; <span className="text-primary">Clase 25</span></p>
                    <p className="text-muted-foreground text-xs mt-1">Prendas de vestir, calzado, sombrerería</p>
                  </div>
                  <hr className="border-amber-500/20" />
                  <p className="text-xs text-muted-foreground">
                    La misma marca en distintas clases puede coexistir sin conflicto legal. Visual Compare Chile detecta autom&aacute;ticamente la clase de cada registro.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="viena">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-2xl font-semibold text-foreground">Clasificaci&oacute;n de Viena</h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  Categoriza los <strong className="text-foreground">elementos figurativos</strong> de una marca: formas, colores, s&iacute;mbolos, animales. Es la base del an&aacute;lisis visual que realizamos.
                </p>

                <div className="space-y-3">
                  <InfoCard
                    title="Qu&eacute; clasifica"
                    description="Elementos visuales: colores, formas geom&eacute;tricas y s&iacute;mbolos."
                    tone="violet"
                  />
                  <InfoCard
                    title="Estructura"
                    description="29 categor&iacute;as principales de elementos visuales jerárquicos."
                    tone="violet"
                  />
                  <InfoCard
                    title="Por qu&eacute; importa"
                    description="Permite buscar marcas con elementos figurativos similares aunque tengan nombres distintos."
                    tone="violet"
                  />
                </div>

                <div className="mt-6 flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                  <Palette className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Clave visual:</strong> dos marcas con nombres distintos pero figuras similares (hexágono azul) pueden constituir conflicto. Viena permite detectarlo.
                  </p>
                </div>
              </div>

              <Card className="border-violet-500/30 bg-violet-500/10 p-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-400">Categor&iacute;as comunes</p>
                <p className="mb-4 font-semibold text-foreground">Elementos figurativos m&aacute;s registrados</p>
                <div className="space-y-2 text-sm">
                  <ClassRow label="Animales reales" code="Cat. 01" pct="18%" />
                  <ClassRow label="S&iacute;mbolos y decoraci&oacute;n" code="Cat. 02" pct="14%" />
                  <ClassRow label="Formas geom&eacute;tricas" code="Cat. 03" pct="22%" />
                  <ClassRow label="Texto y letras estilizadas" code="Cat. 04" pct="31%" />
                  <ClassRow label="Colores combinados" code="Cat. 05" pct="9%" />
                </div>
                <p className="mt-4 text-xs text-muted-foreground border-t border-violet-500/20 pt-3">
                  Distribuci&oacute;n aproximada en base INAPI Chile 2024.
                </p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

function InfoCard({
  title,
  description,
  tone,
}: {
  title: string
  description: string
  tone: "amber" | "violet"
}) {
  return (
    <Card className={tone === "amber" ? "border-amber-500/30 bg-amber-500/10 p-4" : "border-violet-500/30 bg-violet-500/10 p-4"}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description }} />
    </Card>
  )
}

function ClassRow({ label, code, pct }: { label: string; code: string; pct: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground flex-1" dangerouslySetInnerHTML={{ __html: label }} />
      <div className="flex items-center gap-2">
        <div className="h-1.5 rounded-full bg-violet-500/30 w-16 overflow-hidden">
          <div className="h-full rounded-full bg-violet-400" style={{ width: pct }} />
        </div>
        <span className="text-xs font-semibold text-primary w-12 text-right">{code}</span>
      </div>
    </div>
  )
}
