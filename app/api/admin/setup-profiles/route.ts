import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  
  // First try to create the table
  const { error: tableErr } = await supabase.rpc("exec_sql" as never, {
    sql: `CREATE TABLE IF NOT EXISTS public.profiles (id UUID PRIMARY KEY, full_name TEXT, company_name TEXT, role TEXT DEFAULT 'user', created_at TIMESTAMPTZ DEFAULT NOW())`,
  } as never)
  
  // Try direct upsert (works if table exists)
  const { data, error } = await supabase.from("profiles").upsert({
    id: "d381e76d-054d-4098-a008-0037857a986f",
    full_name: "Juan N3uralia",
    company_name: "N3uralia",
    role: "abogado",
  }, { onConflict: "id" }).select()
  
  return NextResponse.json({ tableErr: tableErr?.message, data, error: error?.message, code: error?.code })
}
