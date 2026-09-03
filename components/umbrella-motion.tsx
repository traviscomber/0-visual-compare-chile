"use client"

import { useEffect } from "react"

export function UmbrellaMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("#main-content")
    if (!root) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>("main > section, #directions article, #engine article"))

    targets.forEach((node, index) => {
      node.classList.add("vm-reveal")
      node.style.setProperty("--vm-delay", `${Math.min(index * 45, 180)}ms`)
    })

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((node) => node.classList.add("vm-visible"))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          ;(entry.target as HTMLElement).classList.add("vm-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -6%" },
    )

    targets.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <style>{`
      .vm-reveal {
        opacity: 0;
        transform: translate3d(0, 18px, 0);
        transition:
          opacity 520ms cubic-bezier(.2,.75,.2,1) var(--vm-delay,0ms),
          transform 560ms cubic-bezier(.16,1,.3,1) var(--vm-delay,0ms);
      }

      .vm-reveal.vm-visible {
        opacity: 1;
        transform: none;
      }

      #directions article,
      #engine article {
        position: relative;
      }

      #directions article::after,
      #engine article::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 1px;
        transform: scaleX(0);
        transform-origin: left;
        background: linear-gradient(90deg, #4A7F74, transparent 58%);
        transition: transform 220ms ease;
        pointer-events: none;
      }

      #directions article:hover::after,
      #engine article:hover::after {
        transform: scaleX(1);
      }

      #main-content section h2,
      #main-content section h3 {
        text-wrap: balance;
      }

      @media (prefers-reduced-motion: reduce) {
        .vm-reveal {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        #directions article::after,
        #engine article::after {
          transition: none !important;
        }
      }
    `}</style>
  )
}
