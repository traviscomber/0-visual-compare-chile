# ROADMAP DE IMPLEMENTACIÓN FASE 1 - ORDEN DE EJECUCIÓN

**Objetivo:** Pasar de Fase 0 (UI sin datos) a MVP funcional con datos reales

---

## SEMANA 1: OBTENER DATOS & PREPARAR BD

### Día 1-2: Obtención de Datos
```
TAREA 1.1: Descargar datos históricos INAPI
├─ Acceder a https://www.inapi.cl
├─ Descargar archivo "registros_marcas_2009-2025.xlsx" o similar
├─ Convertir a CSV limpio
└─ Validar: 10+ años de datos (2009-2025)

TAREA 1.2: Obtener clasificaciones OMPI
├─ Descargar Niza v12.1 (45 clases + subcategorías)
├─ Descargar Viena v11 (29 cat + 145 div + 844 sec)
├─ Convertir a formato SQL
└─ Validar integridad de datos
```

**Salida esperada:**
- `registros_marcas_raw.csv` (Mínimo 50K registros)
- `niza_classes_raw.csv` (45 clases)
- `vienna_categories_raw.csv` (29 cat + 145 div + 844 sec)

---

### Día 3-4: Crear Schema SQLite

```sql
-- Archivo: migration_001_create_tables.sql

-- Tabla: niza_classes (45 clases de productos/servicios)
CREATE TABLE IF NOT EXISTS niza_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clase INTEGER UNIQUE NOT NULL,      -- 1-45
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL,          -- 'PRODUCTO' o 'SERVICIO'
  descripcion TEXT,
  ejemplos TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_niza_clase ON niza_classes(clase);

-- Tabla: vienna_categories (29 categorías)
CREATE TABLE IF NOT EXISTS vienna_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_categoria INTEGER UNIQUE NOT NULL,  -- 1-29
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vienna_categoria ON vienna_categories(codigo_categoria);

-- Tabla: vienna_divisions (145 divisiones)
CREATE TABLE IF NOT EXISTS vienna_divisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_id INTEGER NOT NULL,
  codigo_division INTEGER NOT NULL,   -- 1-145
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  UNIQUE(categoria_id, codigo_division),
  FOREIGN KEY(categoria_id) REFERENCES vienna_categories(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vienna_division ON vienna_divisions(codigo_division);

-- Tabla: vienna_sections (844 secciones principales)
CREATE TABLE IF NOT EXISTS vienna_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  division_id INTEGER NOT NULL,
  codigo_seccion_principal INTEGER NOT NULL,  -- 1-844
  codigo_seccion_auxiliar INTEGER,           -- 1-937
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  codigo_completo VARCHAR(20),               -- ej: 03.03.05.02
  UNIQUE(division_id, codigo_seccion_principal, codigo_seccion_auxiliar),
  FOREIGN KEY(division_id) REFERENCES vienna_divisions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vienna_seccion ON vienna_sections(codigo_completo);

-- Tabla: registros (Marcas históricas 2009-2025)
CREATE TABLE IF NOT EXISTS registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  BrandName VARCHAR(255) NOT NULL,
  ApplicationNumber VARCHAR(50),
  RegistrationNumber VARCHAR(50) UNIQUE,
  Applicants VARCHAR(500),
  
  -- Clasificaciones (JSON arrays)
  VienaClasses TEXT,                  -- JSON: ["03.03.05.02", ...]
  NizaClasses TEXT,                   -- JSON: [25, 35, 42]
  
  -- Estados
  Status VARCHAR(50),                 -- 'Vigente', 'Rechazado', 'Expirado', 'En Trámite'
  FilingDate DATE,
  GrantDate DATE,
  ExpiryDate DATE,
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_registros_brand ON registros(BrandName);
CREATE INDEX idx_registros_registration ON registros(RegistrationNumber);
CREATE INDEX idx_registros_filing_date ON registros(FilingDate);
```

**Salida esperada:**
- Archivo `clasificaciones.db` con estructura completa
- 3 índices creados
- Tablas listas para población de datos

---

### Día 5: Cargar Datos en BD

```sql
-- Importar 45 clases Niza
INSERT INTO niza_classes (clase, titulo, tipo, descripcion, ejemplos)
VALUES 
  (1, 'Productos químicos', 'PRODUCTO', 'Químicos para industria, agricultura, horticultura', 'Solventes, pesticidas, fertilizantes'),
  (2, 'Pinturas, barnices', 'PRODUCTO', 'Pinturas, barnices, lacas, protectores', 'Pintura de pared, barniz de madera'),
  (3, 'Cosméticos, higiene', 'PRODUCTO', 'Cosméticos, higiene personal, perfumes', 'Crema facial, jabón, perfume'),
  -- ... (42 más hasta clase 45)
  (45, 'Servicios legales', 'SERVICIO', 'Abogacía, notaría, arbitraje', 'Asesoría legal, defensa en juicio');

-- Importar 29 categorías Viena
INSERT INTO vienna_categories (codigo_categoria, nombre, descripcion)
VALUES 
  (1, 'Cuerpos Celestes', 'Cuerpos celestes, fenómenos naturales, luz, fuego, agua'),
  (2, 'Seres Humanos', 'Personas, caras, torsos, órganos humanos'),
  (3, 'Animales', 'Mamíferos, aves, peces, insectos, reptiles'),
  -- ... (26 más hasta categoría 29)
  (29, 'Categoría Miscelánea', 'Otros elementos no clasificados');

-- Importar 145 divisiones Viena
-- Importar 844 secciones Viena

-- Importar 50K+ registros de marcas 2009-2025
INSERT INTO registros (
  BrandName, ApplicationNumber, RegistrationNumber, Applicants,
  VienaClasses, NizaClasses, Status, FilingDate, GrantDate
)
SELECT 
  MarcaNombre, NumeroSolicitud, NumeroRegistro, Solicitante,
  JSON_ARRAY(...), JSON_ARRAY(...), Estado, FechaPresentacion, FechaConcesion
FROM datos_csv;
```

**Validaciones:**
- [ ] 45 clases Niza cargadas
- [ ] 29 categorías Viena cargadas
- [ ] 145 divisiones Viena cargadas
- [ ] 844 secciones Viena cargadas
- [ ] 50,000+ registros cargados
- [ ] Fechas 2009-2025 cubierto (excepto 10-jul a 05-sep)
- [ ] Integridad de datos validada

---

## SEMANA 2: IMPLEMENTAR BÚSQUEDA EN BD

### Día 1-2: Crear APIs REST

```typescript
// api/marcas/search.ts
export async function GET(req: Request) {
  const { q, tipo } = new URL(req.url).searchParams;
  
  if (tipo === 'nombre') {
    // SELECT * FROM registros WHERE BrandName LIKE '%q%'
    return buscarPorNombre(q);
  } else if (tipo === 'niza') {
    // SELECT * FROM registros WHERE JSON_CONTAINS(NizaClasses, q)
    return buscarPorNiza(q);
  } else if (tipo === 'viena') {
    // SELECT * FROM registros WHERE JSON_CONTAINS(VienaClasses, q)
    return buscarPorViena(q);
  }
}

// api/niza/classes.ts - Retornar 45 clases
export async function GET() {
  const clases = db.query('SELECT * FROM niza_classes ORDER BY clase');
  return Response.json(clases);
}

// api/vienna/categories.ts - Retornar 29 categorías + jerarquía
export async function GET() {
  const categorias = db.query(`
    SELECT c.*, COUNT(d.id) as divisions_count
    FROM vienna_categories c
    LEFT JOIN vienna_divisions d ON c.id = d.categoria_id
    GROUP BY c.id
  `);
  return Response.json(categorias);
}
```

**Salida esperada:**
- [ ] API `/api/marcas/search?q=TROPICAL&tipo=nombre` funcional
- [ ] API `/api/marcas/search?q=32&tipo=niza` funcional
- [ ] API `/api/marcas/search?q=03.03.05&tipo=viena` funcional
- [ ] API `/api/niza/classes` retorna 45 clases
- [ ] API `/api/vienna/categories` retorna 29 categorías

---

### Día 3-4: Conectar Frontend con Backend

```typescript
// Reemplazar en /consulta/page.tsx la búsqueda mock por real

async function realizarBusqueda(query, tipo) {
  const response = await fetch(`/api/marcas/search?q=${query}&tipo=${tipo}`);
  const datos = await response.json();
  
  // Ahora retorna datos reales desde BD
  return datos;  // 50-100 resultados reales
}

// Cargar clasificaciones reales en selectores
async function cargarClasificacionesNiza() {
  const response = await fetch('/api/niza/classes');
  const niza = await response.json();
  
  setNizaClasses(niza);  // 45 clases reales
}

async function cargarCategoríasViena() {
  const response = await fetch('/api/vienna/categories');
  const viena = await response.json();
  
  setViennaCategories(viena);  // 29 categorías reales
}
```

**Salida esperada:**
- [ ] `/consulta` muestra búsqueda con datos REALES
- [ ] Búsqueda por nombre retorna marcas reales
- [ ] Búsqueda por Niza retorna clasificaciones reales
- [ ] Búsqueda por Viena retorna elementos reales
- [ ] Tabla de resultados muestra 10-50 registros por página

---

### Día 5: Testing y Validación

```typescript
// test-suite-week-2.ts

describe('Búsqueda en Base de Datos', () => {
  test('Buscar por nombre retorna 5+ marcas para "TROPICAL"', async () => {
    const result = await fetch('/api/marcas/search?q=TROPICAL&tipo=nombre');
    const data = await result.json();
    expect(data.length).toBeGreaterThan(5);
  });
  
  test('Buscar por Niza clase 32 retorna bebidas', async () => {
    const result = await fetch('/api/marcas/search?q=32&tipo=niza');
    const data = await result.json();
    expect(data[0].NizaClasses).toContain(32);
  });
  
  test('API Niza retorna exactamente 45 clases', async () => {
    const result = await fetch('/api/niza/classes');
    const data = await result.json();
    expect(data.length).toBe(45);
  });
  
  test('API Viena retorna 29 categorías', async () => {
    const result = await fetch('/api/vienna/categories');
    const data = await result.json();
    expect(data.length).toBe(29);
  });
});
```

**Validaciones:**
- [ ] Todos los tests pasan
- [ ] Búsquedas retornan resultados reales
- [ ] Performance < 500ms por consulta
- [ ] Datos están normalizados correctamente

---

## SEMANA 3: INTEGRACIÓN COMPLETA & QA

### Día 1-2: Exportación de Datos

```typescript
// api/marcas/export.ts
export async function POST(req: Request) {
  const { filtros } = await req.json();
  
  const registros = db.query(`
    SELECT * FROM registros 
    WHERE BrandName LIKE ? 
    AND Status = ?
    ORDER BY FilingDate DESC
  `);
  
  // Convertir a CSV
  const csv = convertToCSV(registros);
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="marcas_export.csv"'
    }
  });
}
```

### Día 3-4: Reportes y Estadísticas

```typescript
// api/stats.ts
export async function GET() {
  const stats = {
    total_marcas: db.query('SELECT COUNT(*) FROM registros')[0].count,
    vigentes: db.query('SELECT COUNT(*) FROM registros WHERE Status = "Vigente"')[0].count,
    por_niza: db.query('SELECT clase, COUNT(*) FROM registros GROUP BY clase LIMIT 10'),
    por_viena_categoria: db.query('SELECT codigo_categoria, COUNT(*) FROM registros GROUP BY codigo_categoria LIMIT 10'),
    rango_fechas: {
      desde: db.query('SELECT MIN(FilingDate) FROM registros')[0].min,
      hasta: db.query('SELECT MAX(FilingDate) FROM registros')[0].max
    }
  };
  return Response.json(stats);
}
```

### Día 5: Validación Final

**Checklist de Completitud:**
- [ ] Base de datos cargada con 50K+ registros
- [ ] 45 clases Niza disponibles
- [ ] 29 categorías Viena disponibles
- [ ] 145 divisiones Viena disponibles
- [ ] 844 secciones Viena disponibles
- [ ] Búsqueda por nombre funcional
- [ ] Búsqueda por Niza funcional
- [ ] Búsqueda por Viena funcional
- [ ] Exportación a CSV funcional
- [ ] Paginación de resultados funcional
- [ ] Performance < 500ms por búsqueda
- [ ] Todos los tests pasan
- [ ] Dashboard muestra estadísticas reales

---

## RESULTADO FINAL DE SEMANAS 1-3

```
ANTES (Fase 0):
- ❌ 0 registros de marcas
- ❌ 0 clases Niza
- ❌ 0 categorías Viena
- ✅ UI bonita pero sin datos

DESPUÉS (Fase 1 Completa):
- ✅ 50,000+ registros reales (2009-2025)
- ✅ 45 clases Niza funcionales
- ✅ 29 categorías + 145 divisiones Viena funcionales
- ✅ Búsqueda avanzada multifiltro
- ✅ Exportación CSV
- ✅ Sistema completamente funcional
- ✅ Listo para integrar IA (Semana 4-6)
```

---

## MÉTRICAS DE ÉXITO

| Métrica | Objetivo | Status |
|---------|----------|--------|
| Registros cargados | 50,000+ | Semana 1 |
| Clases Niza | 45 | Semana 1 |
| Categorías Viena | 29 | Semana 1 |
| Divisiones Viena | 145 | Semana 1 |
| Secciones Viena | 844 | Semana 1 |
| API búsqueda por nombre | Funcional | Semana 2 |
| API búsqueda por Niza | Funcional | Semana 2 |
| API búsqueda por Viena | Funcional | Semana 2 |
| Performance promedio | <500ms | Semana 3 |
| Test coverage | 80%+ | Semana 3 |
| Usuarios pueden exportar | ✓ | Semana 3 |

---

## PRÓXIMO: SEMANA 4-6 (IA & COMPARADOR)

Una vez completado Fase 1, seguir con:
1. Implementar MobileNetV2 + TensorFlow.js
2. Pre-procesar 350,000 imágenes
3. Calcular embeddings vectoriales
4. Implementar similitud de coseno
5. Crear comparador visual funcional
