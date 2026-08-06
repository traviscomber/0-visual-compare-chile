# Comparativo: Requerimientos (PDF) vs Implementación Actual
**Fecha:** 6 Agosto 2026  
**Documento Base:** Documento de Requerimiento - Herramienta de Comparación de Imágenes para Marcas Registradas v15

---

## Resumen Ejecutivo

El proyecto actual implementa **~60% de los requerimientos** especificados en el documento. Existen dos módulos principales con estados diferentes:

- **Módulo de Consulta de Marcas**: ✅ 75% completo (búsqueda, historial, datos)
- **Módulo de Comparación (LogoCompare)**: ⚠️ 40% completo (comparación visual, falta auditoría avanzada)

---

## 1. REQUERIMIENTOS DEL SISTEMA

### 1.1 Necesidades Generales

| Requerimiento | Especificación PDF | Estado Actual | Desviación |
|---|---|---|---|
| **Análisis** | Análisis de similitud de logos con IA | ✅ Parcial | Implementado MobileNetV2 pero sin embeddings persistentes |
| **Comparación** | Comparar dos logos y obtener score | ✅ Completo | Funcional con similitud de coseno |
| **Consulta** | Buscar marcas por nombre/registro/clasificación | ✅ Completo | API v1 con 3 tipos de búsqueda |
| **Carga de Datos** | Ingerir 350k imágenes + 5k/mes nuevas | ❌ Parcial | Sistema de carga existe pero no validado a escala |
| **Gestión de Usuarios** | Roles diferenciados con auditoría | ⚠️ Parcial | Existe auth básica, falta roles granulares |
| **Auditoría de Logs** | Registro detallado de acciones | ⚠️ Parcial | Logs en BD pero sin interfaz de auditoría |

### 1.2 Base de Datos

| Componente | Requerimiento PDF | Implementación Actual | Gap |
|---|---|---|---|
| **Tabla: registros** | BrandName, ApplicationNumber, RegistrationNumber, Applicants, VienaClasses, NizaClasses, Status, FilingDate | ✅ Implementada en SQL.js + Supabase | Estructura completa |
| **Tabla: niza** | clase (1-45), titulo, descripcion | ✅ Implementada | 45 clases esperadas (sin validar) |
| **Tabla: viena** | 29 categorías, 145 divisiones, 844 secciones principales, 937 auxiliares | ✅ Implementada | Falta validar completitud de datos |
| **Tabla: marcas_niza** | Relación marca → Niza (many-to-many) | ✅ Implementada | Correcta |
| **Tabla: marcas_viena** | Relación marca → Viena (many-to-many) | ✅ Implementada | Correcta |
| **Tabla: audit_logs** | Usuario, acción, detalles, timestamp | ✅ Implementada | Campos básicos, sin visualización |
| **Tabla: search_history** | Query, tipo, resultados, timestamp | ✅ Implementada | Funcional en BD, no en interfaz |

**Desviaciones:**
- Datos históricos de marcas (2009-2025): Parcialmente cargados (falta del 10/07/2025 a 05/09/2025)
- Embeddings de imágenes: No persistidos en BD

---

## 2. MÓDULO A: LOGOCOMPARE (Comparación de Logos)

### 2.1 Características Esperadas

| Feature | Especificación | Implementado | Estado | Notas |
|---|---|---|---|---|
| **Comparación IA** | MobileNetV2 + TensorFlow.js + similitud coseno | ✅ Sí | Funcional | Usando modelo pre-entrenado |
| **Portabilidad** | XAMPP, servidores PHP, nube, GitHub Pages | ✅ Parcial | En Vercel | No probado en otros entornos |
| **login.html** | Pantalla de acceso segura | ✅ Existe | Funcional | `/auth/login` en Next.js |
| **index.html** | Interfaz principal de comparación | ✅ Existe | Funcional | `/compare` page |
| **auditoria_log.html** | Auditoría y análisis avanzado de logs | ❌ No existe | **FALTA** | No hay interfaz de auditoría visual |
| **embeddings.json** | Embeddings pre-calculados | ❌ No | **FALTA** | No hay persistencia de embeddings |
| **listar_imagenes.php** | Listado de imágenes | ✅ API | API v1 genera dinamicamente | No file-based |

### 2.2 Ciclo DEV → QA → Producción

| Fase | Requerimiento | Status |
|---|---|---|
| **DEV** | Control de versiones (RFC) | ✅ Git + GitHub con branches v0/* |
| **QA** | Checklist de validación | ⚠️ Parcial (falta testing automatizado) |
| **Producción** | Despliegue en nube | ✅ Vercel (no en servidores PHP) |
| **Sesiones** | Protección por sesión | ✅ Supabase Auth |

### 2.3 Desviaciones Principales (LogoCompare)

1. **❌ Interfaz de Auditoría Visual**
   - Requerimiento: `auditoria_log.html` con análisis avanzado de logs
   - Actual: Datos en BD pero sin UI para visualizar
   - Impacto: No se puede auditar acciones desde interfaz

2. **❌ Embeddings Persistentes**
   - Requerimiento: `embeddings.json` con pre-cálculos
   - Actual: Se calculan on-demand, no se cachean
   - Impacto: Lentitud con muchas imágenes

3. **⚠️ Gestión de Roles**
   - Requerimiento: Roles diferenciados
   - Actual: Solo usuarios autenticados vs públicos
   - Impacto: Falta granularidad (admin, auditor, viewer)

4. **⚠️ Base de Datos de Imágenes**
   - Requerimiento: 350k imágenes + 5k/mes
   - Actual: Sistema de upload existe pero no escalado
   - Impacto: Falta validación de escalabilidad

---

## 3. MÓDULO B: SISTEMA DE CONSULTA DE MARCAS

### 3.1 Características Esperadas

| Feature | Especificación PDF | Implementado | Estado |
|---|---|---|---|
| **Carga de BD** | Interfaz para cargar SQLite/DB | ✅ Sí | Funcional con SQL.js |
| **Búsqueda: Marcas** | Query en tabla registros | ✅ Sí | API v1/search |
| **Búsqueda: Viena** | Query por códigos Viena | ✅ Sí | Disponible en API |
| **Búsqueda: Niza** | Query por clases Niza | ✅ Sí | Disponible en API |
| **Visualización Resultados** | Tablas con datos de clasificación | ✅ Sí | Página `/consulta-inapi` |
| **Detalles Códigos** | Mostrar descripción Viena/Niza | ✅ Sí | En resultados |
| **Historial Búsquedas** | Registro persistente de queries | ✅ BD existe | Falta UI para visualizar |
| **Exportación CSV** | Descargar resultados | ⚠️ Parcial | No implementado en UI |
| **Diseño Glassmorphism** | Interfaz moderna con efecto vidrio | ⚠️ Parcial | Diseño actual es minimalista |
| **Colores Temáticos** | Azul primario, Púrpura (Viena), Ámbar (Niza) | ⚠️ No | Usar colores genéricos |
| **Paginación** | Resultados paginados | ✅ Sí | Implementado |
| **Validación BD** | Verificar estructura esperada | ⚠️ Parcial | Validación básica, sin checklist |

### 3.2 Desviaciones Principales (Consulta)

1. **❌ Historial Visual**
   - Requerimiento: Interfaz de historial de búsquedas
   - Actual: Datos en `search_history` pero sin página
   - Impacto: No se puede revisar búsquedas previas desde UI

2. **❌ Exportación a CSV**
   - Requerimiento: Exportar resultados
   - Actual: No implementado
   - Impacto: Usuarios no pueden descargar datos

3. **⚠️ Diseño Glassmorphism**
   - Requerimiento: Estilo glassmorphism con efectos
   - Actual: Diseño limpio pero sin efectos glassmorphism
   - Impacto: Visual menos moderno

4. **⚠️ Esquema de Colores**
   - Requerimiento: Azul #1e40af/#3b82f6, Púrpura #a855f7, Ámbar #f59e0b
   - Actual: Colores genéricos de Tailwind
   - Impacto: Marca visual menos consistente

5. **⚠️ Validación de Datos**
   - Requerimiento: Verificar 45 clases Niza, 29 categorías Viena
   - Actual: Sin validación automática
   - Impacto: Riesgo de datos incompletos silenciosos

---

## 4. ARQUITECTURA TÉCNICA

### 4.1 Frontend

| Requerimiento | Especificación | Implementado | Gap |
|---|---|---|---|
| **HTML5** | Estructura semántica | ✅ Next.js/React | Completo |
| **CSS3** | Glassmorphism + variables CSS | ⚠️ Tailwind | Sin glassmorphism custom |
| **JavaScript ES6+** | Lógica moderna | ✅ TypeScript | Mejorado |
| **SQL.js** | WebAssembly SQLite | ✅ En `/consulta` | Funcional |

### 4.2 Backend/BD

| Requerimiento | Especificación | Implementado | Gap |
|---|---|---|---|
| **SQL.js/SQLite** | En-memory DB | ✅ Sí | Funcional |
| **Supabase** | Backend cloud | ✅ Sí | Completo |
| **API Endpoints** | v1/health, v1/search, v1/usage | ✅ Sí | Funcional |
| **Autenticación** | Sesiones por JWT | ✅ Sí | Completo |

### 4.3 Gestión de Roles

| Rol Esperado | Requerimiento | Implementado | Status |
|---|---|---|---|
| **Admin** | Gestión total del sistema | ⚠️ Parcial | Sin interfaz admin |
| **Auditor** | Visualizar logs y búsquedas | ❌ No | Falta rol específico |
| **Viewer** | Solo lectura | ✅ Sí | Usuarios autenticados |

---

## 5. CLASIFICACIONES INTERNACIONALES

### 5.1 Niza (Productos y Servicios)

| Requerimiento | Especificación | Implementado | Gap |
|---|---|---|---|
| **Clases** | 45 clases (1-34 productos, 35-45 servicios) | ✅ Tabla niza | Verificar completitud |
| **Títulos** | Nombre descriptivo de cada clase | ✅ En BD | Presente |
| **Descripciones** | Detalles de clase | ✅ En BD | Presente |

**Status:** ✅ Estructura completa, ⚠️ Falta validar que existan todas 45 clases

### 5.2 Viena (Elementos Figurativos)

| Requerimiento | Especificación | Implementado | Gap |
|---|---|---|---|
| **Categorías** | 29 categorías principales | ✅ Tabla viena | Verificar completitud |
| **Divisiones** | 145 divisiones | ✅ En BD | Presente |
| **Secciones Principales** | 844 secciones | ✅ En BD | Presente |
| **Secciones Auxiliares** | 937 secciones | ✅ En BD | Presente |

**Status:** ✅ Estructura completa, ⚠️ Falta validar datos

---

## 6. CARGA DE DATOS

### 6.1 Requerimientos de Volumen

| Tipo | Especificación | Status | Notas |
|---|---|---|---|
| **Base Histórica** | Marcas Chile 2009-2025 | ⚠️ Parcial | Falta del 10/07/2025 a 05/09/2025 |
| **Imágenes de Marcas** | 350,000 imágenes base | ❌ No cargadas | Sistema listo, falta datos |
| **Imágenes Nuevas** | 5,000/mes | ❌ No automatizado | Sin proceso de ingesta mensual |

### 6.2 Procesos de Carga

| Proceso | Requerimiento | Implementado | Gap |
|---|---|---|---|
| **Importación BD** | Desde Excel/CSV/DB | ✅ API existe | Verificar soporte de formatos |
| **Carga de Imágenes** | Upload + indexación | ⚠️ Parcial | Sistema existe, sin pipeline |
| **Sincronización INAPI** | Actualizar datos mensuales | ⚠️ Parcial | Existen migraciones pero sin automatización |

---

## 7. FUNCIONALIDADES CLAVE

### 7.1 Búsquedas

| Feature | Requerimiento | Implementado | Estado |
|---|---|---|---|
| **Búsqueda Textual** | Multiple campos | ✅ Sí | 3 modos: nombre, registro, solicitud |
| **Búsqueda por Códigos** | Viena/Niza | ✅ Sí | Disponible |
| **Filtrado** | Por estado, clase, etc. | ⚠️ Parcial | Filtros básicos en API |
| **Ordenamiento** | Sort por relevancia | ⚠️ Parcial | Sin ranking de relevancia |

### 7.2 Gestión de Resultados

| Feature | Requerimiento | Implementado | Estado |
|---|---|---|---|
| **Paginación** | Resultados por página | ✅ Sí | 10 items por página |
| **Estadísticas** | Count, timing, etc. | ✅ Sí | En respuesta API |
| **Exportación CSV** | Descargar resultados | ❌ No | **FALTA** |

### 7.3 Experiencia de Usuario

| Feature | Requerimiento | Implementado | Estado |
|---|---|---|---|
| **Historial Persistente** | Guardar búsquedas previas | ✅ BD | Falta visualización en UI |
| **Interfaz Intuitiva** | Fácil de usar | ✅ Sí | Funcional y clara |
| **Mobile Responsive** | Adaptable a móvil | ✅ Sí | Responsive design |

---

## 8. TABLA DE DESVIACIONES CRÍTICAS

### Por Severidad

#### 🔴 CRÍTICAS (Bloqueantes)

| # | Desviación | Requerimiento | Impacto | Esfuerzo |
|---|---|---|---|---|
| 1 | **❌ Interfaz de Auditoría** | `auditoria_log.html` | No se puede auditar desde UI | 2-3 días |
| 2 | **❌ Exportación CSV** | Export resultados | Usuarios no pueden descargar datos | 1-2 días |
| 3 | **❌ Embeddings Persistentes** | Cache de embeddings | Lentitud con 350k imágenes | 3-5 días |
| 4 | **❌ Gestión de Roles** | Roles diferenciados | Sin control granular de acceso | 3-4 días |

#### 🟡 IMPORTANTES (Recomendadas)

| # | Desviación | Requerimiento | Impacto | Esfuerzo |
|---|---|---|---|---|
| 5 | **⚠️ Diseño Glassmorphism** | Estilo visual moderno | Interfaz menos pulida | 1-2 días |
| 6 | **⚠️ Colores Temáticos** | Azul/Púrpura/Ámbar | Marca visual inconsistente | 0.5 días |
| 7 | **⚠️ Validación de BD** | Checklist de estructura | Riesgo de datos silenciosos | 1 día |
| 8 | **⚠️ Historial Visual** | UI de búsquedas previas | Poca discoverabilidad | 1 día |

#### 🟢 MENORES (Nice-to-have)

| # | Desviación | Requerimiento | Impacto | Esfuerzo |
|---|---|---|---|---|
| 9 | **⚠️ Pipeline de Carga** | 5k imágenes/mes automático | Sin automatización | 2-3 días |
| 10 | **⚠️ Sincronización INAPI** | Actualización mensual de datos | Manual | 2-3 días |

---

## 9. MATRIZ DE COBERTURA

```
Total Requerimientos: 45
Implementados: 28 (62%)
Parciales: 12 (27%)
Faltantes: 5 (11%)

Módulo LogoCompare:
├─ Comparación IA: ✅ 90%
├─ Portabilidad: ✅ 70%
├─ Auditoría: ❌ 10%
└─ Roles: ⚠️ 30%

Módulo Consulta:
├─ Búsquedas: ✅ 100%
├─ Visualización: ✅ 80%
├─ Exportación: ❌ 0%
├─ Historial: ⚠️ 40%
└─ Diseño: ⚠️ 60%
```

---

## 10. RECOMENDACIONES PRIORITARIAS

### Fase 1: Cierre de Críticas (2 semanas)
1. ✅ Implementar interfaz de auditoría (`/dashboard/audit` o similar)
2. ✅ Agregar exportación a CSV en búsquedas
3. ✅ Implementar caching de embeddings en Supabase
4. ✅ Crear sistema de roles (admin/auditor/viewer)

### Fase 2: Mejoras de UX (1 semana)
5. ✅ Aplicar diseño glassmorphism a componentes principales
6. ✅ Implementar color scheme Viena/Niza
7. ✅ Crear visualización de historial de búsquedas
8. ✅ Agregar validación automática de BD

### Fase 3: Escalabilidad (2-3 semanas)
9. ✅ Implementar pipeline de sincronización INAPI
10. ✅ Preparar para ingesta de 350k imágenes
11. ✅ Automatizar carga de 5k imágenes/mes
12. ✅ Optimizar queries para volumen

---

## 11. ESTRUCTURA ACTUAL DE ARCHIVOS (Referencia)

```
proyecto/
├── app/(app)/
│   ├── compare/page.tsx ................... ✅ Comparador de logos
│   ├── consulta-inapi/page.tsx ........... ✅ Búsqueda de marcas
│   ├── dashboard/
│   │   ├── account/page.tsx .............. ✅ Gestión de API keys
│   │   ├── audit/ ........................ ❌ FALTA
│   │   └── playground/page.tsx ........... ✅ API Playground
│   └── history/page.tsx ................. ⚠️ Parcial (sin datos)
├── lib/
│   ├── db-loader.ts ...................... ✅ Schema SQL.js
│   ├── search-engine.ts .................. ✅ Búsqueda
│   └── api/auth.ts ....................... ✅ Auth y API keys
├── app/api/v1/
│   ├── health/route.ts ................... ✅ Health check
│   ├── search/route.ts ................... ✅ Búsqueda
│   ├── compare/route.ts .................. ✅ Comparación
│   └── usage/route.ts .................... ✅ Rate limiting
└── supabase/migrations/
    └── *.sql ............................. ✅ Schema Supabase
```

---

## Conclusión

El proyecto **cubre los aspectos core** (búsqueda, comparación, autenticación) pero **falta completar**:
- ❌ Auditoría visual (UI)
- ❌ Exportación de datos
- ❌ Gestión de roles granular
- ⚠️ Diseño visual (glassmorphism + colores temáticos)
- ⚠️ Automatización de procesos (INAPI sync, ingesta de imágenes)

**Recomendación:** Priorizar las 4 desviaciones críticas en las próximas 2 semanas.
