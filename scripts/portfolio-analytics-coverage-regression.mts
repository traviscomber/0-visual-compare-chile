import { readFile } from "node:fs/promises"

function fail(message: string): never {
  console.error(`Portfolio analytics coverage regression FAIL: ${message}`)
  process.exit(1)
}

const page = await readFile("app/(app)/portfolio/analytics/page.tsx", "utf8")

for (const needle of [
  '.limit(500)',
  'function chunkCaseIds(caseIds:string[],size=100)',
  'for(let index=0;index<caseIds.length;index+=size)',
  'const memberBatches=chunkCaseIds(caseIds)',
  'Promise.all(memberBatches.map(batch=>supabase.rpc("get_case_members_batch",{p_case_ids:batch})))',
  'memberResults.some(result=>result.error)',
  'members=memberResults.flatMap(result=>(result.data??[]) as BatchMember[])',
]) {
  if (!page.includes(needle)) fail(`missing full-coverage invariant: ${needle}`)
}

if (page.includes('caseIds.slice(0,100)')) {
  fail("reviewer identity coverage is truncated to the first 100 cases")
}

console.log("Portfolio analytics coverage regression PASS: reviewer identities are loaded in bounded batches across the full 500-case analytics horizon.")
