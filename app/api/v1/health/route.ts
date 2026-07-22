import { NextResponse } from "next/server"

export const runtime = "nodejs"

function resolveRevision() {
  return process.env.VERCEL_GIT_COMMIT_SHA || process.env.APP_REVISION || "local"
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: "1.0.0",
      revision: resolveRevision(),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}
