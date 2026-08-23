# Visual Compare Chile

Visual Compare es una plataforma de **decision intelligence para propiedad industrial**. Conecta evaluación de marcas, investigación INAPI/patentes, monitoreo competitivo, casos, gobernanza, colaboración, analytics, riesgo predictivo, automatización y Decision Copilot sobre Next.js + Vercel + Supabase.

## Producto v1

Flujo operativo:

`Intelligence Home -> Evaluar -> Investigar -> Monitorear -> Caso -> Case Intelligence -> Governance -> Decision Brief`

Capa ejecutiva:

`Executive Portfolio -> Analytics & SLA -> Trends -> Predictive Risk -> Recommended Interventions -> Automation & Copilot`

## Rutas principales

- `/dashboard` — Intelligence Home
- `/portfolio` — Executive Portfolio
- `/portfolio/analytics` — Analytics, SLA y tendencias
- `/portfolio/risk` — Predictive Risk Radar
- `/portfolio/control` — Automation & Copilot
- `/casos` — casos y decisiones
- `/casos/[id]` — expediente, evidencia, intelligence y timeline
- `/casos/[id]/equipo` — colaboración
- `/casos/[id]/revision` — revisión y governance
- `/casos/[id]/brief` — Decision Brief
- `/casos/[id]/control` — automatización + Copilot
- `/evaluar` — evaluación decision-first
- `/investigar` — investigación unificada
- `/monitorear` — Signal Center
- `/notificaciones` — notificaciones persistentes
- `/api/v1/health` — health operativo

Las URLs históricas siguen funcionando por compatibilidad, pero la arquitectura de producto oficial es la anterior.

## Arquitectura

- **Frontend/runtime:** Next.js 16 en Vercel.
- **Auth/datos:** Supabase Auth + Postgres + RLS.
- **Fuentes externas:** INAPI / datos.gob.cl.
- **IA:** OpenAI con router multimodelo cost-aware y Structured Outputs.
- **Automatización:** Vercel Cron + RPCs service-role controladas.
- **Calidad:** GitHub Actions TypeScript/build + CodeQL + Vercel Preview antes de merge.

## Seguridad

- RLS en todas las superficies de casos y colaboración.
- `SUPABASE_SERVICE_ROLE_KEY` sólo server-side.
- Crons protegidos con `CRON_SECRET`.
- APIs privadas con `no-store`.
- Governance impide cerrar decisiones sin cumplir revisión/quórum configurado.
- Decision Copilot sólo lee contexto autorizado y nunca aprueba/cierra casos autónomamente.
- Copilot limitado a **20 solicitudes/hora/usuario** y **100/día/usuario**.
- Ejecuciones de Copilot, intervenciones, automatizaciones y cambios del caso quedan auditados.

## Datos INAPI

La fuente masiva operacional es el mirror local en Supabase, sincronizado desde datos abiertos oficiales. La búsqueda live se reserva para verificación selectiva/fallback.

El cron `/api/cron/inapi-open-data`:

1. refresca marcas del año actual;
2. refresca patentes del año actual;
3. detecta eventos de vigilancia;
4. avanza backfill histórico;
5. registra la corrida en `inapi_sync_runs`.

Los batches de marcas se deduplican por `source_record_id` antes del upsert para tolerar duplicados provenientes de CKAN.

## IA y costo

Clasificación y Copilot usan routing cost-aware. Los análisis registran modelo/tier, tokens y costo estimado. Las reglas deterministas —RLS, governance, riesgo, readiness, automatización— permanecen separadas del juicio del modelo.

## Variables de entorno mínimas

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
CRON_SECRET=long-random-secret
OPENAI_API_KEY=your-openai-key
```

Nunca versionar secretos reales.

## Desarrollo y validación

```bash
pnpm install
pnpm dev
pnpm exec tsc --noEmit
pnpm build:raw
```

Con entorno productivo configurado:

```bash
pnpm smoke
pnpm release:gate
```

## Release

1. Branch.
2. Migraciones reproducibles + verificación RLS.
3. Vercel Preview `READY`.
4. PR a `main`.
5. TypeScript/build + CodeQL verdes.
6. Merge.
7. Producción `READY`.
8. Validar `/api/v1/health`, crons y Runtime Errors.

## Documentación de entrega

- `docs/V1_ENTERPRISE_HANDOFF.md` — arquitectura, permisos, QA, observabilidad y runbook.
- `SECURITY.md` — política de seguridad.
- `ROADMAP.md` — backlog/roadmap posterior a v1.

GitHub, Supabase y Vercel deben permanecer alineados; `main` es la fuente de verdad del código y las migraciones versionadas.
