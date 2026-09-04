import assert from "node:assert/strict"
import { classifyEnvironmentalRisk } from "../lib/intelligence/snifa-risk.ts"

const codelcoLikeDetail = [
  "Sanciones aplicadas",
  "1 No cumplimiento del programa de rescate. Leves Hecho, actos u omisiones que no constituyan infracción gravísima o grave.",
  "2 No rehabilitación de 36 has. Graves Incumplan gravemente las medidas ambientales.",
  "3 Construcción de camino no autorizado. Leves Hecho, actos u omisiones que no constituyan infracción gravísima o grave.",
].join(" ")

const codelco = classifyEnvironmentalRisk(302, codelcoLikeDetail)
assert.equal(codelco.infringementCount, 3, "three SMA classification labels must yield exactly three sanctioned facts")
assert.equal(codelco.gravisimaCount, 0, "legal explanatory prose must not create a gravisima classification")
assert.equal(codelco.graveCount, 1, "one explicit Graves label must yield one grave infringement")
assert.equal(codelco.leveCount, 2, "two explicit Leves labels must yield two leve infringements")
assert.equal(codelco.environmentalRiskLevel, "high", "a grave infringement must map to high environmental risk")
assert.deepEqual(codelco.environmentalRiskBasis, [
  "1 infracción(es) grave(s)",
  "2 infracción(es) leve(s)",
  "302 UTA",
  "3 hecho(s) sancionados",
])

const proseOnly = classifyEnvironmentalRisk(0, "36 has. de suelo. No constituye infracción gravísima o grave.")
assert.equal(proseOnly.infringementCount, 0, "arbitrary numbers and singular legal prose must not be counted as infringements")
assert.equal(proseOnly.gravisimaCount, 0)
assert.equal(proseOnly.graveCount, 0)
assert.equal(proseOnly.leveCount, 0)
assert.equal(proseOnly.environmentalRiskLevel, "low")

assert.equal(classifyEnvironmentalRisk(99, null).environmentalRiskLevel, "low")
assert.equal(classifyEnvironmentalRisk(100, null).environmentalRiskLevel, "medium")
assert.equal(classifyEnvironmentalRisk(1000, null).environmentalRiskLevel, "high")
assert.equal(classifyEnvironmentalRisk(5000, null).environmentalRiskLevel, "critical")
assert.equal(classifyEnvironmentalRisk(null, "Gravísimas").environmentalRiskLevel, "critical")

console.log("SNIFA risk regression PASS: explicit SMA severity labels, infringement counts and UTA thresholds verified.")
