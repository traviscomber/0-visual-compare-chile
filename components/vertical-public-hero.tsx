import Image from "next/image"
import Link from "next/link"

type VerticalPublicHeroProps = {
  eyebrow: string
  title: string
  body: string
  cta: string
  href: string
  imageSrc: string
  imageAlt: string
  imageClassName?: string
  note?: string
}

export function VerticalPublicHero({
  eyebrow,
  title,
  body,
  cta,
  href,
  imageSrc,
  imageAlt,
  imageClassName = "max-h-[680px]",
  note = "TRACEABLE INTELLIGENCE · REVIEWABLE EVIDENCE",
}: VerticalPublicHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-[#294047] bg-[#0F2A33] px-5 sm:px-7 lg:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_34%,rgba(74,127,116,0.09),transparent_25%),radial-gradient(circle_at_91%_71%,rgba(69,110,142,0.07),transparent_28%),linear-gradient(110deg,#0F2A33_0%,#0D252D_48%,#091A20_100%)]" />
        <div className="absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,rgba(15,42,51,1)_0%,rgba(15,42,51,.96)_68%,rgba(15,42,51,0)_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(183,211,209,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(183,211,209,.12)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_right,transparent_0%,transparent_52%,black_78%,black_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1480px] items-center gap-6 py-10 sm:gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(520px,1.12fr)] lg:gap-[clamp(3rem,6vw,7rem)] lg:py-12 xl:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)]">
        <div className="max-w-[650px] self-center lg:pb-4">
          <p className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#96B5A6] sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#96B5A6]" aria-hidden="true" />
            {eyebrow}
          </p>

          <h1 className="mt-6 max-w-[12.2ch] text-[clamp(2.8rem,12vw,4.85rem)] font-light leading-[0.96] tracking-[-0.05em] text-[#E7DFCE] [text-wrap:balance] sm:text-[clamp(3.1rem,7vw,4.85rem)] lg:text-[clamp(3.1rem,4.2vw,4.85rem)]">
            {title}
          </h1>

          <p className="mt-6 max-w-[540px] text-[15px] leading-7 text-[#C4C8C5] sm:text-[16px] sm:leading-8">
            {body}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-4">
            <Link
              href={href}
              className="inline-flex min-h-12 items-center justify-center border border-[#4A7F74] bg-[#4A7F74] px-5 text-[11px] font-medium tracking-[0.075em] text-white transition-colors duration-150 hover:border-[#5D9388] hover:bg-[#5D9388] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#96B5A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2A33] sm:justify-start"
            >
              {cta}
            </Link>
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#879A97] sm:text-[11px]">{note}</span>
          </div>
        </div>

        <div className="relative flex min-h-[350px] items-center justify-center overflow-visible sm:min-h-[480px] lg:min-h-[650px] lg:justify-end">
          <div className="pointer-events-none absolute left-[12%] top-[20%] h-[54%] w-[66%] rounded-full bg-[#4A7F74]/6 blur-[64px]" aria-hidden="true" />
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1000}
            height={1000}
            priority
            sizes="(max-width: 767px) 88vw, (max-width: 1023px) 74vw, 54vw"
            className={`relative z-10 h-auto w-auto max-w-full object-contain ${imageClassName}`}
          />
        </div>
      </div>
    </section>
  )
}
