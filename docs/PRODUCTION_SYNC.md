# Production Sync

Single source of truth for production work:

1. Git `main`
2. Vercel production env pulled into `.env.vercel.production`
3. Supabase production reached through the canonical env variables resolved by `scripts/production-env.mjs`

## Required flow

Refresh production env from Vercel:

```bash
pnpm vercel:pull
```

Run INAPI sync against the same production env used by Vercel:

```bash
pnpm sync:inapi:prod -- --query VISUAL --type nombre --delayMs 0
pnpm sync:inapi:prod -- --preset phase1-10k --startIndex 0 --maxJobs 5 --delayMs 400
```

The wrapper handles the current Vercel quirk where canonical variables can arrive empty and the real values come in suffixed keys like `SUPABASE_SERVICE_ROLE_KEY_2` and `SUPABASE_URL_2`.

## Working rule

If work starts in Codex:

1. Pull latest `main`
2. Run `pnpm vercel:pull`
3. Run production sync or validation commands through `pnpm sync:inapi:prod`

If work starts in Vercel:

1. Pull the latest Vercel env locally
2. Continue from `main`
3. Validate against the production Supabase project only
