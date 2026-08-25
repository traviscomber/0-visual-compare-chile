"use client"

import { Analytics } from "@vercel/analytics/next"
import { redactAnalyticsUrl } from "@/lib/analytics/privacy"

export function VidentiaAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => ({
        ...event,
        url: redactAnalyticsUrl(event.url),
      })}
    />
  )
}
