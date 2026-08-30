import { readFile } from "node:fs/promises"

type BenchmarkCase = {
  left: string
  right: string
  expectedMatch: boolean
  reason: string
}

type Benchmark = {
  name: string
  source: string
  policy: string
  cases: BenchmarkCase[]
}

const benchmark = JSON.parse(
  await readFile("benchmarks/company-identity-v1.json", "utf8"),
) as Benchmark

let tp = 0
let fp = 0
let fn = 0
let tn = 0
const misses: Array<{ type: "FP" | "FN"; left: string; right: string; reason: string }> = []

for (const item of benchmark.cases) {
  const predictedMatch = normalizeCompanyIdentity(item.left) === normalizeCompanyIdentity(item.right)
  if (predictedMatch && item.expectedMatch) tp += 1
  else if (predictedMatch && !item.expectedMatch) {
    fp += 1
    misses.push({ type: "FP", left: item.left, right: item.right, reason: item.reason })
  } else if (!predictedMatch && item.expectedMatch) {
    fn += 1
    misses.push({ type: "FN", left: item.left, right: item.right, reason: item.reason })
  } else tn += 1
}

const precision = tp + fp ? tp / (tp + fp) : 1
const recall = tp + fn ? tp / (tp + fn) : 1
const accuracy = (tp + tn) / benchmark.cases.length

const result = {
  benchmark: benchmark.name,
  cases: benchmark.cases.length,
  tp,
  fp,
  fn,
  tn,
  precision: round(precision),
  recall: round(recall),
  accuracy: round(accuracy),
  misses,
}

console.log(JSON.stringify(result, null, 2))

// Grade A block-A non-regression floor. Precision is intentionally strict because
// false corporate merges are more damaging than leaving an ambiguous alias for review.
if (precision < 1) {
  console.error(`Company identity benchmark FAIL: precision ${precision.toFixed(3)} < 1.000`)
  process.exit(1)
}
if (recall < 0.9) {
  console.error(`Company identity benchmark FAIL: recall ${recall.toFixed(3)} < 0.900`)
  process.exit(1)
}

console.log("Company identity benchmark PASS")

function normalizeCompanyIdentity(value: string) {
  let normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/^\s*\([A-Z]{2}\)\s*/, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()

  normalized = normalized.replace(/^(S A C I|SACI|S A I C|SAIC)\s+/, "")
  normalized = normalized.replace(
    /(?:\s+(?:S A|SA|S P A|SPA|LTDA|LIMITADA|INC|LLC|LTD|LIMITED|CO LTD|CORP|CORPORATION|GMBH|SAS|N V|NV|AG|PLC|PTE LTD|S A C I|SACI|S A I C|SAIC|S A C I COMERCIANTE))+$/,
    "",
  ).trim()

  return normalized
}

function round(value: number) {
  return Math.round(value * 1000) / 1000
}
