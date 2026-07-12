type ComparisonInsertRow = Record<string, unknown> & {
  brand_context?: unknown
}

export async function insertComparisonWithFallback(
  client: { from: (table: string) => any },
  row: ComparisonInsertRow,
) {
  const initial = await client.from("comparisons").insert(row).select().single()
  if (!initial.error) return initial

  const shouldRetryWithoutBrandContext =
    initial.error.code === "42703" ||
    /brand_context/i.test(initial.error.message ?? "") ||
    /column .*brand_context/i.test(initial.error.message ?? "")

  if (!shouldRetryWithoutBrandContext || !("brand_context" in row)) {
    return initial
  }

  const { brand_context: _brandContext, ...rowWithoutBrandContext } = row
  return client.from("comparisons").insert(rowWithoutBrandContext).select().single()
}
