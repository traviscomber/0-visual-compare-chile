# Security Policy

## Supported branch

Security fixes target `main` and the current production deployment.

## Reporting a vulnerability

Do not open a public issue for vulnerabilities, leaked credentials, authentication bypasses, RLS bypasses, injection issues, or sensitive data exposure.

Report privately to the repository owner/maintainer and include:

- affected route or component;
- reproduction steps;
- expected vs actual behavior;
- impact;
- suggested mitigation when known.

## Secret handling

Never commit:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `CRON_SECRET`;
- `OPENAI_API_KEY`;
- API keys, session tokens or cookies;
- production database credentials;
- private customer data.

Production secrets belong in Vercel/Supabase secret management only.

If a secret is exposed, rotate/revoke it immediately. Removing it from Git history is not sufficient by itself.

## Data access model

- User-owned data must be protected by Supabase RLS.
- Service-role access is server-side only.
- Private endpoints must authenticate before reading/writing user data.
- Cron endpoints must validate `Authorization: Bearer CRON_SECRET`.
- Health endpoints may expose status/configuration presence, never secret values.

## AI safety and integrity

- Model responses that drive structured product behavior must pass schema validation.
- Do not accept invented Niza/Viena/IPC codes as canonical data.
- Model upgrades require evals against the documented baseline before promotion.
- Cost/accuracy claims must come from observed metrics, not hardcoded estimates presented as production facts.

## Dependency and code scanning

The repository uses Dependabot and CodeQL. Security-related dependency updates should receive priority review.
