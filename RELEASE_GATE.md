# Release Gate - Visual Compare Chile

## Objetivo

Cerrar la Semana 8 del roadmap con una verificacion unica y repetible sobre el deployment publico real.

## Variables requeridas

```bash
ACTIVE_DEPLOYMENT_URL=https://your-active-deployment.vercel.app
CANONICAL_DEPLOYMENT_URL=https://your-canonical-domain.vercel.app
EXPECTED_REVISION=<git-sha>
EXPECTED_SUPABASE_PROJECT_REF=<supabase-ref>
EXPECTED_SITE_ORIGIN=https://your-canonical-domain.vercel.app
EXPECTED_CALLBACK_URL=https://your-canonical-domain.vercel.app/auth/callback
```

## Comando unico

```bash
pnpm release:gate
```

El gate ejecuta, en orden:

1. `pnpm smoke` contra `ACTIVE_DEPLOYMENT_URL`
2. `pnpm audit:deploy` contra `ACTIVE_DEPLOYMENT_URL` y `CANONICAL_DEPLOYMENT_URL`

## Criterios de aprobacion

Todos estos checks deben pasar:

1. La home publica responde `200`
2. `/auth/login` responde `200`
3. `/panel` responde `200`
4. `/demo` redirige a `/panel`
5. Las rutas protegidas redirigen a `/auth/login`
6. `/api/v1/health` expone `revision`, `host` y `config.*` completos
7. `revision` coincide con `EXPECTED_REVISION`
8. `supabase_project_ref` coincide con `EXPECTED_SUPABASE_PROJECT_REF`
9. `site_origin` coincide con `EXPECTED_SITE_ORIGIN`
10. `callback_urls` incluye `EXPECTED_CALLBACK_URL`

## Go / No-Go

- `GO`: `pnpm release:gate` termina con exit code `0`
- `NO-GO`: cualquier `FAIL`, `404`, drift de revision, drift de Supabase, drift de callback o dominio canónico roto

## Evidencia minima a guardar

- Salida completa de `pnpm release:gate`
- URL activa validada
- URL canonica validada
- SHA exacto usado en `EXPECTED_REVISION`
- Ref exacto usado en `EXPECTED_SUPABASE_PROJECT_REF`
