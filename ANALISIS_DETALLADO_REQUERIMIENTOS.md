# ANÁLISIS DETALLADO: REQUERIMIENTOS vs. ESTADO ACTUAL

**Documento Base:** Herramienta de Comparación de Imágenes para Marcas Registradas v16
**Fecha Análisis:** 05/09/2025
**Estado Actual:** Fase 0 (UI Básica)

---

## 1. CLASIFICACIÓN NIZA - REQUISITOS

### Estructura Required
- **Total:** 45 clases
- **Clases 1-34:** Productos (químicos, alimentos, ropa, vehículos, electrónica)
- **Clases 35-45:** Servicios (publicidad, financiero, telecom, educación, médicos)

### Campos Tabla `niza_classes`
```sql
CREATE TABLE niza_classes (
  clase INTEGER PRIMARY KEY,          -- 1-45
  titulo VARCHAR(255),                -- Nombre de la clase
  descripcion TEXT                    -- Descripción de qué se protege
);
```

### Ejemplos de Clases Niza
| Clase | Tipo | Descripción |
|-------|------|-------------|
| 32 | Producto | Cervezas, aguas, bebidas sin alcohol |
| 25 | Producto | Ropa, calzado, accesorios |
| 41 | Servicio | Educación, entretenimiento, actividades deportivas |
| 45 | Servicio | Servicios legales, seguros, finanzas |

### Estado Actual
- ❌ Tabla `niza_classes` NO creada
- ❌ 45 clases NO cargadas
- ❌ Búsqueda por Niza NO funcional
- ✅ UI para buscar por Niza DISEÑADA (pero sin datos)

---

## 2. CLASIFICACIÓN VIENA - REQUISITOS

### Estructura Jerárquica
```
29 Categorías Principales
  ├─ 145 Divisiones
  │   └─ 844 Secciones Principales
  │       └─ 937 Secciones Auxiliares
```

### Ejemplos de Categorías Viena
| Categoría | Descripción | Código |
|-----------|-------------|--------|
| 1 | Cuerpos celestes, fenómenos naturales | 01 |
| 2 | Seres humanos | 02 |
| 3 | Animales | 03 |
| 5 | Plantas | 05 |
| 13 | Elementos geométricos | 13 |
| 27 | Letras, alfabetos, números | 27 |

### Campos Tabla `vienna`
```sql
CREATE TABLE vienna (
  codigo INTEGER PRIMARY KEY,         -- Código jerárquico (ej: 010102)
  categoria INTEGER,                  -- Categoría (1-29)
  division INTEGER,                   -- División (1-145)
  seccion_principal INTEGER,          -- Sección Principal (1-844)
  seccion_auxiliar INTEGER,           -- Sección Auxiliar (1-937)
  descripcion TEXT                    -- Descripción visual
);
```

### Estado Actual
- ❌ Tabla `vienna` NO creada correctamente
- ❌ 29 categorías NO disponibles
- ❌ 145 divisiones NO cargadas
- ❌ 844 secciones principales NO procesadas
- ❌ Búsqueda por Viena NO funcional
- ✅ UI para buscar por Viena DISEÑADA (pero sin datos)

---

## 3. TABLA REGISTROS - REQUISITOS

### Marco Legal Chileno
- **Ley:** N° 19.039 (Propiedad intelectual - marcas)
- **Autoridad:** INAPI (Instituto Nacional de Propiedad Intelectual)
- **Período Histórico:** 2009 - 2025 (10+ años de datos)

### Campos Tabla `registros`
```sql
CREATE TABLE registros (
  id INTEGER PRIMARY KEY,
  BrandName VARCHAR(255),             -- Nombre de marca
  ApplicationNumber VARCHAR(50),      -- Número de solicitud
  RegistrationNumber VARCHAR(50),     -- Número de registro
  Applicants VARCHAR(255),            -- Solicitantes
  VienaClasses TEXT,                  -- Códigos Viena (JSON o delimitado)
  NizaClasses TEXT,                   -- Códigos Niza (JSON o delimitado)
  Status VARCHAR(50),                 -- Estado (Registrado, Rechazado, etc)
  FilingDate DATE,                    -- Fecha de presentación
  created_at TIMESTAMP                -- Fecha de ingreso
);
```

### Requisitos de Datos
- Datos de 2009 a 2025
- **Gap Actual:** 10 de Julio 2025 - 05 de Septiembre 2025 (FALTA CARGAR)
- Mínimo 10+ años de histórico
- Debe estar normalizado (limpios, sin duplicados)

### Estado Actual
- ❌ Tabla `registros` NO cargada
- ❌ 0 registros históricos cargados
- ❌ Datos 2009-2025 NO disponibles
- ❌ Gap Julio-Septiembre 2025 NO cubierto
- ✅ UI para consultar marcas DISEÑADA (pero sin datos reales)

---

## 4. COMPARADOR DE LOGOS - REQUISITOS

### Arquitectura Técnica
```javascript
Frontend (HTML5, CSS3, ES6+)
    ↓
SQL.js (WebAssembly SQLite)
    ↓
350,000 imágenes pre-procesadas
    ↓
MobileNetV2 + TensorFlow.js
    ↓
Embeddings (vectores 1280D)
    ↓
Similitud de Coseno (búsqueda rápida)
```

### Pipeline de IA
1. **Pre-procesamiento:** Normalización de imagen (224x224)
2. **Extracción de Features:** MobileNetV2
3. **Embeddings:** Vectores de 1280 dimensiones
4. **Almacenamiento:** BD con índices
5. **Búsqueda:** Similitud de coseno (threshold configurable)

### Datos Requeridos
- **350,000 imágenes:** Logos de marcas registradas
- **Carga Mensual:** 5,000 nuevas imágenes/mes
- **Formato:** JPG, PNG, SVG
- **Tamaño:** ~100GB almacenamiento total

### Estado Actual
- ❌ MobileNetV2 NO implementado
- ❌ TensorFlow.js NO integrado
- ❌ 0 imágenes cargadas
- ❌ 0 embeddings calculados
- ❌ Similitud de coseno NO funcional
- ✅ UI para subir logos DISEÑADA (pero sin análisis real)

---

## 5. MATRIZ DE COMPLETITUD

| Componente | Requerimiento | Estado | % Avance |
|-----------|--------------|--------|----------|
| **Base de Datos** | SQLite con 3 tablas | Parcial | 10% |
| - Tabla registros | 2009-2025 + Gap 7-9/25 | ❌ No cargada | 0% |
| - Tabla niza | 45 clases | ❌ No cargada | 0% |
| - Tabla vienna | 29 cat, 145 div, 844 sec | ❌ No cargada | 0% |
| **Búsqueda** | Full-text + códigos | UI solo | 20% |
| - Marcas por nombre | registros.BrandName | ❌ Sin datos | 0% |
| - Búsqueda Niza | niza_classes.clase | ❌ Sin datos | 0% |
| - Búsqueda Viena | vienna.codigo | ❌ Sin datos | 0% |
| **Comparador IA** | MobileNetV2 + embeddings | ❌ No existe | 0% |
| - Carga de 350K imgs | Storage + normalización | ❌ No existe | 0% |
| - Extracción features | TensorFlow.js | ❌ No existe | 0% |
| - Similitud coseno | Búsqueda vectorial | ❌ No existe | 0% |
| **Auditoría** | Logs de acciones | ❌ No existe | 0% |
| - Historial búsquedas | registros de query | ❌ No existe | 0% |
| - Gestión de roles | Admin/Analista/Auditor | ✅ Mock funcional | 30% |
| **UI/UX** | Interfaz completa | ✅ Diseñada | 100% |
| - Landing page | Hero + CTA | ✅ Funcional | 100% |
| - Dashboard | KPIs + módulos | ✅ Funcional | 100% |
| - Consulta módulo | Búsqueda UI | ✅ Funcional | 100% |
| - Comparador UI | Upload + resultados | ✅ Funcional | 100% |

---

## 6. BRECHA DE IMPLEMENTACIÓN

### CRÍTICO - Semana 1-2
```
❌ Cargar datos históricos 2009-2025 a tabla registros
❌ Crear 45 clases Niza con descripciones
❌ Crear estructura 29 categorías Viena + 145 divisiones + 844 secciones
❌ Validar integridad de clasificaciones OMPI
❌ Crear índices para búsqueda rápida
```

### ALTO - Semana 3-4
```
❌ Implementar MobileNetV2 + TensorFlow.js
❌ Pre-procesar 350,000 imágenes
❌ Calcular embeddings vectoriales
❌ Implementar similitud de coseno
❌ Crear API de búsqueda/comparación
```

### MEDIO - Semana 5-6
```
❌ Gestión de carga mensual (5K imgs/mes)
❌ Auditoría y logs
❌ Exportación a CSV
❌ Reportes administrativos
❌ Optimizaciones de caché
```

---

## 7. COMPARACIÓN: ESPERADO vs. ACTUAL

### Búsqueda de Marcas
**Esperado:**
```
Usuario busca "TROPICAL" 
  ↓
SQL Query: SELECT * FROM registros WHERE BrandName LIKE 'TROPICAL%'
  ↓
Resultado: 3 marcas encontradas con clasificaciones Viena/Niza
```

**Actual:**
```
Usuario busca "TROPICAL"
  ↓
Mock data retorna sin consultar BD
  ↓
Resultado: Placeholder sin datos reales
```

### Comparación de Logos
**Esperado:**
```
Usuario sube logo.jpg
  ↓
MobileNetV2 extrae features
  ↓
Busca similares en 350K imágenes (cosine similarity > 0.85)
  ↓
Top 10 resultados con porcentaje de coincidencia
```

**Actual:**
```
Usuario sube logo.jpg
  ↓
UI muestra formulario
  ↓
Sin procesamiento real
```

---

## 8. ROADMAP REALISTA

### Fase 1 - Datos & BD (Semanas 1-3)
- [ ] Obtener datos históricos INAPI 2009-2025
- [ ] Normalizar y limpiar datos
- [ ] Crear schema SQLite
- [ ] Cargar 3 tablas (registros, niza, vienna)
- [ ] Crear índices
- [ ] Implementar APIs de búsqueda

### Fase 2 - IA & Comparador (Semanas 4-7)
- [ ] Instalar TensorFlow.js + MobileNetV2
- [ ] Crear pipeline de pre-procesamiento
- [ ] Procesar 350K imágenes
- [ ] Calcular embeddings (1280D)
- [ ] Almacenar en BD
- [ ] Implementar búsqueda vectorial

### Fase 3 - Auditoría & Optimización (Semanas 8-10)
- [ ] Sistema de logs
- [ ] Exportación de reportes
- [ ] Caché de resultados
- [ ] Indexación Niza/Viena
- [ ] Carga mensual automática

### Fase 4 - QA & Producción (Semanas 11-12)
- [ ] Testing end-to-end
- [ ] Validación de precisión IA
- [ ] Optimización de performance
- [ ] Deploy a producción
- [ ] Documentación completa

---

## 9. ESTIMACIÓN DE ESFUERZO

| Componente | Horas | FTE | Semanas |
|-----------|-------|-----|---------|
| Datos & BD | 80 | 1 | 2 |
| IA & Comparador | 120 | 1.5 | 3 |
| Auditoría & Logs | 40 | 0.5 | 1 |
| QA & Optimización | 60 | 1 | 1.5 |
| **TOTAL** | **300 hrs** | **1.2** | **7.5 semanas** |

---

## 10. NEXT STEPS RECOMENDADOS

### ✅ YA HECHO
- Landing page profesional
- Dashboard con roles
- UI para búsqueda
- UI para comparador

### 🔴 PRIORIDAD MÁXIMA
1. **Obtener archivo `clasificaciones.db` oficial** del INAPI
   - O crear schema desde cero e importar datos CSV
   
2. **Cargar datos históricos 2009-2025**
   - Normalizar 10+ años de registros
   - Validar integridad
   
3. **Implementar búsqueda real en BD**
   - APIs REST funcionales
   - Validar consultas

4. **Implementar IA MobileNetV2**
   - TensorFlow.js integrado
   - Pipeline de embeddings

---

## Conclusión

**Completitud Actual:** ~15% de requerimientos
- ✅ UI/UX: 100% (bonito pero sin datos)
- ❌ Backend: 0% (no implementado)
- ❌ IA: 0% (no implementado)
- ❌ Datos: 0% (no cargados)

**Tiempo estimado para MVP completo:** 7-8 semanas con 1-2 desarrolladores
