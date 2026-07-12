# Agente Marca Intelligence — Plan Fase 2

**Estado actual (validado con agent-browser, 2026-07-12):**

## Lo que funciona hoy

| Componente | Estado | Notas |
|---|---|---|
| Landing page `/` | ✅ OK | Full content, no errors |
| Login `/auth/login` | ✅ OK | Clean render |
| Consulta `/consulta` | ✅ OK | SQL.js + Niza/Viena data |
| API `/api/v1/health` | ✅ OK | status: ok |
| Agent endpoint GET `/api/v1/agent/analyze` | ✅ OK | openai_configured: true |
| Agent endpoint POST `/api/v1/agent/analyze` | ✅ BUILT | Funcional — requiere OPENAI_API_KEY |
| `/agente` page UI | ✅ BUILT | Redirige a login (auth guard activo) |
| `/dashboard`, `/compare`, `/history` | ✅ OK | Redirect limpio a login |
| `lib/supabase/env.ts` | ✅ FIXED | resolveEnv() con fallback chain _2.._6 |
| `app/(app)/layout.tsx` | ✅ FIXED | Graceful degradation sin crash |
| Niza catalog | ✅ 45 clases NCL 13a ed. | |
| Viena catalog | ✅ 70+ códigos VCL 10a ed. | |

---

## Gaps / Pendientes Fase 2

### BLOQUEADOR: Supabase env vars
**Problema:** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` no están en
`.env.development.local`. El proyecto tiene múltiples instancias Supabase con sufijos (_2.._6).

**Solución:** Reconectar la integración Supabase correcta en Settings → Vars del proyecto en v0.
Una vez conectada, el `resolveEnv()` implementado las tomará automáticamente.

**Impacto:** Sin esto, `/agente`, `/dashboard`, `/compare` redirigen siempre a login.

---

### GAP 1: Repositorio de marcas real (350K INAPI)
**Descripción:** El `ConflictEngine` usa `API_PORTAL_MARCAS` (5 registros demo).
Para conflictos reales necesita los ~350K registros de INAPI Chile.

**Plan:**
1. Descargar CSV desde https://datos.gob.cl/dataset/marcas-registradas
2. Script de importación: `scripts/import-inapi-csv.ts` → tabla `marcas_inapi` en Supabase
3. Modificar `ConflictEngine` para query a Supabase en lugar de array en memoria:
   ```typescript
   // lib/agent/conflict-engine.ts
   const { data } = await supabase
     .from('marcas_inapi')
     .select('id, nombre, niza, viena, estado, pais')
     .filter('viena', 'ov', vienaCodes)  // overlap de arrays PostGIS
   ```
4. Agregar índices GIN en columnas `niza[]` y `viena[]` para queries < 200ms

**Schema Supabase:**
```sql
create table marcas_inapi (
  id uuid primary key default gen_random_uuid(),
  numero_registro text,
  nombre text not null,
  solicitante text,
  estado text check (estado in ('Registrada','Pendiente','Denegada')),
  fecha_solicitud date,
  pais text default 'CL',
  niza text[] default '{}',
  viena text[] default '{}',
  descripcion text,
  created_at timestamptz default now()
);
create index idx_marcas_niza on marcas_inapi using gin(niza);
create index idx_marcas_viena on marcas_inapi using gin(viena);
create index idx_marcas_nombre on marcas_inapi using gin(to_tsvector('spanish', nombre));
```

---

### GAP 2: Integración con motor de comparación visual existente
**Descripción:** El agente acepta `visualScore` como parámetro opcional, pero no está conectado
al motor SHA/pHash/embeddings de `/api/v1/compare` que ya existe.

**Plan:**
- En la UI de `/agente`, después de subir imagen, hacer POST a `/api/v1/vision/analyze` para
  obtener embeddings y hash, luego pasar el `similarity_score` al agente como `visualScore`.
- Esto completa el pipeline: motor visual 50% + Viena 30% + Niza 20%.

**Archivo a modificar:** `app/(app)/agente/page.tsx`
```typescript
// Paso 1: analizar visualmente la imagen
const visualRes = await fetch('/api/v1/vision/analyze', { method: 'POST', body: formData })
const { similarity_score } = await visualRes.json()

// Paso 2: pasar al agente
const agentRes = await fetch('/api/v1/agent/analyze', {
  body: JSON.stringify({ image, nombre, visualScore: similarity_score })
})
```

---

### GAP 3: Guardar informes en Supabase
**Descripción:** Los informes del agente se generan pero no se persisten.

**Plan:**
```sql
create table agent_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  marca text not null,
  nivel_riesgo text,
  viena_codes jsonb,
  niza_clases jsonb,
  conflictos jsonb,
  informe jsonb,
  tokens_totales int,
  costo_usd numeric(8,4),
  pipeline_ms int,
  created_at timestamptz default now()
);
```
- POST `/api/v1/agent/analyze` guarda automáticamente si hay sesión activa.
- Nueva página `/history` muestra informes anteriores.

---

### GAP 4: Rate limiting en endpoint del agente
**Descripción:** Cada llamada cuesta ~$0.04 USD. Sin rate limiting, un abuso podría costar caro.

**Plan:**
- Usar Upstash Redis para rate limiting por IP: máximo 5 análisis/hora para usuarios no auth,
  50/hora para usuarios autenticados.
- Middleware en `/api/v1/agent/analyze/route.ts`.

---

### GAP 5: Feedback de progreso en tiempo real (streaming)
**Descripción:** El análisis tarda 15-30s. La UI solo muestra "Analizando...".

**Plan:**
- Convertir el endpoint a streaming con `TransformStream`.
- Emitir eventos SSE: `{ step: 'viena', status: 'done' }`, `{ step: 'niza', status: 'done' }`, etc.
- UI actualiza progress bar en tiempo real.

---

## Prioridad recomendada

1. **SUPABASE ENV VARS** (bloqueador — 5 min en Settings)
2. **GAP 2: Visual score integration** (1-2 horas — conecta el motor existente)
3. **GAP 1: INAPI 350K** (1 día — requiere descarga + migración)
4. **GAP 3: Persistencia informes** (2-3 horas)
5. **GAP 4: Rate limiting** (1-2 horas)
6. **GAP 5: Streaming progress** (2-3 horas)

**Costo total estimado Fase 2: ~2 días de desarrollo**
