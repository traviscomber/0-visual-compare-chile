export const DEFAULT_API_KEY_DAILY_QUOTA = 500
export const DEFAULT_API_KEY_MONTHLY_QUOTA = 5000
export const DEFAULT_API_KEY_MONTHLY_QUOTA_LABEL = new Intl.NumberFormat("es-CL").format(DEFAULT_API_KEY_MONTHLY_QUOTA)
export const DEFAULT_API_KEY_COMMERCIAL_COPY = `${DEFAULT_API_KEY_MONTHLY_QUOTA_LABEL} analisis de imagen por mes`

export interface ApiQuotaPlan {
  id: string
  name: string
  description: string
  quotaDaily: number
  quotaMonthly: number
}

export const API_QUOTA_PLANS: ApiQuotaPlan[] = [
  {
    id: "mvp-base",
    name: "MVP Base",
    description: `Plan recomendado para el portal actual con ${DEFAULT_API_KEY_COMMERCIAL_COPY}.`,
    quotaDaily: DEFAULT_API_KEY_DAILY_QUOTA,
    quotaMonthly: DEFAULT_API_KEY_MONTHLY_QUOTA,
  },
  {
    id: "pilot",
    name: "Pilot",
    description: "Ventana reducida para pruebas controladas y QA de integraciones.",
    quotaDaily: 100,
    quotaMonthly: 1000,
  },
  {
    id: "high-volume",
    name: "High Volume",
    description: "Escenario operativo para clientes o equipos internos con mayor carga.",
    quotaDaily: 1000,
    quotaMonthly: 10000,
  },
]

export function findApiQuotaPlan(planId: string | null | undefined) {
  if (!planId) {
    return null
  }

  return API_QUOTA_PLANS.find((plan) => plan.id === planId) ?? null
}

export function formatApiQuotaValue(value: number) {
  return new Intl.NumberFormat("es-CL").format(value)
}
