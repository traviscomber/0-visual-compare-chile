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
    const sections = [trust, process, capabilities, audience, platform, final].filter(Boolean) as HTMLElement[]

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

    sections.forEach((section, index) => {
      section.classList.add("tm-section")
      section.style.setProperty("--tm-section-index", String(index))
    })

    process?.classList.add("tm-process-field")
    capabilities?.classList.add("tm-capability-field")
    audience?.classList.add("tm-audience-field")
    platform?.classList.add("tm-platform-field")
    final?.classList.add("tm-final-field")

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
      .tm-live .tm-section::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .34; background: radial-gradient(520px circle at var(--tm-pointer-x) var(--tm-pointer-y), rgba(114,212,197,.065), transparent 62%); }

      .tm-reveal { opacity: 0; transform: translate3d(0,28px,0); transition: opacity 760ms cubic-bezier(.2,.75,.2,1) var(--tm-delay,0ms), transform 950ms cubic-bezier(.16,1,.3,1) var(--tm-delay,0ms); }
      .tm-reveal.tm-visible { opacity: 1; transform: translate3d(0,0,0); }

      .tm-trust-item { transition: transform 520ms cubic-bezier(.16,1,.3,1), background-color 420ms ease, border-color 420ms ease !important; }
      .tm-trust-item:hover { transform: translateY(-7px) !important; }
      .tm-trust-item .px-icon-beacon { position: relative; }
      .tm-trust-item .px-icon-beacon::after { content: ""; position: absolute; inset: -8px; border: 1px solid rgba(150,181,166,.14); border-radius: 999px; opacity: 0; transform: scale(.72); transition: opacity 350ms ease, transform 600ms cubic-bezier(.16,1,.3,1); }
      .tm-trust-item:hover .px-icon-beacon::after { opacity: 1; transform: scale(1.18); }
      .tm-trust-item.tm-visible .px-icon-beacon { animation: tm-breathe 5.4s ease-in-out infinite; animation-delay: var(--tm-delay); }

      .tm-process-field { overflow: hidden; }
      .tm-process-field::before { content: ""; position: absolute; left: 0; right: 0; top: calc(18% + var(--tm-progress,0) * 55%); height: 1px; pointer-events: none; background: linear-gradient(90deg, transparent 5%, rgba(150,181,166,.2) 35%, rgba(114,212,197,.65) 52%, rgba(150,181,166,.12) 70%, transparent 95%); box-shadow: 0 0 28px rgba(114,212,197,.16); opacity: .7; transition: top 90ms linear; }
      .tm-process-step { position: relative; transition: background-color 380ms ease, transform 480ms cubic-bezier(.16,1,.3,1) !important; }
      .tm-process-step:hover { transform: translateY(-8px) !important; background: rgba(114,212,197,.025); }
      .tm-process-step .px-step-symbol { transition: transform 650ms cubic-bezier(.16,1,.3,1), filter 500ms ease; }
      .tm-process-step:hover .px-step-symbol { transform: rotate(-6deg) scale(1.08); filter: drop-shadow(0 12px 24px rgba(114,212,197,.15)); }
      .tm-process-step.tm-visible .px-step-symbol { animation: tm-symbol-breathe 6.2s ease-in-out infinite; animation-delay: var(--tm-delay); }

      .tm-capability-field { overflow: hidden; }
      .tm-capability-field .px-bauhaus-ring { animation: tm-orbit-slow 22s linear infinite; transform-origin: center; }
      .tm-capability-field .px-bauhaus-square { animation: tm-square-drift 9s ease-in-out infinite alternate; }
      .tm-capability-field .px-bauhaus-arc { animation: tm-arc-drift 14s ease-in-out infinite alternate; }
      .tm-capability-field .px-bauhaus-dots { animation: tm-dots-breathe 7s ease-in-out infinite; }
      .tm-capability-item { transition: transform 500ms cubic-bezier(.16,1,.3,1), background-color 400ms ease !important; }
      .tm-capability-item:hover { transform: translate3d(8px,-4px,0) !important; background: rgba(114,212,197,.025); }
      .tm-capability-item .px-capability-icon { transition: transform 520ms cubic-bezier(.16,1,.3,1), color 400ms ease; }
      .tm-capability-item:hover .px-capability-icon { transform: scale(1.1) rotate(4deg); }

      .tm-audience-field { overflow: hidden; }
      .tm-audience-field .px-audience-arc-a { animation: tm-orbit-slow 26s linear infinite; transform-origin: center; }
      .tm-audience-field .px-audience-arc-b { animation: tm-orbit-reverse 31s linear infinite; transform-origin: center; }
      .tm-audience-field .px-audience-dot-grid { animation: tm-dots-breathe 6.8s ease-in-out infinite; }
      .tm-audience-item { transition: transform 430ms cubic-bezier(.16,1,.3,1), color 300ms ease !important; }
      .tm-audience-item:hover { transform: translateX(12px) !important; }
      .tm-audience-item svg { transition: transform 500ms cubic-bezier(.16,1,.3,1), filter 400ms ease; }
      .tm-audience-item:hover svg { transform: rotate(-7deg) scale(1.12); filter: drop-shadow(0 0 18px rgba(114,212,197,.18)); }

      .tm-platform-field { overflow: hidden; }
      .tm-platform-field::before { content: ""; position: absolute; top: 0; bottom: 0; left: calc(8% + var(--tm-progress,0) * 84%); width: 1px; pointer-events: none; background: linear-gradient(to bottom, transparent, rgba(114,212,197,.55), transparent); box-shadow: 0 0 24px rgba(114,212,197,.18); transition: left 100ms linear; }
      .tm-signal-item { transition: transform 480ms cubic-bezier(.16,1,.3,1), background-color 350ms ease !important; }
      .tm-signal-item:hover { transform: translateX(9px) !important; background: rgba(114,212,197,.025); }
      .tm-signal-item .px-signal-line { transform-origin: left; transform: scaleX(.12); opacity: .38; transition: transform 900ms cubic-bezier(.16,1,.3,1), opacity 500ms ease; }
      .tm-signal-item.tm-visible .px-signal-line { transform: scaleX(1); opacity: 1; }
      .tm-signal-item svg { transition: transform 500ms cubic-bezier(.16,1,.3,1); }
      .tm-signal-item:hover svg { transform: scale(1.12) rotate(5deg); }

      .tm-final-field { overflow: hidden; }
      .tm-final-field .px-final-ring-a { animation: tm-orbit-slow 24s linear infinite; transform-origin: center; }
      .tm-final-field .px-final-ring-b { animation: tm-orbit-reverse 29s linear infinite; transform-origin: center; }
      .tm-final-field .px-final-disc { animation: tm-final-pulse 5.8s ease-in-out infinite; }
      .tm-final-field .px-final-dots { animation: tm-dots-breathe 7.4s ease-in-out infinite; }
      .tm-final-field .px-final-actions a { transition: transform 420ms cubic-bezier(.16,1,.3,1), box-shadow 400ms ease !important; }
      .tm-final-field .px-final-actions a:hover { transform: translateY(-4px); box-shadow: 0 18px 38px rgba(0,0,0,.16); }

      @keyframes tm-breathe { 0%,100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(114,212,197,0)); } 50% { transform: scale(1.045); filter: drop-shadow(0 0 18px rgba(114,212,197,.12)); } }
      @keyframes tm-symbol-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      @keyframes tm-orbit-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes tm-orbit-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      @keyframes tm-square-drift { from { transform: translate3d(-5px,4px,0) rotate(-2deg); } to { transform: translate3d(9px,-7px,0) rotate(4deg); } }
      @keyframes tm-arc-drift { from { transform: translate3d(0,6px,0) rotate(-2deg); } to { transform: translate3d(-10px,-4px,0) rotate(3deg); } }
      @keyframes tm-dots-breathe { 0%,100% { opacity: .35; transform: scale(1); } 50% { opacity: .72; transform: scale(1.025); } }
      @keyframes tm-final-pulse { 0%,100% { opacity: .5; transform: scale(1); } 50% { opacity: .85; transform: scale(1.07); } }

      @media (prefers-reduced-motion: reduce) {
        .tm-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .tm-live * { animation: none !important; }
        .tm-live .tm-section::after, .tm-process-field::before, .tm-platform-field::before { display: none !important; }
      }

      @media (max-width: 767px) {
        .tm-live .tm-section::after { display: none; }
        .tm-process-field::before, .tm-platform-field::before { opacity: .38; }
        .tm-trust-item:hover, .tm-process-step:hover, .tm-capability-item:hover, .tm-audience-item:hover, .tm-signal-item:hover { transform: none !important; }
      }
    `}</style>
  )
}
