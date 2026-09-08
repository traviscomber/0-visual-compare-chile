import OpenAI from "openai"
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, PRIVATE_NO_STORE_HEADERS } from "@/lib/auth/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { modelForTier } from "@/lib/ai/model-router"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const JUAN_EMAIL = "juan@n3uralia.com"

const RequestSchema = z.object({
  projectKey: z.string().trim().min(1).max(120),
  query: z.string().trim().min(3).max(600),
})

type Source = { title: string; url: string }

export async function POST(request: Request) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response
  if (auth.user.email?.trim().toLowerCase() !== JUAN_EMAIL) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud de investigación inválida." }, { status: 400, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "La investigación externa no está configurada." }, { status: 503, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const admin = createAdminClient()
  const { data: project, error } = await admin
    .from("intelligence_product_evolution_recommendations")
    .select("product_key,product_name,title,outcome,status,evidence_snapshot,updated_at")
    .eq("user_id", auth.user.id)
    .eq("product_key", parsed.data.projectKey)
    .neq("status", "rejected")
    .maybeSingle()

  if (error) {
    console.error("[project-documentation-research:project]", error.message)
    return NextResponse.json({ error: "No pude cargar el contexto del proyecto." }, { status: 500, headers: PRIVATE_NO_STORE_HEADERS })
  }
  if (!project) {
    return NextResponse.json({ error: "Proyecto no encontrado en Mi espacio." }, { status: 404, headers: PRIVATE_NO_STORE_HEADERS })
  }

  const snapshot = isRecord(project.evidence_snapshot) ? project.evidence_snapshot : {}
  const repoActivity = isRecord(snapshot.repo_activity) ? snapshot.repo_activity : {}
  const subsectionResearch = isRecord(snapshot.subsection_research) ? snapshot.subsection_research : {}
  const projectContext = {
    key: project.product_key,
    name: project.product_name,
    direction: project.title,
    intendedOutcome: project.outcome,
    humanStatus: project.status,
    repo: stringOrNull(repoActivity.repoFullName) ?? stringOrNull(snapshot.repo),
    activeResearchTopics: Array.isArray(subsectionResearch.topics)
      ? subsectionResearch.topics.filter((item): item is string => typeof item === "string").slice(0, 12)
      : [],
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.responses.create({
    model: process.env.OPENAI_ASSISTANT_MODEL || modelForTier("sol"),
    tools: [{ type: "web_search" }],
    input: [
      "Actúa como investigador senior de I+D aplicado para N3uralia.",
      "Debes buscar documentación externa ACTUAL y aplicable al proyecto indicado. Prioriza fuentes primarias y técnicas: documentación oficial de modelos/APIs/frameworks, repositorios oficiales, especificaciones, arXiv/papers, benchmarks reproducibles y documentación de proveedores relevantes.",
      "No uses actividad GitHub interna ni capacidad N3uralia como evidencia externa. El contexto interno sólo sirve para decidir aplicabilidad.",
      "No confundas novedad con utilidad. No recomiendes una tecnología sin explicar mecanismo, integración concreta, beneficio esperado, riesgo y validación necesaria.",
      "Separa claramente: fuente/documento observado -> hallazgo -> aplicación propuesta al proyecto -> validación o experimento requerido.",
      "La ausencia de documentación o evidencia es neutral. No cambies score, conviction, estado humano ni decisiones del proyecto.",
      "Devuelve máximo 6 hallazgos, ordenados por utilidad práctica. Incluye enlaces citables a las fuentes usadas.",
      `Contexto interno del proyecto: ${JSON.stringify(projectContext)}`,
      `Pregunta de Juan: ${parsed.data.query}`,
    ].join("\n\n"),
  })

  const sources = extractSources(response.output)
  return NextResponse.json({
    project: projectContext,
    query: parsed.data.query,
    text: response.output_text?.trim() || "No encontré una respuesta utilizable con las fuentes disponibles.",
    sources,
    decisionBoundary: "Investigación externa de lectura. No modifica score, conviction, estados ni decisiones humanas.",
  }, { headers: PRIVATE_NO_STORE_HEADERS })
}

function extractSources(output: unknown): Source[] {
  if (!Array.isArray(output)) return []
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const item of output) {
    if (!isRecord(item) || item.type !== "message" || !Array.isArray(item.content)) continue
    for (const content of item.content) {
      if (!isRecord(content) || content.type !== "output_text" || !Array.isArray(content.annotations)) continue
      for (const annotation of content.annotations) {
        if (!isRecord(annotation) || annotation.type !== "url_citation") continue
        const url = stringOrNull(annotation.url)
        if (!url || seen.has(url)) continue
        seen.add(url)
        sources.push({ title: stringOrNull(annotation.title) ?? new URL(url).hostname, url })
      }
    }
  }
  return sources.slice(0, 12)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
