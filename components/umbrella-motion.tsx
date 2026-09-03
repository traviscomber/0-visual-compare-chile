"use client"

import { useEffect } from "react"

export function UmbrellaMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const finePointer = window.matchMedia("(pointer: fine)").matches
    const main = document.querySelector<HTMLElement>("main")
    if (!main) return

    main.classList.add("vm-home")

    const directionSection = document.querySelector<HTMLElement>("#directions")
    const directionRows = Array.from(document.querySelectorAll<HTMLElement>("#directions article"))
    const engine = document.querySelector<HTMLElement>("#engine")
    const engineSteps = Array.from(document.querySelectorAll<HTMLElement>("#engine article"))
    const sections = Array.from(main.querySelectorAll<HTMLElement>("section"))
    const logicSection = sections[2]
    const watchSection = sections[3]
    const ctaSection = sections[4]
    const watchRows = watchSection ? Array.from(watchSection.querySelectorAll<HTMLElement>(".group")) : []

    directionSection?.classList.add("vm-direction-field")
    directionRows.forEach((node, index) => {
      node.classList.add("vm-reveal", "vm-direction-row")
      node.style.setProperty("--vm-delay", `${index * 90}ms`)
      node.style.setProperty("--vm-index", String(index))
      const art = node.querySelector<HTMLElement>("div:last-child > div")
      art?.classList.add("vm-orbit-art")
    })

    engine?.classList.add("vm-engine-field")
    engineSteps.forEach((node, index) => {
      node.classList.add("vm-reveal", "vm-engine-step")
      node.style.setProperty("--vm-delay", `${index * 110}ms`)
      node.style.setProperty("--vm-step", String(index))
    })

    logicSection?.classList.add("vm-logic-field")
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

    ctaSection?.classList.add("vm-cta-field")

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

      if (engine) {
        const rect = engine.getBoundingClientRect()
        const raw = (viewport - rect.top) / Math.max(rect.height + viewport, 1)
        engine.style.setProperty("--vm-engine-progress", String(Math.max(0, Math.min(1, raw))))
      }

      if (logicSection) {
        const rect = logicSection.getBoundingClientRect()
        const raw = (viewport - rect.top) / Math.max(rect.height + viewport, 1)
        logicSection.style.setProperty("--vm-logic-progress", String(Math.max(0, Math.min(1, raw))))
      }

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

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer) return
      const x = (event.clientX / Math.max(window.innerWidth, 1)) * 100
      const y = (event.clientY / Math.max(window.innerHeight, 1)) * 100
      main.style.setProperty("--vm-pointer-x", `${x.toFixed(2)}%`)
      main.style.setProperty("--vm-pointer-y", `${y.toFixed(2)}%`)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    updateScroll()

    return () => {
      cancelAnimationFrame(raf)
      revealObserver.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("pointermove", onPointerMove)
      main.classList.remove("vm-home")
    }
  }, [])

  return (
    <style>{`
      .vm-home {
        --vm-pointer-x: 72%;
        --vm-pointer-y: 32%;
        overflow: clip;
        position: relative;
        isolation: isolate;
      }

      .vm-home::before {
        content: "";
        pointer-events: none;
        position: fixed;
        inset: 0;
        z-index: 50;
        opacity: .2;
        mix-blend-mode: screen;
        background: radial-gradient(560px circle at var(--vm-pointer-x) var(--vm-pointer-y), rgba(114,212,197,.10), transparent 68%);
        transition: opacity 500ms ease;
      }

      .vm-reveal {
        opacity: 0;
        transform: translate3d(0, 34px, 0);
        transition: opacity 900ms cubic-bezier(.2,.75,.2,1) var(--vm-delay,0ms), transform 1100ms cubic-bezier(.16,1,.3,1) var(--vm-delay,0ms);
      }
      .vm-reveal.vm-visible { opacity: 1; transform: translate3d(0,0,0); }

      .vm-direction-field { position: relative; overflow: hidden; isolation: isolate; }
      .vm-direction-field::before {
        content: "";
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: .24;
        background-image:
          radial-gradient(circle at 12% 18%, rgba(150,181,166,.22) 0 1px, transparent 1.5px),
          radial-gradient(circle at 76% 34%, rgba(69,110,142,.22) 0 1px, transparent 1.5px),
          linear-gradient(rgba(69,110,142,.055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(69,110,142,.055) 1px, transparent 1px);
        background-size: 180px 180px, 240px 240px, 72px 72px, 72px 72px;
        mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 82%, transparent);
        animation: vm-grid-drift 24s linear infinite;
      }
      .vm-direction-field::after {
        content: "";
        pointer-events: none;
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 140px;
        background: linear-gradient(to bottom, transparent, rgba(7,17,25,.34));
      }

      .vm-direction-row { position: relative; isolation: isolate; transition: background-color 420ms ease, padding-left 520ms cubic-bezier(.16,1,.3,1); }
      .vm-direction-row::before { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(114,212,197,.055), transparent 48%); transform: scaleX(0); transform-origin: left; transition: transform 700ms cubic-bezier(.16,1,.3,1); }
      .vm-direction-row::after { content: ""; position: absolute; left: 0; top: 0; width: 1px; height: 0; background: linear-gradient(#96B5A6, transparent); box-shadow: 0 0 18px rgba(114,212,197,.25); transition: height 720ms cubic-bezier(.16,1,.3,1); }
      .vm-direction-row:hover::before { transform: scaleX(1); }
      .vm-direction-row:hover::after { height: 100%; }
      .vm-direction-row:hover { padding-left: 12px; }
      .vm-orbit-art { transform: translate3d(calc(var(--vm-parallax, 0) * 10px),0,0) rotate(calc(var(--vm-parallax,0) * 2deg)); transition: transform 250ms linear, filter 500ms ease; filter: drop-shadow(0 0 0 rgba(114,212,197,0)); }
      .vm-direction-row:hover .vm-orbit-art { transform: translate3d(0,-8px,0) rotate(3deg) scale(1.045); filter: drop-shadow(0 18px 32px rgba(114,212,197,.12)); }

      .vm-engine-field { --vm-engine-progress: 0; position: relative; overflow: hidden; isolation: isolate; }
      .vm-engine-field::before { content: ""; pointer-events: none; position: absolute; inset: 0; z-index: 0; opacity: .52; background: radial-gradient(circle at 15% 45%, rgba(114,212,197,.10), transparent 24%), radial-gradient(circle at 82% 58%, rgba(69,110,142,.12), transparent 26%), repeating-linear-gradient(90deg, transparent 0 119px, rgba(150,181,166,.025) 120px); animation: vm-field-drift 12s ease-in-out infinite alternate; }
      .vm-engine-field::after { content: ""; pointer-events: none; position: absolute; left: -20%; top: calc(18% + var(--vm-engine-progress) * 52%); z-index: 1; width: 20%; height: 1px; background: linear-gradient(90deg, transparent, #96B5A6, transparent); box-shadow: 0 0 18px rgba(150,181,166,.55); animation: vm-scan-x 5.8s cubic-bezier(.4,0,.2,1) infinite; transition: top 120ms linear; }
      .vm-engine-step { position: relative; z-index: 2; }
      .vm-engine-step::after { content: ""; pointer-events: none; position: absolute; inset: 0; opacity: 0; background: radial-gradient(circle at 50% 34%, rgba(114,212,197,.09), transparent 42%); transition: opacity 500ms ease; }
      .vm-engine-step:hover::after { opacity: 1; }
      .vm-engine-step > div:first-of-type { box-shadow: 0 0 0 0 rgba(150,181,166,.18); }
      .vm-engine-step.vm-visible > div:first-of-type { animation: vm-node-pulse 3.8s ease-in-out infinite; animation-delay: calc(var(--vm-step,0) * 420ms); }
      .vm-engine-step:hover { background: rgba(114,212,197,.035); }

      .vm-logic-field { --vm-logic-progress: 0; position: relative; overflow: hidden; isolation: isolate; }
      .vm-logic-field::before {
        content: "";
        pointer-events: none;
        position: absolute;
        left: 48%;
        top: 8%;
        width: 42vw;
        height: 42vw;
        min-width: 480px;
        min-height: 480px;
        border: 1px solid rgba(69,110,142,.10);
        border-radius: 50%;
        box-shadow: 0 0 0 80px rgba(69,110,142,.018), 0 0 0 160px rgba(69,110,142,.012);
        transform: translate3d(calc((var(--vm-logic-progress) - .5) * 60px), calc((.5 - var(--vm-logic-progress)) * 30px), 0) rotate(calc(var(--vm-logic-progress) * 10deg));
        transition: transform 120ms linear;
      }
      .vm-logic-field::after {
        content: "";
        pointer-events: none;
        position: absolute;
        left: 51%;
        top: 24%;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #96B5A6;
        box-shadow: 12vw 9vw 0 -2px #456E8E, 24vw 2vw 0 -1px #729A90, 19vw 22vw 0 -2px #96B5A6, 5vw 26vw 0 -2px #456E8E;
        opacity: .5;
        animation: vm-constellation 8s ease-in-out infinite alternate;
      }

      .vm-watch-field { --vm-watch-progress: 0; position: relative; overflow: hidden; isolation: isolate; }
      .vm-watch-field::before {
        content: "";
        pointer-events: none;
        position: absolute;
        inset: 0;
        opacity: .18;
        background: repeating-linear-gradient(0deg, transparent 0 47px, rgba(150,181,166,.045) 48px), linear-gradient(115deg, transparent 25%, rgba(114,212,197,.045) 50%, transparent 75%);
        background-size: auto, 220% 100%;
        animation: vm-watch-wash 13s linear infinite;
      }
      .vm-watch-field::after { content: ""; pointer-events: none; position: absolute; right: 0; top: calc(10% + (var(--vm-watch-progress) * 72%)); width: min(46vw, 680px); height: 1px; background: linear-gradient(90deg, transparent, rgba(114,212,197,.62)); box-shadow: 0 0 22px rgba(114,212,197,.28); transition: top 90ms linear; }
      .vm-watch-row { transition: background-color 350ms ease, transform 450ms cubic-bezier(.16,1,.3,1); }
      .vm-watch-row:hover { background: rgba(114,212,197,.04); transform: translateX(8px); }
      .vm-watch-row > div:first-child span { transition: transform 420ms cubic-bezier(.16,1,.3,1), box-shadow 420ms ease, color 420ms ease; }
      .vm-watch-row:hover > div:first-child span { transform: rotate(45deg) scale(1.08); box-shadow: 0 0 26px rgba(114,212,197,.16); color: #E7DFCE; }

      .vm-cta-field { position: relative; overflow: hidden; isolation: isolate; }
      .vm-cta-field::before {
        content: "";
        pointer-events: none;
        position: absolute;
        left: 50%;
        bottom: -22%;
        width: 72vw;
        height: 300px;
        transform: translateX(-50%);
        opacity: .28;
        background: radial-gradient(ellipse at center, rgba(114,212,197,.14), transparent 66%);
        animation: vm-cta-breathe 6s ease-in-out infinite alternate;
      }

      .vm-section h2 { transition: letter-spacing 900ms cubic-bezier(.16,1,.3,1), text-shadow 900ms ease; }
      .vm-section.vm-visible h2 { letter-spacing: -0.058em; text-shadow: 0 0 38px rgba(231,223,206,.025); }
      .vm-section a { position: relative; overflow: hidden; }
      .vm-section a::after { content: "→"; position: absolute; right: 20px; opacity: 0; transform: translateX(-8px); transition: opacity 300ms ease, transform 400ms cubic-bezier(.16,1,.3,1); }
      .vm-section a:hover::after { opacity: 1; transform: translateX(0); }

      @keyframes vm-scan-x { 0% { transform: translateX(0); opacity: 0; } 12% { opacity: .85; } 88% { opacity: .75; } 100% { transform: translateX(700%); opacity: 0; } }
      @keyframes vm-node-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(150,181,166,0); } 45% { box-shadow: 0 0 0 7px rgba(150,181,166,.045), 0 0 22px rgba(114,212,197,.09); } }
      @keyframes vm-field-drift { from { transform: translate3d(-1.5%,0,0) scale(1); } to { transform: translate3d(1.5%,-1%,0) scale(1.04); } }
      @keyframes vm-grid-drift { from { background-position: 0 0, 0 0, 0 0, 0 0; } to { background-position: 90px 80px, -120px 120px, 0 72px, 72px 0; } }
      @keyframes vm-constellation { from { transform: translate3d(-10px, 4px, 0) scale(.96); opacity: .35; } to { transform: translate3d(12px, -8px, 0) scale(1.04); opacity: .65; } }
      @keyframes vm-watch-wash { from { background-position: 0 0, 0 0; } to { background-position: 0 48px, -220% 0; } }
      @keyframes vm-cta-breathe { from { transform: translateX(-50%) scale(.92); opacity: .2; } to { transform: translateX(-50%) scale(1.08); opacity: .4; } }

      @media (prefers-reduced-motion: reduce) {
        .vm-home::before { display: none !important; }
        .vm-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
        .vm-direction-field::before, .vm-engine-field::before, .vm-engine-field::after, .vm-engine-step > div:first-of-type, .vm-logic-field::after, .vm-watch-field::before, .vm-cta-field::before { animation: none !important; }
        .vm-orbit-art, .vm-watch-row, .vm-logic-field::before { transform: none !important; transition: none !important; }
      }

      @media (max-width: 767px) {
        .vm-home::before { display: none; }
        .vm-direction-row:hover { padding-left: 0; }
        .vm-watch-row:hover { transform: none; }
        .vm-watch-field::after { width: 62vw; }
        .vm-logic-field::before { left: 36%; opacity: .45; }
      }
    `}</style>
  )
}
