// Test API Key Generation Script
// Run with: node -r ts-node/register scripts/generate-test-key.ts

import { createAdminClient } from "@/lib/supabase/admin"
import { generateApiKey, hashApiKey } from "@/lib/api/auth"

const TEST_ORG_ID = "00000000-0000-0000-0000-000000000001" // Test organization UUID
const TEST_USER_ID = "00000000-0000-0000-0000-000000000002" // Test user UUID

async function generateTestKey() {
  try {
    console.log("[v0] Generating test API key...")

    const admin = createAdminClient()
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)

    console.log("[v0] API Key generated (unhashed):", apiKey)
    console.log("[v0] Key Hash:", keyHash)

    // Insert into database
    const { data, error } = await admin
      .from("api_keys")
      .insert({
        organization_id: TEST_ORG_ID,
        user_id: TEST_USER_ID,
        key_hash: keyHash,
        name: "test-key-v1",
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      process.exit(1)
    }

    console.log("[v0] Test API Key created successfully!")
    console.log("[v0] Key ID:", data.id)
    console.log("[v0] API Key:", apiKey)
    console.log("[v0]")
    console.log("[v0] Use this API key to test endpoints:")
    console.log(`curl -H "Authorization: Bearer ${apiKey}" http://localhost:3000/api/v1/health`)
    console.log(`curl -H "Authorization: Bearer ${apiKey}" http://localhost:3000/api/v1/usage`)
  } catch (error) {
    console.error("[v0] Fatal error:", error)
    process.exit(1)
  }
}

generateTestKey()
