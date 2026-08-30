import { LocalizedPatentsPage, patentsMetadata } from "@/components/localized-patents-page"

export const metadata = patentsMetadata("en")

export default function EnglishPatentsPage() {
  return <LocalizedPatentsPage locale="en" />
}
