import { LocalizedTechnologiesPage, technologiesMetadata } from "@/components/localized-technologies-page"

export const metadata = technologiesMetadata("es")

export default function SpanishTechnologiesPage() {
  return <LocalizedTechnologiesPage locale="es" />
}
