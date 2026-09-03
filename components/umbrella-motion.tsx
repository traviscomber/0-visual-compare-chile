"use client"

import { useEffect } from "react"

export function UmbrellaMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const main = document.querySelector<HTMLElement>("main")
    if (!main) return

    main.classList.add("vm-home")

    const directionRows = Array.from(document.querySelectorAll<HTMLElement>("#directions article"))
    const engine = document.querySelector<HTMLElement>("#engine")
    const engineSteps = Array.from(document.querySelectorAll<HTMLElement>("#engine article"))
    const sections = Array.from(main.querySelectorAll<HTMLElement>("section"))
    const logicSection = sections[2]
    const watchSection = sections[3]
    const ctaSection = sections[4]
    const watchRows = watchSection ? Array.from(watchSection.querySelectorAll<HTMLElement>(".group")) : []

    directionRows.forEach((node, index) => {
      node.classList.add("vm-reveal", "vm-direction-row")
      node.style.setProperty("--vm-delay", `${index * 90}ms`)
      const art = node.querySelector<HTMLElement>("div:last-child > div")
      art?.classList.add("vm-orbit-art")
    })

    engine?.classList.add("vm-engine-field")
    engineSteps.forEach((node, index) => {
      node.classList.add("vm-reveal", "vm-engine-step")
      node.style.setProperty("--vm-delay", `${index * 110}ms`)
    })

    ;[logicSection, watchSection, ctaSection].forEach((node, index) => {
      if (!node) return
      node.classList.add("vm-reveal", "vm-section")
      node.style.setProperty("--vm-delay", `${index * 70}ms`)
    })

    watchSection?.classList.add("vm-watch-field")
    watchRows.forEach((node, index) => {
      node.classList.add("vm-watch-row")
      node.style.setProperty("--vm-row", String(index))
    })

    if (reduceMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(".vm-reveal").forEach((node) => node.classList.add("vm-visible"))
      return
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("vm-visible")
          revealObserver.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" },
    )

    document.querySelectorAll<HTMLElement>(".vm-reveal").forEach((node) => revealObserver.observe(node))

    let raf = 0
    const updateScroll = () => {
      raf = 0
      const viewport = Math.max(window.innerHeight, 1)

      directionRows.forEach((row, index) => {
        const rect = row.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        const distance = (center - viewport / 2) / viewport
        row.style.setProperty("--vm-parallax", `${Math.max(-1, Math.min(1, distance)) * (index % 2 ? -1 : 1)}`)
      })

      if (watchSection) {
        const rect = watchSection.getBoundingClientRect()
        const raw = (viewport - rect.top) / Math.max(rect.height + viewport, 1)
        watchSection.style.setProperty("--vm-watch-progress", String(Math.max(0, Math.min(1, raw))))
      }
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(updateScroll)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    updateScroll()

    return () => {
      cancelAnimationFrame(raf)
      revealObserver.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      main.classList.remove("vm-home")
    }
  }, [])

  return (
    <style>{`
      .vm-home { overflow: clip; }
      .vm-reveal { opacity: 0; transform: translate3d(0, 34px, 0); transition: opacity 900ms cubic-bezier(.2,.75,.2,1) var(--vm-delay,0ms), transform 1100ms cubic-bezier(.16,1,.3,1) var(--vm-delay,0ms); }
      .vm-reveal.vm-visible { opacity: 1; transform: translate3d(0,0,0); }

      .vm-direction-row { position: relative; isolation: isolate; transition: background-color 420ms ease, padding-left 520ms cubic-bezier(.16,1,.3,1); }
      .vm-direction-row::before { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(114,212,197,.055), transparent 48%); transform: scaleX(0); transform-origin: left; transition: transform 700ms cubic-bezier(.16,1,.3,1); }
      .vm-direction-row:hover::before { transform: scaleX(1); }
      .vm-direction-row:hover { padding-left: 12px; }
      .vm-orbit-art { transform: translate3d(calc(var(--vm-parallax, 0) * 10px),0,0) rotate(calc(var(--vm-parallax,0) * 2deg)); transition: transform 250ms linear, filter 500ms ease; filter: drop-shadow(0 0 0 rgba(114,212,197,0)); }
      .vm-direction-row:hover .vm-orbit-art { transform: translate3d(0,-8px,0) rotate(3deg) scale(1.045); filter: drop-shadow(0 18px 32px rgba(114,212,197,.12)); }

      .vm-engine-field { position: relative; overflow: hidden; }
      .vm-engine-field::before { content: ""; pointer-events: none; position: absolute; inset: 0; opacity: .42; background: radial-gradient(circle at 15% 45%, rgba(114,212,197,.09), transparent 24%), radial-gradient(circle at 82% 58%, rgba(69,110,142,.10), transparent 26%); animation: vm-field-drift 12s ease-in-out infinite alternate; }
      .vm-engine-field::after { content: ""; pointer-events: none; position: absolute; left: -20%; top: 0; width: 20%; height: 1px; background: linear-gradient(90deg, transparent, #96B5A6, transparent); box-shadow: 0 0 18px rgba(150,181,166,.55); animation: vm-scan-x 5.8s cubic-bezier(.4,0,.2,1) infinite; }
      .vm-engine-step > div:first-of-type { box-shadow: 0 0 0 0 rgba(150,181,166,.18); }
      .vm-engine-step.vm-visible > div:first-of-type { animation: vm-node-pulse 3.8s ease-in-out infinite; animation-delay: var(--vm-delay,0ms); }
      .vm-engine-step:hover { background: rgba(114,212,197,.035); }

      .vm-watch-field { --vm-watch-progress: 0; position: relative; overflow: hidden; }
      .vm-watch-field::after { content: ""; pointer-events: none; position: absolute; right: 0; top: calc(10% + (var(--vm-watch-progress) * 72%)); width: min(46vw, 680px); height: 1px; background: linear-gradient(90deg, transparent, rgba(114,212,197,.62)); box-shadow: 0 0 22px rgba(114,212,197,.28); transition: top 90ms linear; }
      .vm-watch-row { transition: background-color 350ms ease, transform 450ms cubic-bezier(.16,1,.3,1); }
      .vm-watch-row:hover { background: rgba(114,212,197,.04); transform: translateX(8px); }
      .vm-watch-row > div:first-child span { transition: transform 420ms cubic-bezier(.16,1,.3,1), box-shadow 420ms ease, color 420ms ease; }
      .vm-watch-row:hover > div:first-child span { transform: rotate(45deg) scale(1.08); box-shadow: 0 0 26px rgba(114,212,197,.16); color: #E7DFCE; }

      .vm-section h2 { transition: letter-spacing 900ms cubic-bezier(.16,1,.3,1); }
      .vm-section.vm-visible h2 { letter-spacing: -0.058em; }
      .vm-section a { position: relative; overflow: hidden; }
      .vm-section a::after { content: "→"; position: absolute; right: 20px; opacity: 0; transform: translateX(-8px); transition: opacity 300ms ease, transform 400ms cubic-bezier(.16,1,.3,1); }
      .vm-section a:hover::after { opacity: 1; transform: translateX(0); }

      @keyframes vm-scan-x { 0% { transform: translateX(0); opacity: 0; } 12% { opacity: .85; } 88% { opacity: .75; } 100% { transform: translateX(700%); opacity: 0; } }
      @keyframes vm-node-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(150,181,166,0); } 45% { box-shadow: 0 0 0 7px rgba(150,181,166,.045), 0 0 22px rgba(114,212,197,.09); } }
      @keyframes vm-field-drift { from { transform: translate3d(-1.5%,0,0) scale(1); } to { transform: translate3d(1.5%,-1%,0) scale(1.04); } }

      @media (prefers-reduced-motion: reduce) {
        .vm-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .vm-engine-field::before, .vm-engine-field::after, .vm-engine-step > div:first-of-type { animation: none !important; }
        .vm-orbit-art, .vm-watch-row { transform: none !important; transition: none !important; }
      }

      @media (max-width: 767px) {
        .vm-direction-row:hover { padding-left: 0; }
        .vm-watch-row:hover { transform: none; }
        .vm-watch-field::after { width: 62vw; }
      }
    `}</style>
  )
}
