"use client"

import { useEffect } from "react"

export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".vx-home")
    if (!root) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const revealNodes = Array.from(root.querySelectorAll<HTMLElement>("[data-vx-reveal]"))

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

    const stage = root.querySelector<HTMLElement>("[data-vx-stage]")
    let frame = 0

    const onPointerMove = (event: PointerEvent) => {
      if (!stage || reduceMotion.matches || event.pointerType === "touch") return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
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

    stage?.addEventListener("pointermove", onPointerMove)
    stage?.addEventListener("pointerleave", resetStage)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      stage?.removeEventListener("pointermove", onPointerMove)
      stage?.removeEventListener("pointerleave", resetStage)
    }
  }, [])

  return null
}
