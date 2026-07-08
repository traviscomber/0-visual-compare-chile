'use client'

import { AlertCircle, Scale } from "lucide-react"

export function LegalDisclaimerSection() {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 p-6 md:p-8">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-amber-900 dark:text-amber-200">Información Legal</h3>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                Visual Compare Chile es una herramienta de análisis técnico que proporciona resultados basados en similitud visual de imágenes. 
                Los resultados no son conclusivos por sí solos y deben ser revisados por un especialista humano antes de tomar decisiones finales.
              </p>
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                La plataforma cumple con LPDP (Ley de Protección de Datos Personales de Chile), LGPD (Brasil) y GDPR (UE). 
                Todos los datos están encriptados en tránsito y en reposo. Los análisis generan registros auditables completos para cumplimiento legal.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                <Scale className="h-4 w-4" />
                <span>Cumplimiento legal verificado. Responsabilidad de decisiones finales con el usuario.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
