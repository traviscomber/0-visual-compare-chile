import { LocalizedPatentsPage, patentsMetadata } from "@/components/localized-patents-page"

export const metadata = patentsMetadata("es")

export default function SpanishPatentsPage() {
  return <LocalizedPatentsPage locale="es" />
}
