export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
      <div className="motion-safe:animate-pulse">
        <div className="h-2 w-28 rounded-full bg-[#4A7F74]/45" />
        <div className="mt-5 h-12 w-full max-w-[34rem] rounded-[10px] bg-[#E7DFCE]/[0.08]" />
        <div className="mt-3 h-12 w-full max-w-[25rem] rounded-[10px] bg-[#E7DFCE]/[0.05]" />

        <div className="mt-10 grid border-y border-[#263D44] sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="min-h-28 border-b border-[#263D44] py-6 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-r-0">
              <div className="h-7 w-10 rounded-md bg-[#E7DFCE]/[0.08]" />
              <div className="mt-3 h-3 w-28 rounded-full bg-white/[0.07]" />
              <div className="mt-2 h-2.5 w-36 max-w-full rounded-full bg-white/[0.04]" />
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="h-3 w-32 rounded-full bg-[#4A7F74]/30" />
            <div className="mt-3 h-8 w-64 max-w-full rounded-lg bg-[#E7DFCE]/[0.07]" />
            <div className="mt-6 divide-y divide-[#263D44] border-y border-[#263D44]">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 py-5">
                  <div className="size-9 shrink-0 rounded-[9px] bg-[#13272D]" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-2/5 rounded-full bg-white/[0.07]" />
                    <div className="mt-2 h-2.5 w-3/5 rounded-full bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-3 w-24 rounded-full bg-[#456E8E]/30" />
            <div className="mt-3 h-8 w-48 rounded-lg bg-[#E7DFCE]/[0.07]" />
            <div className="mt-6 h-44 rounded-[10px] bg-[#13272D]/70 ring-1 ring-inset ring-white/[0.04]" />
          </div>
        </div>
      </div>
    </div>
  )
}
