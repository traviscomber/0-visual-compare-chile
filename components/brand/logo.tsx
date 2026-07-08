import { cn } from "@/lib/utils"

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        aria-hidden="true"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[--color-brand-teal] text-white shadow-sm"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
          <path d="M11 7h6a4 4 0 0 1 4 4v2" />
          <path d="M13 17H7a4 4 0 0 1-4-4v-2" />
        </svg>
      </div>
      {withText && (
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-foreground">Visual Compare</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[--color-brand-teal]">Chile</span>
        </div>
      )}
    </div>
  )
}
