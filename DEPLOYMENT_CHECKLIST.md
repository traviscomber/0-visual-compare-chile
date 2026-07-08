# Deployment Checklist - Visual Compare Chile

## Pre-deploy

- [ ] `.env.local` configured with Supabase URL, anon key, and service role key.
- [ ] `pnpm check:env` passes.
- [ ] `pnpm build` passes.
- [ ] `pnpm smoke` passes against local or production URL.
- [ ] Auth routes load: `/auth/login`, `/auth/sign-up`, `/auth/sign-up-success`.
- [ ] Protected routes redirect unauthenticated users.
- [ ] Upload contract matches UI and backend.

## Production smoke test

- [ ] Login works with a real Supabase user.
- [ ] Upload accepts JPG, PNG, WebP, and TIFF up to 50 MB.
- [ ] Compare returns score, classification, and recommendation.
- [ ] History lists the latest comparisons.
- [ ] Detail page opens from history.
- [ ] Delete comparison only affects the owner.

## Vercel

- [ ] Variables added in Vercel project settings.
- [ ] Latest branch deployed successfully.
- [ ] Production URL loads without console errors.
- [ ] Production URL is publicly reachable and not blocked by Vercel SSO.
- [ ] `pnpm smoke` passes against the production URL.
- [ ] `/compare`, `/history`, and `/settings` work in production.

## Post-deploy

- [ ] Capture any runtime errors.
- [ ] Record manual smoke-test result.
- [ ] Log follow-up tasks for post-MVP backlog.
