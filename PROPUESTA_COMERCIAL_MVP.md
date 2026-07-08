PROPUESTA COMERCIAL - VISUAL COMPARE API CHILE V1
Desarrollo de API de Comparación de Imágenes
Estado: OFICIAL | Versión: 1.0 | Fecha: 11 de mayo de 2026

═══════════════════════════════════════════════════════════════════════════════

INFORMACIÓN DE LA PROPUESTA

Empresa Cliente: [A COMPLETAR]
Proyecto: Visual Compare API Chile V1 - Plataforma de Comparación Visual
Presupuesto Total: $5,000,000 CLP
Duración: 12 semanas (3 meses)
Fecha Inicio: [FECHA A DEFINIR - Semana 1]
Fecha Lanzamiento: Semana 9 (~11 de agosto 2026)
Validez de Propuesta: 30 días desde emisión

═══════════════════════════════════════════════════════════════════════════════

EJECUTIVO / RESUMEN

LogoCompare Cloud V1 es una plataforma moderna cloud-native basada en la 
arquitectura probada de LogoCompare PHP (DEV), transformada a una solución 
escalable usando MobileNetV2 (TensorFlow.js) + similitud de coseno para detectar:

• Duplicados exactos de logos
• Similitud visual entre logos (logos falsificados)
• Conflictos de marca (auditoría INAPI)
• Variaciones de diseño (clasificación Niza/Viena)
• Análisis de riesgo (exact_match → near_duplicate → similar → partial → different)
• Soporte para 350K+ logos de base histórica

ARQUITECTURA:
✓ Migración de XAMPP → Vercel Cloud (serverless)
✓ MobileNetV2 para extracción de embeddings (1280-dim vectors)
✓ Cosine similarity para comparación de logos
✓ PostgreSQL + Supabase para multi-tenant seguro
✓ Vercel Blob para almacenamiento de 350K imágenes
✓ Redis para caching de embeddings

VALOR PROPUESTO:
✓ Comparación visual ML en <100ms (con cache)
✓ Soporta 350K logos históricos (bulk import Semana 2)
✓ Multi-tenant: 100+ organizaciones
✓ API REST completamente documentada (OpenAPI)
✓ Escalable a 1000+ comparaciones/min
✓ Auditoría completa para compliance legal Chile
✓ Listo para producción en 12 semanas

═══════════════════════════════════════════════════════════════════════════════

SCOPE DEL PROYECTO - FASE 1 (4 SEMANAS)

INCLUIDO EN MVP FASE 1:
✅ 7 endpoints API REST funcionales
  - POST /v1/auth/login (JWT + cookies seguras)
  - POST /v1/images/upload (individual + validación)
  - POST /v1/images/bulk-import (350K logos en paralelo)
  - POST /v1/compare (MobileNetV2 + cosine similarity)
  - GET /v1/comparisons (historial + filtros)
  - GET /v1/audit-logs (compliance legal)
  - GET /v1/health (monitoreo)

✅ Autenticación segura
  - JWT tokens (HS256)
  - Session cookies (HttpOnly + Secure)
  - Password hashing (bcrypt 12 rounds)
  - Rate limiting (5 intentos/5min login)

✅ Gestión de Imágenes
  - Upload individual (PNG, JPG, SVG, WebP)
  - Thumbnail generation (64x64, 128x128)
  - Vercel Blob storage (350K+ imágenes)
  - Bulk import CSV desde S3 (10 workers paralelos)
  - Validación MIME type + dimensiones

✅ Motor de Comparación (MobileNetV2)
  - Extracción de embeddings (1280-dim vectors)
  - Cosine similarity calculation
  - 5 categorías de clasificación:
    • exact_match (>0.95) - Duplicado perfecto
    • near_duplicate (>0.85) - Posible infracción
    • visually_similar (>0.70) - Diseño similar
    • partial_similar (>0.50) - Parcialmente similar
    • different (<0.50) - Completamente diferente
  - Latencia <100ms (con cache Redis)
  - Throughput 1000 comparaciones/min

✅ Sistema de Auditoría Completo
  - Logging de todas las acciones (login, upload, compare, delete)
  - Trazabilidad: quién, qué, cuándo, dónde, IP
  - Descarga de logs como CSV (compliance legal)
  - Tabla audit_logs con índices optimizados
  - Admin dashboard de auditoría

✅ Multi-tenant Architecture
  - RLS (Row Level Security) en Supabase
  - Aislamiento de datos por organización
  - Soporte 100+ clientes simultáneamente
  - RBAC: admin, auditor, comparador

✅ Infraestructura Cloud-Native
  - Vercel Functions (serverless API)
  - Supabase PostgreSQL (13 tablas)
  - Vercel Blob (almacenamiento imágenes)
  - Redis (caching embeddings)
  - GitHub Actions (CI/CD)

✅ Documentación & Testing
  - OpenAPI 3.0 specification (Swagger)
  - 80%+ test coverage (unit + integration)
  - README con setup local
  - API reference completo
  - Guía de deployment

✅ Seguridad & Monitoring
  - OWASP Top 10 compliance
  - SQL injection protection (prepared statements)
  - CORS configurado
  - Sentry error tracking
  - Health check endpoint

NO INCLUIDO (Fase 2+):
❌ Dashboard web para usuarios finales
❌ Búsqueda similaridad (similarity search)
❌ Aplicaciones móviles nativas
❌ Certificaciones SOC2/ISO27001
❌ Soporte 24/7 en vivo
❌ SLA contractual (implementar Fase 2)

═══════════════════════════════════════════════════════════════════════════════

DESGLOSE PRESUPUESTARIO

PRESUPUESTO TOTAL: $5,000,000 CLP

Composición:

┌─────────────────────────────────────────────────────────────┐
│ CONCEPTO                          │ PORCENTAJE │ MONTO CLP  │
├─────────────────────────────────────────────────────────────┤
│ Desarrollo Backend                │ 45%        │ $2,250,000 │
│ Testing & QA                      │ 10%        │ $500,000   │
│ Infrastructure & DevOps           │ 5%         │ $250,000   │
│ Documentación & Training          │ 5%         │ $250,000   │
│ Seguridad & Compliance            │ 10%        │ $500,000   │
│ Project Management & Overhead     │ 10%        │ $500,000   │
│ Contingencia (Buffer)             │ 15%        │ $750,000   │
└─────────────────────────────────────────────────────────────┘

NOTA: Infraestructura (hosting, base de datos, storage) utiliza servicios 
GRATUITOS de Vercel, Supabase y Vercel Blob Storage. No hay costo de 
infraestructura recurrente en el MVP.

═══════════════════════════════════════════════════════════════════════════════

ESTRUCTURA DE PAGOS - 3 HITOS

MODELO: Pago por hito de entrega (de Riesgo compartido)

HITO 1 - FUNDACIÓN (Semanas 1-3)
┌──────────────────────────────────────────────────────────────┐
│ Porcentaje: 40% del presupuesto total                        │
│ Monto: $2,000,000 CLP                                        │
│ Plazo de Pago: Al firmar contrato                            │
├──────────────────────────────────────────────────────────────┤
│ DELIVERABLES:                                                │
│                                                              │
│ ✓ Infraestructura completamente configurada                 │
│   - Supabase project con RLS habilitado                      │
│   - Vercel deployment automático                             │
│   - CI/CD con GitHub Actions                                 │
│                                                              │
│ ✓ Database schema completo y testeado                       │
│   - Tablas: images, comparisons, api_keys, usage_logs       │
│   - Indexes para performance                                 │
│   - RLS policies configuradas                               │
│                                                              │
│ ✓ Autenticación API key (SHA-256)                           │
│   - Generación de API keys                                   │
│   - Validación y seguridad                                   │
│   - Rate limiting básico (10 req/min por key)               │
│                                                              │
│ ✓ Upload de imágenes endpoint                               │
│   - POST /api/v1/images (multipart/form-data)               │
│   - Validación de formatos (JPEG, PNG, WebP, TIFF)          │
│   - Límite de 50MB por imagen                               │
│   - Storage en Vercel Blob                                  │
│                                                              │
│ ✓ Error handling estandarizado                              │
│ ✓ Health check endpoint (GET /health)                       │
│ ✓ Logging y auditoría básica                                │
│ ✓ Documentación API (Swagger/OpenAPI)                       │
│ ✓ 50% test coverage                                         │
│                                                              │
│ CRITERIO DE ACEPTACIÓN:                                      │
│ • Todos los endpoints respondiendo sin errores              │
│ • Rate limiting funcionando correctamente                   │
│ • Database con datos de prueba                              │
│ • CI/CD pipeline pasando todos los tests                    │
│ • Documentación actualizada                                 │
│ • Sign-off de cliente (validación técnica)                  │
└──────────────────────────────────────────────────────────────┘

HITO 2 - MOTOR DE COMPARACIÓN (Semanas 4-6)
┌──────────────────────────────────────────────────────────────┐
│ Porcentaje: 30% del presupuesto total                        │
│ Monto: $1,500,000 CLP                                        │
│ Plazo de Pago: Al completar Hito 2 (fin Semana 6)           │
├──────────────────────────────────────────────────────────────┤
│ DELIVERABLES:                                                │
│                                                              │
│ ✓ Comparación de imágenes (endpoint core)                   │
│   - POST /api/v1/compare (image_a_id, image_b_id)          │
│   - Respuesta en <100ms (p95)                               │
│                                                              │
│ ✓ Algoritmo SHA-256 implementado                            │
│   - Detección de duplicados exactos                         │
│   - Comparación bit-a-bit                                   │
│   - Score 0 si exacto, 100 si diferente                     │
│                                                              │
│ ✓ Algoritmo pHash implementado                              │
│   - Perceptual hash de 64-bit                               │
│   - Distancia Hamming <15 = similar                         │
│   - Resistente a cambios menores (rotación, escala)        │
│                                                              │
│ ✓ Clasificación en 5 categorías                             │
│   - exact_match (100% igual)                                │
│   - near_duplicate (85-100% similar)                        │
│   - visually_similar (60-85% similar)                       │
│   - partially_similar (30-60% similar)                      │
│   - different (<30% similar)                                │
│                                                              │
│ ✓ Scoring ponderado                                         │
│   - Combina SHA-256 + pHash                                 │
│   - Pesos: 60% pHash, 40% SHA-256                           │
│   - Score final 0-100%                                      │
│                                                              │
│ ✓ Endpoint de historial                                     │
│   - GET /api/v1/comparisons (listar todas)                 │
│   - GET /api/v1/comparisons/:id (detalle)                  │
│   - Filtrado por fecha, resultado, usuario                 │
│                                                              │
│ ✓ Usage tracking                                            │
│   - GET /api/v1/usage (estadísticas)                        │
│   - Comparaciones realizadas                                │
│   - Storage utilizado                                       │
│   - Rate limit status                                       │
│                                                              │
│ ✓ Performance optimization                                  │
│   - Caching de hashes                                       │
│   - Database indexes                                        │
│   - Query optimization                                      │
│                                                              │
│ ✓ 65% test coverage                                         │
│ ✓ Documentación completa de endpoints                       │
│ ✓ Ejemplos de integración (Python, cURL, JS)               │
│                                                              │
│ CRITERIO DE ACEPTACIÓN:                                      │
│ • Compare endpoint retorna resultados correctos             │
│ • Latencia <100ms en 95% de casos                           │
│ • Scoring correcto en 100 test cases                        │
│ • 65% código cubierto por tests                             │
│ • Sin bugs críticos o P0                                    │
│ • Documentación con ejemplos reales                         │
│ • Sign-off de cliente (validación funcional)                │
└──────────────────────────────────────────────────────────────┘

HITO 3 - PRODUCCIÓN Y LANZAMIENTO (Semanas 7-9)
┌──────────────────────────────────────────────────────────────┐
│ Porcentaje: 30% del presupuesto total                        │
│ Monto: $1,500,000 CLP                                        │
│ Plazo de Pago: Al completar Hito 3 (fin Semana 9)           │
├──────────────────────────────────────────────────────────────┤
│ DELIVERABLES:                                                │
│                                                              │
│ ✓ Testing exhaustivo                                        │
│   - Unit tests (80% coverage)                               │
│   - Integration tests (todos los endpoints)                 │
│   - Load testing (1000+ req/seg)                            │
│   - Security testing (OWASP top 10)                         │
│   - Regression testing                                      │
│                                                              │
│ ✓ Security & Compliance                                     │
│   - Audit de seguridad completo                             │
│   - OWASP top 10 checklist                                  │
│   - SQL injection prevention                                │
│   - Rate limiting hardened                                  │
│   - CORS configuration                                      │
│   - Encryption en tránsito (HTTPS obligatorio)              │
│                                                              │
│ ✓ Performance optimization                                  │
│   - Latencia p99 <150ms                                     │
│   - Throughput: 1000+ req/seg                               │
│   - Database query optimization                             │
│   - Cache strategy implementation                           │
│   - CDN configuration                                       │
│                                                              │
│ ✓ Monitoring & Observability                                │
│   - Sentry integration (error tracking)                     │
│   - Vercel Analytics                                        │
│   - Custom dashboard de métricas                            │
│   - Uptime monitoring (99% target)                          │
│   - Log aggregation                                         │
│                                                              │
│ ✓ Documentación Production-Ready                            │
│   - OpenAPI spec completo                                   │
│   - Guía de integración paso-a-paso                         │
│   - Ejemplos en Python, cURL, JavaScript                   │
│   - Troubleshooting guide                                   │
│   - Release notes                                           │
│                                                              │
│ �� Deployment a Producción                                   │
│   - Blue-green deployment                                   │
│   - Rollback strategy                                       │
│   - Production monitoring activo                            │
│   - Backups automatizados                                   │
│   - Disaster recovery plan                                  │
│                                                              │
│ ✓ Training & Handoff                                        │
│   - Documentación de operaciones                            │
│   - Training al equipo del cliente (2 sesiones)             │
│   - Knowledge transfer                                      │
│   - Support durante primeros 7 días                         │
│                                                              │
│ ✓ 80%+ test coverage                                        │
│ ✓ Zero critical bugs                                        │
│ ✓ API listo para clientes externos                          │
│                                                              │
│ CRITERIO DE ACEPTACIÓN:                                      │
│ • 80% code coverage con tests pasando                       │
│ • Cero bugs P0 o P1                                         │
│ • Security audit completado sin hallazgos críticos          │
│ • Performance testing exitoso (1000+ req/seg)               │
│ • Documentación completa y revisada                         │
│ • Equipo capacitado en operación                            │
│ • API en producción y accesible públicamente                │
│ • Monitoring activo y alertas configuradas                  │
│ • Sign-off de cliente (validación producción)               │
└──────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

CRONOGRAMA DETALLADO

SEMANA 1-3 (HITO 1 - FUNDACIÓN)
├─ Semana 1: Setup, DB schema, auth
├─ Semana 2: Image upload, rate limiting
├─ Semana 3: Error handling, docs, tests (50% coverage)
└─ PAGO 1: $2,000,000 CLP (40%) ✓

SEMANA 4-6 (HITO 2 - COMPARACIÓN)
├─ Semana 4: SHA-256 + pHash implementation
├─ Semana 5: Clasificación, endpoints de historial
├─ Semana 6: Performance, tests (65% coverage)
└─ PAGO 2: $1,500,000 CLP (30%) ✓

SEMANA 7-9 (HITO 3 - PRODUCCIÓN)
├─ Semana 7: Testing exhaustivo, security audit
├─ Semana 8: Performance optimization, monitoring
├─ Semana 9: Final testing, documentation, launch
└─ PAGO 3: $1,500,000 CLP (30%) ✓

SEMANA 10-12: Buffer de contingencia (incluido en presupuesto)

═══════════════════════════════════════════════════════════════════════════════

EQUIPO DEL PROYECTO

RECURSOS ASIGNADOS:

1. Lead Developer (Full-time)
   - Responsabilidades:
     * Arquitectura técnica
     * Code review
     * Decisiones técnicas principales
     * DevOps & deployment
   - Experiencia requerida: 5+ años backend, Node.js/TypeScript

2. Mid-Level Developer (Full-time)
   - Responsabilidades:
     * Implementación de features
     * Testing
     * Bug fixes
     * Documentación de código
   - Experiencia requerida: 3+ años desarrollo backend

3. Senior Technical Review (5 horas/semana)
   - Responsabilidades:
     * Validación de arquitectura
     * Security review
     * Performance analysis
     * Risk mitigation

TOTAL: 2.5 FTE (Full-Time Equivalent)

═══════════════════════════════════════════════════════════════════════════════

TECNOLOGÍA & INFRAESTRUCTURA

STACK TECNOLÓGICO:
• Runtime: Node.js 18+
• Framework: Next.js 16 (App Router)
• Lenguaje: TypeScript
• Base de Datos: PostgreSQL (Supabase)
• Storage: Vercel Blob
• Hosting: Vercel
• Testing: Jest/Vitest + Supertest
• Monitoreo: Sentry + Uptime Robot
• CI/CD: GitHub Actions

INFRAESTRUCTURA:
• Hosting: Vercel (gratuito)
• Database: Supabase free tier (500MB)
• Blob Storage: Vercel Blob (1000 files gratuitos)
• Monitoring: Sentry (free tier) + Uptime Robot (free)
• DNS: Vercel (incluido)
• Email: SendGrid (si necesario, free tier)

COSTO INFRAESTRUCTURA RECURRENTE: $0 USD durante MVP
(Luego de lanzamiento: ~$200-500 USD/mes si se escala)

═══════════════════════════════════════════════════════════════════════════════

TÉRMINOS Y CONDICIONES

METODOLOGÍA:
• Agile/Scrum: Sprints de 1 semana
• Standups diarios: 15 min (9:00 AM hora local)
• Revisiones: Viernes 3:00 PM (1 hora)
• Retrospectivas: Última reunión de cada hito

COMUNICACIÓN:
• Canal principal: Slack (workspace compartido)
• Reuniones: Zoom (link permanente)
• Documentación: GitHub wiki + Notion (compartido)
• Status reports: Semanales en viernes

ENTREGA Y ACEPTACIÓN:
• Todos los deliverables en repositorio GitHub privado
• Código debe pasar:
  - ESLint y Prettier
  - Unit tests (80% coverage en Hito 3)
  - Build sin errores
  - Deployment exitoso a staging
• Aceptación requerida del cliente antes de pago

GARANTÍAS:
✓ Código limpio y bien documentado
✓ Tests cubriendo 80% del código (Hito 3)
✓ Performance SLA: <100ms latencia p95
✓ Uptime: 99% durante primer mes

NO GARANTIZADO:
✗ Bugs post-lanzamiento (soporte separado)
✗ Crecimiento de usuarios >1000 req/seg sin optimización
✗ Downtime por causas externas (Vercel, Supabase)

CAMBIOS DE SCOPE:
• Cualquier cambio requiere análisis y presupuesto adicional
• Cambios menores (<4 horas): Asorbidos en contingencia
• Cambios mayores: Requieren documento formal y autorización
• Priorización: Lead dev + cliente acuerdan

CANCELACIÓN:
• Pre-Hito 1: Reembolso 100%
• Durante Hito 1 (antes de pago): Reembolso 100%
• Después Hito 1: Cobra 40% + costos incurridos
• Después Hito 2: Cobra 70% + costos incurridos
• Después Hito 3: Cobra 100% (proyecto completado)

CONFIDENCIALIDAD:
• Ambas partes se comprometen a confidencialidad
• Código fuente: Propiedad del cliente (100% transfer)
• Documentación: Propiedad conjunta
• IP terceros: Atribuciones incluidas

═══════════════════════════════════════════════════════════════════════════════

RIESGOS Y MITIGACIÓN

RIESGO NIVEL MITIGACIÓN
─────────────────────────────────────────────────────────────────────────────
Team turnover        🔴 ALTO   • Documentación exhaustiva
                               • Code review diario
                               • Knowledge sharing sesiones

Scope creep          🔴 ALTO   • Scope bien definido
                               • Change control process
                               • Weekly steering meetings

Performance issues   🟡 MEDIO  • Load testing semanal
                               • Performance budget defined
                               • Optimization sprints

Security vulns       🟡 MEDIO  • Security review weekly
                               • OWASP checklist
                               • Penetration testing

DB storage limits    🟢 BAJO   • Supabase free = 500MB
                               • Upgrade plan ready
                               • Compression strategy

Deployment issues    🟢 BAJO   • Blue-green deployment
                               • Automated rollback
                               • Staging environment
─────────────────────────────────────────────────────────────────────────────

CONTINGENCIA:
• Buffer de tiempo: Semanas 10-12 (reservadas)
• Buffer de presupuesto: 15% ($750k) para imprevistos
• Escalation path: Lead dev → Client CTO
• Risk review: Semanal en Friday meetings

═══════════════════════════════════════════════════════════════════════════════

COMO EMPEZAR

PRÓXIMOS PASOS:

1. APROBACIÓN DE PROPUESTA
   □ Revisar documento completo
   □ Validar scope con stakeholders
   □ Aprobar presupuesto $5M CLP
   □ Confirmar equipo disponible

2. CONTRATACIÓN (1 semana)
   □ Firmar contrato de desarrollo
   □ Procesar primer pago ($2M hito 1)
   □ Acceso a systems: GitHub, Vercel, Supabase
   □ Crear workspace compartido (Slack, Notion)

3. KICKOFF (Día 1)
   □ Reunión kickoff (1 hora)
   □ Setup de ambiente local
   □ Primer standup
   □ Asignación de tareas Semana 1

4. DESARROLLO (Semanas 1-9)
   □ Seguir cronograma semanal
   □ Validaciones de hito (Friday reviews)
   □ Pagos de hito al completarse

5. LANZAMIENTO (Semana 9)
   □ Deployment a producción
   □ Pago final ($1.5M hito 3)
   □ Handoff y training
   □ Período de 7 días de soporte

═══════════════════════════════════════════════════════════════════════════════

INVERSIÓN RESUMEN

PRESUPUESTO TOTAL: $5,000,000 CLP

DESGLOSE DE PAGOS:

Hito 1 (Fundación)      40%    $2,000,000 CLP
Hito 2 (Comparación)    30%    $1,500,000 CLP
Hito 3 (Producción)     30%    $1,500,000 CLP
────────────────────────────────────────────────
TOTAL                  100%    $5,000,000 CLP

OPCIÓN DE PAGO 1: Por hito (recomendado)
• 40% al firmar contrato (Semana 1 Día 1)
• 30% al completar Hito 2 (Fin Semana 6)
• 30% al completar Hito 3 (Fin Semana 9)

OPCIÓN DE PAGO 2: Mensual (bajo demanda)
• 3 cuotas mensuales de $1,666,667 CLP
• Mes 1 (Semana 1-4)
• Mes 2 (Semana 5-8)
• Mes 3 (Semana 9-12)

OPCIÓN DE PAGO 3: Único (descuento 5%)
• Pago total: $4,750,000 CLP (ahorro: $250k)
• Válido por 7 días desde propuesta

═══════════════════════════════════════════════════════════════════════════════

VALIDEZ Y PRÓXIMAS ACCIONES

VALIDEZ DE PROPUESTA: 30 días desde fecha de emisión
Fecha de Emisión: 11 de mayo de 2026
Vigencia hasta: 10 de junio de 2026

PARA ACEPTAR ESTA PROPUESTA:

1. Firma de cliente autorizado (representante legal)
2. Correo de aceptación formal
3. Transferencia de primer pago ($2M hito 1) O
   Firma de contrato de pago con términos

CONTACTO COMERCIAL:
[Nombre representante comercial]
[Email]
[Teléfono]

CONTACTO TÉCNICO:
[Nombre lead developer]
[Email]
[Teléfono]

═══════════════════════════════════════════════════════════════════════════════

ANEXO A - DEFINICIONES

API KEY: Token de autenticación única para cada organización/usuario

pHash: Perceptual Hash - algoritmo que genera firma de 64-bit de imagen basada 
en características visuales. Dos imágenes similares tienen pHash similar.

SHA-256: Algoritmo criptográfico que genera hash de 256-bit único. Mismo hash 
solo si archivos son bit-a-bit idénticos.

RLS: Row-Level Security - política de seguridad en base de datos que restringe 
acceso a datos por usuario/organización.

SLA: Service Level Agreement - compromiso de disponibilidad/performance.

HITO: Punto de entrega con criterios de aceptación definidos y pago asociado.

TEST COVERAGE: Porcentaje de código ejecutado por tests automatizados.

═══════════════════════════════════════════════════════════════════════════════

ANEXO B - REFERENCIAS Y EJEMPLOS

CASOS DE USO DOCUMENTADOS:

1. Protección de Marca (Legal)
   - Detecta conflictos de marca antes de registro INAPI
   - Estudios jurídicos validan similitud visual
   - Reportes exportables para trámites

2. Detección de Falsificación (E-commerce)
   - Marketplaces validan autenticidad de productos
   - Compara con catálogo oficial
   - Previene venta de contrabando

3. Validación de Diseño (Creative)
   - Diseñadores verifican originalidad
   - Compara contra referencias de inspiración
   - Documentación de proceso creativo

4. QA Visual (Ingeniería)
   - Detecta regresiones visuales en interfaces
   - Integración en CI/CD pipeline
   - Comparación automated de builds

═══════════════════════════════════════════════════════════════════════════════

FIRMA Y ACEPTACIÓN

Esta propuesta es válida por 30 días desde la fecha de emisión.

POR EL PROVEEDOR:

Nombre: ___________________________
Cargo: ____________________________
Empresa: __________________________
Firma: ____________________________
Fecha: ____________________________


POR EL CLIENTE:

Nombre: ___________________________
Cargo: ____________________________
Empresa: __________________________
Firma: ____________________________
Fecha: ____________________________


Autorizado por (si aplica):
Nombre: ___________________________
Cargo: ____________________________
Firma: ____________________________
Fecha: ____________________________

═══════════════════════════════════════════════════════════════════════════════

DOCUMENTO CONFIDENCIAL

Prohibida la reproducción o distribución sin autorización previa.
Esta propuesta contiene información confidencial y de propiedad intelectual.

Fecha Emisión: 11 de mayo de 2026
Versión: 1.0
Estado: OFICIAL - LISTO PARA PRESENTACIÓN
