import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { buildRuntimeConfigSummary } from "@/lib/runtime-config"

export const runtime = "nodejs"

function resolveRevision() {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_REVISION || "local"
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: "ok",
      version: "1.0.0",
      revision: resolveRevision(),
      timestamp: new Date().toISOString(),
      host: request.nextUrl.host,
      config: buildRuntimeConfigSummary(request.nextUrl.host),
    },
    { status: 200 },
  )
}
