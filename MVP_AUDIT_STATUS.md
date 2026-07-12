# MVP Audit Status - Visual Compare Chile

Fecha de auditoria: 2026-07-11 / 2026-07-12

## Fuente de verdad

- `ROADMAP.md`
- `README.md`
- `DEPLOYMENT_CHECKLIST.md`
- `RELEASE_GATE.md`

## Resumen ejecutivo

Estado local del MVP:

- `tsc`: pasa
- `build`: pasa
- `smoke`: pasa localmente
- `smoke` pasa sobre `next start` en `http://127.0.0.1:3014`
- `api/v1`: alineada de forma razonable con el flujo principal
- `settings`, `history`, `compare`, `comparisons/[id]`: revisados y consolidados
- catalogo Niza/Viena: limpio, sin mojibake y visible en `consulta` y detalle operativo
- `consulta` ya no carga el dataset completo en el cliente
- `compare` difiere `ComparisonResultView` hasta tener un resultado

Estado externo del MVP:

- Preview Vercel actual: reachable, pero sirve contrato viejo
- Dominio canonico: roto (`404`)
- Release gate publico: no puede pasar mientras Vercel no sirva esta build

Conclusion actual:

- El MVP no puede declararse terminado todavia.
- La razon ya no es deuda local importante.
- La razon es falta de evidencia publica sobre deploy correcto, dominio correcto y callback correcta.

## Auditoria contra ROADMAP.md

### 1. Auth y rutas estables

Estado: `Localmente probado`

Evidencia:

- `/auth/login` responde `200` en smoke local
- `/auth/signup` redirige a `/auth/sign-up`
- `/compare`, `/dashboard`, `/history`, `/settings`, `/reportes`, `/admin` redirigen a login cuando no hay sesion
- `proxy.ts` reemplaza middleware legacy y mantiene proteccion de rutas

Prueba local:

- `pnpm smoke`

Falta para cierre completo:

- verificar el mismo comportamiento en el deployment publico correcto

### 2. Consulta consistente

Estado: `Localmente probado`

Evidencia:

- `/consulta` existe como ruta publica
- `/api/v1/search`
- `/api/v1/search/niza`
- `/api/v1/search/viena`
- `/api/v1/registros/[id]`
- `lib/classification-knowledge.ts` toma titulos canonicos desde `API_PORTAL_NIZA` y `API_PORTAL_VIENA`
- `consulta` y `comparisons/[id]` muestran etiquetas operativas junto a codigos Niza/Viena
- smoke local pasa sobre `search`, `niza`, `viena` y `registros`

Prueba local:

- `pnpm smoke`

Falta para cierre completo:

- misma evidencia en Vercel con el deployment actualizado

### 3. Upload consistente

Estado: `Localmente consolidado`

Evidencia:

- `app/api/images/upload/route.ts` usa validacion, deduplicacion, OCR, EXIF, ELA y `usage_logs`
- `app/api/v1/images/route.ts` fue alineada para acercarse al mismo motor
- upload soporta JPG, PNG, WebP y TIFF hasta 50 MB

Prueba local disponible:

- `pnpm build`
- revision de contrato en codigo

Falta para cierre completo:

- verificacion real con credenciales y Supabase publico
- smoke/manual test publico con usuario real

### 4. Comparacion confiable

Estado: `Localmente consolidado`

Evidencia:

- `app/api/compare/route.ts` usa scoring real, EXIF, ELA, OCR, diff y persistencia
- `app/api/v1/compare/route.ts` fue alineada al motor principal
- `components/app/comparison-result-view.tsx` expone contrato visible del resultado
- `app/(app)/comparisons/[id]/page.tsx` muestra resumen operativo, cobertura y ruta sugerida
- `components/app/comparison-result-view.tsx` expone etiquetas Niza/Viena legibles y links directos a `/consulta`

Prueba local disponible:

- `pnpm build`
- `pnpm smoke`
- revision de payload y vistas

Falta para cierre completo:

- prueba real con imagenes autenticas sobre Supabase/Vercel publicos

### 5. Historial, detalle, API keys y QA final

Estado: `Mayormente cubierto localmente`

Evidencia:

- `/history` existe y fue limpiado
- `/comparisons/[id]` existe y fue reforzado
- `/settings` fue limpiado
- `components/app/api-key-manager.tsx` y `components/app/profile-form.tsx` fueron consolidados
- `app/api/account/api-keys/*` ahora tienen validaciones y `usage_logs`

Prueba local:

- `pnpm build`
- `pnpm smoke`

Falta para cierre completo:

- prueba autenticada real con usuario Supabase
- verificar creacion/revocacion real de API keys sobre el proyecto correcto

### 6. ES/EN sin rutas rotas

Estado: `Probado localmente`

Evidencia:

- `/es` redirige a `/`
- `/en` redirige a `/`
- `/es/compare` redirige a `/compare`
- `/en/history` redirige a `/history`

Prueba local:

- `pnpm smoke`

Falta para cierre completo:

- repetir esta evidencia en el deploy publico correcto

### 7. Supabase y Vercel estables

Estado: `No probado publicamente`

Evidencia local:

- `/api/v1/health` y `/api/health` publican:
  - `revision`
  - `host`
  - `config.supabase_public_env`
  - `config.supabase_service_env`
  - `config.supabase_url_host`
  - `config.supabase_project_ref`
  - `config.site_origin`
  - `config.callback_urls`
- `release:gate` existe
- `audit:deploy` existe
- `git rev-parse HEAD` actual:
  - `648fa1fc39ace30778b05f975ae33d01a56cf5b1`
- `http://127.0.0.1:3014/api/v1/health` devuelve:
  - `revision: "local"`
  - `host: "localhost:3014"`
  - `config.supabase_project_ref: "btyylseeswnvsuaojvjx"`
  - `config.site_origin: "https://v0-visual-compare-chile.vercel.app"`
  - `config.callback_urls: ["https://v0-visual-compare-chile.vercel.app/auth/callback"]`

Bloqueo externo actual:

- preview actual devuelve contrato viejo:
  - `{"status":"ok","version":"1.0.0","timestamp":"2026-07-12T13:52:54.234Z"}`
- falta `revision`
- falta `host`
- falta `config.*`
- dominio canonico `https://v0-visual-compare-chile.vercel.app/` devuelve `404`
- `pnpm audit:deploy` contra URLs publicas actuales devuelve:
  - `PASS active root`
  - `FAIL active health`
  - `FAIL canonical root`
  - `FAIL canonical health`

Conclusion:

- este punto es el bloqueador real del cierre del objetivo

## Comandos de evidencia local ya verificados

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm smoke
```

Validado tambien con `next start` local:

```bash
SMOKE_BASE_URL=http://127.0.0.1:3014 pnpm smoke
```

## Comando de cierre publico pendiente

```bash
ACTIVE_DEPLOYMENT_URL=https://your-active-deployment.vercel.app
CANONICAL_DEPLOYMENT_URL=https://your-canonical-domain.vercel.app
EXPECTED_REVISION=<git-sha>
EXPECTED_SUPABASE_PROJECT_REF=<supabase-ref>
EXPECTED_SITE_ORIGIN=https://your-canonical-domain.vercel.app
EXPECTED_CALLBACK_URL=https://your-canonical-domain.vercel.app/auth/callback
pnpm release:gate
```

## Criterio de cierre real

El objetivo puede considerarse completo solo si:

1. `pnpm release:gate` pasa contra la URL publica real
2. el dominio canonico deja de responder `404`
3. el health publico devuelve revision y config completas
4. el deploy publico coincide con el checkout actual

## Siguiente paso operativo

1. Commit de la tanda local validada
2. Push a `origin/main`
3. Confirmar que Vercel redeploye desde ese commit
4. Reasignar o restaurar el dominio canonico
5. Repetir `pnpm release:gate` contra la URL publica real
