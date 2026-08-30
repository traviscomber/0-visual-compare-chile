import type { Metadata } from "next"
import { LocalizedEnterpriseAccessPage } from "@/components/localized-enterprise-access-page"

export const metadata: Metadata = {
  title: "Enterprise access",
  description: "Request enterprise access to VIDENTIA for research, monitoring and collaborative trademark work.",
  robots: { index: false, follow: false },
}

type Params = Record<string, string | string[] | undefined>
export default function EnglishEnterpriseAccessPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <LocalizedEnterpriseAccessPage locale="en" searchParams={searchParams} />
}
