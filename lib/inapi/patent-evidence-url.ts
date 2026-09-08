const APPLICATION_PATTERN = /^[A-Za-z0-9._-]{2,80}$/

export function inapiPatentEvidenceUrl(applicationNumber: unknown) {
  const value = typeof applicationNumber === "string" ? applicationNumber.trim() : ""
  if (!APPLICATION_PATTERN.test(value)) return null
  return `https://videntia.app/patentes/registro/${encodeURIComponent(value)}`
}

export function inapiPatentEvidenceUrlFromSourceRecord(sourceRecordId: unknown) {
  const value = typeof sourceRecordId === "string" ? sourceRecordId.trim() : ""
  if (!value.startsWith("sol:")) return null
  return inapiPatentEvidenceUrl(value.slice(4))
}
