"use client"

import { useEffect } from "react"

export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".px-home")
    if (!root) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-px-reveal]"))
    const visual = root.querySelector<HTMLElement>("[data-px-visual]")

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.classList.add("is-visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8%", threshold: 0.1 },
    )

    revealNodes.forEach((node) => observer.observe(node))

    let frame = 0
    const update = () => {
      frame = 0
      if (!visual) return
      const rect = visual.getBoundingClientRect()
      const viewport = Math.max(window.innerHeight, 1)
      const progress = Math.max(-1, Math.min(1, (viewport * 0.5 - rect.top) / viewport))
      root.style.setProperty("--px-scroll", progress.toFixed(3))
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return null
}
