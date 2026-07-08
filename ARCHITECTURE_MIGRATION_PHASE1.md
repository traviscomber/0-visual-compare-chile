# PLAN DE MIGRACIÓN - LOGOCOMPARE ACTUAL → API CLOUD NATIVE
## Alineación Fase 1 (3 Meses) con Arquitectura Existente

**Fecha:** 11 de Mayo 2026  
**Proyecto:** Visual Compare API Chile - LogoCompare Migration  
**Status:** Propuesta con Realineación Técnica

---

## 1. ANÁLISIS ACTUAL: ARQUITECTURA EXISTENTE

### Stack Actual (DEV)
- **Frontend:** HTML/JavaScript (login.html, index.html, auditoria_log.html)
- **Backend:** PHP (listar_imagenes.php)
- **Servidor:** XAMPP (desarrollo local)
- **ML:** TensorFlow.js + MobileNetV2 (extracción de características)
- **Almacenamiento:** embeddings.json + sistema de archivos local
- **Base de datos:** NO EXISTE - todo en archivos estáticos

### Ciclo Actual: DEV → QA → Producción
```
DEV (XAMPP local)
  ↓
QA (validación, multiusuario)
  ↓
Producción (PHP server o GitHub Pages + backend mínimo)
```

### Limitaciones Identificadas
1. **No tiene base de datos real** - solo archivos JSON/PHP
2. **No tiene multi-tenant** - sin gestión de usuarios/roles
3. **No tiene API REST** - acceso directo a archivos
4. **No escalable** - arquitectura local/monolítica
5. **No tiene auditoría robusta** - logs en archivos
6. **No soporta 350K imágenes** - limitado a servidor local

---

## 2. TRANSFORMACIÓN REQUERIDA: CLOUD-NATIVE ARCHITECTURE

### Nueva Stack (Propuesta Fase 1)

```
┌─────────────────────────────────────────────────────────┐
│                   LOGOCOMPARE CLOUD V1                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Next.js 16 + React 19)                       │
│  ├─ Login (seguro con JWT/cookies)                      │
│  ├─ Comparador visual (upload + cálculo)                │
│  ├─ Auditoria (dashboard con logs)                      │
│  └─ Búsqueda de logos                                   │
│                                                          │
│  API REST (Node.js/TypeScript)                          │
│  ├─ POST /v1/auth/login                                 │
│  ├─ POST /v1/images/upload                              │
│  ├─ POST /v1/compare                                    │
│  ├─ GET /v1/comparisons/:id                             │
│  ├─ GET /v1/audit-logs                                  │
│  ├─ GET /v1/search                                      │
│  └─ POST /v1/bulk-import (350K imágenes)                │
│                                                          │
│  Storage & Processing                                   │
│  ├─ Vercel Blob (imágenes: 350K logos)                  │
│  ├─ Supabase PostgreSQL (metadata, embeddings)          │
│  ├─ TensorFlow.js (MobileNetV2 + cosine similarity)     │
│  ├─ Node.js worker (batch processing)                   │
│  └─ Redis (cache de embeddings)                         │
│                                                          │
│  Infrastructure                                         │
│  ├─ Vercel Functions (serverless API)                   │
│  ├─ Supabase DB (multi-tenant, RLS)                     │
│  ├─ Supabase Auth (usuarios + RBAC)                     │
│  └─ Monitoring (Sentry + logs)                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 3. FASE 1 REDEFINIDA (Semanas 1-4)

### Semana 1: Fundación + Setup
**Objetivo:** Infraestructura lista + Auth segura + Pipeline de imágenes

**Entregables:**
- [ ] Repositorio GitHub + CI/CD configurado
- [ ] Supabase project (PostgreSQL + Auth + RLS)
- [ ] Vercel deployment automático
- [ ] Login endpoint (JWT + cookies HTTP-only)
- [ ] Schema inicial (users, images, audit_logs, comparisons)
- [ ] Autenticación segura (2FA optional)

**API Endpoints:**
```
POST /v1/auth/login
POST /v1/auth/logout
GET /v1/auth/me
POST /v1/auth/refresh-token
```

**BD Schema (Tabla Core):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  role ENUM (admin, auditor, comparador),
  created_at TIMESTAMP,
  last_login TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR,
  resource VARCHAR,
  timestamp TIMESTAMP,
  ip_address VARCHAR
);
```

---

### Semana 2: Carga de Imágenes + Storage
**Objetivo:** Upload seguro de 350K logos + indexación

**Entregables:**
- [ ] Upload endpoint (multipart, validación)
- [ ] Vercel Blob integration (almacenamiento de 350K imágenes)
- [ ] Thumbnail generation (64x64, 128x128)
- [ ] Metadata indexing (nombre, categoría, fecha)
- [ ] Bulk import script (CSV → 350K logos)
- [ ] Validación de imágenes (MIME types, tamaño max)

**API Endpoints:**
```
POST /v1/images/upload
GET /v1/images
DELETE /v1/images/:id
POST /v1/images/bulk-import
```

**BD Schema:**
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY,
  filename VARCHAR,
  blob_url VARCHAR (Vercel Blob),
  thumbnail_url VARCHAR,
  filesize INT,
  uploaded_by UUID (users.id),
  created_at TIMESTAMP,
  metadata JSON
);

CREATE TABLE image_metadata (
  id UUID PRIMARY KEY,
  image_id UUID,
  description TEXT,
  category VARCHAR,
  tags ARRAY,
  niza_class VARCHAR,
  viena_class VARCHAR
);
```

---

### Semana 3: Motor de Comparación
**Objetivo:** Algoritmo MobileNetV2 + embeddings + similitud

**Entregables:**
- [ ] TensorFlow.js MobileNetV2 model (pre-trained)
- [ ] Embeddings extraction pipeline (Node.js worker)
- [ ] Cosine similarity calculation
- [ ] Batch processing (100 imgs/min)
- [ ] Redis cache (embeddings)
- [ ] Comparison results storage

**API Endpoints:**
```
POST /v1/compare
GET /v1/comparisons/:id
GET /v1/comparisons?user_id=xxx
```

**BD Schema:**
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  image_id UUID,
  vector FLOAT8[] (1280 dims from MobileNetV2),
  created_at TIMESTAMP,
  INDEX embedding_idx USING ivfflat
);

CREATE TABLE comparisons (
  id UUID PRIMARY KEY,
  image1_id UUID,
  image2_id UUID,
  similarity_score FLOAT (0-1),
  classification VARCHAR (exact_match, near_duplicate, similar, partial, different),
  processed_at TIMESTAMP,
  user_id UUID
);
```

**Algoritmo MobileNetV2:**
```typescript
// Pseudocódigo
async function compareLogos(img1, img2) {
  // 1. Cargar modelo pre-entrenado
  const model = await mobilenet.load();
  
  // 2. Extraer embeddings
  const embeddings1 = model.infer(img1); // 1280-dim vector
  const embeddings2 = model.infer(img2);
  
  // 3. Calcular similitud de coseno
  const similarity = cosineSimilarity(embeddings1, embeddings2);
  // similarity: 0 (ortogonal) to 1 (idéntico)
  
  // 4. Clasificar
  let classification;
  if (similarity > 0.95) classification = 'exact_match';
  else if (similarity > 0.85) classification = 'near_duplicate';
  else if (similarity > 0.70) classification = 'visually_similar';
  else if (similarity > 0.50) classification = 'partial_similar';
  else classification = 'different';
  
  return { similarity, classification };
}
```

---

### Semana 4: Auditoría + QA
**Objetivo:** Auditoría completa + Testing + Launch Readiness

**Entregables:**
- [ ] Audit logs endpoint (GET /v1/audit-logs)
- [ ] Dashboard de auditoría (admin)
- [ ] Unit tests (80% coverage)
- [ ] Integration tests (API)
- [ ] Load testing (1000 comparaciones/min)
- [ ] Security audit (OWASP)
- [ ] Performance optimization
- [ ] Documentation (OpenAPI)

**API Endpoints:**
```
GET /v1/audit-logs?user_id=xxx&date_from=xxx&date_to=xxx
GET /v1/audit-logs/download (CSV)
GET /v1/health
GET /v1/metrics
```

---

## 4. MAPEO: ACTUAL → NUEVO

| Componente Actual | → | Nuevo (Cloud) |
|-------------------|---|---------------|
| login.html | → | Next.js Auth Page + Supabase Auth |
| index.html | → | Next.js Comparador Page + API |
| auditoria_log.html | → | Next.js Admin Dashboard |
| embeddings.json | → | Supabase PostgreSQL + Redis |
| listar_imagenes.php | → | GET /v1/images (Node.js API) |
| XAMPP local | → | Vercel Serverless + Supabase Cloud |
| TensorFlow.js (browser) | → | TensorFlow.js (Node.js worker) |
| Archivos estáticos | → | Vercel Blob (350K imágenes) |
| Auditoría en logs | → | PostgreSQL audit_logs table |

---

## 5. FASE 1 ENTREGABLES FINALES

### Código Base
```
logocompare-api/
├── app/
│   ├── page.tsx (login)
│   ├── dashboard/
│   │   ├── page.tsx (comparador)
│   │   └── audit/page.tsx (auditoría)
│   └── api/
│       ├── auth/[route].ts
│       ├── images/[route].ts
│       ├── compare/[route].ts
│       ├── comparisons/[route].ts
│       ├── audit-logs/[route].ts
│       └── health/route.ts
├── lib/
│   ├── db.ts (Supabase client)
│   ├── mobilenet.ts (TensorFlow.js wrapper)
│   ├── embeddings.ts (extraction pipeline)
│   └── auth.ts (JWT + middleware)
├── workers/
│   └── embeddings-batch-worker.ts (Node.js)
├── tests/
│   └── [unit, integration, e2e]
└── schema/
    └── database.sql (13 tablas)
```

### Base de Datos (13 Tablas)
```sql
1. users
2. user_roles
3. organizations (multi-tenant)
4. images
5. image_metadata
6. embeddings
7. comparisons
8. audit_logs
9. api_keys
10. rate_limits
11. sessions
12. notifications
13. bulk_import_jobs
```

### 7 Endpoints Core
```
POST   /v1/auth/login
POST   /v1/auth/logout
POST   /v1/images/upload
POST   /v1/images/bulk-import
POST   /v1/compare
GET    /v1/comparisons/:id
GET    /v1/audit-logs
```

### Documentación
- OpenAPI 3.0 spec (Swagger)
- Guía de setup local
- Guía de deployment (Vercel)
- API reference completa

---

## 6. COMPARACIÓN: PROPUESTA ACTUAL vs REALIGNADA

### Presupuesto
| Item | Anterior | Realineado | Cambio |
|------|----------|-----------|--------|
| Hito 1 | 3 semanas | 4 semanas | +1 semana |
| Presupuesto H1 | $2,000,000 | $2,000,000 | $0 (absorber con contingencia) |
| Timeline Total | 12 semanas | 12 semanas | SIN CAMBIO |
| Lanzamiento | Sem 9 | Sem 10 | +1 semana buffer |

### Cronograma Ajustado
```
Hito 1 (Sem 1-4): FUNDACIÓN + COMPARACIÓN BÁSICA
  ├─ Sem 1: Auth + DB schema
  ├─ Sem 2: Upload + Storage (350K imágenes)
  ├─ Sem 3: MobileNetV2 + Embeddings
  └─ Sem 4: Auditoría + QA
  └─ PAGO: $2,000,000 CLP (Día 1 firma)

Hito 2 (Sem 5-8): BÚSQUEDA + OPTIMIZACIÓN
  ├─ Sem 5: Search endpoint (similarity search)
  ├─ Sem 6: Performance tuning (<100ms)
  ├─ Sem 7: Clasificación Niza/Viena
  └─ Sem 8: Admin dashboard mejorado
  └─ PAGO: $1,500,000 CLP (Fin Sem 8)

Hito 3 (Sem 9-10): PRODUCCIÓN + LAUNCH
  ├─ Sem 9: Security audit + monitoring
  ├─ Sem 10: Load testing + optimization
  └─ Sem 11-12: Buffer/contingencia
  └─ PAGO: $1,500,000 CLP (Fin Sem 10 - LIVE)
```

---

## 7. IMPACTO TÉCNICO

### Mejoras Significativas
✅ **Escalabilidad:** De 100 imágenes a 350K+  
✅ **Multi-tenant:** Soporte para múltiples clientes  
✅ **API REST:** Integración con terceros  
✅ **Auditoría completa:** Compliance legal  
✅ **Cloud-native:** Sin dependencias locales  
✅ **Performance:** <100ms comparación  
✅ **Seguridad:** OWASP + RLS + 2FA  
✅ **Monitoria:** Sentry + logs centralizados  

### Riesgos Mitigados
⚠️ **Complejidad MobileNetV2:** Evaluado + viable (TensorFlow.js soporta)  
⚠️ **350K imágenes:** Batch processing en worker  
⚠️ **Embeddings storage:** PostgreSQL + Redis (16GB máx inicial)  
⚠️ **Latencia:** Caching + CDN (Vercel Edge)  

---

## 8. PRESUPUESTO REALINEADO

### Hito 1: $2,000,000 CLP (Sem 1-4)
- Backend API development: 45%
- Frontend (Next.js): 20%
- ML pipeline (MobileNetV2): 15%
- Bulk import system: 10%
- Testing + documentation: 10%

### Hito 2: $1,500,000 CLP (Sem 5-8)
- Search optimization: 30%
- Performance tuning: 25%
- Classifications (Niza/Viena): 25%
- Admin dashboard: 20%

### Hito 3: $1,500,000 CLP (Sem 9-10)
- Security hardening: 35%
- Load testing: 25%
- Monitoring setup: 20%
- Documentation + training: 20%

**TOTAL: $5,000,000 CLP (SIN CAMBIOS)**

---

## 9. PRÓXIMAS ACCIONES

1. ✅ **APROBACIÓN CLIENTE:**
   - Revisar timeline: 12 semanas (SIN CAMBIO)
   - Revisar presupuesto: $5M CLP (SIN CAMBIO)
   - Confirmar 350K imágenes incluidas en H1

2. 📋 **KICKOFF (Sem 1):**
   - Entregar stack completo (Node.js setup)
   - Definir equipo (Lead dev + Mid dev)
   - Crear sprint board (Jira/GitHub Projects)

3. 🚀 **EJECUCIÓN:**
   - Seguir cronograma realineado (4 semanas Hito 1)
   - Standups diarios (9 AM)
   - Demo Viernes (cliente)

---

## CONCLUSIÓN

La propuesta comercial **se mantiene sin cambios** ($5M, 12 semanas), pero con una **alineación técnica más precisa**:

- ✅ Incluye 350K imágenes en Hito 1 (Bulk import)
- ✅ MobileNetV2 + embeddings operacional
- ✅ Auditoría completa desde Semana 4
- ✅ Multi-tenant desde inicio
- ✅ Cloud-native sin deuda técnica

**Status:** ✅ Listo para firma y kickoff

---

**Generado:** 11 de Mayo 2026  
**Proyecto:** Visual Compare API Chile - LogoCompare Cloud V1  
**Versión:** 1.1 (Realineada con arquitectura actual)
