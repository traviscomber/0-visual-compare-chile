# Roadmap - Visual Compare Chile

## Fuente de verdad

Este documento reemplaza el roadmap anterior de "8 semanas" como referencia operativa principal del producto.

## Vision de producto

Construir una plataforma de inteligencia marcaria para Chile y luego LATAM, con:

- comparacion visual y contextual de marcas
- busqueda por nombre, Niza y Viena
- autenticacion y organizaciones multi-tenant
- API publica con control de acceso, quotas y auditoria
- motor IA para analisis, registrabilidad y vigilancia

## Estado por fases

### Fase 0 - Completada (Julio 2026)

Entregado:

- Landing page y branding base
- Dashboard con KPIs reales desde Supabase
- Agente IA con GPT-4o Vision para analisis de marcas
- PDF report descargable con imagenes embebidas
- Schema de base de datos de produccion con tablas, RLS y seed Niza + Viena
- Auth Supabase con roles, login, signup y rutas protegidas
- API v1 publica documentada
- Motor de comparacion visual con score ponderado y deteccion de conflictos
- Historial y comparaciones con CRUD, filtros y exportacion
- KMZ Vitacura con GeoJSON publico y descargable

### Fase 1 - En curso (Q3 2026)

Objetivo:

Cerrar la capa de datos reales, seguridad operativa y monetizacion basica del producto.

Lineas de trabajo:

- Integracion INAPI por scraping con sync periodico
- API key management self-service
- Organizaciones y roles multi-tenant: `admin`, `editor`, `member`
- Audit log completo por usuario y accion
- Rate limiting por API key con Upstash Redis
- Exportacion masiva en CSV y Excel

### Fase 2 - Planificada (Q4 2026)

- Motor IA de registrabilidad antes de registrar
- Vigilancia de marca con alertas
- Comparacion en lote desde CSV
- Webhooks y eventos HTTP
- Dashboard analitico avanzado
- SDK cliente para Node y Python

### Fase 3 - Planificada (2027)

- Cobertura LATAM: Argentina, Colombia y Mexico
- Motor multimodal mejorado: fonetico + visual
- White-label para estudios legales
- Marketplace de agentes juridicos especializados

## Criterio de salida de Fase 1

Fase 1 no se considera cerrada hasta cumplir simultaneamente:

1. El sync INAPI carga al menos 10.000 marcas reales
2. El portal de API keys emite, revoca y mide uso en tiempo real
3. El rate limiting bloquea requests sobre el limite configurado

## Estado tecnico actual frente a Fase 1

Base ya disponible desde Fase 0:

- comparacion visual operativa
- consulta por rutas `api/v1`
- auth Supabase y rutas protegidas
- historial y detalle persistidos
- dashboard conectado a datos reales

Bloqueadores fuera de codigo que siguen abiertos:

- el dominio canonico actual de Vercel sigue roto
- la callback publica canonica de Supabase/Vercel sigue desalineada

Eso no cambia la prioridad de producto, pero si bloquea declarar el despliegue publico como completamente cerrado.

## Orden operativo recomendado

### Track 1 - Datos reales INAPI

- definir contrato del scraper y persistencia incremental
- cargar primer lote validado
- dejar job repetible con metricas de sync
- llegar a un primer umbral operativo de 10K marcas

### Track 2 - API keys + quotas

- cerrar UX de emision, rotacion y revocacion
- persistir consumo por clave y por organizacion
- exponer metrica de uso en tiempo real
- enlazar quotas de plan a rate limiting

### Track 3 - Multi-tenant y auditabilidad

- modelar organizaciones, membresias y permisos
- aislar recursos por tenant
- registrar acciones criticas en audit log
- cubrir altas, bajas, cambios de rol y uso de claves

### Track 4 - Exportacion masiva

- definir formato de salida de busquedas y comparaciones
- soportar CSV primero y Excel despues
- proteger exportaciones por permisos y quotas

## Siguiente corte de entregables

El siguiente hito real debe dejar evidencia concreta de:

- primer sync INAPI con volumen medible
- portal de API keys utilizable por usuario final
- limites por API key realmente aplicados

## Documentos complementarios

- `README.md`: estado practico del repo y ejecucion local
- `MVP_AUDIT_STATUS.md`: estado auditado del deploy y de la base tecnica
- `VERCEL_SUPABASE_CANONICAL_FIX.md`: correccion pendiente de dominio y callback
