# Arquitectura y operación — Visual Compare Chile

## 1. Arquitectura general

La plataforma utiliza Next.js sobre Vercel, Supabase para autenticación y persistencia, OpenAI para capacidades de IA y fuentes oficiales INAPI/datos.gob.cl para propiedad industrial.

```mermaid
flowchart TD
  U[Usuario web / Cliente API] --> AUTH[Supabase Auth / API key]
  AUTH --> APP[Next.js en Vercel]

  APP --> AG[Agente de marcas]
  APP --> CMP[Comparación visual]
  APP --> TM[Búsqueda de marcas]
  APP --> PAT[Patent Intelligence]
  APP --> ALT[Alertas competitivas]

  AG --> ROUTER{Router IA}
  ROUTER --> L[Luna - volumen]
  ROUTER --> T[Terra - escalamiento]
  ROUTER --> S[Sol - casos críticos]
  L --> OUT[Structured Outputs + Zod]
  T --> OUT
  S --> OUT
  OUT --> DB[(Supabase Postgres)]

  CMP --> DB
  TM --> LOCAL[Búsqueda local pg_trgm]
  LOCAL --> DB
  TM -->|verificación selectiva| LIVE[INAPI live]

  PAT --> DB
  ALT --> DB

  CRON[Vercel Cron diario] --> CKAN[Datos Abiertos INAPI / datos.gob.cl]
  CKAN --> SYNC1[Sync marcas actuales]
  CKAN --> SYNC2[Sync patentes actuales]
  SYNC1 --> DB
  SYNC2 --> DB
  SYNC2 --> DET[Detección de alertas]
  DET --> DB
  SYNC2 --> BACK[Backfill histórico de patentes]
  BACK --> DB

  DB --> HEALTH[/api/v1/health]
  HEALTH --> OPS[Observabilidad y frescura]
```

## 2. Capa de aplicación

Vercel aloja el frontend y las rutas API. La aplicación separa áreas públicas, sesiones web, APIs autenticadas, endpoints administrativos y cron interno.

El runtime productivo debe mantener configuradas las variables de Supabase, OpenAI, URL pública y `CRON_SECRET`.

## 3. Capa de datos

Supabase cumple cuatro funciones centrales:

- autenticación;
- persistencia de usuarios, comparaciones y resultados;
- mirror local de marcas y patentes;
- RLS y control de acceso por usuario.

Los datos oficiales importados se normalizan y se mantienen mediante upserts idempotentes. La repetición de un sync no debe crear duplicados funcionales.

## 4. INAPI Data Layer

### Marcas

El canal masivo utiliza Datos Abiertos oficiales. La búsqueda operacional es local-first y usa índices de similitud para responder rápidamente. La consulta live queda como verificación selectiva y fallback.

La búsqueda local normaliza tildes y variantes tipográficas para evitar degradar resultados como `DEFIENDETE` vs `DefiéndeTE`.

### Patentes

El sistema importa solicitudes y registros, mantiene relaciones IPC y construye perfiles competitivos sobre el corpus local.

El histórico de solicitudes de patentes 2009–2025 se completa incrementalmente mediante el cron. El proceso es reiniciable: cada año sólo se considera completo cuando la ejecución correspondiente termina con estado exitoso.

## 5. Sincronización diaria

Vercel Cron llama al endpoint interno protegido por `CRON_SECRET`.

Orden de ejecución:

1. sincronizar marcas del año actual;
2. sincronizar patentes del año actual;
3. detectar nuevas coincidencias para alertas;
4. ejecutar un lote acotado de backfill histórico;
5. registrar resultados en `inapi_sync_runs`.

Este orden es importante porque evita que una patente histórica recién importada genere una alerta como si fuera una solicitud nueva.

## 6. Frescura de datos

`/api/v1/health` informa el estado de frescura de marcas y patentes. El threshold operativo actual es de 36 horas. Si la última sincronización exitosa excede ese límite, el sistema puede reportarse degradado para hacer visible el problema.

La fuente local no debe marcarse artificialmente como fresca cuando el origen oficial no pudo actualizarse.

## 7. IA multimodelo

El diseño prioriza costo y confiabilidad:

```text
Luna -> Terra -> Sol
```

- **Luna:** tier por defecto para volumen y costo bajo.
- **Terra:** escalamiento cuando la confianza no es suficiente.
- **Sol:** reservado para casos ambiguos o críticos.

La salida utiliza Structured Outputs y Zod para validar contratos. Se registran modelo, tier máximo, escalamiento, tokens y costo estimado cuando el flujo lo permite.

Los umbrales y modelos pueden configurarse por variables de entorno para probar alternativas sin editar código.

## 8. Comparación visual

El pipeline de imágenes persiste resultado y señales técnicas. La arquitectura permite combinar hashing exacto, similitud perceptual y análisis multimodal.

Los archivos deben validarse antes de procesarse y almacenarse con controles de acceso. Los resultados de comparación se consideran apoyo analítico, no decisión jurídica final.

## 9. Competitive Intelligence

Los perfiles por empresa se construyen sobre patentes observadas y relaciones IPC. Las métricas actuales incluyen cartera observada, estados, actividad reciente, tecnologías dominantes e inventores recurrentes.

Las métricas interanuales sólo se habilitan cuando la cobertura histórica es suficiente. Esta regla evita publicar tendencias basadas en datos incompletos.

## 10. Alertas

Cada watch pertenece a un usuario y puede vigilar empresa o IPC. Los eventos son idempotentes: una combinación watch + expediente no debe generar duplicados repetidos.

El criterio temporal excluye registros históricos anteriores a la creación de la vigilancia.

## 11. API

La API v1 ofrece capacidades de integración protegidas mediante API keys y/o sesión según endpoint. El sistema contempla cuotas, rate limiting y trazabilidad de uso.

Para integraciones externas se recomienda:

- guardar las API keys en un secret manager;
- no exponerlas en frontend;
- respetar `429` y backoff;
- registrar request IDs y tiempos;
- probar primero en el API Playground o ambiente de preview.

## 12. Despliegue

Flujo recomendado:

1. trabajar en branch;
2. abrir PR a `main`;
3. esperar CI y CodeQL;
4. esperar preview Vercel;
5. revisar migraciones si existen;
6. mergear con checks verdes;
7. esperar deployment productivo;
8. verificar `/api/v1/health`;
9. revisar errores runtime y flujos críticos.

## 13. Controles de calidad

El repositorio cuenta con:

- TypeScript gate;
- build productivo de Next.js en CI;
- CodeQL para JavaScript/TypeScript;
- Dependabot;
- CODEOWNERS;
- `SECURITY.md`;
- previews automáticos en Vercel.

## 14. Continuidad operativa

Si INAPI live está caído, la plataforma puede seguir respondiendo desde el mirror local y declarar la frescura disponible. Si OpenAI falla, el análisis dependiente de IA puede degradarse o fallar de forma explícita, pero los datos persistidos y módulos no dependientes de IA permanecen disponibles.

Supabase y Vercel son componentes críticos: cualquier plan de continuidad empresarial debe contemplar propiedad de cuentas, backups, exportación de datos, acceso administrativo y rotación de secretos.