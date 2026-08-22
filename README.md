# Visual Compare Chile

Plataforma de inteligencia de propiedad industrial para Chile. Combina comparación visual de marcas, clasificación Niza/Viena, consulta INAPI, Patent Intelligence, Competitive Intelligence, alertas y una API protegida sobre Supabase + Vercel.

## Estado actual

Producción corre en Vercel con Supabase como base de datos y autenticación. El sistema ya incluye:

- comparación visual de imágenes y persistencia de resultados;
- clasificación Niza y Viena con OpenAI Structured Outputs;
- router multimodelo `Luna -> Terra -> Sol` según confianza/costo;
- tracking de tokens, tier utilizado, escalamiento y costo estimado por análisis;
- mirror local de datos oficiales INAPI para marcas;
- búsqueda local fuzzy/accent-insensitive con verificación live selectiva;
- sincronización diaria de Datos Abiertos INAPI desde `datos.gob.cl`;
- Patent Intelligence con solicitudes, registros e IPC;
- Competitive Intelligence por empresa, inventores, concentración IPC y actividad reciente;
- backfill autónomo de solicitudes históricas de patentes 2009-2025;
- alertas competitivas por empresa o prefijo IPC;
- health checks de revisión, configuración y frescura de datos;
- API v1, auth Supabase, API keys, cuotas y rate limiting.

## Arquitectura completa

```mermaid
flowchart TD
    U[Usuario Web / Cliente API] --> AUTH[Supabase Auth / API Key]
    AUTH --> WEB[Next.js App en Vercel]

    WEB --> IMG[Upload de imágenes]
    IMG --> CMP[Pipeline de comparación]
    CMP --> VISION[Análisis visual / features]
    CMP --> CLASS[Niza + Viena]
    CLASS --> ROUTER{Router multimodelo}
    ROUTER -->|default| LUNA[GPT-5.6 Luna]
    ROUTER -->|baja confianza| TERRA[GPT-5.6 Terra]
    ROUTER -->|caso crítico| SOL[GPT-5.6 Sol]
    LUNA --> SO[Structured Outputs + Zod]
    TERRA --> SO
    SOL --> SO
    SO --> REPORT[Informe / recomendación]
    REPORT --> DB[(Supabase Postgres)]
    VISION --> DB
    CMP --> DB

    WEB --> TM[Consulta de marcas]
    TM --> LOCALTM[search_inapi_local / pg_trgm]
    LOCALTM --> DB
    TM -->|verificación selectiva| LIVE[Buscador INAPI live]
    LIVE --> TM

    WEB --> PAT[Patent Intelligence]
    PAT --> PSEARCH[Búsqueda por título / solicitante / IPC]
    PAT --> COMP[Competitive Intelligence]
    PSEARCH --> DB
    COMP --> DB

    WEB --> ALERTS[Alertas competitivas]
    ALERTS --> WATCH[Watches por empresa / IPC]
    WATCH --> DB

    CRON[Vercel Cron diario] --> CKAN[Datos Abiertos INAPI / datos.gob.cl]
    CKAN --> SYNC_TM[Sync marcas año actual]
    CKAN --> SYNC_PAT[Sync patentes año actual]
    SYNC_TM --> DB
    SYNC_PAT --> DB
    SYNC_PAT --> DETECT[Detector de nuevas coincidencias]
    DETECT --> DB
    DETECT --> ALERTS
    SYNC_PAT --> BACKFILL[Backfill histórico 2009-2025]
    BACKFILL --> DB

    DB --> HEALTH[/api/v1/health]
    HEALTH --> OBS[Observabilidad / freshness / revisión]

    WEB --> PDF[Reportes PDF]
    WEB --> HISTORY[Historial y detalle]
    PDF --> DB
    HISTORY --> DB
```

## Flujo de análisis visual

1. El usuario inicia sesión o usa una API key válida.
2. Sube una o dos imágenes.
3. El backend valida formato, tamaño y permisos.
4. El pipeline extrae señales visuales y ejecuta clasificación Niza/Viena.
5. Luna resuelve por defecto los casos de menor costo.
6. Si la confianza cae bajo el umbral configurado, el caso escala a Terra.
7. Sol se reserva para casos realmente ambiguos o de alto riesgo.
8. Las respuestas pasan por schemas Zod/Structured Outputs; no se depende de parsing regex de JSON.
9. Se guarda resultado, modelo, tier máximo, tokens, escalamiento, costo estimado y señales.
10. El usuario recibe score, clasificación, recomendación, evidencia e historial.

## Flujo de datos INAPI

### Marcas

La fuente primaria operacional es el mirror local en Supabase. El buscador live se usa sólo para verificación selectiva o fallback.

```text
Datos Abiertos INAPI -> Supabase -> búsqueda local fuzzy -> candidatos -> verificación live opcional
```

La búsqueda local usa `pg_trgm`, normalización de tildes y ranking por:

- similitud de nombre;
- nombre exacto normalizado;
- overlap de clases Niza;
- estado del expediente;
- frescura del dato.

### Patentes

Patent Intelligence sincroniza solicitudes y registros oficiales y normaliza:

- número de solicitud/registro;
- título;
- solicitantes;
- inventores;
- IPC;
- país/región;
- estado;
- fechas de presentación, publicación, registro y expiración;
- PCT y prioridades cuando existen.

Competitive Intelligence agrega cartera observada, actividad reciente, IPC dominantes, inventores recurrentes y últimos movimientos.

El crecimiento interanual sólo se habilita cuando la cobertura histórica oficial 2009-2025 está completa. Antes de eso el sistema devuelve `yearOverYearPct = null` para evitar conclusiones sobre un corpus incompleto.

## Sincronización diaria

Vercel ejecuta `/api/cron/inapi-open-data` una vez al día con `CRON_SECRET`.

Orden operativo:

1. refrescar marcas del año actual;
2. refrescar patentes del año actual;
3. detectar eventos para watches competitivos;
4. ejecutar un batch acotado del histórico 2009-2025;
5. registrar cada corrida en `inapi_sync_runs`.

El orden evita que una patente histórica importada durante el backfill se presente falsamente como una solicitud nueva.

## Alertas competitivas

En `/patentes/alertas` cada usuario puede vigilar:

- nombre de empresa/solicitante;
- prefijo IPC.

Los eventos son idempotentes por `watch + expediente`, están protegidos por RLS y sólo consideran registros incorporados después de crear la vigilancia y con fecha de presentación compatible con esa vigilancia.

## Seguridad

Principios actuales:

- Supabase Auth para sesiones;
- RLS en datos de usuario, watches y alertas;
- `SUPABASE_SERVICE_ROLE_KEY` sólo en runtime server-side;
- cron protegido con `Authorization: Bearer CRON_SECRET`;
- APIs privadas con `no-store`;
- Structured Outputs + Zod para contratos de IA;
- endpoints administrativos separados de rutas públicas;
- health sin exponer secretos;
- datos históricos y sincronizaciones idempotentes;
- ninguna credencial debe commitearse al repositorio.

Controles versionados bajo `.github/`:

- CI de lint + TypeScript;
- CodeQL;
- Dependabot;
- CODEOWNERS;
- política `SECURITY.md`.

GitHub Settings debe además mantener `main` protegido con PR obligatorio, checks requeridos y bloqueo de force-push/delete.

## Rutas principales

- `/dashboard` — inicio operativo
- `/compare` — comparación visual
- `/history` — historial de comparaciones
- `/consulta-inapi` — búsqueda de marcas INAPI
- `/patentes` — Patent + Competitive Intelligence
- `/patentes/alertas` — vigilancia competitiva
- `/settings` — cuenta/configuración
- `/dashboard/playground` — API Playground
- `/api/v1/health` — health y frescura

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
CRON_SECRET=long-random-secret
OPENAI_API_KEY=your-openai-key
```

Opcionales para routing IA:

```bash
OPENAI_CLASSIFIER_MODEL=gpt-5.6-luna
OPENAI_NIZA_MODEL=gpt-5.6-luna
OPENAI_VIENA_MODEL=gpt-5.6-luna
```

Nunca usar valores reales de producción en archivos versionados.

## Desarrollo local

Requisitos:

- Node.js 18+
- pnpm

```bash
pnpm install
pnpm dev
```

Validación:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
pnpm smoke
```

Gate operativo:

```bash
pnpm gate:phase1
```

Release gate:

```bash
pnpm release:gate
```

## Operación INAPI

Sync oficial de marcas:

```bash
pnpm sync:inapi:open-data
```

Herramientas existentes:

```bash
pnpm evidence:inapi
pnpm plan:inapi --maxJobs 25
pnpm monitor:inapi
pnpm canary:inapi
```

## Deploy

1. Trabajar en branch.
2. Abrir PR a `main`.
3. Esperar CI + preview Vercel.
4. Revisar migraciones/impacto de datos cuando corresponda.
5. Mergear sólo con checks verdes.
6. Esperar deploy de producción.
7. Validar `/api/v1/health` y flujos críticos.

## Health contract

`/api/v1/health` permite verificar, sin exponer secretos:

- revisión Git servida;
- host y origen esperado;
- configuración de Supabase;
- callbacks de auth;
- frescura del mirror INAPI de marcas;
- frescura del mirror INAPI de patentes.

Un corpus INAPI fuera del threshold de frescura debe degradar el health para que una falla de sincronización no pase inadvertida.

## Fuente de datos

Los mirrors de marcas y patentes usan como fuente masiva los Datos Abiertos oficiales publicados por INAPI en `datos.gob.cl`. El buscador web INAPI no es tratado como API estable ni como fuente primaria para cargas masivas.

## Política de cambios

- no hacer cambios directos a `main`;
- cambios de schema mediante migraciones reproducibles;
- no marcar un sync como exitoso si quedó parcial;
- no publicar métricas de precisión/costo sin evidencia observable;
- mantener fallbacks reversibles para IA e INAPI;
- todo cambio de runtime debe pasar preview Vercel antes de merge.

## Documentación relacionada

- `ROADMAP.md`
- `docs/AI_RND_EVAL_PLAN.md`
- `SECURITY.md`
