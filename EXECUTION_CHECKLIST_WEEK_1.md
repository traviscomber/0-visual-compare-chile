# EXECUTION CHECKLIST - Week 1
## Travis: Tu primer semana como CTO

---

## DÍA 1 (Lunes 9am)

### MORNING (9am - 12pm): INFRASTRUCTURE SETUP

#### GitHub Setup
```
[ ] Create GitHub org: logocompare
[ ] Invite Dev #2 (pending hire)
[ ] Create private repo: logocompare
[ ] Configure branch protection (main)
    [ ] Require 1 PR review
    [ ] Dismiss stale PR approvals
    [ ] Require status checks to pass
[ ] Create CI/CD template (GitHub Actions)
[ ] Add CODEOWNERS file
[ ] Create development branch strategy
```

#### Supabase Project
```
[ ] Create Supabase account (if needed)
[ ] Create new project: logocompare-production
[ ] Region: South America (São Paulo) 
[ ] Tier: Pro ($25/month → scale later)
[ ] Enable backup + replication
[ ] Create database users:
    [ ] anon (public API access)
    [ ] service_role (server-only)
[ ] Save credentials to 1Password
[ ] Enable PostgREST API
[ ] Setup Realtime (optional for now)
```

#### Vercel Setup
```
[ ] Create Vercel team
[ ] Connect GitHub repo to Vercel
[ ] Create production environment
[ ] Create staging environment
[ ] Set environment variables:
    [ ] NEXT_PUBLIC_SUPABASE_URL
    [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
    [ ] SUPABASE_SERVICE_ROLE_KEY
    [ ] STRIPE_PUBLIC_KEY
    [ ] STRIPE_SECRET_KEY
    [ ] MERCADO_PAGO_KEY
[ ] Enable Previewdeployments
[ ] Setup custom domain (temp: logocompare.dev)
```

#### Communication
```
[ ] Create Slack workspace
[ ] Create channels: #dev, #sales, #ops, #general, #bugs
[ ] Add GitHub integration (commits → #dev)
[ ] Add Vercel integration (deploys → #dev)
[ ] Invite team members
[ ] Setup Slack reminders (daily standup 9:15am)
```

### AFTERNOON (1pm - 5pm): SECURITY FOUNDATION

#### Environment Setup
```
[ ] Create .env.local template
[ ] Copy env template to repo (.env.example)
[ ] Never commit .env files (add to .gitignore)
[ ] Setup Vercel Secrets Manager:
    [ ] Copy production secrets
    [ ] Test staging environment
```

#### SSL/TLS
```
[ ] Enable HTTPS on logocompare.dev (automatic)
[ ] Verify SSL certificate
[ ] Test SSL labs: https://ssllabs.com
```

#### Authentication Infrastructure
```
[ ] Create database for users (Supabase)
[ ] Setup JWT token signing
[ ] Create secret key (use openssl)
[ ] Test token generation
```

**EOD Check:**
```
✅ All infrastructure services running
✅ GitHub repo created + protected
✅ Supabase project with credentials
✅ Vercel connected + deployed (empty app)
✅ Slack integrated
✅ Security policies in place

Deliverable: Working deployment pipeline
```

---

## DÍA 2 (Martes 9am - 12pm): DATABASE SCHEMA

### MORNING: SQL SCHEMA CREATION

#### Create Tables
```sql
-- Run in Supabase SQL Editor

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);

-- Comparisons table
CREATE TABLE public.comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  image_a_url VARCHAR NOT NULL,
  image_b_url VARCHAR NOT NULL,
  image_a_hash VARCHAR,
  image_b_hash VARCHAR,
  similarity_score FLOAT,
  risk_level VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_comparisons_user ON comparisons(user_id);
CREATE INDEX idx_comparisons_created ON comparisons(created_at DESC);

-- Usage tracking
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  action VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_usage_user ON usage_logs(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY users_self_access ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY comparisons_user_access ON comparisons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY comparisons_user_insert ON comparisons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### Deploy & Test
```
[ ] Execute SQL in Supabase
[ ] Verify tables created
[ ] Check indexes created
[ ] Test RLS policies
[ ] Backup database
```

### AFTERNOON: API STRUCTURE

#### File structure
```
/vercel/share/v0-project/
├─ app/
│  ├─ api/
│  │  ├─ compare/
│  │  │  └─ route.ts (create TODAY)
│  │  ├─ upload/
│  │  │  └─ route.ts
│  │  └─ auth/
│  │     └─ route.ts
│  └─ page.tsx
├─ lib/
│  ├─ phash.ts (create TODAY)
│  ├─ supabase.ts (create TODAY)
│  └─ utils.ts
└─ public/
```

**EOD Check:**
```
✅ Database schema deployed
✅ RLS policies active
✅ Indexes created
✅ Backup configured
✅ API file structure ready

Deliverable: Production database ready for code
```

---

## DÍA 3 (Miércoles): pHASH ALGORITHM

### MORNING: IMPLEMENTATION

#### Create lib/phash.ts
```typescript
// You write this file
// Key functions:
// - calculateHash(imageBuffer) → string (64-char hex)
// - calculateSimilarity(hash1, hash2) → number (0-100)
// - hexToHammingDistance(hash1, hash2) → number
// 
// Performance target: <50ms per comparison

[ ] Write pHash algorithm
[ ] Add EXIF extraction (optional)
[ ] Add unit tests
[ ] Benchmark performance
[ ] Optimize if needed
```

#### Performance Testing
```bash
[ ] Test with 10 image pairs
[ ] Measure average latency (target: <50ms)
[ ] Check memory usage
[ ] Profile with Node.js profiler
```

### AFTERNOON: API ENDPOINT

#### Create app/api/compare/route.ts
```typescript
// You write this file
// POST /api/compare
// Expects: FormData with image_a + image_b
// Returns: { similarity_score: 0-100, risk_level, message }
// Errors: 400, 401, 413, 500

[ ] Handle multipart/form-data
[ ] Validate images
[ ] Call pHash
[ ] Store in Supabase
[ ] Return proper JSON response
[ ] Error handling
[ ] Add logging (console + Sentry)
[ ] Add rate limiting (100 req/min)
```

#### Testing
```bash
[ ] Test with curl
[ ] Test with invalid images
[ ] Test without auth (should fail)
[ ] Test with huge images
[ ] Verify database insert
[ ] Check latency (<100ms p95)
```

**EOD Check:**
```
✅ pHash algorithm working
✅ /api/compare endpoint live
✅ Database inserts verified
✅ Latency target met
✅ Error handling complete

Deliverable: /api/compare API functional
```

---

## DÍA 4 (Jueves): AUTHENTICATION

### MORNING: SUPABASE AUTH

#### Setup Supabase Auth
```
[ ] Enable Email provider in Supabase
[ ] Configure email templates (in Supabase)
[ ] Test email confirmation
[ ] Create .env variables:
    [ ] SUPABASE_URL
    [ ] SUPABASE_ANON_KEY
    [ ] SUPABASE_SERVICE_ROLE_KEY
```

#### Create lib/supabase.ts
```typescript
[ ] Browser client (for frontend)
[ ] Server client (for API routes)
[ ] Auth helpers
[ ] JWT validation
```

### AFTERNOON: AUTH ENDPOINTS

#### Create app/auth/signup/route.ts
```typescript
[ ] Accept email + password
[ ] Hash password (bcrypt)
[ ] Create user in Supabase
[ ] Send confirmation email
[ ] Return success message
[ ] Error handling (user exists, weak password, etc)
```

#### Create app/auth/login/route.ts
```typescript
[ ] Accept email + password
[ ] Verify password
[ ] Issue JWT token
[ ] Set HTTP-only cookie
[ ] Return success
[ ] Error handling
```

#### Create middleware.ts
```typescript
[ ] Check JWT in cookies
[ ] Validate token
[ ] Attach user to request
[ ] Protect /dashboard routes
```

**EOD Check:**
```
✅ Supabase Auth configured
✅ Signup endpoint working
✅ Login endpoint working
✅ Middleware protecting routes
✅ Email confirmation working

Deliverable: Auth system functional
```

---

## DÍA 5 (Viernes): TESTING + CI/CD

### MORNING: UNIT TESTS

```bash
[ ] Test pHash algorithm
[ ] Test /api/compare endpoint
[ ] Test auth endpoints
[ ] Test database queries
[ ] Target: 80%+ coverage
```

### AFTERNOON: CI/CD PIPELINE

#### GitHub Actions Setup
```yaml
[ ] Create .github/workflows/ci.yml
[ ] Trigger: on push to main + PRs
[ ] Steps:
    [ ] Install dependencies
    [ ] Lint (eslint)
    [ ] Type check (tsc)
    [ ] Run tests (jest)
    [ ] Build (next build)
    [ ] Deploy staging (Vercel)
```

#### Deployment
```
[ ] Setup automatic staging deploys
[ ] Setup manual production deploys
[ ] Test deployment pipeline
[ ] Verify staging environment working
```

**END OF WEEK CHECK:**
```
✅ Infrastructure running
✅ Database schema deployed
✅ pHash algorithm working
✅ /api/compare API live
✅ Auth system working
✅ Tests passing
✅ CI/CD pipeline active
✅ Staging environment working

WEEK 1 DELIVERABLE: Production-ready backend infrastructure
```

---

## METRICS TO TRACK

### Performance
```
[ ] API latency: <100ms (p95)
[ ] Database query: <50ms
[ ] Uptime: 100% (this week, expected)
[ ] Errors: 0 (this week)
```

### Code Quality
```
[ ] Test coverage: 80%+
[ ] Lint errors: 0
[ ] Type errors: 0
[ ] Commits: daily
```

### Team
```
[ ] Dev #2 hired? (target: end of week)
[ ] Contractor interviews done?
```

---

## IF YOU GET STUCK

### Supabase setup issues?
→ Check Supabase docs: https://supabase.com/docs

### GitHub Actions failing?
→ Check build logs in GitHub
→ Run locally: npm run build + npm test

### API latency too high?
→ Check database query plan (EXPLAIN)
→ Add indexes if needed
→ Profile with DataDog

### Authentication not working?
→ Verify JWT token structure
→ Check cookies being set
→ Test with Postman

---

## SIGNS OF SUCCESS

By Friday 5pm, you should be able to:

1. **POST to /api/compare**
   ```bash
   curl -X POST http://localhost:3000/api/compare \
     -F "image_a=@logo1.jpg" \
     -F "image_b=@logo2.jpg"
   
   Response: { "similarity_score": 87, "risk_level": "WARNING" }
   ```

2. **Sign up a user**
   ```bash
   curl -X POST http://localhost:3000/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com", "password":"Test123!"}'
   
   Response: { "success": true, "user_id": "..." }
   ```

3. **Deploy to production**
   ```bash
   git push origin main
   # GitHub Actions runs → Vercel deploys
   # https://logocompare.vercel.app/ is live
   ```

---

## COMMUNICATION

- **Daily standup**: 9:15am Slack
- **Issues**: Post in #bugs
- **Updates**: End-of-day in #dev
- **Help**: Ask the team (don't get stuck >30min)

---

**You've got this, Travis. Let's build! 🚀**

