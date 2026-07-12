import { NextResponse } from "next/server"
import { tryGetSupabaseUrl, tryGetSupabaseAnonKey } from "@/lib/supabase/env"

/**
 * Runtime config endpoint — returns Supabase public vars resolved server-side.
 * Used by the browser client when NEXT_PUBLIC_* are not embedded in the bundle.
 */
export function GET() {
  const url = tryGetSupabaseUrl()
  const anonKey = tryGetSupabaseAnonKey()

  return NextResponse.json(
    { url, anonKey, configured: !!(url && anonKey) },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    }
  )
}
