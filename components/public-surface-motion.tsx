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

    sections.forEach((section, index) => {
      section.classList.add("psm-reveal")
      section.style.setProperty("--psm-delay", `${Math.min(index * 40, 160)}ms`)
    })

    articles.forEach((article, index) => {
      article.classList.add("psm-item")
      article.style.setProperty("--psm-item-delay", `${(index % 5) * 45}ms`)
    })

    const revealAll = () => {
      sections.forEach((section) => section.classList.add("psm-visible"))
      articles.forEach((article) => article.classList.add("psm-visible"))
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealAll()
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        ;(entry.target as HTMLElement).classList.add("psm-visible")
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.12, rootMargin: "0px 0px -6%" })

    sections.forEach((section) => observer.observe(section))
    articles.forEach((article) => observer.observe(article))

    return () => observer.disconnect()
  }, [variant])

  return (
    <style>{`
      .psm-root { position:relative; isolation:isolate; overflow:clip; }

      .psm-reveal {
        opacity:0;
        transform:translate3d(0,18px,0);
        transition:opacity 520ms cubic-bezier(.2,.75,.2,1) var(--psm-delay,0ms), transform 560ms cubic-bezier(.16,1,.3,1) var(--psm-delay,0ms);
      }
      .psm-reveal.psm-visible { opacity:1; transform:none; }

      .psm-item {
        position:relative;
        opacity:0;
        transform:translate3d(0,12px,0);
        transition:opacity 420ms ease var(--psm-item-delay,0ms), transform 500ms cubic-bezier(.16,1,.3,1) var(--psm-item-delay,0ms), background-color 180ms ease, border-color 180ms ease;
      }
      .psm-item.psm-visible { opacity:1; transform:none; }
      .psm-item:hover { background-color:rgba(150,181,166,.018); border-color:rgba(150,181,166,.42)!important; }

      .psm-root section a { transition:color 180ms ease,border-color 180ms ease,background-color 180ms ease; }

      .psm-resources pre {
        transition:border-color 180ms ease,background-color 180ms ease;
      }
      .psm-resources pre:hover,.psm-resources pre:focus-visible { border-color:#4A7F74; }

      .psm-patents section h2::after,
      .psm-technologies section h2::after,
      .psm-trademarks section h2::after {
        content:"";
        display:block;
        width:44px;
        height:1px;
        margin-top:18px;
        background:#4A7F74;
        opacity:.5;
      }

      @media(prefers-reduced-motion:reduce){
        .psm-reveal,.psm-item{opacity:1!important;transform:none!important;transition:none!important}
        .psm-root section a,.psm-resources pre{transition:none!important}
      }
    `}</style>
  )
}
