# ANÁLISIS DE ALINEACIÓN - VISUAL COMPARE API V1
## Fase 1 (Semanas 1-3) vs Requerimientos LogoCompare

**Documento de Validación:** Alineación entre Propuesta Comercial MVP y Requerimientos Técnicos  
**Fecha:** 11 de mayo de 2026  
**Estado:** ANÁLISIS CRÍTICO  
**Objetivo:** Validar cobertura de requerimientos en Hito 1 (3 primeras semanas)

---

## 1. REQUERIMIENTOS DEL CLIENTE (Documento LogoCompare)

### 1.1 Requerimientos de Carga de Datos
```
CLIENTE NECESITA:
├─ Cargar 350,000 imágenes históricas (de Excel 2009-presente)
├─ Cargar 5,000 nuevas imágenes por mes
├─ Clasificaciones Niza (45 clases: 1-34 productos, 35-45 servicios)
├─ Clasificaciones Viena (29 categorías de elementos figurativos)
├─ Sistema de auditoría (quién, qué, cuándo, dónde)
└─ Gestión de usuarios con roles diferenciados
```

### 1.2 Requerimientos de Comparación
```
CLIENTE NECESITA:
├─ Comparación de logos (similar a LogoCompare prototype)
├─ Detección de duplicados exactos
├─ Detección de similitud visual
├─ Clasificación en categorías
├─ Base de datos histórica consulta
└─ Performance: <100ms por comparación
```

### 1.3 Stack Tecnológico del Prototipo Existente
```
LogoCompare Prototype usa:
├─ Frontend: HTML5, CSS3, JavaScript ES6+
├─ Backend: PHP (optional)
├─ ML: MobileNetV2 + TensorFlow.js
├─ Similitud: Coseno (embeddings)
├─ Database: SQLite / SQL.js
└─ Arquitectura: login.html → index.html → embeddings.json
```

---

## 2. PROPUESTA ACTUAL (HITO 1)

### 2.1 Stack Tecnológico Propuesto
```
Visual Compare API V1 Hito 1 usa:
├─ Runtime: Node.js 18+
├─ Framework: Next.js 16 (App Router)
├─ Lenguaje: TypeScript
├─ Base de Datos: PostgreSQL (Supabase)
├─ Storage: Vercel Blob (para imágenes)
├─ Hosting: Vercel
├─ Testing: Jest/Vitest
└─ Autenticación: API key (SHA-256)

COMPARACIÓN:
⚠️  Diferente stack (JavaScript/Node vs PHP/MobileNetV2)
⚠️  PostgreSQL vs SQLite
✅ Ambos soportan imágenes
✅ Ambos soportan auditoría
```

### 2.2 Endpoints Propuestos en Hito 1
```
HITO 1 ENDPOINTS:
├─ GET /health
├─ POST /api/v1/images (upload)
├─ Basic error handling
├─ API key authentication
└─ Rate limiting (10 req/min)

❌ FALTA: POST /api/v1/compare (implementado en Hito 2)
❌ FALTA: Clasificaciones Niza
❌ FALTA: Clasificaciones Viena
❌ FALTA: Auditoría completa
❌ FALTA: Gestión de usuarios/roles
```

### 2.3 Base de Datos Propuesta en Hito 1
```
TABLAS PLANIFICADAS:
├─ images (id, user_id, url, filename, hash_sha256, created_at)
├─ comparisons (pendiente en Hito 2)
├─ api_keys (id, user_id, key_hash, created_at)
└─ usage_logs (id, user_id, endpoint, timestamp)

❌ FALTA: Tabla de clasificaciones_niza (45 clases)
❌ FALTA: Tabla de clasificaciones_viena (29 categorías)
❌ FALTA: Tabla de usuarios con roles
❌ FALTA: Tabla de auditoría detallada (action, actor, resource, timestamp)
```

---

## 3. GAPS DE ALINEACIÓN

### 3.1 CRÍTICOS (Deben cubrirse en Hito 1)

| Gap | Requerimiento | Status Actual | Severidad | Impacto |
|-----|---------------|---------------|-----------|---------|
| **Clasificaciones Niza** | 45 clases de productos/servicios | ❌ No incluido | 🔴 CRÍTICO | Sin clasificación = No es comparable a INAPI |
| **Clasificaciones Viena** | 29 categorías de elementos figurativos | ❌ No incluido | 🔴 CRÍTICO | Sin clasificación visual = No cumple requisitos |
| **Usuarios & Roles** | Gestión de usuarios con roles diferenciados | ❌ Solo API keys | 🔴 CRÍTICO | No hay control de acceso por rol |
| **Auditoría Completa** | Audit logging (quién/qué/cuándo/dónde) | ⚠️ Básico | 🔴 CRÍTICO | Compliance requirement (INAPI) |
| **Carga 350K imágenes** | Bulk import de históricos | ❌ No planificado | 🔴 CRÍTICO | MVP sin datos = No funcional |

### 3.2 ALTOS (Deberían incluirse)

| Gap | Requerimiento | Status Actual | Severidad | Impacto |
|-----|---------------|---------------|-----------|---------|
| **Comparación** | POST /compare endpoint | ⚠️ Hito 2 | 🟠 ALTO | Funcionalidad principal en Sem 4 |
| **Historial** | Búsqueda y gestión de comparaciones | ⚠️ Hito 2 | 🟠 ALTO | Requisito de cliente ausente en Sem 1-3 |
| **Base de datos histórica** | Consulta de registros 2009-presente | ❌ No planificado | 🟠 ALTO | Cliente necesita reportes históricos |

### 3.3 MEDIOS (Futuro)

| Gap | Requerimiento | Status Actual | Severidad | Impacto |
|-----|---------------|---------------|-----------|---------|
| **Dashboard Web** | UI para usuarios finales | ❌ Out of scope | 🟡 MEDIO | MVP es solo API |
| **Exportación** | Export de resultados (Excel, PDF) | ❌ No planificado | 🟡 MEDIO | Conveniencia de usuario |
| **ML Avanzado** | TensorFlow embeddings | ❌ Descartado | 🟡 MEDIO | Presupuesto/complejidad |

---

## 4. PROPUESTA DE REALINEACIÓN - HITO 1 MEJORADO

### 4.1 Schema de Base de Datos REVISADO

```sql
-- Tabla 1: Organizaciones (Multi-tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP
);

-- Tabla 2: Usuarios con Roles
CREATE TABLE users (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50), -- admin, viewer, auditor, uploader
    created_at TIMESTAMP
);

-- Tabla 3: Clasificaciones Niza (Referencial)
CREATE TABLE clasificaciones_niza (
    id SERIAL PRIMARY KEY,
    clase INT UNIQUE (1-45),
    descripcion VARCHAR(500),
    tipo VARCHAR(20), -- 'producto' o 'servicio'
    created_at TIMESTAMP
);

-- Tabla 4: Clasificaciones Viena (Referencial)
CREATE TABLE clasificaciones_viena (
    id SERIAL PRIMARY KEY,
    categoria INT UNIQUE (1-29),
    nombre VARCHAR(255),
    descripcion TEXT,
    created_at TIMESTAMP
);

-- Tabla 5: Imágenes
CREATE TABLE images (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255),
    url VARCHAR(500),
    hash_sha256 CHAR(64),
    phash VARCHAR(50),
    clasificacion_niza INT REFERENCES clasificaciones_niza(clase),
    clasificacion_viena INT REFERENCES clasificaciones_viena(categoria),
    metadata JSON, -- {dimensions, colors, elements, etc}
    uploaded_at TIMESTAMP,
    created_at TIMESTAMP
);

-- Tabla 6: Auditoría
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50), -- 'upload', 'compare', 'download', 'delete', 'export'
    resource_type VARCHAR(50), -- 'image', 'classification', 'report'
    resource_id VARCHAR(255),
    changes JSON, -- {before, after}
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org_timestamp (org_id, timestamp),
    INDEX idx_user_timestamp (user_id, timestamp)
);

-- Tabla 7: API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    key_hash CHAR(64),
    name VARCHAR(255),
    last_used_at TIMESTAMP,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- Tabla 8: Comparisons (Para Hito 2, pero schema desde Hito 1)
CREATE TABLE comparisons (
    id UUID PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    image_a_id UUID REFERENCES images(id),
    image_b_id UUID REFERENCES images(id),
    similarity_score DECIMAL(5,2), -- 0-100
    classification VARCHAR(50), -- exact_match, near_duplicate, etc
    created_at TIMESTAMP
);

-- Tabla 9: Usage Stats
CREATE TABLE usage_stats (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID REFERENCES organizations(id),
    month TIMESTAMP,
    images_uploaded INT DEFAULT 0,
    comparisons_performed INT DEFAULT 0,
    storage_used_mb DECIMAL(10,2),
    api_calls INT DEFAULT 0
);
```

### 4.2 Endpoints Revisados para Hito 1

```javascript
// HITO 1 ENDPOINTS (MEJORADO)

GET /v1/health
// Response: {status: "ok", timestamp: ISO8601}

POST /v1/images
// Upload single image + metadata
// Body: {file, clasificacion_niza?, clasificacion_viena?, name?}
// Response: {id, url, hash_sha256, uploaded_at}

GET /v1/images
// List images with filters
// Query: ?niza_class=25&viena_cat=3&limit=50&offset=0
// Response: [{id, filename, url, niza_class, viena_cat, uploaded_at}, ...]

DELETE /v1/images/:id
// Delete image (requiere auditoría)
// Response: {deleted: true, audit_id: xxx}

POST /v1/classifications/niza/load
// Load/bulk import Niza classifications
// Body: {data: [{clase, descripcion, tipo}, ...]}
// Response: {loaded: 45, timestamp: ISO8601}

POST /v1/classifications/viena/load
// Load/bulk import Viena classifications
// Body: {data: [{categoria, nombre, descripcion}, ...]}
// Response: {loaded: 29, timestamp: ISO8601}

GET /v1/classifications/niza
// Get all Niza classes
// Query: ?tipo=producto
// Response: [{clase, descripcion, tipo}, ...]

GET /v1/classifications/viena
// Get all Viena categories
// Response: [{categoria, nombre, descripcion}, ...]

POST /v1/audit-logs
// Get audit logs (requiere role: auditor o admin)
// Body: {org_id, start_date, end_date, action?, user_id?}
// Response: [{id, action, resource_type, resource_id, user_id, timestamp, ip, changes}, ...]

GET /v1/usage
// Usage statistics
// Response: {images_uploaded, comparisons_performed, storage_mb, api_calls}

POST /v1/users/invite
// Invite user + assign role (admin only)
// Body: {email, role: 'admin|viewer|auditor|uploader'}
// Response: {user_id, email, role, invited_at}

GET /v1/users
// List users in organization (admin only)
// Response: [{id, email, role, created_at, last_login}, ...]

POST /v1/bulk-import/images
// Bulk import 350K historical images
// Body: {file: CSV, mapping: {filename_col, niza_col, viena_col, ...}}
// Response: {job_id, status: 'queued', estimated_time_minutes: 45}

GET /v1/bulk-import/status/:job_id
// Check bulk import progress
// Response: {status: 'processing|completed|error', processed: 150000, total: 350000, progress_percent: 43}
```

### 4.3 Cronograma Revisado para Hito 1

```
SEMANA 1:
├─ Lunes-Miércoles: DB schema (6 tablas core + auditoría)
├─ Jueves-Viernes: Auth + API keys + Rate limiting
└─ Testing: 30% coverage

SEMANA 2:
├─ Lunes-Martes: Image upload endpoint (with Niza/Viena classification)
├─ Miércoles: Bulk import job (para 350K imágenes)
├─ Jueves: Usuarios & roles + auditoría logging
├─ Viernes: Classificaciones Niza/Viena endpoints
└─ Testing: 45% coverage

SEMANA 3:
├─ Lunes-Martes: Error handling + RLS policies
├─ Miércoles: Documentation (OpenAPI spec)
├─ Jueves: Audit logs query endpoint
├─ Viernes: Testing (50% coverage) + Sign-off
└─ Deliverable: Base API lista, datos históricos importados
```

### 4.4 Cargas de Datos para Hito 1

```
CLASIFICACIONES:
├─ Niza: 45 clases (datos de OMPI - públicos)
├─ Viena: 29 categorías (datos de OMPI - públicos)
└─ Carga inicial: ~2KB de SQL (seed data)

IMÁGENES HISTÓRICAS:
├─ Fuente: Excel cliente (2009-2026)
├─ Volumen: 350,000 imágenes
├─ Formato esperado: CSV o XLS con columnas
├─ Proceso: Bulk import job (async, ~2-4 horas)
├─ Validación: SHA-256 duplicate detection
└─ Resultado: Base de datos con 350K imágenes indexadas

USUARIOS:
├─ Admin: Cliente (acceso total)
├─ Viewers: Consultores (solo lectura)
├─ Auditors: Cumplimiento (audit logs)
├─ Uploaders: Personal cliente (cargar nuevas imágenes)
└─ Roles con RLS policies en Supabase
```

---

## 5. TABLA DE COBERTURA REQUERIMIENTOS

| Requerimiento | Hito 1 Original | Hito 1 Propuesto | Gap? | Prioridad |
|---------------|-----------------|------------------|------|-----------|
| **Stack Node.js/Next.js** | ✅ Incluido | ✅ Incluido | ✅ NO | - |
| **PostgreSQL + Supabase** | ✅ Incluido | ✅ Incluido | ✅ NO | - |
| **Auth API key** | ✅ Incluido | ✅ Incluido | ✅ NO | - |
| **Upload endpoint** | ✅ Incluido | ✅ Incluido + Niza/Viena | ✅ NO | - |
| **Clasificaciones Niza** | ❌ NO | ✅ AGREGADO | ✅ CERRADO | 🔴 CRÍTICO |
| **Clasificaciones Viena** | ❌ NO | ✅ AGREGADO | ✅ CERRADO | 🔴 CRÍTICO |
| **Gestión de usuarios/roles** | ⚠️ API keys | ✅ COMPLETO | ✅ CERRADO | 🔴 CRÍTICO |
| **Auditoría (who/what/when/where)** | ⚠️ Básica | ✅ COMPLETA | ✅ CERRADO | 🔴 CRÍTICO |
| **Bulk import 350K imágenes** | ❌ NO | ✅ AGREGADO | ✅ CERRADO | 🔴 CRÍTICO |
| **Comparación (SHA256+pHash)** | ❌ Hito 2 | ❌ Hito 2 | ⚠️ ACEPTABLE | 🟠 ALTO |
| **Historial/búsqueda** | ❌ Hito 2 | ❌ Hito 2 | ⚠️ ACEPTABLE | 🟠 ALTO |

---

## 6. ESTIMACIÓN DE ESFUERZO ADICIONAL

### 6.1 Trabajo Requerido (Semanas adicionales)

```
Tarea                                    Estimación    Quién
──────────────────────────────────────────────────────────
DB schema + 6 tablas nuevas              2 días        Lead dev
Niza/Viena classification endpoints      2 días        Mid dev
Bulk import job (async)                  3 días        Lead dev
Usuarios & roles (RBAC)                  3 días        Mid dev
Auditoría logging completo               2 días        Mid dev
RLS policies en Supabase                 1.5 días      Lead dev
Testing (auditoría, bulk)                2 días        Mid dev
Documentation (new endpoints)            1.5 días      Mid dev
──────────────────────────────────────────────────────────
TOTAL                                    ~17 días      
```

### 6.2 Impacto en Timeline

```
Hito 1 Original: 3 semanas = 15 días útiles
Trabajo adicional: 17 días (¡EXCEDE!)

OPCIONES:
1. Extender Hito 1 a 4 semanas (+1 semana)
2. Mover Comparación a Hito 2.5 (nueva iteración)
3. Reducir scope de Auditoría (básica vs completa)
4. Agregar developer adicional (2.5 FTE → 3 FTE)
```

### 6.3 Costo Presupuestario Adicional

```
Estimación:
├─ 17 días adicionales ÷ 5 días/semana = 3.4 semanas
├─ 1 Lead dev + 1 Mid dev × $1,250/semana = $2,500/semana
├─ 3.4 semanas × $2,500 = $8,500 USD adicionales
├─ En CLP (~$1,300/USD): $8,500 × 1,300 = $11,050,000 CLP
└─ IMPACTO: +2.2% del presupuesto total ($5M)
```

---

## 7. RECOMENDACIONES

### 7.1 OPCIÓN A: Realineación Completa (RECOMENDADA)

**Decisión:** Incluir TODOS los requerimientos en Hito 1

**Acciones:**
1. ✅ Extender Hito 1 de 3 a 4 semanas (Sem 1-4)
2. ✅ Agregar 5 endpoints nuevos (Niza, Viena, Usuarios, Auditoría, Bulk)
3. ✅ Crear 6 tablas en DB (clasificaciones, usuarios, auditoría)
4. ✅ Implementar bulk import para 350K imágenes
5. ✅ Mantener presupuesto (absorber en contingencia: 15% = $750K)

**Ventajas:**
- MVP funcional desde el Hito 1
- Cliente puede empezar a usar API en Sem 4
- Clasificaciones + auditoría es lo que cliente REALMENTE necesita

**Desventajas:**
- Timeline más ajustado
- Menos buffer para issues

**Timeline Resultante:**
```
Hito 1: Sem 1-4 (Fundación + Clasificaciones + Auditoría)
Hito 2: Sem 5-7 (Comparación + Búsqueda)
Hito 3: Sem 8-10 (QA + Launch)
Buffer: Sem 11-12 (Contingencia)
```

### 7.2 OPCIÓN B: Realineación Parcial

**Decisión:** Incluir solo clasificaciones en Hito 1, auditoría en Hito 2

**Scope Hito 1:** Upload + Niza + Viena (no bulk import ni auditoría completa)

**Ventajas:**
- Mantiene timeline de 3 semanas
- Presupuesto sin cambios

**Desventajas:**
- Cliente sin auditoría en Sem 1-3 (compliance issue)
- MVP aún no puede importar datos históricos

### 7.3 OPCIÓN C: Scope Reducido (NO RECOMENDADO)

**Decisión:** Mantener Hito 1 tal cual, mover clasificaciones a Hito 2

**Ventajas:**
- Zero timeline changes
- MVP "limpio"

**Desventajas:**
- ❌ NO cumple requisitos cliente
- ❌ Clasificaciones Niza/Viena son CRÍTICAS
- ❌ Cliente no puede usar API en producción sin ellas

---

## 8. DECISIÓN RECOMENDADA

**RECOMENDACIÓN: OPCIÓN A - Realineación Completa**

**Justificación:**
1. Las clasificaciones Niza/Viena NO son "nice-to-have", son **mandatorio** para compliance INAPI
2. Auditoría es **requisito legal** en Chile (Ley 19.039)
3. Bulk import es lo que hace útil el MVP (sin datos = no funciona)
4. El costo adicional (~$11M CLP) está dentro de la contingencia (15% = $750K)
5. **Cliente obtiene ROI desde Hito 1**, no desde Hito 2

**Nueva Propuesta:** Presentar al cliente:
- ✅ Hito 1 extendido a 4 semanas (Sem 1-4)
- ✅ Incluye: Fundación + Clasificaciones + Auditoría + Bulk Import
- ✅ Presupuesto: SIN CAMBIOS (absorber en contingencia)
- ✅ Pago Hito 1: Sigue siendo $2,000,000 (40% del presupuesto base)
- ✅ Nuevo cronograma:
  - **Hito 1:** Sem 1-4 → $2,000,000 CLP
  - **Hito 2:** Sem 5-7 → $1,500,000 CLP  
  - **Hito 3:** Sem 8-10 → $1,500,000 CLP
  - **Buffer:** Sem 11-12 (incluido)
  - **TOTAL:** 12 semanas, $5,000,000 CLP ✅

---

## 9. DOCUMENTO DE VALIDACIÓN

**Preparado por:** V0 Architecture Review  
**Fecha:** 11 de mayo de 2026  
**Estado:** PENDIENTE APROBACIÓN CLIENTE  
**Próximo paso:** Presentar a cliente con nueva propuesta comercial

**Aprobaciones requeridas:**
- ☐ Lead Developer (Timeline viabilidad)
- ☐ Cliente (Requisitos coverage)
- ☐ Finance (Presupuesto viabilidad)
- ☐ Legal (Compliance Niza/Viena/Auditoría)

---

**Conclusión:** El MVP requiere realineación para ser viable. La Opción A es la recomendada y mantiene presupuesto y timeline global (12 semanas, $5M CLP).
