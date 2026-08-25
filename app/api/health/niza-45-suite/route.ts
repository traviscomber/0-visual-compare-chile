import { NextResponse } from 'next/server'
import { NizaClassifier } from '@/lib/agent/niza-classifier'
import cases from '@/tests/fixtures/niza-regression-cases.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

type FixtureCase = {
  id: string
  expected: string
  description: string
}

type CaseResult = {
  id: string
  expected: string
  classes: string[]
  principals: string[]
  includesExpected: boolean
  exactExpected: boolean
  model: string
  escalated: boolean
  error: string | null
}

async function runCase(item: FixtureCase): Promise<CaseResult> {
  try {
    const result = await new NizaClassifier().classify({
      nombre: `QA-${item.expected}`,
      descripcion: item.description,
    })
    const classes = result.clases.map((entry) => entry.numero)
    const principals = result.clases.filter((entry) => entry.tipo === 'principal').map((entry) => entry.numero)
    return {
      id: item.id,
      expected: item.expected,
      classes,
      principals,
      includesExpected: classes.includes(item.expected),
      exactExpected: classes.length === 1 && classes[0] === item.expected,
      model: result.model_used,
      escalated: result.routing.escalated,
      error: null,
    }
  } catch (error) {
    return {
      id: item.id,
      expected: item.expected,
      classes: [],
      principals: [],
      includesExpected: false,
      exactExpected: false,
      model: '',
      escalated: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function GET() {
  const fixture = cases as FixtureCase[]
  const results: CaseResult[] = []
  const batchSize = 5

  for (let index = 0; index < fixture.length; index += batchSize) {
    const batch = fixture.slice(index, index + batchSize)
    results.push(...await Promise.all(batch.map(runCase)))
  }

  const expectedPasses = results.filter((item) => item.includesExpected).length
  const exactPasses = results.filter((item) => item.exactExpected).length
  const errors = results.filter((item) => item.error)

  return NextResponse.json({
    ok: expectedPasses === fixture.length && errors.length === 0,
    ran_at: new Date().toISOString(),
    summary: {
      total: fixture.length,
      expected_class_present: expectedPasses,
      exact_single_class: exactPasses,
      errors: errors.length,
    },
    failures: results.filter((item) => !item.includesExpected || item.error),
    non_exact: results.filter((item) => item.includesExpected && !item.exactExpected),
    results,
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  })
}
