const FALLBACK_SUPABASE_URL = "http://127.0.0.1:54321"
const FALLBACK_SUPABASE_ANON_KEY = "placeholder-public-anon-key"

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY
}
