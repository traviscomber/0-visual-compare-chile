"use client"

import { useEffect } from "react"

export function TechnologyMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".technologies-public-page")
    if (!root) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    root.classList.add("tech-live")

    const sections = Array.from(root.querySelectorAll<HTMLElement>("section"))
    const articles = Array.from(root.querySelectorAll<HTMLElement>("article"))
    const heroImage = root.querySelector<HTMLElement>("section:first-of-type img")

    sections.forEach((section, index) => {
      section.classList.add("tech-section")
      section.style.setProperty("--tech-index", String(index))
    })
    articles.forEach((article, index) => {
      article.classList.add("tech-item")
      article.style.setProperty("--tech-delay", `${(index % 6) * 75}ms`)
    })
    heroImage?.classList.add("tech-hero-object")

    if (reduced || !("IntersectionObserver" in window)) {
      sections.forEach((section) => section.classList.add("tech-visible"))
      articles.forEach((article) => article.classList.add("tech-item-visible"))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const node = entry.target as HTMLElement
        node.classList.add(node.classList.contains("tech-item") ? "tech-item-visible" : "tech-visible")
        observer.unobserve(node)
      })
    }, { threshold: 0.12, rootMargin: "0px 0px -7%" })

    sections.forEach((section) => observer.observe(section))
    articles.forEach((article) => observer.observe(article))

    let raf = 0
    const update = (event?: PointerEvent) => {
      raf = 0
      if (event && event.pointerType !== "touch") {
        root.style.setProperty("--tech-x", `${event.clientX}px`)
        root.style.setProperty("--tech-y", `${event.clientY}px`)
      }
      const vh = Math.max(window.innerHeight, 1)
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        const p = Math.max(0, Math.min(1, (vh - rect.top) / Math.max(vh + rect.height, 1)))
        section.style.setProperty("--tech-progress", p.toFixed(3))
      })
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => update())
    }
    const onPointer = (event: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => update(event))
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    window.addEventListener("pointermove", onPointer, { passive: true })
    update()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("pointermove", onPointer)
      root.classList.remove("tech-live")
    }
  }, [])

  return <style>{`
    .tech-live { --tech-x: 76vw; --tech-y: 30vh; position: relative; isolation: isolate; overflow: clip; }
    .tech-live::before { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 31; opacity: .16; background: radial-gradient(420px circle at var(--tech-x) var(--tech-y), rgba(114,212,197,.13), transparent 67%); mix-blend-mode: screen; }
    .tech-section { position: relative; isolation: isolate; opacity: 0; transform: translateY(30px); transition: opacity 820ms cubic-bezier(.2,.75,.2,1), transform 1080ms cubic-bezier(.16,1,.3,1); }
    .tech-section.tech-visible { opacity: 1; transform: none; }
    .tech-section::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .42; background: radial-gradient(ellipse at calc(72% + var(--tech-progress,0) * 8%) 42%, rgba(74,127,116,.09), transparent 28%), linear-gradient(145deg, transparent 18%, rgba(69,110,142,.04), transparent 72%); }
    .tech-item { position: relative; opacity: .2; transform: translate3d(18px,16px,0); transition: opacity 720ms cubic-bezier(.2,.75,.2,1) var(--tech-delay), transform 920ms cubic-bezier(.16,1,.3,1) var(--tech-delay), background-color 380ms ease, border-color 380ms ease; }
    .tech-item.tech-item-visible { opacity: 1; transform: none; }
    .tech-item::before { content: ""; position: absolute; left: 0; top: 50%; width: 0; height: 1px; pointer-events: none; opacity: 0; background: linear-gradient(90deg, rgba(114,212,197,.72), transparent); transition: width 720ms cubic-bezier(.16,1,.3,1), opacity 420ms ease; }
    .tech-item.tech-item-visible::before { width: min(100px,16%); opacity: .34; }
    .tech-item:hover { transform: translateX(10px); background: rgba(114,212,197,.025); border-color: rgba(150,181,166,.48) !important; }
    .tech-item:hover::before { width: min(240px,36%); opacity: .9; }
    .tech-hero-object { animation: tech-hero-breathe 8.5s ease-in-out infinite; filter: drop-shadow(0 26px 48px rgba(0,0,0,.18)); }

    .tech-live .tech-section:nth-of-type(2)::before { content: ""; position: absolute; width: min(520px,44vw); aspect-ratio: 1; right: 4%; top: 14%; border-radius: 999px; pointer-events: none; opacity: .26; background: repeating-radial-gradient(circle, rgba(150,181,166,.18) 0 1px, transparent 1px 42px); transform: rotate(calc(var(--tech-progress,0) * 48deg)) scale(calc(.92 + var(--tech-progress,0) * .08)); mask-image: radial-gradient(circle, #000 0 58%, transparent 78%); }
    .tech-live .tech-section:nth-of-type(3)::before { content: ""; position: absolute; inset: 10% 5%; pointer-events: none; opacity: .18; background-image: radial-gradient(circle, rgba(150,181,166,.62) 0 1px, transparent 1.5px); background-size: 34px 34px; transform: translate3d(calc(var(--tech-progress,0) * -14px), calc(var(--tech-progress,0) * 9px),0); mask-image: linear-gradient(90deg, transparent, #000 24%, #000 78%, transparent); }
    .tech-live .tech-section:nth-of-type(4)::before { content: ""; position: absolute; left: calc(6% + var(--tech-progress,0) * 84%); top: 0; bottom: 0; width: 1px; pointer-events: none; background: linear-gradient(to bottom, transparent, rgba(114,212,197,.58), transparent); box-shadow: 0 0 28px rgba(114,212,197,.14); opacity: .62; }
    .tech-live .tech-section:nth-of-type(5)::before { content: ""; position: absolute; left: 7%; right: 7%; top: 52%; height: 1px; pointer-events: none; opacity: .52; background: linear-gradient(90deg, #456E8E 0 26%, #4A7F74 26% 64%, #96B5A6 64% 100%); transform-origin: left; transform: scaleX(calc(.12 + var(--tech-progress,0) * .88)); }
    .tech-live .tech-section:nth-of-type(5) .tech-item > span:first-child { transition: color 420ms ease, text-shadow 420ms ease, transform 500ms cubic-bezier(.16,1,.3,1); }
    .tech-live .tech-section:nth-of-type(5) .tech-item:hover > span:first-child { color: #96B5A6 !important; transform: scale(1.05); text-shadow: 0 0 18px rgba(150,181,166,.2); }
    .tech-live .tech-section:nth-of-type(6)::after { opacity: .58; background: radial-gradient(circle at 78% 48%, rgba(74,127,116,.14), transparent 25%), repeating-linear-gradient(90deg, transparent 0 86px, rgba(150,181,166,.022) 86px 87px); }
    .tech-live .tech-section:nth-of-type(n+2) h2::after { content: ""; display: block; width: clamp(44px, calc(var(--tech-progress,0) * 150px), 150px); height: 1px; margin-top: 18px; background: linear-gradient(90deg, #4A7F74, transparent); opacity: .52; }
    .tech-live section a { transition: transform 380ms cubic-bezier(.16,1,.3,1), box-shadow 400ms ease, background-color 320ms ease, border-color 320ms ease; }
    .tech-live section a:hover { transform: translateY(-3px); box-shadow: 0 16px 38px rgba(0,0,0,.16); }

    @keyframes tech-hero-breathe { 0%,100% { transform: translate3d(0,0,0) rotate(0deg); } 50% { transform: translate3d(0,-9px,0) rotate(.7deg); } }

    @media (prefers-reduced-motion: reduce) {
      .tech-live::before, .tech-section::before { display:none !important; }
      .tech-section, .tech-item { opacity:1 !important; transform:none !important; transition:none !important; }
      .tech-hero-object { animation:none !important; }
    }
    @media (max-width: 767px) {
      .tech-live::before { display:none; }
      .tech-item:hover { transform:none; }
      .tech-live .tech-section::before { opacity:.18; }
    }
  `}</style>
}
