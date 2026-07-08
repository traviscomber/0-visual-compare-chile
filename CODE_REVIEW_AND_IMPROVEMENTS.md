# Code Review & Recommendations - MVP Foundation Check

**Date:** May 11, 2026  
**Project:** Visual Compare API Chile  
**Status:** 40% complete (API skeleton + auth working)  

---

## Current Code Assessment

### ✅ What's Good

1. **Authentication System** (`lib/api/auth.ts`)
   - SHA-256 hashing implemented correctly
   - API key generation format (`sc_*`) follows conventions
   - Context extraction working (org_id, user_id)
   - Last used tracking for audit
   - **Grade: A** - Production ready

2. **Compare Endpoint** (`app/api/v1/compare/route.ts`)
   - Multi-tenant query (checks organization_id)
   - Weighted scoring implemented (60% pHash, 40% metadata)
   - 5-category classification logic correct
   - Recommendation system (APPROVE/REVIEW/REJECT)
   - Signals extraction (sha256, phash distance, format, dimensions)
   - Audit logging on comparisons
   - **Grade: A-** - Minor optimizations needed

3. **File Organization**
   - API routes grouped by version (/v1/*)
   - Library utilities separated properly
   - Clear separation of concerns
   - **Grade: B+** - Good foundation

### ⚠️ What Needs Work

1. **Image Upload Endpoint** (`app/api/v1/images/route.ts`)
   - Status: Basic structure exists
   - Issue: No validation of file type/size
   - Issue: No integration with Vercel Blob
   - Issue: pHash generation not implemented
   - **Recommendation: PRIORITY - Week 2 task**
   - Effort: 4-6 hours to complete

2. **Error Handling**
   - Issue: Errors logged to console, not to Sentry
   - Issue: Stack traces exposed to clients
   - Issue: No request ID for tracing
   - **Recommendation: Standardize error responses (Week 3)**
   - Effort: 2-3 hours

3. **Rate Limiting**
   - Status: Not implemented yet
   - Issue: No protection against abuse
   - **Recommendation: Add in-memory rate limit (Week 1)**
   - Effort: 1-2 hours

4. **pHash Implementation**
   - Status: Distance calculation exists, but hash generation missing
   - Issue: calculateHammingDistance() is string-based, works fine
   - Issue: No pHash generation during upload
   - **Recommendation: Implement during Phase 1 Week 2**
   - Effort: 3-4 hours

5. **Testing**
   - Status: No tests written yet
   - Issue: API works but untested
   - **Recommendation: Create test suite Week 7-9**
   - Effort: 20-30 hours for 80% coverage

6. **Database Schema**
   - Status: Likely complete in Supabase
   - Issue: No RLS policies verified
   - Issue: No indexes for performance
   - **Recommendation: Audit Week 1, add indexes Week 2**
   - Effort: 2-3 hours

---

## Specific Code Improvements

### Priority 1: Image Upload Completion (Week 2)

**Current state:** `app/api/v1/images/route.ts` exists but incomplete

**What's needed:**

```typescript
// lib/image/processing.ts (NEW FILE)

import sharp from "sharp"
import crypto from "crypto"
import Jimp from "jimp"

export async function processImage(buffer: Buffer) {
  // 1. Extract metadata
  const metadata = await sharp(buffer).metadata()
  
  // 2. Generate SHA-256
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex")
  
  // 3. Generate pHash (simplified)
  const phash = await generatePhash(buffer)
  
  return {
    width: metadata.width,
    height: metadata.height,
    mimeType: metadata.format,
    sha256,
    phash,
  }
}

async function generatePhash(buffer: Buffer): Promise<string> {
  // Use Jimp to:
  // 1. Resize to 32x32
  // 2. Convert to grayscale
  // 3. Calculate average pixel value
  // 4. Create 64-bit hash (8x8 grid, each bit = 1 if pixel > avg)
  
  const image = await Jimp.read(buffer)
  image.resize(32, 32)
  image.greyscale()
  
  // Calculate average luminance
  const pixels: number[] = []
  image.scan(0, 0, 32, 32, (x, y) => {
    const idx = image.getPixelIndex(x, y)
    const data = image.bitmap.data
    const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
    pixels.push(luminance)
  })
  
  const avg = pixels.reduce((a, b) => a + b) / pixels.length
  
  // Convert to 64-bit hash
  let phash = ""
  for (let i = 0; i < 64; i++) {
    phash += pixels[i] > avg ? "1" : "0"
  }
  
  return phash
}

export function calculateHammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64
  
  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++
  }
  return distance
}
```

**Use in upload endpoint:**
```typescript
import { put } from "@vercel/blob"
import { processImage } from "@/lib/image/processing"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  
  // Validation
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/tiff"]
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }
  
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 413 })
  }
  
  // Process
  const buffer = await file.arrayBuffer()
  const { width, height, mimeType, sha256, phash } = await processImage(Buffer.from(buffer))
  
  // Store in Vercel Blob
  const blob = await put(`uploads/${org_id}/${Date.now()}-${file.name}`, buffer, {
    access: "private",
  })
  
  // Save to database
  const { data: image } = await admin.from("images").insert({
    user_id: context.user_id,
    organization_id: context.organization_id,
    filename: file.name,
    file_path: blob.url,
    sha256,
    phash,
    mime_type: mimeType,
    size_bytes: file.size,
    width,
    height,
  }).select().single()
  
  return NextResponse.json({ success: true, data: image })
}
```

**Effort:** 4-6 hours  
**Dependencies:** Jimp (npm install jimp sharp)

---

### Priority 2: Rate Limiting (Week 1)

**Current state:** Not implemented

**Add to:** `lib/rate-limit.ts` (NEW FILE)

```typescript
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  apiKey: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
): boolean {
  const now = Date.now()
  const entry = store.get(apiKey)
  
  // Create new entry
  if (!entry || entry.resetAt < now) {
    store.set(apiKey, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  // Check limit
  if (entry.count >= limit) {
    return false
  }
  
  // Increment
  entry.count++
  return true
}

export function getRateLimitStatus(apiKey: string): { remaining: number; resetAt: number } {
  const entry = store.get(apiKey)
  const now = Date.now()
  
  if (!entry || entry.resetAt < now) {
    return { remaining: 100, resetAt: now + 60000 }
  }
  
  return {
    remaining: 100 - entry.count,
    resetAt: entry.resetAt,
  }
}
```

**Use in all /v1/* endpoints:**
```typescript
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const apiKey = authHeader.slice(7)
  
  if (!checkRateLimit(apiKey, 100, 60 * 1000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    )
  }
  
  // ... rest of endpoint
}
```

**Effort:** 1-2 hours  
**Dependencies:** None (built-in)

---

### Priority 3: Error Standardization (Week 3)

**Create:** `lib/errors.ts`

```typescript
export const ApiErrors = {
  UNAUTHORIZED: {
    status: 401,
    code: "UNAUTHORIZED",
    message: "Invalid or missing API key",
  },
  FORBIDDEN: {
    status: 403,
    code: "FORBIDDEN",
    message: "You don't have access to this resource",
  },
  NOT_FOUND: {
    status: 404,
    code: "NOT_FOUND",
    message: "Resource not found",
  },
  BAD_REQUEST: {
    status: 400,
    code: "BAD_REQUEST",
    message: "Invalid request",
  },
  RATE_LIMIT: {
    status: 429,
    code: "RATE_LIMIT",
    message: "Too many requests",
  },
  INVALID_FILE: {
    status: 400,
    code: "INVALID_FILE",
    message: "Invalid file type or size",
  },
  SERVER_ERROR: {
    status: 500,
    code: "SERVER_ERROR",
    message: "Internal server error",
  },
}

export function createErrorResponse(
  error: keyof typeof ApiErrors,
  details?: string
) {
  const err = ApiErrors[error]
  return {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      ...(details && { details }),
    },
  }
}
```

**Effort:** 2 hours

---

## Database Schema Checklist

**Verify these exist in Supabase:**

```sql
-- images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sha256 TEXT,
  phash TEXT (64 chars),
  mime_type TEXT,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- comparisons table
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL,
  image_a_id UUID NOT NULL REFERENCES images(id),
  image_b_id UUID NOT NULL REFERENCES images(id),
  similarity_score NUMERIC(5,1),
  classification TEXT,
  recommendation TEXT,
  signals JSONB,
  result_json JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- api_keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- usage_logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_images_user_org ON images(user_id, organization_id);
CREATE INDEX idx_images_sha256 ON images(sha256);
CREATE INDEX idx_comparisons_user_org ON comparisons(user_id, organization_id);
CREATE INDEX idx_comparisons_created ON comparisons(created_at DESC);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_usage_logs_user ON usage_logs(user_id, created_at);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY images_own ON images
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY comparisons_own ON comparisons
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY api_keys_own ON api_keys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY usage_logs_own ON usage_logs
  FOR SELECT USING (user_id = auth.uid());
```

---

## Dependencies to Install

```bash
npm install sharp jimp
npm install sentry@latest  # For error tracking
npm install typescript @types/node --save-dev
```

---

## Testing Strategy

**Phase 1 (Weeks 1-6):** Manual testing during development  
**Phase 2 (Weeks 7-9):** Automated test suite

```typescript
// __tests__/api/images.test.ts
import { POST } from "@/app/api/v1/images/route"

describe("POST /v1/images", () => {
  it("should reject invalid file type", async () => {
    // Create invalid file
    const response = await POST(mockRequest)
    expect(response.status).toBe(400)
  })
  
  it("should reject oversized file", async () => {
    // Create 51MB file
    const response = await POST(mockRequest)
    expect(response.status).toBe(413)
  })
  
  it("should upload valid image", async () => {
    // Create valid PNG
    const response = await POST(mockRequest)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.data.id).toBeDefined()
  })
})
```

---

## Deployment Readiness

**Before Week 9 Launch:**

- [ ] All code reviewed (2 devs minimum)
- [ ] 80% test coverage achieved
- [ ] Zero critical security issues
- [ ] Performance tested (<100ms p95)
- [ ] Database backups configured
- [ ] Error monitoring active (Sentry)
- [ ] Uptime monitoring active
- [ ] Documentation complete
- [ ] API keys generated for test customers
- [ ] Runbook created for common issues

---

## Next Actions This Week

**For Travis (Lead Dev):**
1. Read this document ✓
2. Audit Supabase schema (confirm tables exist)
3. Review `app/api/v1/compare/route.ts` for any issues
4. Create `lib/image/processing.ts` skeleton
5. Setup Sentry account (free tier)
6. Create GitHub milestone for Phase 1

**For Dev #2 (when hired):**
1. Onboard to codebase
2. Read PHASE_1_DETAILED_CHECKLIST.md
3. Setup local environment
4. Create first PR (small change to test workflow)

---

## Grade Summary

| Component | Grade | Status | Priority |
|-----------|-------|--------|----------|
| Authentication | A | ✅ Done | - |
| Compare Logic | A- | ✅ Done | Minor polish |
| Image Upload | C | ⏳ Incomplete | P1 - Week 2 |
| Error Handling | C- | ⚠️ Basic | P2 - Week 3 |
| Rate Limiting | F | ❌ Missing | P1 - Week 1 |
| Testing | F | ❌ None | P2 - Weeks 7-9 |
| Database Schema | B+ | ✅ Likely done | Verify Week 1 |
| Documentation | C+ | ⏳ Partial | P2 - Week 3 |

**Overall Grade: B** (Good foundation, needs completion)

---

**Prepared by:** v0  
**For:** Travis & Team  
**Date:** May 11, 2026  
**Status:** Ready for implementation
