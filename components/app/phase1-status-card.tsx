import { Phase1StatusLiveCard } from "@/components/app/phase1-status-live-card"
import { getPhase1StatusPayload } from "@/lib/phase1-status"

export async function Phase1StatusCard({ organizationId }: { organizationId: string }) {
  const payload = await getPhase1StatusPayload(organizationId)

  return <Phase1StatusLiveCard initialPayload={payload} />
}
