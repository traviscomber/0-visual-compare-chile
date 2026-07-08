# MVP Daily Plan - Visual Compare Chile

## Week 1 - Foundation
### Day 1
- Confirm Supabase env vars.
- Review auth flow in login, signup and callback.
- Verify `/dashboard` redirect behavior.

### Day 2
- Review middleware/session refresh.
- Remove or fix broken navigation links.
- Confirm route map is coherent.

### Day 3
- Align visible product copy with real limits.
- Review landing and docs text.
- Remove remaining demo contradictions.

### Day 4
- Run production build.
- Fix build regressions only.
- Confirm protected routes still work.

### Day 5
- Do a smoke test of auth and navigation.
- Confirm logout and re-login work.
- Freeze foundation changes.

## Week 2 - Upload Flow
### Day 1
- Verify shared validation constants.
- Confirm UI and API limits match.

### Day 2
- Test JPG, PNG, WebP and TIFF uploads.
- Test rejected formats and oversize files.

### Day 3
- Validate deduplication by SHA-256.
- Confirm storage path and signed URL generation.

### Day 4
- Test upload error handling.
- Fix any inconsistent error messages.

### Day 5
- Smoke test upload from UI end to end.
- Verify no mismatch remains between docs and backend.

## Week 3 - Comparison Core
### Day 1
- Confirm pHash is used in both upload endpoints.
- Remove any old demo hash logic.

### Day 2
- Verify `/api/compare` produces stable result payloads.
- Confirm classification and recommendation.

### Day 3
- Check access control on comparison reads.
- Verify user isolation for stored comparisons.

### Day 4
- Review persisted result JSON.
- Confirm diff URLs and metadata are present when available.

### Day 5
- Run comparison smoke tests with real uploaded files.

## Week 4 - History and Detail
### Day 1
- Review comparison list UI.
- Make sure empty and loading states are sensible.

### Day 2
- Review comparison detail page.
- Confirm navigation from history to detail works.

### Day 3
- Test safe delete behavior.
- Verify only the owner can delete.

### Day 4
- Check diff visualization and metadata rendering.

### Day 5
- End-to-end review of history plus detail flow.

## Week 5 - QA and Security
### Day 1
- Review RLS or equivalent access policies.
- Validate cross-user isolation.

### Day 2
- Test login, logout, upload, compare and delete.

### Day 3
- Review error messages and edge cases.

### Day 4
- Smoke test mobile layout.
- Check obvious accessibility issues.

### Day 5
- Collect QA findings and prioritize fixes.

## Week 6 - Deploy and Handoff
### Day 1
- Verify production env vars.
- Review deployment configuration.

### Day 2
- Deploy to Vercel.
- Confirm production build and runtime health.

### Day 3
- Review logs and fix deployment-only issues.

### Day 4
- Clean up remaining copy, links and rough edges.

### Day 5
- Write handoff notes and post-MVP backlog.

