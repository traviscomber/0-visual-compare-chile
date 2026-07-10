# Codex Quick Start Guide

## TL;DR (30 seconds)

**Project:** Visual Compare Chile - Brand comparison SaaS  
**Status:** MVP deployed, Phase 3 ready  
**What to do:** Build authentication system (API keys + settings pages)  
**Timeline:** 3 weeks / ~90 hours  
**Cost:** $240/year  

## Immediate Next Steps

1. **Read this first:**
   - CODEX_ROADMAP.md (5 min) - Full overview
   - PHASE3_AUTHENTICATION.md (10 min) - What to build

2. **Setup local development:**
   ```bash
   git clone https://github.com/traviscomber/0-visual-compare-chile.git
   cd 0-visual-compare-chile
   git checkout v0/travis-2540-c183821f
   npm install  # or pnpm install
   ```

3. **Environment variables:**
   Copy from `/vercel/share/.env.project` to `.env.local`

4. **Run development:**
   ```bash
   npm run dev  # http://localhost:3000
   ```

5. **Start building Phase 3:**
   Follow the "Phase 3 Implementation Plan" in CODEX_ROADMAP.md

## Key Files to Know

| File | Purpose |
|------|---------|
| `CODEX_ROADMAP.md` | Full development guide START HERE |
| `PHASE3_AUTHENTICATION.md` | Auth system specifications |
| `PRICING_USER_TIERS.md` | Pricing model and strategy |
| `OPTIMIZATION_STRATEGY.md` | Cost/performance optimization |
| `lib/vision/gpt4o-mini.ts` | Vision API service |
| `app/api/v1/vision/` | Vision API endpoints |
| `app/(app)/consulta/page.tsx` | Main search page |

## What's Already Done

- Database schema (9 tables)
- Vision API service (GPT-4o mini)
- Search API (search, niza, viena, registros)
- UI components (SearchPanel, ResultsTable, etc.)
- Production deployment (Vercel)

## What You Need to Build (Phase 3)

### Week 1: API Endpoints
```
POST   /api/v1/account/api-keys         Create API key
GET    /api/v1/account/api-keys         List all keys
GET    /api/v1/account/api-keys/[id]    Get single key
PUT    /api/v1/account/api-keys/[id]    Update key
DELETE /api/v1/account/api-keys/[id]    Revoke key
POST   /api/v1/account/api-keys/[id]/rotate  Rotate key
```

### Week 2: UI Pages
```
/settings         User account settings + key management
/history          Search history + export
```

### Week 3: Integration
- Add auth to vision API
- Rate limiting (500 req/day)
- Audit logging
- Testing

## Code Pattern: Protected API Route

```typescript
// app/api/v1/account/api-keys/route.ts
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get user from auth header
  const token = req.headers.get('authorization')?.split('Bearer ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query user's API keys
  const { data: keys, error: dbError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', user.id);

  return Response.json({ keys });
}
```

## Code Pattern: Vision API

```typescript
import { GPT4oMiniVisionService } from '@/lib/vision/gpt4o-mini';

const vision = new GPT4oMiniVisionService();

// Compare two logos
const result = await vision.compareBrands(
  'https://example.com/logo1.png',
  'https://example.com/logo2.png'
);

console.log(result);
// {
//   similarity: 0.87,
//   colors: ['#000000', '#FF5733'],
//   style: 'modern',
//   riskLevel: 'high',
//   analysis: 'Both use similar sans-serif fonts...'
// }
```

## Testing Checklist (Sign-Off)

- [ ] Generate API key - returns 32 char key
- [ ] Use key in X-API-Key header - works
- [ ] Invalid key - returns 401
- [ ] Expired key (30+ days) - returns 401
- [ ] Rate limit (500/day) - enforced at 501st request
- [ ] Rotate key - old revoked, new works
- [ ] Revoke key - immediately rejected
- [ ] /settings page - loads and works
- [ ] /history page - shows past comparisons
- [ ] Export CSV - downloads correctly
- [ ] Audit log - all actions logged
- [ ] Performance - pages load <2s

## Git Workflow

```bash
# Start new feature
git checkout -b feature/phase3-auth

# Commit regularly
git add .
git commit -m "feat: add API key endpoints"

# Push to feature branch
git push origin feature/phase3-auth

# When done, create PR
# Review → Merge to main → Auto-deploys to Vercel
```

## Important Decisions

| What | Decision | Why |
|------|----------|-----|
| Vision Model | GPT-4o mini | $6/year, 88-92% accuracy |
| Auth System | Supabase + RLS | Serverless, automatic scaling |
| Cache | Redis + In-memory | 71% cost reduction |
| Rate Limit | 500/day | Prevents abuse |
| Key Expiry | 30 days | Security best practice |
| Pricing | Freemium | Validates market |

## Success Metrics

**Phase 3 Complete when:**
- 6 API endpoints all working
- Settings page functional
- History page functional
- Audit logging complete
- 0 security vulnerabilities
- All tests passing

**MVP Launch when:**
- 100 free users
- 5 paying customers
- <2s page load
- 99.9% uptime

## Resources

- **Tech:** Next.js 16, React 19, TypeScript, TailwindCSS
- **Auth:** Supabase authentication
- **DB:** PostgreSQL (Supabase)
- **Vision:** OpenAI GPT-4o mini
- **Deploy:** Vercel

## Questions?

Check these docs in order:
1. CODEX_ROADMAP.md - Main guide
2. PHASE3_AUTHENTICATION.md - Auth spec
3. Code examples in the repo
4. Vercel deployment logs

---

**Ready to build?** Start with CODEX_ROADMAP.md!

