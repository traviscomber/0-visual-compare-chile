import PatentAlertsPage from "../../patentes/alertas/page"
import { TdpiSignalInbox } from "@/components/intelligence/tdpi-signal-inbox"

export default function MonitorearPage() {
  return (
    <>
      <TdpiSignalInbox />
      <PatentAlertsPage />
    </>
  )
}
