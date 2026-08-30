import type { Metadata } from "next"
import { LocalizedEnterpriseAccessPage } from "@/components/localized-enterprise-access-page"

export const metadata: Metadata = {
  title: "Acceso empresarial",
  description: "Solicita acceso empresarial a VIDENTIA para investigación, vigilancia y trabajo colaborativo.",
  robots: { index: false, follow: false },
}

type Params = Record<string, string | string[] | undefined>
export default function SpanishEnterpriseAccessPage({ searchParams }: { searchParams: Promise<Params> }) {
  return <LocalizedEnterpriseAccessPage locale="es" searchParams={searchParams} />
}
