export function shouldRejectMissingResearchContext(input: {
  kind: string
  intentContextCount: number
  contextMatchCount: number
}) {
  return input.kind === "research"
    && input.intentContextCount > 0
    && input.contextMatchCount === 0
}
