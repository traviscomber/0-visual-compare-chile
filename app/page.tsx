import type { Metadata } from "next"
import { UmbrellaHomePage } from "@/components/umbrella-home-page"

export const metadata: Metadata = {
  title: "VIDENTIA — IP & Technology Intelligence",
  description: "Search, analyze and monitor trademarks, patents and emerging technologies with traceable intelligence.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
}

export default function RootPage() {
  return <UmbrellaHomePage />
}
