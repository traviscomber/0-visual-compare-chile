# MVP Progress Tracker - Visual Compare Chile

## Status Summary
- Current phase: MVP stabilization and release prep
- Focus: core path first
- Main risk: production verification with real Supabase env vars and a publicly reachable Vercel deployment

## Verified
- [x] Auth routes render and redirect correctly in local smoke test.
- [x] Upload contract aligned to JPG, PNG, WebP, TIFF up to 50 MB.
- [x] Comparison endpoints use SHA-256, pHash and diff visual flow.
- [x] History, detail and settings are protected by session guards.
- [x] Production build passes.
- [x] Public landing and demo copy aligned to MVP.
- [x] README and deployment checklist updated for the current state.

## Remaining
- [ ] Real Supabase credentials configured in `.env.local` and Vercel.
- [ ] End-to-end login with a real Supabase user.
- [ ] End-to-end upload, compare and history flow against real backend.
- [ ] Production deploy verified on a public live URL that is not blocked by Vercel SSO.

## Issues Log
| Date | Issue | Impact | Status |
|------|-------|--------|--------|
| 2026-07-08 | Missing real Supabase env vars and public production URL | Blocks full end-to-end release audit | Open |

## Decisions Log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-07-08 | Keep historical Fase 0 docs as reference only | Preserve audit trail without mixing it with current MVP handoff |
| 2026-07-08 | Use `SHA-256 + pHash + diff visual` as the visible comparison story | Matches the verified current codebase |

## Definition of Done
- Auth works end to end with Supabase.
- Upload and compare work end to end.
- History and detail work end to end.
- Main routes are protected.
- Production build passes.
- Production deploy is verified.
- The live URL is publicly reachable without Vercel SSO.
