# API SPECIFICATION - PHASE 1 (SEMANAS 1-4)
## LogoCompare Cloud V1 - Detalle Técnico Completo

**Proyecto:** Visual Compare API Chile  
**Fase:** 1 (Fundación + Motor de Comparación)  
**Duración:** 4 semanas  
**Presupuesto:** $2,000,000 CLP  

---

## ÍNDICE

1. [Arquitectura General](#arquitectura)
2. [Endpoints Fase 1](#endpoints)
3. [Schema Base de Datos](#schema)
4. [Flujos de Negocio](#flujos)
5. [Especificación Técnica](#especificación)
6. [Cronograma Detallado](#cronograma)

---

## ARQUITECTURA

### Stack Tecnológico

```
┌─────────────────┐
│   Frontend      │
│  (Next.js 16)   │  - React 19
│                 │  - TypeScript
└────────┬────────┘
         │
┌────────▼────────────────────────────────┐
│      API Gateway (Vercel Functions)     │
│                                         │
│  - Rate limiting                        │
│  - JWT validation                       │
│  - CORS handling                        │
└────────┬────────────────────────────────┘
         │
┌────────▼──────────────────────────────────────┐
│    Application Layer (Node.js/TypeScript)     │
│                                               │
│  ├─ Auth Service (JWT + Sessions)            │
│  ├─ Image Service (Upload + Storage)         │
│  ├─ Comparison Service (MobileNetV2)         │
│  ├─ Audit Service (Logging)                  │
│  └─ Search Service (Similarity Query)        │
└────────┬──────────────────────────────────────┘
         │
    ┌────┴────┬────────────┐
    │          │            │
┌───▼──┐  ┌──▼────┐  ┌───▼────┐
│      │  │       │  │        │
│ DB   │  │ Blob  │  │ Cache  │
│      │  │       │  │        │
└──────┘  └───────┘  └────────┘
  PostgreSQL Vercel   Redis
  Supabase    Blob  (embeddings)
```

### Base de Datos (Supabase PostgreSQL)

**13 Tablas Core:**
```
1. users              - Usuarios del sistema
2. user_roles        - Roles (admin, auditor, comparador)
3. organizations     - Multi-tenant support
4. images            - Metadatos de imágenes
5. image_metadata    - Clasificaciones (Niza/Viena)
6. embeddings        - Vectores MobileNetV2
7. comparisons       - Resultados de comparaciones
8. audit_logs        - Logs completos
9. api_keys          - API keys para integraciones
10. rate_limits      - Rate limiting per user
11. sessions         - Sesiones activas
12. notifications    - Sistema de notificaciones
13. bulk_import_jobs - Tracking de imports
```

---

## ENDPOINTS FASE 1

### 1. AUTENTICACIÓN

#### POST /v1/auth/login
Autentica usuario y devuelve JWT + session cookie

**Request:**
```json
{
  "email": "admin@logocompare.cl",
  "password": "SecurePassword123!",
  "remember_me": false
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@logocompare.cl",
    "name": "Admin User",
    "role": "admin",
    "organization_id": "org_123"
  },
  "expires_in": 86400
}
```

**Headers Response:**
```
Set-Cookie: session=eyJ...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

**Error (401):**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Email o contraseña incorrectos"
}
```

**Seguridad:**
- Password hash: bcrypt (12 rounds)
- JWT signing: HS256
- Session: HttpOnly, Secure cookies
- Rate limiting: 5 intentos/IP/5min
- 2FA: Optional (implementar Sem 3)

---

#### POST /v1/auth/logout
Cierra sesión y invalida tokens

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "message": "Logout exitoso"
}
```

**Headers Response:**
```
Set-Cookie: session=; HttpOnly; Secure; Max-Age=0
```

---

#### GET /v1/auth/me
Obtiene datos del usuario autenticado

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@logocompare.cl",
  "name": "Admin User",
  "role": "admin",
  "organization_id": "org_123",
  "created_at": "2026-05-11T10:30:00Z",
  "last_login": "2026-05-11T14:22:15Z"
}
```

---

#### POST /v1/auth/refresh-token
Refresca token expirado

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 86400
}
```

---

### 2. GESTIÓN DE IMÁGENES

#### POST /v1/images/upload
Carga una imagen individual

**Request (multipart/form-data):**
```
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="file"; filename="logo.png"
Content-Type: image/png

[binary data]
------boundary
Content-Disposition: form-data; name="metadata"

{
  "description": "Logo de empresa XYZ",
  "category": "technology",
  "tags": ["logo", "empresa", "tech"],
  "niza_class": "35",
  "viena_class": "26.01"
}
------boundary--
```

**Response (201):**
```json
{
  "id": "img_550e8400-e29b-41d4-a716-446655440000",
  "filename": "logo.png",
  "blob_url": "https://blob.vercel-storage.com/...",
  "thumbnail_url": "https://blob.vercel-storage.com/...",
  "filesize": 245632,
  "metadata": {
    "description": "Logo de empresa XYZ",
    "category": "technology",
    "tags": ["logo", "empresa", "tech"],
    "niza_class": "35",
    "viena_class": "26.01"
  },
  "uploaded_by": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-05-11T14:22:15Z",
  "processing_status": "pending_embedding"
}
```

**Validaciones:**
- Tipos: PNG, JPG, SVG, WebP
- Tamaño máx: 10MB
- Dimensiones: 64x64 a 2048x2048
- Rate limit: 100 uploads/user/día

**Procesamiento Asíncrono:**
```typescript
// Genera thumbnail y extrae embedding en background
// Status: pending_embedding → processing → completed → failed
```

---

#### POST /v1/images/bulk-import
Carga 350K imágenes en bulk

**Request (application/json):**
```json
{
  "source": "csv_url",
  "csv_url": "https://storage.example.com/350k-logos.csv",
  "format": {
    "columns": ["filename", "category", "niza_class", "viena_class"],
    "has_header": true,
    "delimiter": ","
  },
  "batch_size": 100,
  "concurrent_workers": 10
}
```

**CSV Format:**
```
filename,category,niza_class,viena_class
logo1.png,technology,35,26.01
logo2.jpg,finance,36,27.02
...
```

**Response (202 - Accepted):**
```json
{
  "job_id": "bulk_import_550e8400-e29b-41d4-a716",
  "status": "queued",
  "total_files": 350000,
  "started_at": "2026-05-11T14:22:15Z",
  "estimated_completion": "2026-05-13T10:30:00Z",
  "progress": {
    "completed": 0,
    "failed": 0,
    "pending": 350000,
    "percentage": 0
  },
  "webhook_url": "https://example.com/webhooks/bulk-import"
}
```

**Webhook (cada 1000 imágenes):**
```json
{
  "job_id": "bulk_import_550e8400...",
  "progress": {
    "completed": 1000,
    "failed": 2,
    "pending": 349000,
    "percentage": 0.29
  },
  "timestamp": "2026-05-11T14:25:00Z"
}
```

**Processing Pipeline:**
```
CSV Download → Validate → Queue (10 workers)
  ↓
Per Image:
  1. Download from S3
  2. Validate MIME type
  3. Generate thumbnail
  4. Extract embedding (MobileNetV2)
  5. Store in DB + Blob
  6. Update job status
  ↓
Webhook notification → Job complete
```

---

#### GET /v1/images
Lista imágenes con paginación

**Query Parameters:**
```
GET /v1/images?page=1&limit=50&sort=created_at&order=desc&category=technology
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "img_550e8400-e29b-41d4-a716-446655440000",
      "filename": "logo.png",
      "thumbnail_url": "https://blob.vercel-storage.com/...",
      "category": "technology",
      "created_at": "2026-05-11T14:22:15Z",
      "uploaded_by": "admin@logocompare.cl"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 350000,
    "pages": 7000
  }
}
```

---

#### DELETE /v1/images/:id
Elimina una imagen

**Request:**
```
DELETE /v1/images/img_550e8400-e29b-41d4-a716-446655440000
```

**Response (204 No Content):**
```
(vacío)
```

**Auditoría:**
```
Registra en audit_logs:
- user_id: quién deletea
- action: DELETE
- resource: image_id
- timestamp
- ip_address
```

---

### 3. COMPARACIÓN DE LOGOS

#### POST /v1/compare
Compara dos logos usando MobileNetV2

**Request:**
```json
{
  "image1_id": "img_550e8400-e29b-41d4-a716-446655440000",
  "image2_id": "img_550e8400-e29b-41d4-a716-446655440001",
  "threshold": 0.70,
  "detailed_analysis": true
}
```

**Response (200):**
```json
{
  "comparison_id": "cmp_550e8400-e29b-41d4-a716-446655440000",
  "image1": {
    "id": "img_550e8400-e29b-41d4-a716-446655440000",
    "filename": "logo1.png",
    "url": "https://blob.vercel-storage.com/..."
  },
  "image2": {
    "id": "img_550e8400-e29b-41d4-a716-446655440001",
    "filename": "logo2.png",
    "url": "https://blob.vercel-storage.com/..."
  },
  "similarity": {
    "score": 0.87,
    "confidence": 0.94,
    "method": "MobileNetV2_cosine"
  },
  "classification": {
    "category": "near_duplicate",
    "risk_level": "high",
    "explanation": "Logos muy similares - posible infracción de marca"
  },
  "detailed_analysis": {
    "color_similarity": 0.92,
    "shape_similarity": 0.81,
    "text_similarity": 0.78,
    "visual_regions": [
      {
        "region": "top_left",
        "similarity": 0.95,
        "description": "Similar círculo rojo"
      }
    ]
  },
  "created_at": "2026-05-11T14:22:15Z"
}
```

**Classification Logic:**
```
similarity >= 0.95  → exact_match
similarity >= 0.85  → near_duplicate
similarity >= 0.70  → visually_similar
similarity >= 0.50  → partial_similar
similarity <  0.50  → different
```

**Algorithm Details:**
```typescript
async function compareLogos(img1_id, img2_id) {
  // 1. Fetch embeddings from DB (cached)
  const emb1 = await getEmbedding(img1_id);
  const emb2 = await getEmbedding(img2_id);
  
  // 2. Calculate cosine similarity
  const similarity = cosineSimilarity(emb1, emb2);
  
  // 3. Calculate confidence
  const confidence = calculateConfidence(similarity);
  
  // 4. Classify result
  const classification = classify(similarity);
  
  // 5. Optional: Generate detailed analysis
  if (detailed_analysis) {
    const regions = analyzeVisualRegions(img1, img2);
    return { similarity, confidence, classification, regions };
  }
  
  return { similarity, confidence, classification };
}
```

**Performance:**
- Latencia: <100ms (con cache)
- Sin cache: <500ms (primer cálculo)
- Throughput: 1000 comparaciones/min

---

#### GET /v1/comparisons/:id
Obtiene detalle de comparación

**Request:**
```
GET /v1/comparisons/cmp_550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "id": "cmp_550e8400-e29b-41d4-a716-446655440000",
  "image1_id": "img_550e8400-e29b-41d4-a716-446655440000",
  "image2_id": "img_550e8400-e29b-41d4-a716-446655440001",
  "similarity_score": 0.87,
  "classification": "near_duplicate",
  "risk_level": "high",
  "created_at": "2026-05-11T14:22:15Z",
  "created_by": "admin@logocompare.cl"
}
```

---

#### GET /v1/comparisons
Lista comparaciones del usuario

**Query Parameters:**
```
GET /v1/comparisons?page=1&limit=50&classification=near_duplicate&date_from=2026-05-01
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "cmp_550e8400...",
      "image1_filename": "logo1.png",
      "image2_filename": "logo2.png",
      "similarity_score": 0.87,
      "classification": "near_duplicate",
      "created_at": "2026-05-11T14:22:15Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5432,
    "pages": 109
  }
}
```

---

### 4. AUDITORÍA

#### GET /v1/audit-logs
Obtiene logs de auditoría

**Query Parameters (Admin only):**
```
GET /v1/audit-logs?user_id=xxx&action=UPLOAD&date_from=2026-05-01&date_to=2026-05-11&limit=100
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "log_550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-05-11T14:22:15Z",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_email": "admin@logocompare.cl",
      "action": "UPLOAD",
      "resource_type": "image",
      "resource_id": "img_550e8400-e29b-41d4-a716-446655440000",
      "resource_name": "logo.png",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "status": "success",
      "details": {
        "filesize": 245632,
        "mime_type": "image/png"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 15432
  }
}
```

**Acciones Registradas:**
```
LOGIN
LOGOUT
UPLOAD
DELETE
COMPARE
BULK_IMPORT_START
BULK_IMPORT_COMPLETE
DOWNLOAD
ROLE_CHANGE
USER_CREATE
USER_DELETE
```

---

#### GET /v1/audit-logs/download
Descarga logs como CSV

**Request:**
```
GET /v1/audit-logs/download?date_from=2026-05-01&date_to=2026-05-11&format=csv
```

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit_logs_2026-05-11.csv"

timestamp,user_email,action,resource_type,resource_id,ip_address,status
2026-05-11T14:22:15Z,admin@logocompare.cl,UPLOAD,image,img_550e8400...,192.168.1.100,success
...
```

---

### 5. SALUD DEL SISTEMA

#### GET /v1/health
Health check

**Request:**
```
GET /v1/health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-11T14:22:15Z",
  "services": {
    "database": "healthy",
    "blob_storage": "healthy",
    "cache": "healthy",
    "ml_model": "healthy"
  }
}
```

---

## SCHEMA BASE DE DATOS

### Tabla: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  
  INDEX idx_email (email),
  INDEX idx_organization_id (organization_id),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'auditor', 'comparador'))
);
```

### Tabla: images
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  filename VARCHAR(255) NOT NULL,
  blob_url VARCHAR(1024) NOT NULL,
  thumbnail_url VARCHAR(1024),
  filesize INT NOT NULL,
  mime_type VARCHAR(50),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  
  INDEX idx_organization_id (organization_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_created_at (created_at)
);
```

### Tabla: embeddings
```sql
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL UNIQUE REFERENCES images(id) ON DELETE CASCADE,
  vector FLOAT8[] NOT NULL, -- 1280-dim vector from MobileNetV2
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_image_id (image_id),
  INDEX idx_vector USING ivfflat (vector vector_cosine_ops) WITH (lists = 100)
);
```

### Tabla: comparisons
```sql
CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  image1_id UUID NOT NULL REFERENCES images(id),
  image2_id UUID NOT NULL REFERENCES images(id),
  similarity_score FLOAT NOT NULL,
  classification VARCHAR(50) NOT NULL,
  risk_level VARCHAR(50),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CHECK (similarity_score >= 0 AND similarity_score <= 1),
  CONSTRAINT valid_classification CHECK (
    classification IN ('exact_match', 'near_duplicate', 'visually_similar', 'partial_similar', 'different')
  ),
  
  INDEX idx_organization_id (organization_id),
  INDEX idx_created_at (created_at),
  INDEX idx_classification (classification)
);
```

### Tabla: audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20),
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_organization_id (organization_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp),
  INDEX idx_resource (resource_type, resource_id)
);
```

---

## FLUJOS DE NEGOCIO

### Flujo 1: Carga Individual de Logo
```
1. Usuario click "Subir Logo"
2. POST /v1/images/upload (multipart/form-data)
3. Validaciones:
   - Tipo archivo (PNG, JPG, SVG, WebP)
   - Tamaño (<10MB)
   - Dimensiones (64x64 a 2048x2048)
4. Almacenamiento:
   - Guarda en Vercel Blob
   - Crea thumbnail (128x128)
   - Inserta en tabla images
5. Procesamiento Asíncrono:
   - Worker: Carga MobileNetV2
   - Extrae embedding (1280 dims)
   - Guarda en tabla embeddings
   - Actualiza status: completed
6. Response: 201 Created
7. Auditoría: audit_logs.INSERT
```

### Flujo 2: Bulk Import (350K Imágenes)
```
1. Admin upload CSV con URLs de S3
2. POST /v1/images/bulk-import
3. Validaciones:
   - CSV format (columns, delimiter)
   - URLs accesibles
4. Job creado: bulk_import_jobs.INSERT
5. Queue 10 workers concurrentes
6. Per imagen (350K iteraciones):
   - Download from S3
   - Validate MIME
   - Store in Blob
   - Extract embedding
   - Webhook notification cada 1000
7. Job complete webhook
8. Auditoría: audit_logs.INSERT
```

### Flujo 3: Comparación de Logos
```
1. Usuario selecciona 2 logos
2. POST /v1/compare
3. Retrieve embeddings del DB (con cache Redis)
4. Calculate cosine similarity:
   - score = dot(emb1, emb2) / (norm(emb1) * norm(emb2))
   - range: [0, 1]
5. Classify:
   - score >= 0.95 → exact_match (rojo)
   - score >= 0.85 → near_duplicate (naranja)
   - score >= 0.70 → visually_similar (amarillo)
   - score >= 0.50 → partial_similar (gris)
   - score < 0.50  → different (verde)
6. Store result: comparisons.INSERT
7. Auditoría: audit_logs.INSERT
8. Response: comparison_id + resultado
```

---

## ESPECIFICACIÓN TÉCNICA

### Environment Variables (Necesarios)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Storage
VERCEL_BLOB_TOKEN=xxx
BLOB_STORE_ID=xxx

# Cache
REDIS_URL=redis://xxx:6379

# Auth
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=86400

# ML Model
MOBILENET_MODEL_URL=https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@v2

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Dependencies
```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@tensorflow/tfjs": "^4.10.0",
    "@tensorflow-models/mobilenet": "^2.1.0",
    "jose": "^5.0.0",
    "bcrypt": "^5.1.0",
    "redis": "^4.6.0",
    "@vercel/blob": "^0.14.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "sentry": "^7.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.0"
  }
}
```

### Rate Limiting
```
POST /v1/auth/login: 5 req/5min/IP
POST /v1/images/upload: 100 req/day/user
POST /v1/compare: 1000 req/day/user
GET /v1/audit-logs: 100 req/day/user
```

---

## CRONOGRAMA DETALLADO

### Semana 1: Fundación + Auth + DB

**Día 1-2: Setup Infrastructure**
- [ ] Repo GitHub setup
- [ ] Vercel project creation
- [ ] Supabase database provisioning
- [ ] Redis instance setup
- [ ] CI/CD pipeline (GitHub Actions)

**Día 3-4: Authentication**
- [ ] JWT implementation (sign/verify)
- [ ] Password hashing (bcrypt)
- [ ] Session management (HttpOnly cookies)
- [ ] Auth middleware
- [ ] Login endpoint (POST /v1/auth/login)
- [ ] Logout endpoint (POST /v1/auth/logout)
- [ ] Me endpoint (GET /v1/auth/me)

**Día 5: Database Schema**
- [ ] Crear 13 tablas (users, images, embeddings, etc.)
- [ ] RLS policies
- [ ] Índices
- [ ] Seed data (test users)

**Testing:**
- [ ] Unit tests auth functions
- [ ] Integration tests login flow
- [ ] Coverage: 80%+

---

### Semana 2: Image Upload + Storage

**Día 1-2: Vercel Blob Integration**
- [ ] Setup Vercel Blob connection
- [ ] Upload implementation
- [ ] Thumbnail generation
- [ ] File validation (MIME, size, dimensions)

**Día 3-4: Image Management Endpoints**
- [ ] POST /v1/images/upload
- [ ] GET /v1/images
- [ ] DELETE /v1/images/:id
- [ ] Image metadata storage

**Día 5: Bulk Import Pipeline**
- [ ] CSV parser
- [ ] S3 download capability
- [ ] Queue management (10 workers)
- [ ] Webhook notifications
- [ ] Job tracking

**Testing:**
- [ ] Upload single image
- [ ] Upload 10K images (bulk test)
- [ ] Validate thumbnails
- [ ] Error handling

---

### Semana 3: MobileNetV2 + Embeddings

**Día 1-2: ML Model Setup**
- [ ] Load MobileNetV2 model
- [ ] Implement image preprocessing
- [ ] Extract embeddings (1280-dim vectors)
- [ ] Performance optimization (<500ms)

**Día 3-4: Comparison Engine**
- [ ] Cosine similarity calculation
- [ ] Classification logic (5 categories)
- [ ] Risk level assessment
- [ ] Caching (Redis)

**Día 5: Comparison Endpoints**
- [ ] POST /v1/compare
- [ ] GET /v1/comparisons/:id
- [ ] GET /v1/comparisons (list)
- [ ] Batch processing for bulk comparisons

**Testing:**
- [ ] MobileNetV2 model inference
- [ ] Cosine similarity accuracy
- [ ] Latency <100ms (cached)
- [ ] Latency <500ms (first run)

---

### Semana 4: Auditoría + QA + Launch

**Día 1-2: Audit System**
- [ ] Audit logs table & schema
- [ ] Log all actions (login, upload, compare, delete)
- [ ] GET /v1/audit-logs endpoint
- [ ] CSV export capability
- [ ] Admin dashboard (auditoria)

**Día 3: Testing + Documentation**
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] Load testing (1000 req/min)
- [ ] Security audit (OWASP)
- [ ] OpenAPI documentation
- [ ] README + setup guide

**Día 4-5: Production Preparation**
- [ ] Environment setup (staging → production)
- [ ] Final security review
- [ ] Performance optimization
- [ ] Monitoring setup (Sentry)
- [ ] Health check endpoint (GET /v1/health)
- [ ] Deploy to production

**Go-Live Checklist:**
- [ ] All 7 endpoints working
- [ ] Rate limiting active
- [ ] Monitoring & alerts configured
- [ ] Audit logs flowing
- [ ] 350K images queued for bulk import
- [ ] Backup procedures tested
- [ ] Documentation complete

---

## MÉTRICAS DE ÉXITO (FASE 1)

| Métrica | Target | Status |
|---------|--------|--------|
| Endpoint availability | 99.9% | ✓ |
| Latencia p95 comparación | <100ms | ✓ |
| Latencia p95 upload | <1s | ✓ |
| Test coverage | 80%+ | ✓ |
| Throughput comparación | 1000/min | ✓ |
| Error rate | <0.1% | ✓ |
| Security audit score | 95%+ | ✓ |
| Documentación completitud | 100% | ✓ |

---

## CONCLUSIÓN

**Fase 1 entrega:**
- ✅ 7 endpoints funcionales
- ✅ Multi-tenant architecture
- ✅ 350K imágenes listas para import
- ✅ MobileNetV2 embeddings operacional
- ✅ Auditoría completa
- ✅ Cloud-native infraestructure
- ✅ Production-ready security

**Presupuesto Fase 1:** $2,000,000 CLP  
**Timeline:** 4 semanas  
**Pago:** Día 1 (firma contrato)

---

**Generado:** 11 de Mayo 2026  
**Versión:** 1.0  
**Status:** ✅ Listo para desarrollo
