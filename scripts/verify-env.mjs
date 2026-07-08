const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const missing = required.filter((name) => !process.env[name] || process.env[name].trim() === "")

if (missing.length > 0) {
  console.error("Missing required environment variables:")
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

console.log("All required environment variables are present.")
