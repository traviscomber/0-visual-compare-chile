import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "VIDENTIA — Inteligencia para marcas en Chile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111827", color: "#F7F8F6", padding: "64px 72px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 58, height: 58, border: "1px solid rgba(255,255,255,.2)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 }}>V</div>
          <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 22, letterSpacing: 5, fontWeight: 700 }}>VIDENTIA</span><span style={{ marginTop: 8, fontSize: 12, letterSpacing: 3, color: "#98A2B3" }}>BY N3URALIA</span></div>
        </div>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#63C7B8" }}>TRADEMARK INTELLIGENCE · CHILE</div>
      </div>
      <div style={{ maxWidth: 980, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 72, lineHeight: 1.02, letterSpacing: -3, fontWeight: 400 }}>Busca. Entiende.<br/>Decide. Vigila.</div>
        <div style={{ marginTop: 28, fontSize: 23, lineHeight: 1.5, color: "#CBD5E1" }}>Inteligencia para marcas en Chile, construida sobre evidencia oficial y contexto verificable.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.16)", paddingTop: 22, fontSize: 13, color: "#98A2B3" }}><span>INAPI · NIZA · VIENA · TDPI</span><span>videntia.app</span></div>
    </div>,
    size,
  )
}
