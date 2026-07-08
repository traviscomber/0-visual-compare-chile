# MVP Execution Checklist - Visual Compare Chile

## Goal
Turn the MVP roadmap into a concrete execution plan with clear weekly outputs, so work can move without reopening scope every turn.

## Working Rules
- Keep the MVP scope small.
- Prefer fixing the current flow over adding new surfaces.
- Treat auth, upload, compare, history, and deploy as the core path.
- Do not add new major features until the core path is stable.

## Week 1 - Stabilize Foundation
### Objective
Make auth, routes, and base navigation consistent.

### Tasks
- Confirm `login`, `signup`, and `callback` work with Supabase.
- Keep middleware session refresh active.
- Remove or repair broken navigation links.
- Align all visible copy with the actual product limits.
- Verify `/dashboard` loads only when authenticated.
- Run a production build.

### Exit Criteria
- Login works.
- Signup works.
- Redirects are correct.
- No broken links in the main flow.
- Build passes.

## Week 2 - Unify Upload Flow
### Objective
Make image upload behavior identical across UI and backend.

### Tasks
- Keep supported formats to JPG, PNG, WebP, and TIFF.
- Keep size limit at 50 MB.
- Use shared validation constants in UI and API.
- Confirm deduplication by SHA-256.
- Verify upload errors are clear and consistent.
- Confirm storage paths and signed URLs work.

### Exit Criteria
- Upload works from the UI.
- Invalid files are rejected correctly.
- Large files are rejected correctly.
- Backend and UI enforce the same contract.

## Week 3 - Comparison Core
### Objective
Make comparison results trustworthy and reproducible.

### Tasks
- Use real pHash in both upload endpoints.
- Keep SHA-256 exact matching.
- Preserve the final comparison score.
- Store the full comparison payload.
- Confirm access control on comparison reads.
- Keep comparison outputs stable.

### Exit Criteria
- Comparing two uploaded images returns a score.
- The score includes classification and recommendation.
- Data is saved and retrievable.

## Week 4 - History and Detail
### Objective
Let users review results without touching the database.

### Tasks
- Make the comparison list page usable.
- Make the comparison detail page usable.
- Keep delete behavior safe and scoped to the owner.
- Verify diff visualization if available.
- Make empty states and loading states clear.

### Exit Criteria
- A user can see their history.
- A user can open a result detail page.
- A user can delete their own comparison.

## Week 5 - QA and Security
### Objective
Reduce release risk before deployment.

### Tasks
- Check RLS or equivalent access policies.
- Verify one user cannot read another user’s data.
- Test login, logout, upload, compare, history, and delete.
- Review error messages for clarity.
- Test the mobile layout of the core flow.

### Exit Criteria
- Core security checks pass.
- Core user flows pass manually.
- No obvious production blockers remain.

## Week 6 - Deploy and Handoff
### Objective
Put the MVP in a stable demo-ready state.

### Tasks
- Verify production env vars.
- Deploy to Vercel.
- Confirm the production URL is public and not behind Vercel SSO.
- Review logs and runtime errors.
- Fix any deployment-only regressions.
- Write the final handoff notes.

### Exit Criteria
- Production deployment is live.
- Main flow works in production.
- Production URL is publicly reachable.
- There is a clear list of post-MVP follow-ups.

## Recommended Order of Work
1. Auth and routing.
2. Upload contract.
3. Comparison core.
4. History and detail.
5. QA and security.
6. Deployment.

## MVP Definition of Done
- Auth is real and stable.
- Upload and compare are consistent.
- History and detail are usable.
- Core routes are protected.
- Build passes.
- Production deploy is working.
