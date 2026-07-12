# Visual Compare Chile

Plataforma de inteligencia marcaria para Chile con comparacion visual, consulta operativa, auth Supabase, historial, API v1 y base para organizaciones y monetizacion por API.

## Estado actual

- Fase 0 completada.
- Fase 1 en curso: datos reales, API keys, multi-tenant, audit log, rate limiting y exportacion masiva.
- Auth Supabase integrada.
- Upload soporta JPG, PNG, WebP y TIFF hasta 50 MB.
- La comparacion persiste score, clasificacion, recomendacion y senales forenses.
- Historial y detalle estan protegidos por sesion.
- Build de produccion y smoke local pasan.
- En Vercel, el preview activo responde y el dominio canonico actual necesita correccion.

## Roadmap operativo

La fuente de verdad del desarrollo es `ROADMAP.md`.

Resumen de fases:

- Fase 0 - Completada: landing, dashboard, motor de comparacion, API v1, auth, historial y PDF report
- Fase 1 - En curso: INAPI, API keys self-service, organizaciones, audit log, quotas y exportacion
- Fase 2 - Planificada: registrabilidad IA, vigilancia, batch compare, webhooks, analytics, SDK
- Fase 3 - Planificada: expansion LATAM, motor multimodal, white-label, marketplace juridico

Criterio de salida de Fase 1:

1. Sync INAPI con al menos 10K marcas reales
2. Portal de API keys con emision, revocacion y uso en tiempo real
3. Rate limiting efectivo sobre el limite configurado

## Flujo principal

1. Crear cuenta o iniciar sesion.
2. Subir dos imagenes desde `/compare`.
3. Revisar score, clasificacion y diff.
4. Consultar historial en `/history`.
5. Abrir detalle de cada comparacion en `/comparisons/[id]`.

## Rutas principales

- `/`
- `/auth/login`
- `/auth/sign-up`
- `/dashboard`
- `/compare`
- `/history`
- `/settings`
- `/consulta`
- `/panel`

## Requisitos locales

- Node.js 18+
- pnpm
- Variables de Supabase en `.env.local`

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
```

`NEXT_PUBLIC_SITE_URL` no es secreto. Se usa para que `/api/health` y `/api/v1/health` publiquen el origen esperado y la URL exacta de callback que debe existir tambien en Supabase Auth.

## Instalar y correr

```bash
pnpm install
pnpm dev
```

## Validacion local

```bash
pnpm check:env
pnpm build
pnpm smoke
```

## Smoke contra despliegue

```bash
SMOKE_BASE_URL=https://your-active-deployment.vercel.app pnpm smoke
```

Usa la URL exacta del deployment publico que quieras validar.

## Auditoria de revision del deploy

```bash
ACTIVE_DEPLOYMENT_URL=https://your-active-deployment.vercel.app \
CANONICAL_DEPLOYMENT_URL=https://your-canonical-domain.vercel.app \
EXPECTED_REVISION=<git-sha> \
EXPECTED_SUPABASE_PROJECT_REF=<supabase-ref> \
EXPECTED_SITE_ORIGIN=https://your-canonical-domain.vercel.app \
EXPECTED_CALLBACK_URL=https://your-canonical-domain.vercel.app/auth/callback \
pnpm audit:deploy
```

Usa estas variables para verificar que el dominio publico realmente este sirviendo:

- el commit esperado (`EXPECTED_REVISION`)
- el proyecto Supabase correcto (`EXPECTED_SUPABASE_PROJECT_REF`)
- el origen publico correcto (`EXPECTED_SITE_ORIGIN`)
- la callback exacta publicada por la app (`EXPECTED_CALLBACK_URL`)

## Deploy

1. Sube el branch correcto a GitHub.
2. Configura las variables de entorno en Vercel.
3. En Supabase, permite como redirect URL `https://<tu-dominio>/auth/callback` y las preview URLs que uses.
4. Verifica que el dominio de produccion sea publico y no este bloqueado por Vercel SSO.
5. Ejecuta el smoke sobre la URL publica real.
6. Verifica login, upload, compare e historial en produccion.

## Health contract de deploy

El endpoint `/api/v1/health` debe exponer como minimo:

- `revision`
- `host`
- `config.supabase_public_env`
- `config.supabase_service_env`
- `config.supabase_url_host`
- `config.supabase_project_ref`
- `config.site_origin`
- `config.callback_urls`

Eso permite verificar en un solo request:

- que Vercel esta sirviendo el commit correcto
- que Supabase publico y service role existen
- que el proyecto Supabase inferido desde `NEXT_PUBLIC_SUPABASE_URL` es el esperado
- que la callback `/auth/callback` publicada por la app coincide con lo que debe configurarse en Supabase Auth

## Estado Vercel auditado

Auditado el 11 de julio de 2026:

- Deployment publico activo:
  - `https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app/`
- Health endpoint activo:
  - `https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app/api/v1/health`
- Dominio canonico actualmente roto:
  - `https://v0-visual-compare-chile.vercel.app/`
  - Respuesta observada: `404 DEPLOYMENT_NOT_FOUND`

## Notas

- `app/demo` es una vista comercial de apoyo, no el flujo core.
- `app/consulta` usa la capa compartida del API Portal (`/api/v1/search`, `/api/v1/search/niza`, `/api/v1/search/viena`).
- El plan activo vive en `ROADMAP.md`.
- `auth/signup` redirige a `/auth/sign-up`.
- El archivo `proxy.ts` mantiene el refresh de sesion y la proteccion de rutas para Next.js 16.
