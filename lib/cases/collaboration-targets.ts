export function validateCaseMemberTargets(
  requested: unknown,
  memberIds: Iterable<string>,
  limit = 20,
): { valid: true; targets: string[] } | { valid: false; targets: [] } {
  if (requested === undefined || requested === null) return { valid: true, targets: [] }
  if (!Array.isArray(requested) || requested.length > limit) return { valid: false, targets: [] }
  if (requested.some((value) => typeof value !== "string" || !value.trim())) return { valid: false, targets: [] }

  const allowed = new Set(memberIds)
  const targets = [...new Set(requested.map((value) => String(value).trim()))]
  if (targets.some((target) => !allowed.has(target))) return { valid: false, targets: [] }
  return { valid: true, targets }
}

export function isCaseMemberTarget(target: unknown, memberIds: Iterable<string>) {
  if (target === undefined || target === null || target === "") return true
  if (typeof target !== "string") return false
  return new Set(memberIds).has(target.trim())
}
