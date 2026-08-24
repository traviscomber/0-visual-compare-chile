"use client"

import { useEffect } from "react"

export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".vx-home")
    if (!root) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-vx-reveal]"))
    const nav = root.querySelector<HTMLElement>(".vx-nav")
    const stage = root.querySelector<HTMLElement>("[data-vx-stage]")
    const photo = root.querySelector<HTMLElement>(".vx-photo")

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
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
      { rootMargin: "0px 0px -10%", threshold: 0.12 },
    )

    revealNodes.forEach((node) => observer.observe(node))

    let pointerFrame = 0
    let scrollFrame = 0

    const onPointerMove = (event: PointerEvent) => {
      if (!stage || event.pointerType === "touch") return
      cancelAnimationFrame(pointerFrame)
      pointerFrame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2
        stage.style.setProperty("--vx-px", x.toFixed(3))
        stage.style.setProperty("--vx-py", y.toFixed(3))
      })
    }

    const resetStage = () => {
      if (!stage) return
      stage.style.setProperty("--vx-px", "0")
      stage.style.setProperty("--vx-py", "0")
    }

    const updateScrollMotion = () => {
      scrollFrame = 0
      const viewport = Math.max(window.innerHeight, 1)
      const scrollY = window.scrollY
      root.style.setProperty("--vx-scroll", String(scrollY))
      nav?.classList.toggle("is-scrolled", scrollY > 28)

      if (stage) {
        const rect = stage.getBoundingClientRect()
        const progress = Math.max(-1, Math.min(1, (viewport * 0.55 - rect.top) / viewport))
        root.style.setProperty("--vx-stage-scroll", progress.toFixed(3))
      }

      if (photo) {
        const rect = photo.getBoundingClientRect()
        const progress = Math.max(-1, Math.min(1, (viewport * 0.6 - rect.top) / viewport))
        root.style.setProperty("--vx-photo-scroll", progress.toFixed(3))
      }
    }

    const onScroll = () => {
      if (scrollFrame) return
      scrollFrame = requestAnimationFrame(updateScrollMotion)
    }

    stage?.addEventListener("pointermove", onPointerMove)
    stage?.addEventListener("pointerleave", resetStage)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    updateScrollMotion()

    return () => {
      cancelAnimationFrame(pointerFrame)
      cancelAnimationFrame(scrollFrame)
      observer.disconnect()
      stage?.removeEventListener("pointermove", onPointerMove)
      stage?.removeEventListener("pointerleave", resetStage)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return null
}
