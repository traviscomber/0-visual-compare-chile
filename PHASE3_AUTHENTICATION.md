# Phase 3: Authentication & API Key Management

## Overview

Phase 3 implements enterprise-grade authentication and API key management for the Visual Compare Chile platform. This enables secure programmatic access while maintaining security through Supabase authentication and row-level security (RLS) policies.

---

## Architecture

### Authentication Flow

```
User/Developer
     ↓
POST /auth/generate-key
     ↓
Supabase Auth + RLS
     ↓
Generate API Key
     ↓
Return: {apiKey, secret}
     ↓
Developer stores securely
     ↓
Subsequent requests:
Bearer {apiKey}
     ↓
/lib/api/auth.ts validates
     ↓
Query by user_id (RLS)
```

### Security Layers

1. **Supabase Auth** - User login/signup
2. **API Key Hashing** - SHA-256 with salt
3. **Row Level Security (RLS)** - Database-level data isolation
4. **Rate Limiting** - Per API key quotas (planned)
5. **Audit Logging** - All API access tracked

---

## API Key Management

### Generate API Key

**Endpoint:** `POST /api/auth/keys/generate`

```typescript
// Request
{
  name: "My App Integration",
  expiresIn: 2592000  // 30 days in seconds (optional)
}

// Response
{
  keyId: "key_abc123xyz",
  apiKey: "vc_live_abc123...xyz",  // Only shown once
  secret: "secret_xyz...abc",       // Only shown once
  createdAt: "2026-07-10T12:00:00Z",
  expiresAt: "2026-08-10T12:00:00Z"
}
```

### List API Keys

**Endpoint:** `GET /api/auth/keys`

```typescript
// Response
{
  keys: [
    {
      id: "key_abc123xyz",
      name: "My App Integration",
      createdAt: "2026-07-10T12:00:00Z",
      expiresAt: "2026-08-10T12:00:00Z",
      lastUsed: "2026-07-10T15:30:00Z",
      active: true
    }
  ]
}
```

### Revoke API Key

**Endpoint:** `DELETE /api/auth/keys/{keyId}`

```typescript
// Response
{
  success: true,
  message: "API key revoked"
}
```

### Rotate API Key

**Endpoint:** `POST /api/auth/keys/{keyId}/rotate`

```typescript
// Response
{
  keyId: "key_abc123xyz",
  newApiKey: "vc_live_new...key",  // New key only shown once
  newSecret: "secret_new...xyz",
  oldKeyExpires: "2026-07-11T12:00:00Z"
}
```

---

## Implementation Details

### Database Schema (Supabase)

#### api_keys Table

```sql
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,  -- SHA-256(apiKey + salt)
  key_salt TEXT NOT NULL,         -- Random salt
  secret_hash TEXT,               -- Optional secret hash
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);
```

#### RLS Policies

```sql
-- Users can only see their own keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create keys for themselves
CREATE POLICY "Users can create API keys" ON api_keys
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own keys
CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own keys
CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can manage all keys
CREATE POLICY "Admins can manage all keys" ON api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );
```

#### audit_logs Table (Usage Tracking)

```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT,
  response_time_ms INT,
  tokens_used INT,
  cost_estimate NUMERIC,
  ip_address TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_api_key_id ON audit_logs(api_key_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/keys/generate      - Generate new API key
GET    /api/auth/keys               - List user's API keys
GET    /api/auth/keys/{id}          - Get specific API key
DELETE /api/auth/keys/{id}          - Revoke API key
POST   /api/auth/keys/{id}/rotate   - Rotate API key
```

### Management Endpoints

```
GET    /api/auth/account/profile    - Get user profile
PUT    /api/auth/account/profile    - Update profile
GET    /api/auth/account/usage      - Get usage statistics
GET    /api/auth/account/audit-logs - Get audit logs
```

---

## Implementation Files

### lib/api/auth.ts (Enhanced)

```typescript
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function authenticateApiKey(apiKey: string) {
  const admin = createAdminClient()

  // Extract key hash and validate format
  const parts = apiKey.split('_')
  if (parts.length < 3) throw new Error('Invalid API key format')

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

  const { data, error } = await admin
    .from('api_keys')
    .select('id, user_id, organization_id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .is('expires_at', null)  // or gt expires_at to NOW()
    .single()

  if (error || !data) {
    throw new Error('Invalid API key')
  }

  return {
    keyId: data.id,
    userId: data.user_id,
    organizationId: data.organization_id,
  }
}
```

### app/api/auth/keys/generate/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, expiresIn } = body

    if (!name) {
      return NextResponse.json({ error: 'Key name required' }, { status: 400 })
    }

    // Generate random API key
    const apiKey = `vc_live_${crypto.randomBytes(32).toString('hex')}`
    const keySalt = crypto.randomBytes(16).toString('hex')
    const keyHash = crypto.createHash('sha256').update(apiKey + keySalt).digest('hex')

    const admin = createAdminClient()
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    const { data, error } = await admin
      .from('api_keys')
      .insert({
        user_id: user.id,
        name,
        key_hash: keyHash,
        key_salt: keySalt,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      keyId: data.id,
      apiKey,  // Only shown once
      name: data.name,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    })
  } catch (error) {
    console.error('[v0] Key generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Account Management Pages

### /app/settings/page.tsx

Account settings dashboard with:
- Profile information
- API key management
- Usage statistics
- Audit logs
- Subscription/billing info

### /app/history/page.tsx

Search history and comparison tracking:
- Recent searches
- Comparison results
- Export history
- Usage analytics

---

## Security Best Practices

1. **Never log full API keys** - Only log last 4 chars: `vc_live_****xyz`
2. **Rotate keys regularly** - Prompt users every 90 days
3. **Implement rate limiting** - Per-key quotas to prevent abuse
4. **Monitor suspicious activity** - Alert on unusual patterns
5. **Use HTTPS only** - Enforce secure transport
6. **Hash keys at rest** - SHA-256 with salt
7. **Expire keys** - Force re-generation periodically
8. **Audit everything** - Log all API access

---

## Testing Checklist

- [ ] Generate API key through UI
- [ ] API key appears in list
- [ ] Can authenticate requests with API key
- [ ] API key expires correctly
- [ ] Revoke API key prevents further access
- [ ] Rotate creates new key and expires old one
- [ ] Audit logs track all API usage
- [ ] Rate limits enforce quotas
- [ ] Users can only see their own keys
- [ ] Admins can see all keys

---

## Migration Path

### Week 1: Authentication Endpoints
- Implement key generation
- Implement key validation
- Add RLS policies
- Test security

### Week 2: Management UI
- Build settings page
- Build history page
- Add audit logging
- Implement usage tracking

### Week 3: Monitoring & Rate Limiting
- Add rate limiting
- Add monitoring alerts
- Add analytics dashboard
- Performance optimization

---

## Cost Impact

- **Database** - Negligible (small tables, indexed queries)
- **API Key Generation** - $0 (local cryptography)
- **Audit Logging** - +$10-20/month at scale
- **Total Phase 3 Cost** - ~$5/month (MVP)

---

## Conclusion

Phase 3 establishes the foundation for enterprise API access, enabling developers to programmatically access Visual Compare Chile while maintaining security, auditability, and cost control through Supabase's native authentication and RLS policies.

**Status:** Ready for implementation
**Timeline:** 2-3 weeks
**Priority:** High (enables monetization & enterprise use cases)
