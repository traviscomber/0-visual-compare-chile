import { NextResponse } from "next/server"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CONTEXT_TYPES = new Set(["general", "brand", "company", "technology"])
const ITEM_TYPES = new Set(["comparison", "search", "watch", "alert", "research"])
const PRIORITIES = new Set(["low", "normal", "high"])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ActionBody = {
  contextType?: string
  contextQuery?: string
  caseTitle?: string
  itemType?: string
  sourceId?: string
  sourceTitle?: string
  actionTitle?: string
  priority?: string
  dueAt?: string | null
  assignedTo?: string | null
  evidence?: Record<string, unknown>
}

type ActionRow = {
  case_id: string
  item_id: string
  action_id: string
  case_created: boolean
  item_created: boolean
  action_created: boolean
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({})) as ActionBody
  const contextType = body.contextType?.trim() ?? ""
  const contextQuery = body.contextQuery?.trim() ?? ""
  const caseTitle = body.caseTitle?.trim() ?? ""
  const itemType = body.itemType?.trim() ?? ""
  const sourceId = body.sourceId?.trim() ?? ""
  const sourceTitle = body.sourceTitle?.trim() ?? ""
  const actionTitle = body.actionTitle?.trim() ?? ""
  const priority = body.priority?.trim() || "normal"
  const assignedTo = body.assignedTo?.trim() || null
  const dueAt = normalizeDueAt(body.dueAt)
  const evidence = isPlainObject(body.evidence) ? body.evidence : {}

  if (!CONTEXT_TYPES.has(contextType)
    || contextQuery.length < 1 || contextQuery.length > 240
    || caseTitle.length < 2 || caseTitle.length > 160
    || !ITEM_TYPES.has(itemType)
    || sourceId.length < 1 || sourceId.length > 240
    || sourceTitle.length < 1 || sourceTitle.length > 240
    || actionTitle.length < 1 || actionTitle.length > 240
    || !PRIORITIES.has(priority)
    || (assignedTo !== null && !UUID_PATTERN.test(assignedTo))
    || dueAt === undefined
    || JSON.stringify(evidence).length > 16_000) {
    return NextResponse.json(
      { error: "Acción inválida." },
      { status: 400, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  const { data, error } = await auth.supabase.rpc("create_intelligence_action", {
    p_context_type: contextType,
    p_context_query: contextQuery,
    p_case_title: caseTitle,
    p_item_type: itemType,
    p_source_id: sourceId,
    p_source_title: sourceTitle,
    p_action_title: actionTitle,
    p_priority: priority,
    p_due_at: dueAt,
    p_assigned_to: assignedTo,
    p_evidence: evidence,
  })

  if (error) {
    const expectedClientError = ["invalid_", "authentication_required"].some(token => error.message.includes(token))
    const permissionError = ["not_allowed", "recipient", "permission", "policy"].some(token => error.message.toLowerCase().includes(token))
    if (!expectedClientError && !permissionError) {
      console.error("[intelligence-actions] create failed", { code: error.code, message: error.message })
    }
    return NextResponse.json(
      { error: permissionError ? "No tienes permisos para crear esta acción." : expectedClientError ? "Acción inválida." : "No pudimos crear la acción." },
      { status: permissionError ? 403 : expectedClientError ? 400 : 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  const row = (Array.isArray(data) ? data[0] : data) as ActionRow | null
  if (!row?.case_id || !row.item_id || !row.action_id) {
    return NextResponse.json(
      { error: "No pudimos confirmar la acción creada." },
      { status: 500, headers: PRIVATE_NO_STORE_HEADERS },
    )
  }

  const created = {
    case: Boolean(row.case_created),
    evidence: Boolean(row.item_created),
    action: Boolean(row.action_created),
  }

  return NextResponse.json(
    {
      ok: true,
      caseId: row.case_id,
      itemId: row.item_id,
      actionId: row.action_id,
      created,
      href: `/casos/${row.case_id}/equipo`,
    },
    {
      status: created.case || created.evidence || created.action ? 201 : 200,
      headers: PRIVATE_NO_STORE_HEADERS,
    },
  )
}

function normalizeDueAt(value: string | null | undefined) {
  if (value === null || value === undefined || value.trim() === "") return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
