# Codex Development Roadmap - Visual Compare Chile
**Last Updated:** July 10, 2026 | **Status:** Phase 3 Ready | **Sprint:** Week 1-2

---

## Executive Summary

Visual Compare Chile is a brand comparison SaaS with vision API integration. Currently at **Phase 2 Complete** (UI/UX done, MVP deployed). The project needs Phase 3 (Authentication) and optimization implementation.

**Current Status:** Production-ready MVP with GPT-4o mini vision API ready to integrate.

---

## Project Overview

### What It Does
- Upload and compare brand logos using GPT-4o mini vision AI
- Search trademark database by name, Niza classification, Viena codes
- Track comparison history and export results
- Provide analysis: colors, styles, similarity scoring, confusion risk

### Tech Stack
- **Frontend:** Next.js 16, React 19, TailwindCSS, shadcn/ui
- **Backend:** Node.js API routes, SQL.js in-memory database
- **Auth:** Supabase + RLS policies
- **Vision:** OpenAI GPT-4o mini (88-92% accuracy, $0.0013/comparison)
- **Hosting:** Vercel (Edge Functions)
- **Database:** Supabase PostgreSQL (optional backup)

### Cost Structure
- **MVP:** $240/year (Vercel $20/mo base)
- **Growth:** $1,200/year (at 100K requests/day)
- **Vision:** $6/year (GPT-4o mini for 10K requests)
- **Optimization potential:** 70% reduction ($240 → $72/year)

---

## Completed Work (Phases 1-2)

### Phase 1: Database & API Foundation ✅
- SQL.js database with 9 tables
- 4 API endpoints: search, niza, viena, registros
- React useDatabase hook
- 797 lines of backend code

### Phase 2: UI/UX Components ✅
- 6 React components: SearchPanel, ResultsTable, FilterPanel, MarcaCard, ExportDialog, StatsBar
- Glassmorphism styling
- Branding colors (Blue, Purple, Amber)
- /consulta/page.tsx fully functional

### Deployment ✅
- Vercel production: https://v0-visual-compare-chile.vercel.app
- Supabase PostgreSQL connected
- Environment variables configured
- Auto-deploy on main branch push

---

## Next Priority: Phase 3 - Authentication & API Keys

### What Needs to Be Done

#### Week 1-2: Core Auth Implementation
- [ ] Build API key generation system
- [ ] Implement key rotation logic (30-day expiry)
- [ ] Create RLS policies for api_keys table
- [ ] Build 6 key management API endpoints
- [ ] Create /settings page (key management)
- [ ] Create /history page (search history)

#### Week 3: Integration & Testing
- [ ] Integrate auth into vision API endpoints
- [ ] Add rate limiting (500 req/day per API key)
- [ ] Build audit logging system
- [ ] Test key revocation flow
- [ ] Build monitoring dashboard

### Files to Create/Modify

**New API Routes:**
```
app/api/v1/account/
  ├── api-keys/route.ts           (GET/POST list, create keys)
  ├── api-keys/[id]/route.ts      (GET/PUT/DELETE single key)
  ├── api-keys/[id]/rotate/route.ts (POST rotate key)
  └── audit/route.ts               (GET audit logs)

app/api/v1/account/settings/
  └── route.ts                     (GET/PUT user settings)
```

**New React Pages:**
```
app/(app)/
  ├── settings/
  │   └── page.tsx                 (Account settings UI)
  └── history/
      └── page.tsx                 (Search history UI)
```

**Database Tables (already created via migration):**
- `api_keys` - API key storage with hashing
- `audit_logs` - Track all API access
- `users` - User accounts
- `organization_members` - Multi-tenant support

### Implementation Details

**API Key Management:**
1. Generate: 32-char random key → SHA-256 hash → store hash + metadata
2. Validate: On every request, hash provided key, compare to stored hash
3. Rotate: Generate new key, mark old as "rotated", keep for 24h grace
4. Revoke: Mark as "revoked", reject all requests
5. Expire: Auto-revoke after 30 days (configurable)
6. Rate limit: 500 requests/day per key

**Audit Trail:**
- Log: user_id, action, resource_type, resource_id, IP, timestamp
- Store: In audit_logs table with RLS
- Query: /api/v1/account/audit endpoint
- Display: In /history page with filtering

**Security:**
- All keys hashed with SHA-256 + 16-byte salt
- RLS enforces user isolation
- Rate limiting prevents abuse
- Audit logging for compliance

---

## Feature Roadmap (After Phase 3)

### Phase 4: Scale & Monitoring (Week 4-5)
- [ ] Build usage dashboard (requests/day, cost)
- [ ] Implement cost optimization (70% savings target)
- [ ] Add performance monitoring
- [ ] Setup alerts for quota/spending
- [ ] Build admin dashboard

### Phase 5: Enterprise Features (Week 6+)
- [ ] Multi-user teams/organizations
- [ ] Custom branding for white-label
- [ ] Bulk comparison API
- [ ] Export to PDF/Excel
- [ ] Webhook integrations
- [ ] SSO (SAML/OAuth)

### Phase 6: Market Launch (Month 3)
- [ ] Free tier: 50 comparisons/month
- [ ] Pro tier: $29/month (5K comparisons)
- [ ] Enterprise: Custom pricing
- [ ] Stripe integration complete
- [ ] Pricing page & checkout
- [ ] Onboarding flow

---

## File Structure Reference

```
/vercel/share/v0-project/
├── app/
│   ├── (app)/                    # Protected routes
│   │   ├── consulta/page.tsx     # Main search page
│   │   ├── settings/page.tsx     # Account settings (TODO)
│   │   └── history/page.tsx      # Search history (TODO)
│   ├── api/v1/
│   │   ├── search/               # Search API
│   │   ├── vision/               # Vision API (NEW)
│   │   ├── comparisons/          # Comparison history
│   │   ├── registros/            # Trademark details
│   │   └── account/              # Account/auth API (TODO)
│   └── layout.tsx
├── lib/
│   ├── db-types.ts              # TypeScript types
│   ├── db-loader.ts             # Database operations
│   ├── vision/                  # Vision API service
│   │   ├── gpt4o-mini.ts        # GPT-4o mini service
│   │   ├── types.ts             # Vision types
│   │   └── cache.ts             # Vision cache
│   └── api-portal-data.ts       # Sample data
├── hooks/
│   └── useDatabase.ts           # React DB hook
├── components/api-portal/       # UI components
│   ├── search-panel.tsx
│   ├── results-table.tsx
│   ├── filter-panel.tsx
│   ├── marca-card.tsx
│   ├── export-dialog.tsx
│   └── stats-bar.tsx
├── supabase/
│   └── migrations/
│       └── add_api_keys.sql     # DB schema
└── docs/
    ├── CODEX_ROADMAP.md         # This file
    ├── PRICING_USER_TIERS.md    # Pricing strategy
    ├── PHASE3_AUTHENTICATION.md # Phase 3 specs
    ├── OPTIMIZATION_STRATEGY.md # Cost optimization
    └── V0_TOKEN_OPTIMIZATION.md # v0 usage guide
```

---

## Environment Variables

Required for local development:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
POSTGRES_URL=postgresql://postgres:password@[project].supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
REDIS_URL=redis://... (optional, for caching)
```

Available in: `/vercel/share/.env.project`

---

## Critical Code Patterns

### Vision API Usage
```typescript
import { GPT4oMiniVisionService } from '@/lib/vision/gpt4o-mini';

const vision = new GPT4oMiniVisionService();
const result = await vision.compareBrands(image1URL, image2URL);
// Result: { similarity: 0.85, colors: [...], risk: 'high', analysis: '...' }
```

### API Route Protection
```typescript
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, 
                                process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: { user }, error } = await supabase.auth.getUser(
    req.headers.get('authorization')?.split('Bearer ')[1] || ''
  );
  
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // ... rest of handler
}
```

### Database Query Pattern
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from('registros')
  .select('*')
  .match({ id: id })
  .single();
```

---

## Testing Checklist

### Phase 3 Sign-Off
- [ ] Generate API key - gets 32 char key
- [ ] List keys - shows all user's keys
- [ ] Use key in X-API-Key header - works
- [ ] Expired key - returns 401
- [ ] Wrong key - returns 401
- [ ] Rate limit (500/day) - enforced
- [ ] Rotate key - old revoked, new works
- [ ] Revoke key - immediately rejected
- [ ] Audit log - all actions logged
- [ ] /settings page - loads, can manage keys
- [ ] /history page - shows past comparisons
- [ ] Export CSV - downloads with data
- [ ] Performance - <2s page load

---

## Quick Reference: Key Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Vision Model | GPT-4o mini | 88-92% accuracy, $6/year, 600ms response |
| Cache Strategy | Redis + In-memory | 71% cost reduction on hits |
| Auth | Supabase + RLS | Serverless, built-in auth, automatic scaling |
| Pricing | Freemium | Free tier validates market, Pro at $29/mo |
| Rate Limit | 500/day | Prevents abuse, aligns with freemium tier |
| Key Expiry | 30 days | Security best practice, forces rotation |
| Gross Margin | 99% | Vision API is negligible cost |

---

## Commit History (Recent)

```
d2bceee - v0 token optimization strategy
f13e4c8 - Cost and performance optimization strategy
c6958a5 - Phase 3 Authentication & API Key Management specs
84cb7d2 - GPT-4o mini vision API implementation (806 lines)
ea954c8 - Pricing & user tier strategy
5444ff9 - Infrastructure costs analysis
143653f - OpenAI vision models comparison
5a4a201 - Unify MVP flow and portal (deployed)
```

---

## Success Metrics

### Phase 3 Completion
- [ ] All 6 API endpoints working
- [ ] RLS policies enforce isolation
- [ ] Settings page functional
- [ ] History page shows data
- [ ] Audit log complete
- [ ] Zero security vulnerabilities
- [ ] Performance: <200ms API response

### MVP Launch Readiness
- [ ] Auth system 100% complete
- [ ] Vision API integrated
- [ ] Pricing page published
- [ ] 100 free users signed up
- [ ] 5 paying customers

### Production Targets
- [ ] Uptime: 99.9%
- [ ] LCP: <1.5s
- [ ] INP: <100ms
- [ ] Cost: <$100/month at 100K req/day
- [ ] Cache hit rate: 30-50%

---

## How to Use This Roadmap

1. **Start of Sprint:** Read the "Next Priority" section
2. **During Development:** Reference "File Structure" and "Code Patterns"
3. **Before Commit:** Check "Testing Checklist"
4. **Planning:** Review "Feature Roadmap" for context
5. **Problem-Solving:** Check "Critical Code Patterns"
6. **Deployment:** Follow git commits in "Commit History"

---

## Support Documentation

See also:
- `PRICING_USER_TIERS.md` - Pricing strategy details
- `PHASE3_AUTHENTICATION.md` - Auth implementation guide
- `OPTIMIZATION_STRATEGY.md` - Performance optimization
- `VISION_MODELS_COMPARISON.md` - Vision model analysis
- `INFRASTRUCTURE_COSTS.md` - Infrastructure breakdown
- `V0_TOKEN_OPTIMIZATION.md` - v0 development guide

---

## Contact & Questions

- **Main Branch:** `v0/travis-2540-c183821f`
- **Deployed URL:** https://v0-visual-compare-chile.vercel.app
- **GitHub:** github.com/traviscomber/0-visual-compare-chile
- **Status:** Ready for Phase 3 implementation

---

**Next Action:** Start Phase 3 - Build API key management system (Week 1-2)

