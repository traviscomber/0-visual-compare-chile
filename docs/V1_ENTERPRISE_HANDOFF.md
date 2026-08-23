# Visual Compare — v1 Enterprise Handoff

## Product scope

Visual Compare is a decision-intelligence platform for industrial property workflows in Chile. The production product is organized around Intelligence Home, Executive Portfolio, Cases, Evaluar, Investigar, Monitorear, governance, analytics, predictive risk, automation and Decision Copilot.

## Production architecture

- Next.js 16 on Vercel.
- Supabase Auth + Postgres + RLS.
- INAPI open-data mirrors from datos.gob.cl.
- OpenAI multimodel routing for bounded classification and Decision Copilot.
- Vercel Cron for INAPI sync and case automation sweeps.
- GitHub Actions CI + CodeQL as merge gates.

## Security and tenancy

All user/workspace case tables use RLS. Access is derived from case ownership or explicit case membership. Privileged background automation uses service-role-only RPCs. `case_copilot_rate_limits` intentionally has RLS enabled with zero policies and direct grants revoked; access is only through `consume_case_copilot_quota()`.

Decision Copilot guardrails:

- authorized case context only;
- no autonomous approval, closure or decision mutation;
- consequential interventions require human confirmation;
- 20 requests/hour/user and 100 requests/day/user;
- model, token usage, estimated cost and suggested actions are audited;
- deterministic fallback is available when model execution is unavailable.

## Permission matrix

| Capability | Owner | Editor | Viewer | Assignee/Reviewer |
| --- | --- | --- | --- | --- |
| Read case/evidence/timeline | Yes | Yes | Yes | When member |
| Edit case content | Yes | Yes | No | No |
| Manage members | Yes | No | No | No |
| Start governance round | Yes | Yes | No | No |
| Change governance policy | Yes | No | No | No |
| Respond to assigned review | Yes | Yes | Yes | Own request only |
| Configure automation policy | Yes | No | No | No |
| Execute consequential intervention | Yes | Editor where allowed | No | No |
| Use Decision Copilot | Yes | Yes | Yes | When case access exists |

## Scheduled jobs

### INAPI sync

`/api/cron/inapi-open-data` refreshes current-year trademark and patent data, detects watches and advances historical backfill. It is protected by `CRON_SECRET`.

Operational invariant: duplicate CKAN records are deduplicated by `source_record_id` before each Postgres upsert, preventing `ON CONFLICT DO UPDATE command cannot affect row a second time` failures.

### Case automation

The hourly automation sweep reads explicit owner-configured policies. It may send reminders and elevate priority when configured. It cannot approve, decide, close, reassign reviewers or extend deadlines autonomously.

## Observability

Primary checks:

1. Vercel deployment state must be `READY`.
2. GitHub CI and CodeQL must be green before merge.
3. `/api/v1/health` must remain healthy after release.
4. Vercel Runtime Errors should be checked after cron windows and releases.
5. `inapi_sync_runs` is the source of truth for INAPI sync completion/failure.
6. `case_events`, `case_automation_actions` and `case_copilot_runs` provide case-level auditability.

## Release runbook

1. Work on a branch; no direct production feature work on `main`.
2. Apply reversible/idempotent Supabase migrations and verify RLS.
3. Wait for Vercel preview `READY`.
4. Open PR and require TypeScript/build + CodeQL green.
5. Merge to `main`.
6. Wait for production deployment `READY`.
7. Validate health endpoint and critical authenticated flows.
8. Check runtime errors and cron results.
9. Roll back application by redeploying the prior known-good Vercel deployment if runtime behavior regresses. Database rollbacks must be explicit migrations; never destructively revert production data ad hoc.

## Critical QA flows

- Authentication and tenant isolation.
- Evaluar → Investigar handoff.
- Investigar → Monitorear/watchlist.
- Signal → Investigar.
- Save evaluation/research/watch/signal into a case.
- Case Intelligence readiness and checkpoints.
- Team membership, comments, mentions and assigned actions.
- Review request → approve/changes → governance quorum.
- Decision gate cannot close while governance is incomplete.
- Decision Brief renders and prints.
- Portfolio, Analytics/SLA and Predictive Risk reflect accessible cases only.
- Recommended interventions require appropriate permissions.
- Automation policy is owner-controlled.
- Copilot is grounded, audited and rate limited.
- INAPI cron completes without duplicate-upsert failure.

## Data and AI cost controls

The multimodel router remains cost-aware. Decision Copilot uses the economical configured tier by default and records estimated cost per run. User-level request budgets prevent accidental prompt loops or UI abuse. Material provider/pricing changes must be reviewed separately from product releases.

## Operational ownership

- GitHub is the source of truth for code and migrations.
- Supabase is the source of truth for production relational data and RLS.
- Vercel is the source of truth for deployed revisions, cron execution and runtime logs.
- INAPI/datos.gob.cl is the authoritative external source for synchronized public industrial-property data.

## v1 certification boundary

The v1 enterprise release is considered certified when production is on the release merge SHA, CI/CodeQL are green, Supabase migrations are applied with RLS verified, Vercel reports `READY`, health is responsive, and no unresolved release-blocking runtime error remains.
