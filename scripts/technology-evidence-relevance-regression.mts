import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Technology evidence relevance regression FAIL: ${message}`)
  process.exit(1)
}

const openalex = await readFile("lib/intelligence/openalex.ts", "utf8")
const crossref = await readFile("lib/intelligence/crossref.ts", "utf8")

if (openalex.includes('sort: "publication_date:desc"')) {
  fail("OpenAlex search must preserve provider relevance ordering instead of forcing publication date")
}

if (crossref.includes('url.searchParams.set("sort", "published")')) {
  fail("Crossref search must preserve provider relevance ordering instead of forcing publication date")
}

if (!openalex.includes("Preserve OpenAlex's default relevance ordering")) {
  fail("OpenAlex relevance-ordering invariant is undocumented")
}

if (!crossref.includes("Keep Crossref's relevance ranking")) {
  fail("Crossref relevance-ordering invariant is undocumented")
}

console.log("Technology evidence relevance regression PASS: literature evidence preserves provider relevance ranking instead of recency-first ranking.")
