import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ClasificacionesNizaViena() {
  return (
    <section id="clasificaciones" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-foreground">Clasificaciones Internacionales</h2>
          <p className="mt-3 text-lg text-muted-foreground">Sistemas Niza y Viena para organización de marcas</p>
        </div>

        <Tabs defaultValue="niza" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="niza">Sistema Niza</TabsTrigger>
            <TabsTrigger value="viena">Sistema Viena</TabsTrigger>
          </TabsList>

          <TabsContent value="niza">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Clasificación de Niza</h3>
                <p className="text-muted-foreground mb-6">
                  Sistema de clasificación de productos y servicios usado en registro de marcas
                </p>
                
                <div className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-foreground">¿Qué clasifica?</p>
                    <p className="text-sm text-muted-foreground mt-1">Productos y servicios protegidos por la marca</p>
                  </div>
                  
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-foreground">Estructura</p>
                    <p className="text-sm text-muted-foreground mt-1">45 clases: 1-34 (productos), 35-45 (servicios)</p>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-foreground">Propósito</p>
                    <p className="text-sm text-muted-foreground mt-1">Estandarización global, claridad y prevención de conflictos</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <p className="font-semibold text-foreground mb-4">Ejemplo Práctico</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Marca: "TROPICAL"</p>
                    <p className="text-muted-foreground">Producto: Jugos de frutas</p>
                    <p className="text-primary font-semibold mt-1">→ Clase 32: Bebidas sin alcohol</p>
                  </div>
                  <hr className="my-3 border-amber-200" />
                  <p className="text-xs text-muted-foreground">
                    La misma marca en ropa estaría en Clase 25, sin conflicto. Cada clase es independiente.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="viena">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Clasificación de Viena</h3>
                <p className="text-muted-foreground mb-6">
                  Sistema jerárquico para clasificar elementos figurativos de marcas
                </p>
                
                <div className="space-y-4">
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <p className="text-sm font-semibold text-foreground">¿Qué clasifica?</p>
                    <p className="text-sm text-muted-foreground mt-1">Elementos visuales: colores, formas, símbolos</p>
                  </div>
                  
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <p className="text-sm font-semibold text-foreground">Estructura</p>
                    <p className="text-sm text-muted-foreground mt-1">29 categorías principales de elementos visuales</p>
                  </div>

                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <p className="text-sm font-semibold text-foreground">Propósito</p>
                    <p className="text-sm text-muted-foreground mt-1">Facilitar búsqueda visual, evitar duplicidad de registros</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
                <p className="font-semibold text-foreground mb-4">Categorías Comunes</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Animales (reales)</span>
                    <span className="text-primary font-semibold">Código 01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Símbolos/decoración</span>
                    <span className="text-primary font-semibold">Código 02</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Formas geométricas</span>
                    <span className="text-primary font-semibold">Código 03</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Texto/Letras</span>
                    <span className="text-primary font-semibold">Código 04</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Colores combinados</span>
                    <span className="text-primary font-semibold">Código 05</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
