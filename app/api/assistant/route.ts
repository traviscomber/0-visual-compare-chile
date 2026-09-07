import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { runVidentiaAssistant } from "@/lib/assistant/videntia-assistant"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(8_000),
})

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
})

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Conversación inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "El asistente no está configurado." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS })
  }

  try {
    const result = await runVidentiaAssistant({
      messages: parsed.data.messages,
      context: {
        userId: auth.user.id,
        userEmail: auth.user.email ?? "usuario",
        supabase: auth.supabase,
      },
    })
    return NextResponse.json(result, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    console.error("[assistant] request failed", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "No pude completar la orden con la evidencia disponible." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
}
