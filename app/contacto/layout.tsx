import type { ReactNode } from "react"
import { PublicLegalFooter } from "@/components/public-legal-footer"

export default function ContactoLayout({ children }: { children: ReactNode }) {
  return <>{children}<PublicLegalFooter /></>
}
