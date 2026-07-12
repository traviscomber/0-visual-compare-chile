# MVP Audit Status - Visual Compare Chile

Fecha de auditoria: 2026-07-12

## Fuente de verdad

- `ROADMAP.md`
- `README.md`
- `RELEASE_GATE.md`
- `VERCEL_SUPABASE_CANONICAL_FIX.md`

## Resumen ejecutivo

Estado del producto:

- Fase 0: completada
- Fase 1: en curso
- Fase 2 y Fase 3: aun no iniciadas como entregables productivos

Estado tecnico local:

- `tsc`: pasa
- `build`: pasa
- `smoke`: pasa localmente
- `api/v1`: alineada con el flujo principal
- `compare`, `history`, `comparisons/[id]`, `consulta`, `settings`: consolidados para el MVP base

Estado tecnico publico:

- el preview activo ya sirvio el commit correcto
- el dominio canonico sigue roto
- la callback publica canonica sigue desalineada

Conclusion:

- la base entregada de Fase 0 esta tecnicamente consolidada
- el cierre publico del deploy sigue bloqueado por configuracion externa
- el trabajo prioritario de producto ya debe medirse contra Fase 1

## Cobertura cerrada de Fase 0

Entregado y con base tecnica visible en el repo:

- landing y branding
- dashboard con KPIs reales desde Supabase
- auth Supabase con roles y rutas protegidas
- API v1 publica
- motor de comparacion visual
- historial y CRUD de comparaciones
- PDF report descargable
- catalogos Niza y Viena sembrados y visibles

Evidencia local consolidada:

- `pnpm exec tsc --noEmit`
- `pnpm build`
- `pnpm smoke`

## Estado auditado frente a Fase 1

### 1. Integracion INAPI

Estado: `Pendiente`

Existe contexto funcional para consulta y persistencia, pero no hay evidencia cerrada en esta auditoria de:

- scraper estable
- sync periodico
- carga validada de 10K marcas reales

### 2. API key management self-service

Estado: `Parcial`

Existe base en UI y endpoints de cuenta, pero Fase 1 exige evidencia adicional de:

- emision real
- revocacion real
- medicion de uso en tiempo real
- quotas ligadas a plan o tenant

### 3. Organizaciones y roles multi-tenant

Estado: `Pendiente`

El auth base y roles iniciales existen, pero aun no se puede marcar cerrada la capa multi-tenant de Fase 1 sin:

- organizaciones
- membresias
- aislamiento de recursos por tenant
- permisos `admin`, `editor`, `member`

### 4. Audit log completo

Estado: `Parcial`

Hay trazas y `usage_logs` en partes del flujo, pero falta trazabilidad integral de acciones criticas:

- autenticacion
- emision o revocacion de claves
- cambios de rol
- comparaciones y exportaciones sensibles

### 5. Rate limiting por API key

Estado: `Pendiente`

No hay evidencia cerrada en esta auditoria de bloqueo efectivo con Upstash Redis sobre limites configurados por plan o clave.

### 6. Exportacion masiva CSV + Excel

Estado: `Pendiente`

La capacidad de exportacion existe en el alcance historico del MVP, pero Fase 1 pide una salida masiva y operativa para busquedas y comparaciones que aun no queda auditada como entregable terminado.

## Criterio de salida de Fase 1

Fase 1 solo puede cerrarse cuando exista evidencia publica o verificable de:

1. sync INAPI con al menos 10K marcas reales
2. portal de API keys que emite, revoca y mide uso en tiempo real
3. rate limiting que bloquea requests sobre el limite configurado

## Bloqueo externo actual de deploy

Situacion confirmada:

- el preview activo ya sirvio el commit correcto
- el dominio canonico `https://v0-visual-compare-chile.vercel.app/` sigue roto
- `site_origin` publico sigue apuntando al preview
- la callback canonica publica no esta cerrada

Impacto:

- no bloquea seguir desarrollando Fase 1 localmente
- si bloquea declarar estable el despliegue publico de referencia

## Siguiente foco recomendado

### Track producto

1. Integracion INAPI con primer lote real medible
2. Portal de API keys con uso en tiempo real
3. Rate limiting efectivo por clave

### Track plataforma

1. Restaurar dominio canonico en Vercel
2. Alinear `NEXT_PUBLIC_SITE_URL`
3. Alinear callback canonica en Supabase Auth
4. Repetir `pnpm release:gate`
