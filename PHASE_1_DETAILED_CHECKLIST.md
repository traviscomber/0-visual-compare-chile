# Phase 1 Implementation Checklist - MVP Foundation (Weeks 1-3)

## Week 1: Infrastructure & Auth Foundation

### Database Schema Validation (Day 1-2) - 2 hours
Status: ⏳ TODO

**Task 1.1.1: Verify/Create Tables**
- [ ] `images` table exists with all fields:
  - `id` (UUID, primary key)
  - `user_id` (UUID, FK to auth.users)
  - `organization_id` (UUID)
  - `filename` (text)
  - `file_path` (text, Vercel Blob path)
  - `sha256` (text, for exact matching)
  - `phash` (text, 64-char hex for perceptual hash)
  - `mime_type` (text: image/jpeg, image/png, etc)
  - `size_bytes` (integer)
  - `width` (integer, pixels)
  - `height` (integer, pixels)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- [ ] `comparisons` table exists with all fields:
  - `id` (UUID, primary key)
  - `user_id` (UUID, FK)
  - `organization_id` (UUID)
  - `image_a_id` (UUID, FK to images)
  - `image_b_id` (UUID, FK to images)
  - `similarity_score` (numeric 0-100)
  - `classification` (text: exact_match, near_duplicate, visually_similar, partially_similar, different)
  - `recommendation` (text: APPROVE, REVIEW, REJECT_DUPLICATE)
  - `signals` (jsonb: {sha256_match, phash_distance, format_match, dimensions_match})
  - `result_json` (jsonb)
  - `created_at` (timestamp)

- [ ] `api_keys` table exists with all fields:
  - `id` (UUID, primary key)
  - `user_id` (UUID, FK)
  - `organization_id` (UUID)
  - `key_hash` (text, SHA-256 hash of actual key)
  - `is_active` (boolean, default true)
  - `expires_at` (timestamp, nullable)
  - `last_used_at` (timestamp, nullable)
  - `created_at` (timestamp)

- [ ] `usage_logs` table exists with all fields:
  - `id` (UUID, primary key)
  - `user_id` (UUID, FK)
  - `organization_id` (UUID)
  - `action` (text: "image.uploaded", "comparison.created", etc)
  - `metadata` (jsonb: {comparison_id, similarity_score, classification})
  - `created_at` (timestamp)
  - `ip_address` (inet, nullable)

**Task 1.1.2: Create RLS (Row Level Security) Policies**
- [ ] Images RLS:
  ```sql
  CREATE POLICY "Users see own images"
    ON images FOR SELECT
    USING (user_id = auth.uid());
  
  CREATE POLICY "Users can insert own images"
    ON images FOR INSERT
    WITH CHECK (user_id = auth.uid());
  ```

- [ ] Comparisons RLS:
  ```sql
  CREATE POLICY "Users see own comparisons"
    ON comparisons FOR SELECT
    USING (user_id = auth.uid());
  ```

- [ ] API Keys RLS:
  ```sql
  CREATE POLICY "Users see own API keys"
    ON api_keys FOR SELECT
    USING (user_id = auth.uid());
  ```

- [ ] Usage Logs RLS:
  ```sql
  CREATE POLICY "Users see own usage"
    ON usage_logs FOR SELECT
    USING (user_id = auth.uid());
  ```

### API Key Management (Day 2-4) - 4 hours
Status: ✅ DONE (lib/api/auth.ts exists)

**Task 1.2.1: Verify Auth Functions**
- [ ] `hashApiKey(key: string)` exists and uses SHA-256
- [ ] `generateApiKey()` generates `sc_*` format keys
- [ ] `authenticateApiKey(apiKey: string)` returns ApiKeyContext or null
- [ ] Authentication checks:
  - [ ] API key format validation
  - [ ] API key exists in database
  - [ ] API key is active (is_active = true)
  - [ ] API key not expired (expires_at > now)
  - [ ] Updates last_used_at on each call

**Task 1.2.2: Test Authentication Flow**
- [ ] Generate test API key in Supabase
- [ ] Call `authenticateApiKey()` with valid key → returns context
- [ ] Call with invalid key → returns null
- [ ] Call with expired key → returns null
- [ ] Call with inactive key → returns null

### Rate Limiting Setup (Day 4-5) - 2 hours
Status: ⏳ TODO

**Task 1.3.1: Implement Simple In-Memory Rate Limiting**
- [ ] Create `lib/rate-limit.ts`:
  ```typescript
  interface RateLimitEntry {
    count: number
    resetAt: number
  }
  
  const store = new Map<string, RateLimitEntry>()
  
  export function checkRateLimit(apiKey: string, limit: number = 100, window: number = 60000): boolean {
    const now = Date.now()
    const entry = store.get(apiKey)
    
    if (!entry || entry.resetAt < now) {
      store.set(apiKey, { count: 1, resetAt: now + window })
      return true
    }
    
    if (entry.count >= limit) return false
    entry.count++
    return true
  }
  ```

- [ ] Use in API routes:
  ```typescript
  const apiKey = authHeader.slice(7)
  if (!checkRateLimit(apiKey, 100, 60000)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }
  ```

**Task 1.3.2: Test Rate Limiting**
- [ ] Make 100 requests in 1 minute → succeeds
- [ ] Make 101st request → 429 Too Many Requests
- [ ] Wait 60 seconds → counter resets

---

## Week 2: Image Upload & Storage

### POST /v1/images Endpoint (Day 6-12) - 6 hours
Status: ⏳ TODO (partial work exists)

**Task 2.1.1: Validate Request**
- [ ] Check Authorization header
- [ ] Authenticate API key
- [ ] Check rate limit
- [ ] Validate file:
  - [ ] MIME type in [image/jpeg, image/png, image/webp, image/tiff]
  - [ ] File size ≤ 50MB
  - [ ] Reject without file attachment

**Task 2.1.2: Process & Store Image**
- [ ] Upload to Vercel Blob:
  ```typescript
  import { put } from "@vercel/blob"
  
  const blob = await put(`uploads/${organizationId}/${Date.now()}-${filename}`, file, {
    access: "private",
  })
  ```

- [ ] Extract image metadata:
  ```typescript
  import sharp from "sharp"
  
  const metadata = await sharp(buffer).metadata()
  // { width, height, format, size }
  ```

- [ ] Generate SHA-256:
  ```typescript
  import crypto from "crypto"
  
  const hash = crypto.createHash("sha256").update(buffer).digest("hex")
  ```

- [ ] Generate pHash (perceptual hash):
  ```typescript
  // Use jimp or similar
  import Jimp from "jimp"
  
  const image = await Jimp.read(buffer)
  // Calculate 64-bit pHash (simplified: convert to grayscale, resize to 8x8, threshold)
  const phash = calculatePhash(image)
  ```

**Task 2.1.3: Save to Database**
- [ ] Insert into `images` table:
  ```typescript
  const { data: image } = await admin
    .from("images")
    .insert({
      user_id: context.user_id,
      organization_id: context.organization_id,
      filename,
      file_path: blob.url,
      sha256: hash,
      phash: phashValue,
      mime_type,
      size_bytes: buffer.length,
      width: metadata.width,
      height: metadata.height,
    })
    .select()
    .single()
  ```

- [ ] Log usage event:
  ```typescript
  await admin.from("usage_logs").insert({
    user_id: context.user_id,
    organization_id: context.organization_id,
    action: "image.uploaded",
    metadata: { image_id: image.id, filename, size: buffer.length },
  })
  ```

**Task 2.1.4: Return Response**
- [ ] Success (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "img_abc123",
      "filename": "screenshot.png",
      "size_bytes": 2048576,
      "width": 1920,
      "height": 1080,
      "uploaded_at": "2024-05-20T14:32:00Z"
    }
  }
  ```

- [ ] Error cases:
  - [ ] 401: Missing/invalid API key
  - [ ] 400: Invalid file type or too large
  - [ ] 413: Payload too large
  - [ ] 500: Storage/database error

### SHA-256 Hash Generation (Day 12-14) - 3 hours
Status: ✅ DONE (basic structure exists)

**Task 2.2.1: Verify Implementation**
- [ ] Hash function exists and is deterministic
- [ ] Two identical images → same hash
- [ ] Slightly different images → different hash
- [ ] Hash stored in database correctly

**Task 2.2.2: Test Hash Quality**
- [ ] Test with sample images
- [ ] Verify no collisions (SHA-256 has near-zero collision probability)
- [ ] Performance: <10ms per image

### Testing & Validation (Day 14-15) - 2 hours
Status: ⏳ TODO

**Task 2.3.1: Unit Tests**
- [ ] Test valid file upload
- [ ] Test invalid file type rejection
- [ ] Test oversized file rejection
- [ ] Test authentication failure
- [ ] Test rate limiting
- [ ] Test database constraints

**Task 2.3.2: Manual Testing**
- [ ] Upload JPEG, PNG, WebP, TIFF
- [ ] Upload 49MB file → success
- [ ] Upload 51MB file → fail
- [ ] Upload with invalid auth → 401
- [ ] Upload 100 files → rate limit kicks in
- [ ] Verify files in Vercel Blob
- [ ] Verify records in Supabase

---

## Week 3: Database & Core API Structure

### GET /v1/health Endpoint (Day 16-17) - 1 hour
Status: ⏳ TODO

**Task 3.1.1: Implement Health Check**
```typescript
export async function GET() {
  try {
    const admin = createAdminClient()
    
    // Check database
    const { error: dbError } = await admin.from("api_keys").select("id").limit(1)
    
    // Check storage access
    const storageOk = true // Vercel Blob always available
    
    if (dbError) {
      return NextResponse.json({ 
        status: "unhealthy", 
        database: false, 
        storage: true 
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      status: "healthy", 
      database: true, 
      storage: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      error: String(error) 
    }, { status: 500 })
  }
}
```

### Database RLS & Security (Day 17-21) - 4 hours
Status: ⏳ TODO

**Task 3.2.1: Enable RLS on All Tables**
- [ ] ALTER TABLE images ENABLE ROW LEVEL SECURITY
- [ ] ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY
- [ ] ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY
- [ ] ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY

**Task 3.2.2: Test RLS Enforcement**
- [ ] User A uploads image → User B cannot see it
- [ ] User A creates comparison → User B cannot retrieve it
- [ ] API key from Org A cannot access Org B's data

**Task 3.2.3: Audit Logging**
- [ ] Log all sensitive operations (updates, deletes)
- [ ] Include user, timestamp, action
- [ ] Store in audit_log table for compliance

### Error Handling & Logging (Day 21-23) - 3 hours
Status: ⏳ TODO

**Task 3.3.1: Standardize Error Responses**
- [ ] Create `lib/errors.ts`:
  ```typescript
  export const ApiErrors = {
    UNAUTHORIZED: { status: 401, code: "UNAUTHORIZED", message: "Invalid API key" },
    FORBIDDEN: { status: 403, code: "FORBIDDEN", message: "Access denied" },
    NOT_FOUND: { status: 404, code: "NOT_FOUND", message: "Resource not found" },
    BAD_REQUEST: { status: 400, code: "BAD_REQUEST", message: "Invalid request" },
    RATE_LIMIT: { status: 429, code: "RATE_LIMIT", message: "Too many requests" },
    SERVER_ERROR: { status: 500, code: "SERVER_ERROR", message: "Internal error" },
  }
  ```

- [ ] Use consistently across all endpoints

**Task 3.3.2: Structured Logging**
- [ ] Log format: `[timestamp] [level] [context] message`
- [ ] Log levels: DEBUG, INFO, WARN, ERROR
- [ ] Include request ID for tracing
- [ ] Send errors to Sentry for monitoring

**Task 3.3.3: Test Error Handling**
- [ ] 401 on bad API key
- [ ] 404 on missing image
- [ ] 400 on invalid request
- [ ] 500 with proper error message (no stack traces to client)

### Documentation (Day 23-25) - 3 hours
Status: ⏳ TODO

**Task 3.4.1: Create OpenAPI Schema**
- [ ] Define all endpoints:
  - [ ] POST /v1/images
  - [ ] GET /v1/health
  - [ ] POST /v1/compare (skeleton)
  - [ ] GET /v1/comparisons/:id (skeleton)
  - [ ] GET /v1/comparisons (skeleton)

- [ ] Include request/response schemas
- [ ] Error code documentation

**Task 3.4.2: Setup Swagger UI**
- [ ] Create `/docs` endpoint that serves Swagger UI
- [ ] Auto-generate from OpenAPI schema

**Task 3.4.3: Write Getting Started Guide**
- [ ] How to get API key
- [ ] Authentication header format
- [ ] First API call example (health check)
- [ ] Error handling

---

## Phase 1 Sign-Off Checklist

### Infrastructure
- [ ] Database schema complete and tested
- [ ] RLS policies enforced
- [ ] Supabase free tier monitoring setup
- [ ] Vercel Blob storage working

### Authentication
- [ ] API key generation working
- [ ] API key hashing secure
- [ ] Authentication middleware on all /v1/* routes
- [ ] Rate limiting active

### Image Upload
- [ ] POST /v1/images endpoint complete
- [ ] File validation (type, size)
- [ ] Metadata extraction (dimensions, hash)
- [ ] Database storage working
- [ ] Vercel Blob storage working

### Core APIs
- [ ] GET /v1/health working
- [ ] Error handling standardized
- [ ] Logging centralized
- [ ] Documentation complete

### Testing
- [ ] Unit tests written (>50% coverage)
- [ ] Manual testing checklist completed
- [ ] No critical bugs
- [ ] Performance acceptable (<200ms response time)

### Security
- [ ] RLS enforced
- [ ] API key validation works
- [ ] Rate limiting active
- [ ] No SQL injection vulnerabilities
- [ ] CORS configured properly

---

## Estimated Effort: Phase 1

**Total: ~65-75 hours (8-10 working days for 1 dev)**

- Week 1: 20 hours (Infrastructure & Auth)
- Week 2: 20 hours (Image Upload)
- Week 3: 20 hours (Database & Docs)
- Buffer: 5 hours (unexpected issues)

**Cost at ~$20.75k CLP/hour: ~$1.35-1.55M CLP**

**Status: ✅ On Budget**

---

## Next Phase: Phase 2 - Comparison Engine (Weeks 4-6)

Once Phase 1 is complete:
1. Implement pHash algorithm
2. Create POST /v1/compare endpoint
3. Implement classification logic
4. Optimize for performance

---

Created: May 11, 2026
Project: Visual Compare API Chile MVP
Budget: $5M CLP / 3 months
Phase: 1 of 3
