import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ClasificacionesNizaViena() {
  return (
    <section id="clasificaciones" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-foreground">Clasificaciones internacionales</h2>
          <p className="mt-3 text-lg text-muted-foreground">Sistemas Niza y Viena para organizar marcas.</p>
        </div>

        <Tabs defaultValue="niza" className="w-full">
          <TabsList className="mx-auto mb-8 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="niza">Sistema Niza</TabsTrigger>
            <TabsTrigger value="viena">Sistema Viena</TabsTrigger>
          </TabsList>

          <TabsContent value="niza">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-2xl font-semibold text-foreground">Clasificación de Niza</h3>
                <p className="mb-6 text-muted-foreground">
                  Sistema de clasificación de productos y servicios usado en el registro de marcas.
                </p>

                <div className="space-y-4">
                  <InfoCard
                    title="Qué clasifica"
                    description="Productos y servicios protegidos por la marca."
                    tone="amber"
                  />
                  <InfoCard title="Estructura" description="45 clases: 1-34 productos, 35-45 servicios." tone="amber" />
                  <InfoCard
                    title="Propósito"
                    description="Estandarización global, claridad y prevención de conflictos."
                    tone="amber"
                  />
                </div>
              </div>

              <Card className="border-amber-500/30 bg-amber-500/10 p-6">
                <p className="mb-4 font-semibold text-foreground">Ejemplo práctico</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Marca: "TROPICAL"</p>
                    <p className="text-muted-foreground">Producto: Jugos de frutas</p>
                    <p className="mt-1 font-semibold text-primary">→ Clase 32: Bebidas sin alcohol</p>
                  </div>
                  <hr className="my-3 border-amber-500/30" />
                  <p className="text-xs text-muted-foreground">
                    La misma marca en ropa estaría en Clase 25, sin conflicto. Cada clase es independiente.
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="viena">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-2xl font-semibold text-foreground">Clasificación de Viena</h3>
                <p className="mb-6 text-muted-foreground">
                  Sistema jerárquico para clasificar elementos figurativos de marcas.
                </p>

                <div className="space-y-4">
                  <InfoCard
                    title="Qué clasifica"
                    description="Elementos visuales: colores, formas y símbolos."
                    tone="violet"
                  />
                  <InfoCard
                    title="Estructura"
                    description="29 categorías principales de elementos visuales."
                    tone="violet"
                  />
                  <InfoCard
                    title="Propósito"
                    description="Facilitar búsqueda visual y evitar duplicidad de registros."
                    tone="violet"
                  />
                </div>
              </div>

              <Card className="border-violet-500/30 bg-violet-500/10 p-6">
                <p className="mb-4 font-semibold text-foreground">Categorías comunes</p>
                <div className="space-y-2 text-sm">
                  <ClassRow label="Animales (reales)" code="Código 01" />
                  <ClassRow label="Símbolos / decoración" code="Código 02" />
                  <ClassRow label="Formas geométricas" code="Código 03" />
                  <ClassRow label="Texto / letras" code="Código 04" />
                  <ClassRow label="Colores combinados" code="Código 05" />
                </div>
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
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Card>
  )
}

function ClassRow({ label, code }: { label: string; code: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-primary">{code}</span>
    </div>
  )
}
