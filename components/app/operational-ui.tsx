import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Tone = "neutral" | "success" | "warning" | "danger"

export function OperationalPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12", className)}>
      {children}
    </div>
  )
}

export function OperationalHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="grid gap-7 border-b border-border/80 pb-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.78fr)] lg:items-end lg:gap-14 lg:pb-10">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#96B5A6]">{eyebrow}</p>
        <h1 className="mt-4 max-w-none text-[clamp(2.7rem,7vw,5.1rem)] font-light leading-[1.01] tracking-[-0.045em] text-[#E7DFCE] lg:max-w-[12ch]">
          {title}
        </h1>
      </div>
      <div className="min-w-0 lg:justify-self-end">
        <div className="max-w-2xl text-[15px] leading-7 text-white/88 sm:text-base sm:leading-7 lg:text-[17px]">{description}</div>
        {meta ? <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{meta}</div> : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export function OperationalMetricRail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid grid-cols-2 gap-px border-b border-border/80 bg-border/70 lg:grid-cols-4", className)}>
      {children}
    </section>
  )
}

export function OperationalMetric({
  value,
  label,
  detail,
  tone = "neutral",
}: {
  value: ReactNode
  label: string
  detail: string
  tone?: Tone
}) {
  const valueClass = tone === "danger"
    ? "text-[#E8AAA3]"
    : tone === "warning"
      ? "text-[#D6A46F]"
      : tone === "success"
        ? "text-[#96B5A6]"
        : "text-[#E7DFCE]"

  return (
    <div className="min-h-[116px] bg-background px-3 py-5 sm:min-h-[126px] sm:px-5 sm:py-6 lg:min-h-[136px]">
      <p className={cn("text-[2rem] font-light leading-none tracking-[-0.035em] sm:text-[2.45rem]", valueClass)}>{value}</p>
      <p className="mt-2 text-[13px] font-medium leading-5 text-white sm:text-sm">{label}</p>
      <p className="mt-1 max-w-[24ch] text-[11px] leading-[1.55] text-muted-foreground sm:text-xs">{detail}</p>
    </div>
  )
}

export function OperationalSectionHeader({
  eyebrow,
  title,
  meta,
  action,
  className,
}: {
  eyebrow: string
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#96B5A6]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-light leading-tight tracking-[-0.03em] text-[#E7DFCE] sm:text-[1.75rem]">{title}</h2>
      </div>
      {action ?? (meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null)}
    </div>
  )
}

export function OperationalPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[10px] bg-[#13272D] p-5 shadow-[inset_0_0_0_1px_rgba(183,211,209,0.05)] sm:p-6", className)}>
      {children}
    </div>
  )
}
