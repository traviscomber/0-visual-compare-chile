# MVP Backlog - Visual Compare Chile

## P0
- [ ] Auth: keep Supabase login, signup and callback fully working.
- [ ] Auth: keep middleware session refresh active.
- [ ] Navigation: remove or fix broken links in the main flow.
- [ ] Upload: align UI, docs and API on `50 MB` plus `JPG/PNG/WebP/TIFF`.
- [ ] Upload: keep deduplication by SHA-256 working.
- [ ] Compare: use real pHash instead of demo hashing.
- [ ] Compare: keep `/api/compare` stable and user-scoped.
- [ ] Deploy: verify production build and Vercel env vars.

## P1
- [ ] History: make the comparison list easy to use.
- [ ] Detail: make comparison detail readable and complete.
- [ ] Delete: keep comparison delete safe and owner-scoped.
- [ ] QA: test login, upload, compare and delete end to end.
- [ ] Security: verify cross-user isolation.
- [ ] UX: clean up error messages and empty states.

## P2
- [ ] Copy: remove leftover demo wording from landing and docs.
- [ ] Polish: normalize typography and route naming.
- [ ] Ops: add a simple post-launch checklist.
- [ ] Docs: write a short handoff for the first pilot.

## Ticket Format
Use this template for each task:

```md
### [P0] Short Title
Why:
What:
Done when:
```

## Suggested First Tickets
1. [P0] Auth flow cleanup.
2. [P0] Upload contract unification.
3. [P0] pHash replacement.
4. [P1] History/detail pass.
5. [P1] QA/security smoke test.
6. [P0] Production deploy check.

