# MVP Visual Compare API Chile V1 - CLP $5M Budget (3 Months)

## Executive Summary

**Budget:** $5,000,000 CLP (~$6,500 USD)
**Timeline:** 3 months (12 weeks)
**Status:** FEASIBLE with aggressive scope reduction

### Budget Allocation (Optimized for Constraints)
- Development (60%): $3.0M CLP (~$3,900 USD) - 1 dev + 1 part-time senior
- Infrastructure (15%): $750k CLP (~$975 USD) - Vercel free tier + Supabase free tier
- Security/Testing (15%): $750k CLP (~$975 USD) - Automated testing + security scanning
- Operations/Contingency (10%): $500k CLP (~$650 USD)

**Total: $5.0M CLP**

---

## Phase 1: MVP Scope (Weeks 1-3) - $1.67M CLP

### Week 1: Infrastructure & Auth (Days 1-5)
**Goal:** API foundation ready for development

✅ **Already Completed:**
- Next.js API routes scaffold (using existing code)
- Supabase database schema (images, comparisons, api_keys, usage_logs)
- Authentication system (API key based)

**Action Items (COMPLETE if not done):**
1. **Finalize Database Schema** (2h)
   - images table (id, user_id, organization_id, filename, file_path, sha256, phash, mime_type, size_bytes, width, height, created_at)
   - comparisons table (id, user_id, organization_id, image_a_id, image_b_id, similarity_score, classification, recommendation, signals, created_at)
   - api_keys table (id, user_id, organization_id, key_hash, is_active, expires_at, last_used_at)
   - usage_logs table (id, user_id, organization_id, action, metadata, created_at)
   - RLS policies for multi-tenancy

2. **API Key Management** (4h)
   - [DONE] hashApiKey() and generateApiKey() in lib/api/auth.ts
   - [DONE] authenticateApiKey() middleware
   - [DONE] API key validation on all v1 routes

3. **Rate Limiting** (2h)
   - Implement simple rate limiting (Upstash Redis OR memory-based for MVP)
   - 100 requests/minute per API key

**Cost: $166k CLP** (1 dev × 8h × ~$20.75k/h)

---

### Week 2: Image Upload & Storage (Days 6-10)
**Goal:** Upload endpoint working end-to-end

**Tasks:**
1. **POST /v1/images - Upload Endpoint** (6h)
   - [EXISTS] Basic route structure in place
   - Validate file (JPEG, PNG, WebP, TIFF only)
   - Max 50MB per image
   - Store in Vercel Blob (free tier: 1000 files)
   - Extract metadata: dimensions, mime type, size
   - **Generate SHA-256 hash** (verification, deduplication)
   - Return image_id

2. **SHA-256 Hash Generation** (3h)
   - Use crypto.subtle.digest() or crypto library
   - Store hash in database
   - Use for exact-match detection

3. **Testing & Validation** (2h)
   - Basic unit tests for upload logic
   - Error handling (invalid file type, too large, etc)

**Cost: $166k CLP**

---

### Week 3: Database & Core API Structure (Days 11-15)
**Goal:** Database production-ready, core endpoints functional

**Tasks:**
1. **GET /v1/health** (1h)
   - [LIKELY EXISTS] Health check endpoint
   - Verify database, storage, auth connections

2. **Database RLS & Security** (4h)
   - Enable RLS on all tables
   - Users can only see their own data
   - Audit logging for compliance

3. **Error Handling & Logging** (3h)
   - Standardized error responses
   - Structured logging for debugging
   - Error monitoring setup

4. **Documentation** (3h)
   - API documentation (OpenAPI/Swagger format)
   - Setup in `/docs` endpoint

**Cost: $166k CLP**

---

## Phase 2: Comparison Engine MVP (Weeks 4-6) - $1.67M CLP

### Week 4: SHA-256 & pHash Implementation (Days 16-20)
**Goal:** Two comparison methods working

**Tasks:**
1. **pHash Implementation** (8h)
   - Use existing phash library (npm: `sharp` + `jimp` already have hash functions)
   - Calculate perceptual hash for each image during upload
   - Store in database
   - Hamming distance calculation function [EXISTS in code]

2. **POST /v1/compare Endpoint** (6h)
   - [EXISTS] Basic structure with SHA-256 + pHash
   - Accept image_a_id, image_b_id
   - Run SHA-256 comparison
   - Run pHash comparison
   - Weighted scoring (60% pHash, 40% metadata) - NO embeddings yet
   - Classifications: exact_match, near_duplicate, visually_similar, partially_similar, different
   - Return similarity_score (0-100%), classification, recommendation

3. **Comparison Storage** (2h)
   - Save comparison results to database
   - Include signals, metadata, timestamps
   - Log usage

**Cost: $166k CLP**

---

### Week 5: Testing & Optimization (Days 21-25)
**Goal:** Comparison engine production-ready

**Tasks:**
1. **Load Testing** (4h)
   - Test 100 comparisons/minute
   - Verify <100ms latency (p95)
   - Check database query performance
   - Optimize if needed

2. **Integration Testing** (3h)
   - Full flow: upload → compare → retrieve
   - Error scenarios
   - Edge cases (same image, invalid IDs, etc)

3. **GET /v1/comparisons/:id** (3h)
   - [EXISTS] Retrieve single comparison
   - Return full result with signals

4. **GET /v1/comparisons** (2h)
   - List comparisons (paginated)
   - Filter by date, user
   - Support sorting

**Cost: $166k CLP**

---

### Week 6: Features & API Hardening (Days 26-30)
**Goal:** MVP feature-complete

**Tasks:**
1. **DELETE /v1/images/:id** (2h)
   - Delete image from storage + database
   - Cascade cleanup comparisons

2. **GET /v1/usage** (2h)
   - Usage stats (API calls, storage, monthly trends)
   - Per-user breakdown

3. **API Documentation Updates** (2h)
   - Update with actual endpoints
   - Add code examples (cURL, Python, JS)
   - Setup automated documentation

4. **Security Hardening** (3h)
   - CORS configuration
   - Request validation
   - SQL injection prevention
   - Rate limiting verification

5. **Performance Monitoring** (2h)
   - Setup error tracking (Sentry free tier)
   - Response time monitoring
   - Database query monitoring

**Cost: $166k CLP**

---

## Phase 3: QA, Testing & Launch (Weeks 7-9) - $1.67M CLP

### Week 7: Comprehensive Testing (Days 31-35)
**Tasks:**
1. **Automated Test Suite** (6h)
   - Unit tests (80% coverage of core logic)
   - Integration tests (full API flows)
   - Edge case testing
   - Setup CI/CD in GitHub Actions (free tier)

2. **Manual Testing** (3h)
   - QA checklist walkthrough
   - Regression testing
   - User acceptance testing

3. **Performance Profiling** (2h)
   - Memory usage
   - CPU usage
   - Database query optimization

**Cost: $166k CLP**

---

### Week 8: Security Audit & Bug Fixes (Days 36-40)
**Tasks:**
1. **Security Review** (4h)
   - OWASP top 10 check
   - API key security review
   - Database security
   - Data encryption at rest/transit

2. **Bug Fixes** (3h)
   - Critical bugs from testing
   - Performance issues
   - Error handling edge cases

3. **Preparation for Production** (2h)
   - Documentation finalization
   - Deployment checklist
   - Backup strategy

4. **Senior Review** (2h)
   - Code review by senior dev
   - Architecture validation

**Cost: $166k CLP**

---

### Week 9: Monitoring Setup & Launch (Days 41-45)
**Tasks:**
1. **Monitoring & Alerting** (3h)
   - Uptime monitoring (Uptime Robot free tier)
   - Error alerts (Sentry)
   - Performance alerts

2. **Launch Preparation** (2h)
   - Final deployment
   - Smoke tests in production
   - Communications

3. **Documentation** (2h)
   - Release notes
   - Client onboarding guide
   - Troubleshooting guide

4. **Post-Launch Support** (2h)
   - Monitor for issues
   - Quick response team

**Cost: $166k CLP**

---

## Phase 4: Contingency & Optimization (Weeks 10-12) - $1.0M CLP

### Week 10: Bug Fixes & Refinements
- Patch any production issues
- User feedback incorporation
- Performance optimization

### Week 11: Feature Enhancements (Low Priority)
- Batch comparison endpoint (if time permits)
- Advanced filtering
- Export functionality

### Week 12: Documentation & Knowledge Transfer
- Comprehensive documentation
- Team training
- Handoff to operations

---

## ⚠️ CRITICAL CONSTRAINTS & TRADE-OFFS

### What's REMOVED from Original MVP:
❌ **Embeddings/TensorFlow.js** - Too complex, requires ML expertise
❌ **Computer Vision Advanced Features** - Histogram comparison, SIFT, SURF
❌ **Video Comparison** - Out of scope for CLP budget
❌ **Batch Processing** - Can add in v2
❌ **Advanced Analytics Dashboard** - CLI/API only
❌ **Compliance Certifications** - ISO 27001, SOC2 not achievable in timeline
❌ **Mobile Apps** - API only, clients build their own UI
❌ **Custom ML Models** - Use pre-built algorithms only

### What's INCLUDED (MVP):
✅ **SHA-256 Comparison** - Exact duplicate detection
✅ **pHash (Perceptual Hash)** - Visual similarity detection
✅ **Weighted Scoring** - Intelligent classification
✅ **API Key Authentication** - Secure multi-tenant access
✅ **Rate Limiting** - Basic protection
✅ **Usage Tracking** - For billing/analytics
✅ **Error Handling** - Comprehensive
✅ **Documentation** - OpenAPI + code examples
✅ **Monitoring** - Error tracking + uptime monitoring
✅ **Testing** - 80% code coverage
✅ **Security** - RLS, SQL injection prevention, rate limiting

---

## Team Requirements

### Minimum Team:
1. **Full-Time Lead Developer (Travis?)** - 
   - Backend API development
   - Database design & optimization
   - DevOps/deployment
   - Senior code review

2. **Full-Time Developer #2** -
   - API implementation
   - Testing & QA
   - Documentation
   - Bug fixes

3. **Part-Time Senior (5 hours/week)** -
   - Architecture review
   - Security review
   - Performance optimization
   - Mentoring

**Total: 2.5 FTE for 12 weeks**

### Cost Breakdown:
- Dev #1 (Senior): $2.5M CLP (60% of budget)
- Dev #2 (Mid): $1.5M CLP (35% of budget)
- Infrastructure + Tools: $750k CLP (15% contingency, tools, services)

---

## Success Metrics (MVP)

**Functional:**
- ✓ All 7 core endpoints working
- ✓ 80%+ test coverage
- ✓ Zero critical security issues
- ✓ <100ms p95 latency
- ✓ 99% uptime SLA

**Business:**
- ✓ API is multi-tenant (multiple organizations)
- ✓ Rate limiting prevents abuse
- ✓ Usage tracking working for billing
- ✓ Documentation allows 3rd party integration
- ✓ Monitoring catches production issues

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Scope creep | High | Medium | Strict sprint boundaries, 2-week reviews |
| Team turnover | High | Low | Good documentation, code reviews |
| Performance issues | Medium | Medium | Weekly load testing, optimization sprints |
| Security vulnerabilities | High | Low | Weekly security review, automated scanning |
| Database issues | Medium | Low | Backup strategy, RLS testing |
| Storage costs | Low | Low | Vercel Blob free tier + compression |

---

## Technology Stack (Validated for Budget)

| Component | Choice | Reason | Cost |
|-----------|--------|--------|------|
| Hosting | Vercel | Free tier sufficient, CDN included | $0 |
| Database | Supabase | Free tier (500MB), scales to paid as needed | $0-50/mo |
| Storage | Vercel Blob | Free tier (1000 files initially) | $0 |
| Monitoring | Sentry | Free tier covers MVP | $0 |
| API Docs | Swagger UI | Self-hosted on /docs endpoint | $0 |
| CI/CD | GitHub Actions | Free tier sufficient | $0 |
| Image Processing | Sharp + Node.js crypto | Built-in, no external service | $0 |
| Uptime Monitoring | Uptime Robot | Free tier (5 min checks) | $0 |

**Infrastructure Total: ~$750k CLP for contingency/overages**

---

## Phase Breakdown Timeline

```
Week 1-3:   Infrastructure & Auth Foundation
├─ Day 1-5: Database schema, auth, security (Phase 1a)
├─ Day 6-10: Image upload, SHA-256 (Phase 1b)
└─ Day 11-15: Database hardening, core APIs (Phase 1c)

Week 4-6:   Comparison Engine & Core Features
├─ Day 16-20: pHash + compare endpoint (Phase 2a)
├─ Day 21-25: Testing & optimization (Phase 2b)
└─ Day 26-30: Features hardening (Phase 2c)

Week 7-9:   QA, Security, Launch
├─ Day 31-35: Comprehensive testing (Phase 3a)
├─ Day 36-40: Security audit & fixes (Phase 3b)
└─ Day 41-45: Monitoring & launch (Phase 3c)

Week 10-12: Contingency & Optimization
└─ Bug fixes, refinements, documentation

TOTAL: 12 weeks (90 days)
```

---

## Next Steps

1. **Confirm team availability** - 2 devs for 12 weeks
2. **Validate Supabase/Vercel free tier limits** - May need small paid plan
3. **Review current code** - Complete Phase 1 assessment
4. **Setup CI/CD** - GitHub Actions workflow
5. **Create sprint backlog** - Detailed 2-week sprints
6. **Begin Week 1** - Infrastructure & auth

---

## Dependencies & Current Status

### ✅ Already Completed (~40% of MVP):
- Next.js API scaffold
- Supabase integration
- API key authentication (lib/api/auth.ts)
- Compare endpoint structure (app/api/v1/compare/route.ts)
- Hash functions (SHA-256, pHash distance calculation)
- Database schema (images, comparisons, api_keys)
- Landing page with documentation

### 🚧 In Progress (~30% of MVP):
- Image upload endpoint validation
- pHash implementation optimization
- Comparison scoring algorithm refinement
- Usage tracking
- Error handling standardization

### ⏳ To Do (~30% of MVP):
- GET /v1/comparisons/:id details
- GET /v1/comparisons list with filtering
- DELETE /v1/images/:id cascade logic
- GET /v1/usage statistics
- Rate limiting implementation
- Comprehensive test suite (80% coverage)
- Security audit & hardening
- Documentation finalization
- Monitoring setup
- Production deployment

---

## Feasibility Verdict: ✅ ACHIEVABLE

**With constraints:**
- Remove embeddings/ML features
- Use only SHA-256 + pHash (2 methods instead of 3)
- Focus on API, not UI
- Minimal documentation initially
- Defer advanced features to v2

**This MVP is a solid foundation for scaling beyond Year 1.**

---

Generated: May 11, 2026
Project: Visual Compare API Chile V1
Budget: $5,000,000 CLP
Timeline: 12 weeks (3 months)
Status: ✅ Ready for execution
