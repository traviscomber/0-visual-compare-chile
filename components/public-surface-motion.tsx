"use client"

import { useEffect } from "react"

type PublicSurfaceMotionProps = {
  variant?: "trademarks" | "patents" | "technologies" | "resources"
}

export function PublicSurfaceMotion({ variant = "resources" }: PublicSurfaceMotionProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-public-surface]")
    if (!root) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    root.classList.add("psm-root", `psm-${variant}`)

    const sections = Array.from(root.querySelectorAll<HTMLElement>("section"))
    const articles = Array.from(root.querySelectorAll<HTMLElement>("article"))
    const heroImage = root.querySelector<HTMLElement>("section:first-of-type img")
    const headings = Array.from(root.querySelectorAll<HTMLElement>("section h2"))

    sections.forEach((section, index) => {
      section.classList.add("psm-section", "psm-reveal")
      section.style.setProperty("--psm-delay", `${Math.min(index * 45, 180)}ms`)
      section.style.setProperty("--psm-section-index", String(index))
    })

    articles.forEach((article, index) => {
      article.classList.add("psm-article", "psm-item-reveal")
      article.style.setProperty("--psm-index", String(index))
      article.style.setProperty("--psm-item-delay", `${(index % 6) * 70}ms`)
    })

    headings.forEach((heading) => heading.classList.add("psm-heading"))
    heroImage?.classList.add("psm-hero-object")

    const revealAll = () => {
      sections.forEach((section) => section.classList.add("psm-visible"))
      articles.forEach((article) => article.classList.add("psm-item-visible"))
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealAll()
      return
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("psm-visible")
          sectionObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -8%" },
    )

    const itemObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("psm-item-visible")
          itemObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.16, rootMargin: "0px 0px -5%" },
    )

    sections.forEach((section) => sectionObserver.observe(section))
    articles.forEach((article) => itemObserver.observe(article))

    let raf = 0
    const update = (event?: PointerEvent) => {
      raf = 0
      if (event && event.pointerType !== "touch") {
        root.style.setProperty("--psm-x", `${(event.clientX / Math.max(window.innerWidth, 1)) * 100}%`)
        root.style.setProperty("--psm-y", `${(event.clientY / Math.max(window.innerHeight, 1)) * 100}%`)
      }

      const viewport = Math.max(window.innerHeight, 1)
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        const progress = Math.max(-1, Math.min(1, (viewport * 0.52 - rect.top) / viewport))
        const through = Math.max(0, Math.min(1, (viewport - rect.top) / Math.max(viewport + rect.height, 1)))
        section.style.setProperty("--psm-scroll", progress.toFixed(3))
        section.style.setProperty("--psm-through", through.toFixed(3))
        section.style.setProperty("--psm-section-index", String(index))
      })
    }

    const onPointerMove = (event: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => update(event))
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => update())
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()

    return () => {
      cancelAnimationFrame(raf)
      sectionObserver.disconnect()
      itemObserver.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [variant])

  return (
    <style>{`
      .psm-root {
        --psm-x: 74%;
        --psm-y: 28%;
        position: relative;
        isolation: isolate;
        overflow: clip;
      }

      .psm-root::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 30;
        pointer-events: none;
        opacity: .2;
        background: radial-gradient(circle 380px at var(--psm-x) var(--psm-y), rgba(114,212,197,.11), transparent 68%);
        mix-blend-mode: screen;
      }

      .psm-section {
        position: relative;
        isolation: isolate;
      }

      .psm-section::after {
        content: "";
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: .3;
        background:
          radial-gradient(circle at calc(14% + var(--psm-scroll, 0) * 7%) 35%, rgba(114,212,197,.065), transparent 28%),
          linear-gradient(115deg, transparent 15%, rgba(69,110,142,.035) 48%, transparent 73%);
        transform: translate3d(0, calc(var(--psm-scroll, 0) * 10px), 0);
      }

      .psm-reveal {
        opacity: 0;
        transform: translate3d(0, 30px, 0);
        transition: opacity 820ms cubic-bezier(.2,.75,.2,1) var(--psm-delay,0ms), transform 1040ms cubic-bezier(.16,1,.3,1) var(--psm-delay,0ms);
      }
      .psm-reveal.psm-visible { opacity: 1; transform: none; }

      .psm-item-reveal {
        opacity: .28;
        transform: translate3d(16px, 14px, 0);
        transition: opacity 720ms cubic-bezier(.2,.75,.2,1) var(--psm-item-delay,0ms), transform 900ms cubic-bezier(.16,1,.3,1) var(--psm-item-delay,0ms), background-color 380ms ease, border-color 380ms ease;
      }
      .psm-item-reveal.psm-item-visible { opacity: 1; transform: none; }

      .psm-heading {
        transform-origin: left center;
        transition: letter-spacing 700ms cubic-bezier(.16,1,.3,1), text-shadow 700ms ease;
      }
      .psm-section.psm-visible .psm-heading {
        text-shadow: 0 16px 50px rgba(0,0,0,.16);
      }

      .psm-hero-object {
        transform: translate3d(calc(var(--psm-scroll,0) * -9px), calc(var(--psm-scroll,0) * -5px), 0) rotate(calc(var(--psm-scroll,0) * .9deg));
        filter: drop-shadow(0 26px 46px rgba(0,0,0,.18));
        transition: filter 700ms ease;
        animation: psm-float 8s ease-in-out infinite alternate;
      }

      .psm-article {
        position: relative;
      }
      .psm-article:hover {
        transform: translate3d(8px,0,0);
        background-color: rgba(114,212,197,.028);
        border-color: rgba(150,181,166,.48);
      }

      .psm-root section a {
        transition: transform 380ms cubic-bezier(.16,1,.3,1), border-color 320ms ease, background-color 320ms ease, box-shadow 420ms ease;
      }
      .psm-root section a:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 36px rgba(0,0,0,.16);
      }

      /* PATENTS — document lineage, prior-art scan, evidence progression */
      .psm-patents .psm-section:nth-of-type(n+2)::before {
        content: "";
        position: absolute;
        left: calc(4% + var(--psm-through,0) * 88%);
        top: 0;
        bottom: 0;
        width: 1px;
        z-index: 0;
        pointer-events: none;
        opacity: .42;
        background: linear-gradient(to bottom, transparent 5%, rgba(69,110,142,.18) 28%, rgba(150,181,166,.58) 50%, rgba(69,110,142,.16) 72%, transparent 95%);
        box-shadow: 0 0 26px rgba(114,212,197,.11);
      }
      .psm-patents .psm-section:nth-of-type(odd)::after {
        background:
          radial-gradient(circle at calc(72% + var(--psm-scroll,0) * 6%) 42%, rgba(69,110,142,.095), transparent 30%),
          linear-gradient(100deg, transparent, rgba(114,212,197,.03), transparent);
      }
      .psm-patents .psm-article::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        width: 0;
        height: 1px;
        pointer-events: none;
        opacity: 0;
        background: linear-gradient(90deg, rgba(150,181,166,.52), transparent);
        transition: width 760ms cubic-bezier(.16,1,.3,1), opacity 420ms ease;
      }
      .psm-patents .psm-article.psm-item-visible::before {
        width: min(120px,18%);
        opacity: .48;
      }
      .psm-patents .psm-article:hover::before {
        width: min(220px,32%);
        opacity: .9;
      }
      .psm-patents .psm-article > span:first-child {
        transition: color 420ms ease, text-shadow 420ms ease, transform 500ms cubic-bezier(.16,1,.3,1);
      }
      .psm-patents .psm-article:hover > span:first-child {
        color: #96B5A6 !important;
        transform: translateX(4px);
        text-shadow: 0 0 18px rgba(150,181,166,.25);
      }
      .psm-patents .psm-section:nth-of-type(3) .psm-article,
      .psm-patents .psm-section:nth-of-type(4) .psm-article {
        background-image: linear-gradient(90deg, rgba(69,110,142,.025), transparent 28%);
      }
      .psm-patents .psm-section:nth-of-type(5)::after {
        opacity: .48;
        background:
          repeating-linear-gradient(90deg, transparent 0 72px, rgba(150,181,166,.025) 72px 73px),
          radial-gradient(circle at 78% 40%, rgba(74,127,116,.12), transparent 27%);
      }
      .psm-patents .psm-section:nth-of-type(n+2) h2::after {
        content: "";
        display: block;
        width: clamp(40px, calc(var(--psm-through,0) * 160px), 160px);
        height: 1px;
        margin-top: 18px;
        background: linear-gradient(90deg, #4A7F74, transparent);
        opacity: .5;
      }

      /* TECHNOLOGIES */
      .psm-technologies .psm-section::after {
        background: radial-gradient(ellipse at 80% calc(35% + var(--psm-scroll,0) * 4%), rgba(114,212,197,.075), transparent 31%), linear-gradient(155deg, transparent 22%, rgba(69,110,142,.04), transparent 69%);
      }

      /* TRADEMARKS */
      .psm-trademarks .psm-section:nth-of-type(even)::after {
        background: radial-gradient(circle at 22% 52%, rgba(150,181,166,.07), transparent 26%), linear-gradient(90deg, transparent, rgba(114,212,197,.03), transparent);
      }

      /* RESOURCES */
      .psm-resources pre {
        transition: border-color 420ms ease, box-shadow 520ms ease, transform 520ms cubic-bezier(.16,1,.3,1);
      }
      .psm-resources pre:hover,
      .psm-resources pre:focus-visible {
        border-color: #4A7F74;
        box-shadow: 0 18px 55px rgba(0,0,0,.22), 0 0 34px rgba(114,212,197,.055);
        transform: translateY(-3px);
      }

      @keyframes psm-float {
        from { translate: 0 0; }
        to { translate: 0 -9px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .psm-root::before { display: none !important; }
        .psm-reveal, .psm-item-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .psm-hero-object { animation: none !important; transform: none !important; }
        .psm-article, .psm-resources pre { transform: none !important; transition: none !important; }
        .psm-patents .psm-section::before { display: none !important; }
      }

      @media (max-width: 767px) {
        .psm-root::before { display: none; }
        .psm-hero-object { animation-duration: 10s; }
        .psm-article:hover { transform: none; }
        .psm-patents .psm-section::before { opacity: .2; }
      }
    `}</style>
  )
}
