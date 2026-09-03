"use client"

import { useEffect } from "react"

export function TrademarkMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".px-home")
    if (!root) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    root.classList.add("tm-live")

    const trust = root.querySelector<HTMLElement>(".px-trust")
    const process = root.querySelector<HTMLElement>(".px-process")
    const capabilities = root.querySelector<HTMLElement>(".px-capabilities")
    const audience = root.querySelector<HTMLElement>(".px-audience")
    const platform = root.querySelector<HTMLElement>(".px-platform")
    const final = root.querySelector<HTMLElement>(".px-final")
    const footer = root.querySelector<HTMLElement>(".px-footer")
    const sections = [trust, process, capabilities, audience, platform, final, footer].filter(Boolean) as HTMLElement[]

    const register = (nodes: HTMLElement[], className: string, step = 85) => {
      nodes.forEach((node, index) => {
        node.classList.add("tm-reveal", className)
        node.style.setProperty("--tm-delay", `${index * step}ms`)
      })
    }

    if (trust) register(Array.from(trust.querySelectorAll<HTMLElement>("article")), "tm-trust-item", 90)
    if (process) register(Array.from(process.querySelectorAll<HTMLElement>(".px-flow article")), "tm-process-step", 120)
    if (capabilities) register(Array.from(capabilities.querySelectorAll<HTMLElement>(".px-capability-grid article")), "tm-capability-item", 85)
    if (audience) register(Array.from(audience.querySelectorAll<HTMLElement>(".px-audience-list article")), "tm-audience-item", 70)
    if (platform) register(Array.from(platform.querySelectorAll<HTMLElement>(".px-platform-signals article")), "tm-signal-item", 105)
    if (footer) register(Array.from(footer.querySelectorAll<HTMLElement>(".px-footer-nav > div")), "tm-footer-col", 90)

    root.querySelectorAll<HTMLElement>(".px-section-heading, .px-platform-copy, .px-final-grid, .px-footer-brand").forEach((node, index) => {
      node.classList.add("tm-reveal", "tm-copy-block")
      node.style.setProperty("--tm-delay", `${index * 55}ms`)
    })

    sections.forEach((section, index) => {
      section.classList.add("tm-section")
      section.style.setProperty("--tm-section-index", String(index))
    })

    trust?.classList.add("tm-trust-field")
    process?.classList.add("tm-process-field")
    capabilities?.classList.add("tm-capability-field")
    audience?.classList.add("tm-audience-field")
    platform?.classList.add("tm-platform-field")
    final?.classList.add("tm-final-field")
    footer?.classList.add("tm-footer-field")

    if (reduced || !("IntersectionObserver" in window)) {
      root.querySelectorAll<HTMLElement>(".tm-reveal").forEach((node) => node.classList.add("tm-visible"))
      root.style.setProperty("--tm-pointer-x", "50%")
      root.style.setProperty("--tm-pointer-y", "50%")
      return () => root.classList.remove("tm-live")
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("tm-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    )

    root.querySelectorAll<HTMLElement>(".tm-reveal").forEach((node) => observer.observe(node))

    let raf = 0
    const update = () => {
      raf = 0
      const viewport = Math.max(window.innerHeight, 1)
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, (viewport - rect.top) / Math.max(viewport + rect.height, 1)))
        section.style.setProperty("--tm-progress", progress.toFixed(3))
      })
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }

    const onPointer = (event: PointerEvent) => {
      root.style.setProperty("--tm-pointer-x", `${event.clientX}px`)
      root.style.setProperty("--tm-pointer-y", `${event.clientY}px`)
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
      root.classList.remove("tm-live")
    }
  }, [])

  return (
    <style>{`
      .tm-live { --tm-pointer-x: 50vw; --tm-pointer-y: 50vh; overflow: clip; }
      .tm-live .tm-section { position: relative; isolation: isolate; }
      .tm-live .tm-section::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .42; background: radial-gradient(560px circle at var(--tm-pointer-x) var(--tm-pointer-y), rgba(114,212,197,.08), transparent 62%); }
      .tm-live .tm-section::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .15; background-image: linear-gradient(rgba(150,181,166,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(150,181,166,.05) 1px, transparent 1px); background-size: 84px 84px; mask-image: linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%); }

      .tm-reveal { opacity: 0; transform: translate3d(0,30px,0); transition: opacity 820ms cubic-bezier(.2,.75,.2,1) var(--tm-delay,0ms), transform 1050ms cubic-bezier(.16,1,.3,1) var(--tm-delay,0ms); }
      .tm-reveal.tm-visible { opacity: 1; transform: translate3d(0,0,0); }
      .tm-copy-block h2 { transition: letter-spacing 1000ms cubic-bezier(.16,1,.3,1), transform 1000ms cubic-bezier(.16,1,.3,1); }
      .tm-copy-block.tm-visible h2 { letter-spacing: -0.052em; transform: translateX(0); }

      .tm-trust-field { overflow: hidden; }
      .tm-trust-field::before { opacity: .1; }
      .tm-trust-field > .px-shell::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(114,212,197,.55), transparent); transform: scaleX(calc(.22 + var(--tm-progress,0) * .78)); transform-origin: center; box-shadow: 0 0 20px rgba(114,212,197,.12); }
      .tm-trust-item { transition: transform 560ms cubic-bezier(.16,1,.3,1), background-color 420ms ease, border-color 420ms ease !important; }
      .tm-trust-item:hover { transform: translateY(-9px) !important; background: rgba(114,212,197,.025); }
      .tm-trust-item .px-icon-beacon { position: relative; }
      .tm-trust-item .px-icon-beacon::after { content: ""; position: absolute; inset: -8px; border: 1px solid rgba(150,181,166,.18); border-radius: 999px; opacity: 0; transform: scale(.72); transition: opacity 350ms ease, transform 600ms cubic-bezier(.16,1,.3,1); }
      .tm-trust-item:hover .px-icon-beacon::after { opacity: 1; transform: scale(1.22); }
      .tm-trust-item.tm-visible .px-icon-beacon { animation: tm-breathe 5.1s ease-in-out infinite; animation-delay: var(--tm-delay); }

      .tm-process-field { overflow: hidden; }
      .tm-process-field::before { content: ""; position: absolute; left: 0; right: 0; top: calc(16% + var(--tm-progress,0) * 60%); height: 1px; pointer-events: none; background: linear-gradient(90deg, transparent 5%, rgba(150,181,166,.24) 35%, rgba(114,212,197,.78) 52%, rgba(150,181,166,.16) 70%, transparent 95%); box-shadow: 0 0 32px rgba(114,212,197,.2); opacity: .82; transition: top 90ms linear; }
      .tm-process-field .px-flow::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, transparent 0%, rgba(114,212,197,.04) 50%, transparent 100%); transform: translateX(calc(-70% + var(--tm-progress,0) * 140%)); }
      .tm-process-step { position: relative; transition: background-color 380ms ease, transform 480ms cubic-bezier(.16,1,.3,1) !important; }
      .tm-process-step:hover { transform: translateY(-9px) !important; background: rgba(114,212,197,.035); }
      .tm-process-step .px-step-symbol { transition: transform 650ms cubic-bezier(.16,1,.3,1), filter 500ms ease; }
      .tm-process-step:hover .px-step-symbol { transform: rotate(-7deg) scale(1.1); filter: drop-shadow(0 14px 28px rgba(114,212,197,.18)); }
      .tm-process-step.tm-visible .px-step-symbol { animation: tm-symbol-breathe 5.8s ease-in-out infinite; animation-delay: var(--tm-delay); }

      .tm-capability-field { overflow: hidden; }
      .tm-capability-field .px-bauhaus-field { opacity: .88; }
      .tm-capability-field .px-bauhaus-ring { animation: tm-orbit-slow 20s linear infinite; transform-origin: center; }
      .tm-capability-field .px-bauhaus-square { animation: tm-square-drift 8.5s ease-in-out infinite alternate; }
      .tm-capability-field .px-bauhaus-arc { animation: tm-arc-drift 13s ease-in-out infinite alternate; }
      .tm-capability-field .px-bauhaus-dots { animation: tm-dots-breathe 6.4s ease-in-out infinite; }
      .tm-capability-layout::after { content: ""; position: absolute; right: 5%; top: 18%; width: 34%; height: 64%; pointer-events: none; background: radial-gradient(circle, rgba(69,110,142,.10), transparent 68%); filter: blur(28px); transform: translateY(calc((var(--tm-progress,0) - .5) * 28px)); }
      .tm-capability-item { transition: transform 520ms cubic-bezier(.16,1,.3,1), background-color 400ms ease, box-shadow 400ms ease !important; }
      .tm-capability-item:hover { transform: translate3d(10px,-5px,0) !important; background: rgba(114,212,197,.035); box-shadow: 0 16px 34px rgba(0,0,0,.12); }
      .tm-capability-item .px-capability-icon { transition: transform 520ms cubic-bezier(.16,1,.3,1), color 400ms ease, filter 400ms ease; }
      .tm-capability-item:hover .px-capability-icon { transform: scale(1.13) rotate(5deg); filter: drop-shadow(0 0 18px rgba(114,212,197,.18)); }
      .tm-capability-field .px-capability-cta { position: relative; overflow: hidden; }
      .tm-capability-field .px-capability-cta::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(110deg, transparent 20%, rgba(114,212,197,.06) 48%, transparent 76%); transform: translateX(calc(-85% + var(--tm-progress,0) * 170%)); }

      .tm-audience-field { overflow: hidden; }
      .tm-audience-field .px-audience-stage { position: relative; }
      .tm-audience-field .px-audience-stage::after { content: ""; position: absolute; width: 160px; height: 160px; right: 9%; top: 34%; border-radius: 50%; border: 1px solid rgba(150,181,166,.18); box-shadow: 0 0 60px rgba(114,212,197,.06); transform: scale(calc(.82 + var(--tm-progress,0) * .32)); opacity: calc(.24 + var(--tm-progress,0) * .52); pointer-events: none; }
      .tm-audience-field .px-audience-arc-a { animation: tm-orbit-slow 24s linear infinite; transform-origin: center; }
      .tm-audience-field .px-audience-arc-b { animation: tm-orbit-reverse 28s linear infinite; transform-origin: center; }
      .tm-audience-field .px-audience-dot-grid { animation: tm-dots-breathe 6.2s ease-in-out infinite; }
      .tm-audience-item { transition: transform 440ms cubic-bezier(.16,1,.3,1), color 300ms ease, background-color 300ms ease !important; }
      .tm-audience-item:hover { transform: translateX(14px) !important; background: rgba(114,212,197,.025); }
      .tm-audience-item svg { transition: transform 500ms cubic-bezier(.16,1,.3,1), filter 400ms ease; }
      .tm-audience-item:hover svg { transform: rotate(-8deg) scale(1.14); filter: drop-shadow(0 0 20px rgba(114,212,197,.2)); }

      .tm-platform-field { overflow: hidden; }
      .tm-platform-field::before { content: ""; position: absolute; top: 0; bottom: 0; left: calc(7% + var(--tm-progress,0) * 86%); width: 1px; pointer-events: none; background: linear-gradient(to bottom, transparent, rgba(114,212,197,.68), transparent); box-shadow: 0 0 28px rgba(114,212,197,.21); transition: left 100ms linear; }
      .tm-platform-field .px-platform-grid::after { content: ""; position: absolute; inset: 12% 8% auto auto; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(114,212,197,.09), transparent 68%); filter: blur(18px); animation: tm-field-float 8s ease-in-out infinite alternate; pointer-events: none; }
      .tm-signal-item { transition: transform 500ms cubic-bezier(.16,1,.3,1), background-color 350ms ease, box-shadow 350ms ease !important; }
      .tm-signal-item:hover { transform: translateX(11px) !important; background: rgba(114,212,197,.035); box-shadow: inset 2px 0 0 rgba(150,181,166,.28); }
      .tm-signal-item .px-signal-line { transform-origin: left; transform: scaleX(.08); opacity: .34; transition: transform 980ms cubic-bezier(.16,1,.3,1), opacity 500ms ease; }
      .tm-signal-item.tm-visible .px-signal-line { transform: scaleX(1); opacity: 1; }
      .tm-signal-item svg { transition: transform 500ms cubic-bezier(.16,1,.3,1), filter 400ms ease; }
      .tm-signal-item:hover svg { transform: scale(1.14) rotate(6deg); filter: drop-shadow(0 0 18px rgba(114,212,197,.18)); }

      .tm-final-field { overflow: hidden; }
      .tm-final-field::before { opacity: .18; }
      .tm-final-field .px-final-ring-a { animation: tm-orbit-slow 22s linear infinite; transform-origin: center; }
      .tm-final-field .px-final-ring-b { animation: tm-orbit-reverse 26s linear infinite; transform-origin: center; }
      .tm-final-field .px-final-disc { animation: tm-final-pulse 5.2s ease-in-out infinite; }
      .tm-final-field .px-final-dots { animation: tm-dots-breathe 6.8s ease-in-out infinite; }
      .tm-final-field .px-final-grid { position: relative; }
      .tm-final-field .px-final-grid::after { content: ""; position: absolute; left: 48%; top: 50%; width: 34%; height: 1px; background: linear-gradient(90deg, transparent, rgba(150,181,166,.4), transparent); transform: scaleX(calc(.35 + var(--tm-progress,0) * .65)); transform-origin: left; pointer-events: none; }
      .tm-final-field .px-final-actions a { transition: transform 440ms cubic-bezier(.16,1,.3,1), box-shadow 400ms ease, border-color 300ms ease !important; }
      .tm-final-field .px-final-actions a:hover { transform: translateY(-5px); box-shadow: 0 20px 42px rgba(0,0,0,.18); }

      .tm-footer-field { position: relative; overflow: hidden; }
      .tm-footer-field::after { content: ""; position: absolute; left: -20%; top: 0; width: 20%; height: 1px; background: linear-gradient(90deg, transparent, rgba(150,181,166,.7), transparent); box-shadow: 0 0 18px rgba(114,212,197,.18); animation: tm-footer-scan 7.5s ease-in-out infinite; pointer-events: none; }
      .tm-footer-col { transition: transform 440ms cubic-bezier(.16,1,.3,1); }
      .tm-footer-col:hover { transform: translateY(-5px); }
      .tm-footer-col a { transition: color 260ms ease, transform 320ms cubic-bezier(.16,1,.3,1); }
      .tm-footer-col a:hover { transform: translateX(5px); }
      .tm-footer-field .px-footer-brand strong { display: inline-block; animation: tm-brand-breathe 6.5s ease-in-out infinite; }

      @keyframes tm-breathe { 0%,100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(114,212,197,0)); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(114,212,197,.14)); } }
      @keyframes tm-symbol-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes tm-orbit-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes tm-orbit-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      @keyframes tm-square-drift { from { transform: translate3d(-5px,4px,0) rotate(-2deg); } to { transform: translate3d(10px,-8px,0) rotate(5deg); } }
      @keyframes tm-arc-drift { from { transform: translate3d(0,7px,0) rotate(-2deg); } to { transform: translate3d(-11px,-5px,0) rotate(4deg); } }
      @keyframes tm-dots-breathe { 0%,100% { opacity: .34; transform: scale(1); } 50% { opacity: .76; transform: scale(1.03); } }
      @keyframes tm-final-pulse { 0%,100% { opacity: .48; transform: scale(1); } 50% { opacity: .9; transform: scale(1.09); } }
      @keyframes tm-field-float { from { transform: translate3d(-8px,8px,0) scale(.96); } to { transform: translate3d(10px,-10px,0) scale(1.05); } }
      @keyframes tm-footer-scan { 0% { transform: translateX(0); opacity: 0; } 12% { opacity: .8; } 88% { opacity: .7; } 100% { transform: translateX(700%); opacity: 0; } }
      @keyframes tm-brand-breathe { 0%,100% { opacity: .88; text-shadow: 0 0 0 rgba(114,212,197,0); } 50% { opacity: 1; text-shadow: 0 0 24px rgba(114,212,197,.12); } }

      @media (prefers-reduced-motion: reduce) {
        .tm-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .tm-live * { animation: none !important; }
        .tm-live .tm-section::after, .tm-live .tm-section::before, .tm-process-field::before, .tm-platform-field::before, .tm-footer-field::after { display: none !important; }
      }

      @media (max-width: 767px) {
        .tm-live .tm-section::after, .tm-live .tm-section::before { display: none; }
        .tm-process-field::before, .tm-platform-field::before { opacity: .34; }
        .tm-trust-item:hover, .tm-process-step:hover, .tm-capability-item:hover, .tm-audience-item:hover, .tm-signal-item:hover, .tm-footer-col:hover { transform: none !important; }
        .tm-audience-field .px-audience-stage::after, .tm-final-field .px-final-grid::after { display: none; }
      }
    `}</style>
  )
}
