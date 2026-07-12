# Deployment Checklist - Visual Compare Chile

## Pre-deploy

- [ ] `.env.local` configured with Supabase URL, anon key, and service role key.
- [ ] `.env.local` or Vercel env includes `NEXT_PUBLIC_SITE_URL` for the final public origin.
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

## Current Production Audit

Date audited: July 11, 2026

- Preview URL currently reachable:
  - `https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app/`
- Preview API health currently reachable:
  - `https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app/api/v1/health`
- Preview smoke status:
  - `pnpm smoke` against the preview URL passed on July 11, 2026
- Preview deploy audit status after health-contract hardening:
  - `pnpm audit:deploy` currently fails on preview health contract
  - interpretation: the public preview is reachable, but it does not yet serve the latest checkout contract
- Expected latest health contract includes:
  - `status`
  - `version`
  - `revision`
  - `timestamp`
  - `host`
  - `config.supabase_public_env`
  - `config.supabase_service_env`
  - `config.supabase_url_host`
  - `config.supabase_project_ref`
  - `config.auth_callback_path`
  - `config.site_origin`
  - `config.callback_urls`
- Canonical domain currently failing:
  - `https://v0-visual-compare-chile.vercel.app/`
  - Result observed: `404 DEPLOYMENT_NOT_FOUND`

Required action before calling production stable:

- [ ] Confirm which Vercel domain is intended to be canonical.
- [ ] Reassign or restore the canonical `v0-visual-compare-chile.vercel.app` domain if it should remain primary.
- [ ] Run `pnpm smoke` using `SMOKE_BASE_URL=<active-deployment-url>` against the exact public URL.
- [ ] Run `pnpm audit:deploy` with `EXPECTED_REVISION=<git-sha>` against the exact public URL.
- [ ] Run `pnpm audit:deploy` with `EXPECTED_SUPABASE_PROJECT_REF`, `EXPECTED_SITE_ORIGIN`, and `EXPECTED_CALLBACK_URL`.
- [ ] Manually verify auth callback URLs in Supabase match the final production and preview domains.
- [ ] Confirm the `config.callback_urls` returned by `/api/v1/health` are all present in Supabase Auth redirect URLs.
- [ ] Confirm Vercel env vars are present so Supabase cannot fail at runtime due to missing public keys.

## Post-deploy

- [ ] Capture any runtime errors.
- [ ] Record manual smoke-test result.
- [ ] Log follow-up tasks for post-MVP backlog.
