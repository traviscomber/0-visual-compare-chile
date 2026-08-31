import { LocalizedTechnologiesPage, technologiesMetadata } from "@/components/localized-technologies-page"

export const metadata = technologiesMetadata("en")

export default function EnglishTechnologiesPage() {
  return <LocalizedTechnologiesPage locale="en" />
}
