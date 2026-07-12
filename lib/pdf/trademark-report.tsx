// react-pdf/renderer document — NO custom components (reconciler limitation)
// All rendering is inlined. No null returns, no fragments, no hooks.
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  navy:       "#0D1B2A",
  navyLight:  "#1A2E45",
  blue:       "#2563EB",
  blueLight:  "#3B82F6",
  blueFaint:  "#EFF6FF",
  green:      "#16A34A",
  greenFaint: "#F0FDF4",
  amber:      "#D97706",
  amberFaint: "#FFFBEB",
  red:        "#DC2626",
  redFaint:   "#FEF2F2",
  slate:      "#64748B",
  slateLight: "#94A3B8",
  border:     "#E2E8F0",
  white:      "#FFFFFF",
  offwhite:   "#F8FAFC",
  text:       "#1E293B",
  textMuted:  "#475569",
}

const s = StyleSheet.create({
  page:            { backgroundColor: C.white, fontFamily: "Helvetica", paddingBottom: 48 },
  cover:           { backgroundColor: C.navy, flex: 1 },
  coverAccent:     { backgroundColor: C.blue, height: 6 },
  coverBody:       { padding: 52, flex: 1, justifyContent: "space-between" },
  coverLogoRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 44 },
  coverLogoBox:    { width: 38, height: 38, backgroundColor: C.blue, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  coverLogoTxt:    { fontSize: 17, color: C.white, fontFamily: "Helvetica-Bold" },
  coverBrand:      { fontSize: 18, color: C.white, fontFamily: "Helvetica-Bold" },
  coverBrandSub:   { fontSize: 8, color: C.blueLight, letterSpacing: 2 },
  coverTitle:      { fontSize: 36, color: C.white, fontFamily: "Helvetica-Bold", lineHeight: 1.25, marginBottom: 14 },
  coverSubtitle:   { fontSize: 13, color: C.blueLight, lineHeight: 1.55, marginBottom: 44 },
  coverStatRow:    { flexDirection: "row", gap: 16, marginBottom: 40 },
  coverStatBox:    { flex: 1, backgroundColor: C.navyLight, borderRadius: 10, padding: 16, alignItems: "center" },
  coverStatNum:    { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  coverStatLabel:  { fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
  coverDivider:    { height: 1, backgroundColor: C.navyLight, marginBottom: 28 },
  coverMetaRow:    { flexDirection: "row", gap: 28 },
  coverMetaItem:   { flexDirection: "column", gap: 3 },
  coverMetaLabel:  { fontSize: 8, color: C.slateLight, textTransform: "uppercase", letterSpacing: 1.5 },
  coverMetaValue:  { fontSize: 11, color: C.white, fontFamily: "Helvetica-Bold" },
  coverFooterRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  coverBadge:      { backgroundColor: C.blue, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  coverBadgeTxt:   { fontSize: 8, color: C.white, fontFamily: "Helvetica-Bold", letterSpacing: 1 },

  pageHdr:         { backgroundColor: C.navy, height: 46, flexDirection: "row", alignItems: "center", paddingHorizontal: 40, justifyContent: "space-between" },
  pageHdrBrand:    { fontSize: 10, color: C.white, fontFamily: "Helvetica-Bold" },
  pageHdrSub:      { fontSize: 8, color: C.slateLight },
  pageNum:         { fontSize: 8, color: C.slateLight },

  content:         { paddingHorizontal: 40, paddingTop: 26 },
  sectionTagRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  sectionTagLine:  { height: 3, width: 26, backgroundColor: C.blue, borderRadius: 2 },
  sectionTagTxt:   { fontSize: 9, color: C.blue, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1.5 },

  h1:              { fontSize: 22, color: C.navy, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  h2:              { fontSize: 16, color: C.navy, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h3:              { fontSize: 12, color: C.navy, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  body:            { fontSize: 10, color: C.textMuted, lineHeight: 1.6, marginBottom: 10 },
  bodySmall:       { fontSize: 9, color: C.textMuted, lineHeight: 1.5 },

  card:            { backgroundColor: C.offwhite, borderRadius: 10, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardRow:         { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  cardLogoBox:     { width: 68, height: 68, borderRadius: 8, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  cardLogoImg:     { width: "100%", height: "100%" },
  cardInfo:        { flex: 1 },
  cardTitleRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
  cardTitle:       { fontSize: 17, color: C.navy, fontFamily: "Helvetica-Bold" },
  cardMeta:        { fontSize: 8, color: C.slateLight, marginBottom: 6 },
  cardDesc:        { fontSize: 9, color: C.textMuted, lineHeight: 1.45 },

  statsRow:        { flexDirection: "row", gap: 8, marginTop: 12 },
  statBox:         { flex: 1, borderRadius: 8, padding: 10, alignItems: "center" },
  statNum:         { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  statLabel:       { fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },

  riskBadge:       { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: "flex-start" },
  riskText:        { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },

  tableHdr:        { flexDirection: "row", backgroundColor: C.navy, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 0 },
  tableHdrCell:    { fontSize: 8, color: C.slateLight, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow:        { flexDirection: "row", paddingHorizontal: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border, alignItems: "center" },
  tableRowAlt:     { backgroundColor: C.offwhite },
  tableCell:       { fontSize: 9, color: C.text },
  tableCellMuted:  { fontSize: 9, color: C.textMuted },

  chipRow:         { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 8 },
  chip:            { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: C.blueFaint },
  chipText:        { fontSize: 8, color: C.blue, fontFamily: "Helvetica-Bold" },

  screenshotBox:   { borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: C.border, marginBottom: 6 },
  screenshotImg:   { width: "100%", height: 230 },
  screenshotCap:   { fontSize: 8, color: C.slateLight, textAlign: "center", marginBottom: 10 },

  recItem:         { flexDirection: "row", gap: 10, marginBottom: 9, alignItems: "flex-start" },
  recNum:          { width: 18, height: 18, borderRadius: 9, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" },
  recNumTxt:       { fontSize: 9, color: C.white, fontFamily: "Helvetica-Bold" },
  recText:         { flex: 1, fontSize: 9.5, color: C.textMuted, lineHeight: 1.55, paddingTop: 1 },

  nextStepRow:     { flexDirection: "row", gap: 8, marginBottom: 5, alignItems: "flex-start" },
  nextStepDot:     { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.blue, marginTop: 3 },
  nextStepText:    { flex: 1, fontSize: 9, color: C.textMuted, lineHeight: 1.5 },

  divider:         { height: 1, backgroundColor: C.border, marginVertical: 16 },
  twoCol:          { flexDirection: "row", gap: 12 },
  col:             { flex: 1 },

  highlightBox:    { borderRadius: 8, padding: 14, marginBottom: 14, borderLeftWidth: 3 },
  highlightText:   { fontSize: 9.5, lineHeight: 1.6 },

  footer:          { position: "absolute", bottom: 16, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:      { fontSize: 8, color: C.slateLight },
})

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CaseData {
  name: string
  industry: string
  description: string
  risk: "BAJO" | "MEDIO" | "ALTO"
  tokens: number
  cost: string
  time: string
  totalConflicts: number
  highConflicts: number
  mediumConflicts: number
  lowConflicts: number
  analyzedCount: number
  viena: Array<{ code: string; description: string; confidence: number }>
  niza: Array<{ class: string; description: string }>
  conflicts: Array<{ name: string; score: number; level: string; niza: string[]; country: string }>
  recommendations: string[]
  nextSteps: string[]
  logoPath: string
  screenshotPath: string
  screenshotDetailPath: string
}

export interface TrademarkReportProps {
  cases: CaseData[]
  generatedAt: string
  preparedFor: string
}

// ─── Helpers (pure view-returning functions, not React components) ────────────
function riskBg(r: string) {
  if (r === "ALTO")  return C.redFaint
  if (r === "MEDIO") return C.amberFaint
  return C.greenFaint
}
function riskColor(r: string) {
  if (r === "ALTO")  return C.red
  if (r === "MEDIO") return C.amber
  return C.green
}
function conflictBg(lvl: string)  { return lvl === "ALTO" ? C.redFaint  : lvl === "MEDIO" ? C.amberFaint : C.greenFaint }
function conflictClr(lvl: string) { return lvl === "ALTO" ? C.red       : lvl === "MEDIO" ? C.amber      : C.green }

// ─── Document ────────────────────────────────────────────────────────────────
export function TrademarkReportDocument({ cases, generatedAt, preparedFor }: TrademarkReportProps) {
  const totalPages = 2 + cases.length * 2

  const pages: React.ReactElement[] = []

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────
  pages.push(
    <Page key="cover" size="A4" style={s.page}>
      <View style={s.cover}>
        <View style={s.coverAccent} />
        <View style={s.coverBody}>
          <View>
            {/* Branding */}
            <View style={s.coverLogoRow}>
              <View style={s.coverLogoBox}>
                <Text style={s.coverLogoTxt}>VC</Text>
              </View>
              <View>
                <Text style={s.coverBrand}>Visual Compare</Text>
                <Text style={s.coverBrandSub}>CHILE · PROPIEDAD INTELECTUAL</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={s.coverTitle}>{"Informe de\nAnálisis de Marca"}</Text>
            <Text style={s.coverSubtitle}>
              {"Clasificación automatizada con IA · Detección de conflictos\nClasificación Niza (NCL 13a ed.) y Viena (VCL 10a ed.)"}
            </Text>

            {/* Stats */}
            <View style={s.coverStatRow}>
              <View style={s.coverStatBox}>
                <Text style={[s.coverStatNum, { color: C.blueLight }]}>{cases.length}</Text>
                <Text style={[s.coverStatLabel, { color: C.slateLight }]}>Marcas analizadas</Text>
              </View>
              <View style={s.coverStatBox}>
                <Text style={[s.coverStatNum, { color: C.green }]}>{cases.filter(c => c.risk === "BAJO").length}</Text>
                <Text style={[s.coverStatLabel, { color: C.slateLight }]}>Riesgo bajo</Text>
              </View>
              <View style={s.coverStatBox}>
                <Text style={[s.coverStatNum, { color: C.amber }]}>{cases.filter(c => c.risk === "MEDIO").length}</Text>
                <Text style={[s.coverStatLabel, { color: C.slateLight }]}>Riesgo medio</Text>
              </View>
              <View style={s.coverStatBox}>
                <Text style={[s.coverStatNum, { color: C.red }]}>{cases.filter(c => c.risk === "ALTO").length}</Text>
                <Text style={[s.coverStatLabel, { color: C.slateLight }]}>Riesgo alto</Text>
              </View>
            </View>
          </View>

          <View>
            <View style={s.coverDivider} />
            <View style={s.coverFooterRow}>
              <View style={s.coverMetaRow}>
                <View style={s.coverMetaItem}>
                  <Text style={s.coverMetaLabel}>Preparado para</Text>
                  <Text style={s.coverMetaValue}>{preparedFor}</Text>
                </View>
                <View style={s.coverMetaItem}>
                  <Text style={s.coverMetaLabel}>Fecha de generación</Text>
                  <Text style={s.coverMetaValue}>{generatedAt}</Text>
                </View>
                <View style={s.coverMetaItem}>
                  <Text style={s.coverMetaLabel}>Motor de análisis</Text>
                  <Text style={s.coverMetaValue}>GPT-4o Vision + Conflict Engine v1</Text>
                </View>
              </View>
              <View style={s.coverBadge}>
                <Text style={s.coverBadgeTxt}>CONFIDENCIAL</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Page>
  )

  // ── PAGE 2: EXECUTIVE SUMMARY ──────────────────────────────────────────────
  pages.push(
    <Page key="summary" size="A4" style={s.page}>
      {/* Header */}
      <View style={s.pageHdr}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[s.coverLogoBox, { width: 22, height: 22, borderRadius: 5 }]}>
            <Text style={[s.coverLogoTxt, { fontSize: 10 }]}>VC</Text>
          </View>
          <Text style={s.pageHdrBrand}>Visual Compare Chile</Text>
        </View>
        <Text style={s.pageHdrSub}>Informe de Análisis de Marca · Confidencial</Text>
        <Text style={s.pageNum}>2 / {totalPages}</Text>
      </View>

      <View style={s.content}>
        {/* Section tag */}
        <View style={s.sectionTagRow}>
          <View style={s.sectionTagLine} />
          <Text style={s.sectionTagTxt}>Resumen ejecutivo</Text>
        </View>
        <Text style={s.h1}>Resultados del análisis</Text>
        <Text style={[s.body, { marginBottom: 18 }]}>
          Se analizaron {cases.length} marcas mediante el motor de inteligencia artificial de Visual Compare Chile,
          que combina visión por computador (GPT-4o Vision) para clasificación Viena, análisis semántico para
          clases Niza, y un motor de conflictos con scoring ponderado contra el repositorio de marcas registradas.
        </Text>

        {/* Summary table */}
        <View style={{ borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: C.border, marginBottom: 18 }}>
          <View style={s.tableHdr}>
            <Text style={[s.tableHdrCell, { flex: 2 }]}>Marca</Text>
            <Text style={[s.tableHdrCell, { flex: 1.5 }]}>Sector</Text>
            <Text style={[s.tableHdrCell, { flex: 1, textAlign: "center" }]}>Riesgo</Text>
            <Text style={[s.tableHdrCell, { flex: 0.8, textAlign: "center" }]}>Conflictos</Text>
            <Text style={[s.tableHdrCell, { flex: 0.8, textAlign: "center" }]}>Costo IA</Text>
            <Text style={[s.tableHdrCell, { flex: 0.8, textAlign: "center" }]}>Tiempo</Text>
          </View>
          {cases.map((c, i) => (
            <View key={c.name} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
              <Text style={[s.tableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{c.name}</Text>
              <Text style={[s.tableCellMuted, { flex: 1.5 }]}>{c.industry}</Text>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={[s.tableCell, { color: riskColor(c.risk), fontFamily: "Helvetica-Bold", fontSize: 9 }]}>
                  {c.risk}
                </Text>
              </View>
              <Text style={[s.tableCell, { flex: 0.8, textAlign: "center" }]}>{c.totalConflicts}</Text>
              <Text style={[s.tableCellMuted, { flex: 0.8, textAlign: "center" }]}>{c.cost}</Text>
              <Text style={[s.tableCellMuted, { flex: 0.8, textAlign: "center" }]}>{c.time}</Text>
            </View>
          ))}
        </View>

        {/* Methodology */}
        <View style={[s.highlightBox, { backgroundColor: C.blueFaint, borderLeftColor: C.blue }]}>
          <Text style={[s.h3, { marginBottom: 5 }]}>Metodología del motor</Text>
          <Text style={[s.highlightText, { color: C.textMuted }]}>
            El scoring de conflictos es ponderado: 50% similitud visual (GPT-4o Vision + overlap de códigos Viena),
            30% coincidencia de códigos Viena detectados, 20% coincidencia de clases Niza propuestas.
            La similitud de nombres usa detección de prefijos y substrings además de bigram Jaccard.
            Umbral de reporte: score total mayor a 15 puntos sobre 100.
          </Text>
        </View>

        {/* Risk explanations */}
        <View style={s.twoCol}>
          <View style={[s.col, { backgroundColor: C.greenFaint, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#BBF7D0" }]}>
            <Text style={[s.h3, { color: C.green, marginBottom: 3 }]}>Riesgo Bajo</Text>
            <Text style={[s.bodySmall, { color: "#166534" }]}>
              Sin conflictos de alto impacto. Se puede proceder al registro con observaciones menores.
            </Text>
          </View>
          <View style={[s.col, { backgroundColor: C.amberFaint, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#FDE68A" }]}>
            <Text style={[s.h3, { color: C.amber, marginBottom: 3 }]}>Riesgo Medio</Text>
            <Text style={[s.bodySmall, { color: "#92400E" }]}>
              Conflictos de impacto moderado identificados. Se recomienda evaluación jurídica antes del registro.
            </Text>
          </View>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>Este análisis es orientativo y no reemplaza asesoría jurídica especializada.</Text>
        <Text style={s.footerText}>© 2026 Visual Compare Chile · visualcompare.cl</Text>
      </View>
    </Page>
  )

  // ── CASE PAGES ────────────────────────────────────────────────────────────
  cases.forEach((c, ci) => {
    const pageA = 3 + ci * 2
    const pageB = pageA + 1

    // Page A — Overview + screenshot + Viena
    pages.push(
      <Page key={`case-${ci}-a`} size="A4" style={s.page}>
        <View style={s.pageHdr}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.coverLogoBox, { width: 22, height: 22, borderRadius: 5 }]}>
              <Text style={[s.coverLogoTxt, { fontSize: 10 }]}>VC</Text>
            </View>
            <Text style={s.pageHdrBrand}>Visual Compare Chile</Text>
          </View>
          <Text style={s.pageHdrSub}>Informe de Análisis de Marca · Confidencial</Text>
          <Text style={s.pageNum}>{pageA} / {totalPages}</Text>
        </View>
        <View style={s.content}>
          <View style={s.sectionTagRow}>
            <View style={s.sectionTagLine} />
            <Text style={s.sectionTagTxt}>Caso {ci + 1} de {cases.length}</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={s.cardLogoBox}>
                <Image src={c.logoPath} style={s.cardLogoImg} />
              </View>
              <View style={s.cardInfo}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle}>{c.name}</Text>
                  <View style={[s.riskBadge, { backgroundColor: riskBg(c.risk) }]}>
                    <Text style={[s.riskText, { color: riskColor(c.risk) }]}>RIESGO {c.risk}</Text>
                  </View>
                </View>
                <Text style={s.cardMeta}>{c.industry} · {c.tokens.toLocaleString()} tokens · {c.cost} USD · {c.time}</Text>
                <Text style={s.cardDesc}>{c.description}</Text>
              </View>
            </View>
            <View style={s.statsRow}>
              <View style={[s.statBox, { backgroundColor: C.redFaint }]}>
                <Text style={[s.statNum, { color: C.red }]}>{c.highConflicts}</Text>
                <Text style={[s.statLabel, { color: C.red }]}>Alto</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: C.amberFaint }]}>
                <Text style={[s.statNum, { color: C.amber }]}>{c.mediumConflicts}</Text>
                <Text style={[s.statLabel, { color: C.amber }]}>Medio</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: C.greenFaint }]}>
                <Text style={[s.statNum, { color: C.green }]}>{c.lowConflicts}</Text>
                <Text style={[s.statLabel, { color: C.green }]}>Bajo</Text>
              </View>
              <View style={[s.statBox, { backgroundColor: C.blueFaint }]}>
                <Text style={[s.statNum, { color: C.blue }]}>{c.analyzedCount}</Text>
                <Text style={[s.statLabel, { color: C.blue }]}>Analizadas</Text>
              </View>
            </View>
          </View>

          {/* Screenshot */}
          <Text style={[s.h3, { marginBottom: 7 }]}>Resultado en plataforma</Text>
          <View style={s.screenshotBox}>
            <Image src={c.screenshotPath} style={s.screenshotImg} />
          </View>
          <Text style={s.screenshotCap}>
            Captura del informe generado por el Agente IA de Visual Compare Chile para la marca {c.name}
          </Text>

          {/* Viena codes */}
          <View style={s.divider} />
          <Text style={[s.h3, { marginBottom: 7 }]}>Clasificación Viena detectada (VCL 10a ed.)</Text>
          <View style={s.chipRow}>
            {c.viena.map(v => (
              <View key={v.code} style={s.chip}>
                <Text style={s.chipText}>{v.code} · {v.confidence}%</Text>
              </View>
            ))}
          </View>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden" }}>
            {c.viena.map((v, vi) => (
              <View key={v.code} style={[s.tableRow, vi % 2 === 1 ? s.tableRowAlt : {}, { paddingVertical: 6 }]}>
                <Text style={[s.tableCell, { flex: 0.7, fontFamily: "Helvetica-Bold", color: C.blue }]}>{v.code}</Text>
                <Text style={[s.tableCellMuted, { flex: 3 }]}>{v.description}</Text>
                <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                  <View style={{ backgroundColor: v.confidence >= 90 ? C.greenFaint : C.amberFaint, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 8, color: v.confidence >= 90 ? C.green : C.amber, fontFamily: "Helvetica-Bold" }}>{v.confidence}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>Este análisis es orientativo y no reemplaza asesoría jurídica especializada.</Text>
          <Text style={s.footerText}>© 2026 Visual Compare Chile</Text>
        </View>
      </Page>
    )

    // Page B — Niza + Conflicts + Recommendations + Detail screenshot
    pages.push(
      <Page key={`case-${ci}-b`} size="A4" style={s.page}>
        <View style={s.pageHdr}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[s.coverLogoBox, { width: 22, height: 22, borderRadius: 5 }]}>
              <Text style={[s.coverLogoTxt, { fontSize: 10 }]}>VC</Text>
            </View>
            <Text style={s.pageHdrBrand}>Visual Compare Chile</Text>
          </View>
          <Text style={s.pageHdrSub}>Informe de Análisis de Marca · Confidencial</Text>
          <Text style={s.pageNum}>{pageB} / {totalPages}</Text>
        </View>
        <View style={s.content}>
          <View style={s.sectionTagRow}>
            <View style={s.sectionTagLine} />
            <Text style={s.sectionTagTxt}>{c.name} — Detalle</Text>
          </View>

          {/* Niza */}
          <Text style={[s.h3, { marginBottom: 7 }]}>Clases Niza recomendadas (NCL 13a ed.)</Text>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
            <View style={s.tableHdr}>
              <Text style={[s.tableHdrCell, { flex: 0.6 }]}>Clase</Text>
              <Text style={[s.tableHdrCell, { flex: 3 }]}>Descripción</Text>
            </View>
            {c.niza.map((n, ni) => (
              <View key={n.class} style={[s.tableRow, ni % 2 === 1 ? s.tableRowAlt : {}]}>
                <View style={{ flex: 0.6 }}>
                  <View style={{ backgroundColor: C.blue, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start" }}>
                    <Text style={{ fontSize: 9, color: C.white, fontFamily: "Helvetica-Bold" }}>NCL {n.class}</Text>
                  </View>
                </View>
                <Text style={[s.tableCellMuted, { flex: 3 }]}>{n.description}</Text>
              </View>
            ))}
          </View>

          {/* Conflicts — always render the view, show "sin conflictos" if empty */}
          <Text style={[s.h3, { marginBottom: 7 }]}>Conflictos detectados ({c.conflicts.length})</Text>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
            <View style={s.tableHdr}>
              <Text style={[s.tableHdrCell, { flex: 2 }]}>Marca registrada</Text>
              <Text style={[s.tableHdrCell, { flex: 0.7, textAlign: "center" }]}>Score</Text>
              <Text style={[s.tableHdrCell, { flex: 0.7, textAlign: "center" }]}>Nivel</Text>
              <Text style={[s.tableHdrCell, { flex: 1 }]}>Clases</Text>
              <Text style={[s.tableHdrCell, { flex: 0.6 }]}>País</Text>
            </View>
            {c.conflicts.length === 0 ? (
              <View style={[s.tableRow]}>
                <Text style={[s.tableCellMuted, { flex: 1 }]}>Sin conflictos significativos detectados</Text>
              </View>
            ) : (
              c.conflicts.slice(0, 8).map((conf, ci2) => (
                <View key={conf.name + ci2} style={[s.tableRow, ci2 % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{conf.name}</Text>
                  <View style={{ flex: 0.7, alignItems: "center" }}>
                    <Text style={[s.tableCell, { color: conflictClr(conf.level), fontFamily: "Helvetica-Bold" }]}>{Math.round(conf.score)}</Text>
                  </View>
                  <View style={{ flex: 0.7, alignItems: "center" }}>
                    <View style={{ backgroundColor: conflictBg(conf.level), borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 8, color: conflictClr(conf.level), fontFamily: "Helvetica-Bold" }}>{conf.level}</Text>
                    </View>
                  </View>
                  <Text style={[s.tableCellMuted, { flex: 1 }]}>{conf.niza.map(n => `NCL ${n}`).join(", ")}</Text>
                  <Text style={[s.tableCellMuted, { flex: 0.6 }]}>{conf.country}</Text>
                </View>
              ))
            )}
          </View>

          {/* Recommendations */}
          <View style={s.divider} />
          <Text style={[s.h3, { marginBottom: 10 }]}>Recomendaciones del agente</Text>
          {c.recommendations.map((rec, ri) => (
            <View key={ri} style={s.recItem}>
              <View style={s.recNum}>
                <Text style={s.recNumTxt}>{ri + 1}</Text>
              </View>
              <Text style={s.recText}>{rec}</Text>
            </View>
          ))}

          {/* Next steps */}
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
          <Text style={[s.bodySmall, { fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 7, textTransform: "uppercase", letterSpacing: 1 }]}>
            Próximos pasos
          </Text>
          {c.nextSteps.map((step, si) => (
            <View key={si} style={s.nextStepRow}>
              <View style={s.nextStepDot} />
              <Text style={s.nextStepText}>{step}</Text>
            </View>
          ))}

          {/* Detail screenshot */}
          <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
          <Text style={[s.h3, { marginBottom: 7 }]}>Vista detallada — secciones expandidas</Text>
          <View style={s.screenshotBox}>
            <Image src={c.screenshotDetailPath} style={[s.screenshotImg, { height: 190 }]} />
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.footerText}>{"Análisis generado el " + new Date().toLocaleDateString("es-CL") + " · Motor Visual Compare IA v1.0"}</Text>
          <Text style={s.footerText}>© 2026 Visual Compare Chile</Text>
        </View>
      </Page>
    )
  })

  return <Document title="Informe Análisis de Marca — Visual Compare Chile">{pages}</Document>
}
