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
}

export function VerticalPublicHero({
  eyebrow,
  title,
  body,
  cta,
  href,
  imageSrc,
  imageAlt,
  imageClassName = "max-h-[620px]",
}: VerticalPublicHeroProps) {
  return (
    <section className="border-b border-[#294047] bg-[#0F2A33] px-5 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-70px)] max-w-[1480px] items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-12">
        <div className="max-w-[680px] self-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#96B5A6]">{eyebrow}</p>
          <h1 className="mt-5 max-w-[13ch] text-[clamp(3rem,4.35vw,4.85rem)] font-light leading-[0.94] tracking-[-0.052em] text-[#E7DFCE] [text-wrap:balance]">
            {title}
          </h1>
          <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[#BDBEBD]">{body}</p>
          <Link
            href={href}
            className="mt-7 inline-flex min-h-12 items-center bg-[#4A7F74] px-5 text-[11px] font-medium tracking-[0.07em] text-white transition-colors hover:bg-[#578f83] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72D4C5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2A33]"
          >
            {cta}
          </Link>
        </div>

        <div className="relative flex min-h-[520px] items-center justify-center overflow-visible lg:min-h-[650px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={900}
            height={900}
            priority
            sizes="(max-width: 1023px) 88vw, 52vw"
            className={`h-auto w-auto max-w-full object-contain ${imageClassName}`}
          />
        </div>
      </div>
    </section>
  )
}
