"use client"

import { useEffect } from "react"

export function ResourcesMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-public-surface]")
    if (!root) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    root.classList.add("res-live")

    const sections = Array.from(root.querySelectorAll<HTMLElement>("main section"))
    const articles = Array.from(root.querySelectorAll<HTMLElement>("main article"))
    const pres = Array.from(root.querySelectorAll<HTMLElement>("pre"))

    sections.forEach((section, i) => {
      section.classList.add("res-section")
      section.style.setProperty("--res-index", String(i))
    })
    articles.forEach((article, i) => {
      article.classList.add("res-item")
      article.style.setProperty("--res-delay", `${(i % 6) * 80}ms`)
    })
    pres.forEach((pre, i) => {
      pre.classList.add("res-code")
      pre.style.setProperty("--res-code-delay", `${i * 120}ms`)
    })

    if (reduced || !("IntersectionObserver" in window)) {
      sections.forEach((s) => s.classList.add("res-visible"))
      articles.forEach((a) => a.classList.add("res-item-visible"))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const node = entry.target as HTMLElement
        if (node.classList.contains("res-item")) node.classList.add("res-item-visible")
        else node.classList.add("res-visible")
        observer.unobserve(node)
      })
    }, { threshold: .12, rootMargin: "0px 0px -6%" })

    sections.forEach((s) => observer.observe(s))
    articles.forEach((a) => observer.observe(a))

    let raf = 0
    const update = () => {
      raf = 0
      const vh = Math.max(window.innerHeight, 1)
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        const p = Math.max(0, Math.min(1, (vh - rect.top) / Math.max(vh + rect.height, 1)))
        section.style.setProperty("--res-progress", p.toFixed(3))
      })
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(update)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      root.classList.remove("res-live")
    }
  }, [])

  return <style>{`
    .res-live { position:relative; isolation:isolate; overflow:clip; }
    .res-section { position:relative; isolation:isolate; opacity:0; transform:translateY(28px); transition:opacity 820ms cubic-bezier(.2,.75,.2,1), transform 1040ms cubic-bezier(.16,1,.3,1); }
    .res-section.res-visible { opacity:1; transform:none; }
    .res-section::after { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none; opacity:.38; background:linear-gradient(90deg,transparent 12%,rgba(74,127,116,.025) 50%,transparent 88%); }
    .res-item { position:relative; opacity:.2; transform:translateX(16px); transition:opacity 700ms cubic-bezier(.2,.75,.2,1) var(--res-delay), transform 900ms cubic-bezier(.16,1,.3,1) var(--res-delay), background-color 360ms ease, border-color 360ms ease; }
    .res-item.res-item-visible { opacity:1; transform:none; }
    .res-item::before { content:""; position:absolute; left:0; top:0; bottom:0; width:1px; opacity:.24; background:linear-gradient(to bottom,transparent,#4A7F74,transparent); transform:scaleY(.18); transform-origin:top; transition:transform 850ms cubic-bezier(.16,1,.3,1),opacity 400ms ease; }
    .res-item.res-item-visible::before { transform:scaleY(1); opacity:.52; }
    .res-item:hover { transform:translateX(8px); background:rgba(114,212,197,.025); border-color:rgba(150,181,166,.45) !important; }

    .res-live main section:first-of-type::before { content:""; position:absolute; right:5%; top:12%; width:min(440px,38vw); aspect-ratio:1; border-radius:999px; pointer-events:none; opacity:.22; background:repeating-radial-gradient(circle,rgba(150,181,166,.18) 0 1px,transparent 1px 38px); transform:rotate(calc(var(--res-progress,0) * 28deg)); mask-image:radial-gradient(circle,#000 0 56%,transparent 78%); }
    .res-live main section:nth-of-type(2)::before { content:""; position:absolute; left:calc(5% + var(--res-progress,0) * 88%); top:0; bottom:0; width:1px; pointer-events:none; opacity:.52; background:linear-gradient(to bottom,transparent,rgba(114,212,197,.66),transparent); box-shadow:0 0 26px rgba(114,212,197,.13); }
    .res-live main section:nth-of-type(3)::before { content:""; position:absolute; left:5%; right:5%; top:calc(18% + var(--res-progress,0) * 64%); height:1px; pointer-events:none; opacity:.42; background:linear-gradient(90deg,transparent,#456E8E 24%,#4A7F74 52%,#96B5A6 72%,transparent); box-shadow:0 0 24px rgba(114,212,197,.1); }

    .res-code { position:relative; overflow:hidden; transition:transform 500ms cubic-bezier(.16,1,.3,1), border-color 360ms ease, box-shadow 450ms ease !important; }
    .res-code::before { content:""; position:absolute; left:-30%; top:0; bottom:0; width:22%; pointer-events:none; background:linear-gradient(90deg,transparent,rgba(183,211,209,.08),transparent); transform:skewX(-12deg); animation:res-code-scan 5.8s ease-in-out infinite; animation-delay:var(--res-code-delay); }
    .res-code::after { content:""; position:absolute; left:0; right:0; top:0; height:1px; pointer-events:none; background:linear-gradient(90deg,transparent,rgba(150,181,166,.72),transparent); opacity:.62; transform:translateX(calc(-100% + var(--res-progress,0) * 200%)); }
    .res-code:hover,.res-code:focus-visible { transform:translateY(-4px) !important; border-color:#4A7F74 !important; box-shadow:0 18px 52px rgba(0,0,0,.24),0 0 34px rgba(114,212,197,.06) !important; }
    .res-live main section a { transition:transform 380ms cubic-bezier(.16,1,.3,1),box-shadow 380ms ease,border-color 300ms ease,background-color 300ms ease; }
    .res-live main section a:hover { transform:translateY(-3px); box-shadow:0 15px 34px rgba(0,0,0,.16); }
    .res-live footer { position:relative; overflow:hidden; }
    .res-live footer::before { content:""; position:absolute; left:-20%; right:-20%; top:0; height:1px; background:linear-gradient(90deg,transparent,#4A7F74,#96B5A6,#456E8E,transparent); animation:res-footer-line 8s linear infinite; opacity:.55; }

    @keyframes res-code-scan { 0%,18%{left:-30%;opacity:0} 34%{opacity:.8} 68%{left:116%;opacity:.45} 100%{left:116%;opacity:0} }
    @keyframes res-footer-line { from{transform:translateX(-18%)} to{transform:translateX(18%)} }

    @media (prefers-reduced-motion:reduce){
      .res-section,.res-item{opacity:1!important;transform:none!important;transition:none!important}
      .res-section::before,.res-code::before,.res-code::after,.res-live footer::before{display:none!important}
      .res-code{transform:none!important;transition:none!important}
    }
    @media(max-width:767px){
      .res-live main section::before{opacity:.18!important}
      .res-item:hover,.res-code:hover{transform:none!important}
    }
  `}</style>
}
