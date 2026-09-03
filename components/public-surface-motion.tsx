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

    sections.forEach((section, index) => {
      section.classList.add("psm-section", "psm-reveal")
      section.style.setProperty("--psm-delay", `${Math.min(index * 55, 220)}ms`)
    })

    articles.forEach((article, index) => {
      article.classList.add("psm-article")
      article.style.setProperty("--psm-index", String(index))
    })

    heroImage?.classList.add("psm-hero-object")

    if (reduceMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("psm-visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("psm-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -8%" },
    )

    sections.forEach((section) => observer.observe(section))

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
        section.style.setProperty("--psm-scroll", progress.toFixed(3))
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
      observer.disconnect()
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
        opacity: .22;
        background: radial-gradient(circle 360px at var(--psm-x) var(--psm-y), rgba(114,212,197,.11), transparent 68%);
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
        opacity: .28;
        background:
          radial-gradient(circle at calc(14% + var(--psm-scroll, 0) * 7%) 35%, rgba(114,212,197,.065), transparent 28%),
          linear-gradient(115deg, transparent 15%, rgba(69,110,142,.035) 48%, transparent 73%);
        transform: translate3d(0, calc(var(--psm-scroll, 0) * 10px), 0);
        transition: opacity 600ms ease;
      }

      .psm-reveal {
        opacity: 0;
        transform: translate3d(0, 28px, 0);
        transition: opacity 850ms cubic-bezier(.2,.75,.2,1) var(--psm-delay,0ms), transform 1050ms cubic-bezier(.16,1,.3,1) var(--psm-delay,0ms);
      }
      .psm-reveal.psm-visible { opacity: 1; transform: none; }

      .psm-hero-object {
        transform: translate3d(calc(var(--psm-scroll,0) * -9px), calc(var(--psm-scroll,0) * -5px), 0) rotate(calc(var(--psm-scroll,0) * .9deg));
        filter: drop-shadow(0 26px 46px rgba(0,0,0,.18));
        transition: filter 700ms ease;
        animation: psm-float 8s ease-in-out infinite alternate;
      }

      .psm-article {
        transition: background-color 380ms ease, transform 500ms cubic-bezier(.16,1,.3,1), border-color 380ms ease;
      }
      .psm-article:hover {
        transform: translate3d(7px,0,0);
        background-color: rgba(114,212,197,.025);
        border-color: rgba(150,181,166,.46);
      }

      .psm-patents .psm-section:nth-of-type(odd)::after {
        background: radial-gradient(circle at 76% 42%, rgba(69,110,142,.09), transparent 30%), linear-gradient(100deg, transparent, rgba(114,212,197,.025), transparent);
      }
      .psm-technologies .psm-section::after {
        background: radial-gradient(ellipse at 80% calc(35% + var(--psm-scroll,0) * 4%), rgba(114,212,197,.075), transparent 31%), linear-gradient(155deg, transparent 22%, rgba(69,110,142,.04), transparent 69%);
      }
      .psm-trademarks .psm-section:nth-of-type(even)::after {
        background: radial-gradient(circle at 22% 52%, rgba(150,181,166,.07), transparent 26%), linear-gradient(90deg, transparent, rgba(114,212,197,.03), transparent);
      }
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
        to { translate: 0 -8px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .psm-root::before { display: none !important; }
        .psm-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .psm-hero-object { animation: none !important; transform: none !important; }
        .psm-article, .psm-resources pre { transform: none !important; transition: none !important; }
      }

      @media (max-width: 767px) {
        .psm-root::before { display: none; }
        .psm-hero-object { animation-duration: 10s; }
        .psm-article:hover { transform: none; }
      }
    `}</style>
  )
}
