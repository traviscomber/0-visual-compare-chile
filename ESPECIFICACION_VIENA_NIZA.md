# ESPECIFICACIÓN TÉCNICA: VIENA Y NIZA

## 1. CLASIFICACIÓN NIZA - 45 CLASES

### Estructura Completa Requerida

```sql
CREATE TABLE niza_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clase INTEGER UNIQUE NOT NULL,      -- 1-45
  titulo VARCHAR(255) NOT NULL,       -- Nombre de la clase
  tipo VARCHAR(20),                   -- 'PRODUCTO' o 'SERVICIO'
  descripcion TEXT,                   -- Descripción detallada
  ejemplos TEXT,                      -- Ejemplos de productos/servicios
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Las 45 Clases Niza (Completas)

#### PRODUCTOS (Clases 1-34)
| Clase | Título | Tipo | Ejemplos |
|-------|--------|------|----------|
| 1 | Productos químicos | PRODUCTO | Químicos para uso en industria, agricultura, horticultura |
| 2 | Pinturas, barnices | PRODUCTO | Pinturas, barnices, lacas, productos para proteger oxidación |
| 3 | Cosméticos, higiene | PRODUCTO | Cosméticos, jabones, dentífricos, perfumes |
| 4 | Lubricantes, combustibles | PRODUCTO | Aceites, grasas, combustibles, lubricantes |
| 5 | Productos farmacéuticos | PRODUCTO | Medicinas, remedios, productos farmacéuticos |
| 6 | Metales sin trabajar | PRODUCTO | Metales sin trabajar, minerales, transportes |
| 7 | Máquinas, herramientas | PRODUCTO | Máquinas, herramientas, motores, dispositivos |
| 8 | Herramientas manuales | PRODUCTO | Herramientas de mano, cubiertos, armas blancas |
| 9 | Aparatos eléctricos | PRODUCTO | Aparatos eléctricos, dispositivos de computación, software |
| 10 | Instrumentos quirúrgicos | PRODUCTO | Instrumentos médicos, quirúrgicos, dentales |
| 11 | Aparatos de iluminación | PRODUCTO | Lámparas, iluminación, aparatos de rayos UV |
| 12 | Vehículos | PRODUCTO | Vehículos terrestres, aéreos, navales |
| 13 | Armas de fuego | PRODUCTO | Armas, municiones, explosivos |
| 14 | Metales preciosos | PRODUCTO | Metales preciosos, joyas, relojes |
| 15 | Instrumentos musicales | PRODUCTO | Instrumentos musicales, aparatos de grabación |
| 16 | Artículos de papel | PRODUCTO | Papel, cartón, impresos, material de escritura |
| 17 | Caucho, plástico | PRODUCTO | Caucho, goma, plástico sin trabajar |
| 18 | Cuero | PRODUCTO | Cuero, materiales de imitación de cuero |
| 19 | Materiales de construcción | PRODUCTO | Piedra, vidrio, minerales para construcción |
| 20 | Muebles | PRODUCTO | Muebles, sistemas de almacenamiento |
| 21 | Artículos de cocina | PRODUCTO | Utensilios de cocina, cubertería, cristalería |
| 22 | Textiles, telas | PRODUCTO | Telas, tejidos, paños, velos |
| 23 | Hilos, fibras | PRODUCTO | Hilos, fibras textiles, cordeles, redes |
| 24 | Telas, tejidos | PRODUCTO | Telas de mesa, de cama, ropa blanca textil |
| 25 | Ropa, calzado | PRODUCTO | Ropa de confección, calzado, accesorios de vestir |
| 26 | Encajes, bordados | PRODUCTO | Encajes, bordados, cintas, botones |
| 27 | Artículos de limpieza | PRODUCTO | Alfombras, esteras, material aislante |
| 28 | Productos alimenticios | PRODUCTO | Alimentos, bebidas (excepto alcohólicas y cerveza) |
| 29 | Bebidas alcohólicas | PRODUCTO | Vino, bebidas alcohólicas, cerveza |
| 30 | Productos de molinería | PRODUCTO | Harina, almidón, productos de pastelería |
| 31 | Productos agrícolas | PRODUCTO | Semillas, granos, plantas, frutas, verduras |
| 32 | Bebidas sin alcohol | PRODUCTO | Agua, refrescos, bebidas energéticas |
| 33 | Productos diversos | PRODUCTO | Productos agrícolas, transportes, plantas vivas |
| 34 | Tabaco | PRODUCTO | Tabaco, cigarrillos, productos del tabaco |

#### SERVICIOS (Clases 35-45)
| Clase | Título | Tipo | Ejemplos |
|-------|--------|------|----------|
| 35 | Publicidad, comercio | SERVICIO | Publicidad, gestión comercial, franquicias |
| 36 | Servicios financieros | SERVICIO | Seguros, finanzas, banca, inversiones |
| 37 | Servicios de construcción | SERVICIO | Construcción, reparaciones, instalaciones |
| 38 | Telecomunicaciones | SERVICIO | Telecomunicaciones, radiodifusión |
| 39 | Transporte, almacenaje | SERVICIO | Transporte, empaque, almacenaje, viajes |
| 40 | Tratamiento de materiales | SERVICIO | Procesamiento de materiales, tratamientos |
| 41 | Educación, entretenimiento | SERVICIO | Educación, entretenimiento, actividades deportivas |
| 42 | Servicios de comida | SERVICIO | Restaurantes, cafeterías, servicios de catering |
| 43 | Hospedaje, alojamiento | SERVICIO | Hospedería, alojamiento temporal |
| 44 | Servicios médicos | SERVICIO | Medicina, veterinaria, higiene, belleza |
| 45 | Servicios legales | SERVICIO | Abogacía, notaría, arbitraje |

---

## 2. CLASIFICACIÓN VIENA - ESTRUCTURA JERÁRQUICA

### Estructura Tabla Principal
```sql
CREATE TABLE vienna (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_categoria INTEGER,           -- 1-29 (categoría)
  codigo_division INTEGER,            -- 1-145 (división dentro de categoría)
  codigo_seccion_principal INTEGER,   -- 1-844 (sección principal)
  codigo_seccion_auxiliar INTEGER,    -- 1-937 (sección auxiliar)
  categoria_nombre VARCHAR(255),      -- Nombre de categoría
  division_nombre VARCHAR(255),       -- Nombre de división
  seccion_nombre VARCHAR(255),        -- Nombre de sección
  descripcion TEXT,                   -- Descripción visual
  ejemplos TEXT,                      -- Ejemplos de elementos
  codigo_completo VARCHAR(20),        -- Código jerárquico (ej: 01.01.01.01)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Las 29 Categorías Viena

| Categoría | Código | Nombre | Descripción |
|-----------|--------|--------|-------------|
| 1 | 01 | Cuerpos Celestes | Cuerpos celestes, fenómenos naturales, luz, fuego, agua |
| 2 | 02 | Seres Humanos | Personas, caras, torsos, órganos humanos, partes del cuerpo |
| 3 | 03 | Animales | Mamíferos, aves, peces, insectos, reptiles |
| 4 | 04 | Plantas | Flores, árboles, arbustos, plantas |
| 5 | 05 | Alimentos | Frutas, vegetales, alimentos |
| 6 | 06 | Objetos Inanimados | Herramientas, armas, equipamiento |
| 7 | 07 | Objetos Diversos | Muebles, vehículos, construcciones |
| 8 | 08 | Envases | Botellas, cajas, recipientes |
| 9 | 09 | Adornos, Accesorios | Joyas, accesorios, ornamentos |
| 10 | 10 | Tejidos | Patrones, bordados, textiles |
| 11 | 11 | Banderas, Símbolos | Banderas, símbolos nacionales |
| 12 | 12 | Escritura, Abreviaturas | Letras, números, palabras |
| 13 | 13 | Figuras Geométricas | Líneas, cuadrados, círculos, triángulos |
| 14 | 14 | Signos de Puntuación | Puntos, líneas, símbolos |
| 15 | 15 | Signos Convencionales | Cruces, asteriscos, símbolos |
| 16 | 16 | Signos Especiales | Notas musicales, flechas |
| 17 | 17 | Caracteres Orientales | Caracteres chinos, japoneses, árabes |
| 18 | 18 | Materia, Luminosidad | Sombras, texturas, degradados |
| 19 | 19 | Colores | Combinaciones de colores |
| 20 | 20 | Formas Combinadas | Formas complejas |
| 21 | 21 | Patrones | Patrones repetitivos |
| 22 | 22 | Marcos | Bordes, marcos |
| 23 | 23 | Ilustraciones | Escenas, composiciones |
| 24 | 24 | Emblemas | Escudos, emblemas |
| 25 | 25 | Marcas de Agua | Marcas especiales |
| 26 | 26 | Perspectiva | Vistas en 3D |
| 27 | 27 | Efectos Especiales | Movimiento, velocidad |
| 28 | 28 | Combinaciones Complejas | Formas muy complejas |
| 29 | 29 | Categoría Miscelánea | Otros elementos no clasificados |

### Estructura de Códigos Viena

```
Estructura: CC.DD.SSSS.AA
             │  │   │    │
             │  │   │    └─ Sección Auxiliar (0001-0937)
             │  │   └────── Sección Principal (0001-0844)
             │  └────────── División (01-145)
             └──────────────Categoría (01-29)

Ejemplo: 03.03.05.02
         │   │   │  │
         │   │   │  └─ Sección Auxiliar 02
         │   │   └──── Sección Principal 05
         │   └─────────División 03
         └──────────── Categoría 03 (Animales)
         
Significado: Categoría Animales → División Específica → Sección de León → Variante 02
```

### Ejemplo de Datos Viena Completos

```sql
-- Insertando estructura para Animales con León
INSERT INTO vienna (
  codigo_categoria, 
  codigo_division, 
  codigo_seccion_principal, 
  codigo_seccion_auxiliar,
  categoria_nombre,
  division_nombre,
  seccion_nombre,
  descripcion,
  ejemplos,
  codigo_completo
) VALUES (
  3,                    -- Categoría: Animales
  3,                    -- División 3 (Felinos)
  5,                    -- Sección Principal 5 (Leones)
  2,                    -- Sección Auxiliar 2 (Variante)
  'Animales',
  'Felinos',
  'Leones',
  'Representación de leones en diferentes posiciones y estilos',
  'León parado, león saltando, cabeza de león',
  '03.03.05.02'
);
```

---

## 3. TABLA REGISTROS - ESTRUCTURA COMPLETA

### Schema SQL
```sql
CREATE TABLE registros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identificadores
  BrandName VARCHAR(255) NOT NULL,
  ApplicationNumber VARCHAR(50),
  RegistrationNumber VARCHAR(50) UNIQUE,
  
  -- Solicitante
  Applicants VARCHAR(500),
  
  -- Clasificación
  VienaClasses TEXT,        -- JSON: ["03.03.05.02", "13.01.01.01"]
  NizaClasses TEXT,         -- JSON: [25, 35, 42]
  
  -- Estado y Fechas
  Status VARCHAR(50),       -- 'Vigente', 'Rechazado', 'Expirado', 'En Trámite'
  FilingDate DATE,          -- Fecha de presentación
  GrantDate DATE,           -- Fecha de concesión
  ExpiryDate DATE,          -- Fecha de expiración
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  IsIntl BOOLEAN,           -- ¿Solicitud internacional?
  NiceNotes TEXT            -- Notas específicas de Niza
);
```

### Ejemplo de Registro Completo

```json
{
  "id": 1,
  "BrandName": "TROPICAL",
  "ApplicationNumber": "SG-2024-001234",
  "RegistrationNumber": "SG-2024-5678",
  "Applicants": "Empresa Tropical Ltd.",
  "VienaClasses": "[\"05.01.01.01\", \"05.01.02.03\"]",
  "NizaClasses": "[32, 39]",
  "Status": "Vigente",
  "FilingDate": "2024-03-15",
  "GrantDate": "2024-09-10",
  "ExpiryDate": "2034-09-10",
  "created_at": "2025-01-01 10:30:00",
  "IsIntl": true,
  "NiceNotes": "Bebidas sin alcohol, transporte"
}
```

---

## 4. QUERIES ESPERADAS

### Búsqueda por Nombre (Niza + Viena)
```sql
SELECT r.*, n.titulo as niza_titulo, v.descripcion as vienna_desc
FROM registros r
LEFT JOIN niza_classes n ON JSON_EXTRACT(r.NizaClasses, '$[0]') = n.clase
LEFT JOIN vienna v ON JSON_EXTRACT(r.VienaClasses, '$[0]') LIKE CONCAT(v.codigo_completo, '%')
WHERE r.BrandName LIKE '%TROPICAL%'
AND r.Status = 'Vigente'
LIMIT 50;
```

### Búsqueda por Código Niza
```sql
SELECT r.*, n.titulo, n.descripcion
FROM registros r
JOIN niza_classes n ON JSON_CONTAINS(r.NizaClasses, CAST(n.clase AS JSON))
WHERE n.clase = 32  -- Bebidas sin alcohol
ORDER BY r.FilingDate DESC;
```

### Búsqueda por Código Viena
```sql
SELECT r.*, v.categoria_nombre, v.seccion_nombre
FROM registros r
JOIN vienna v ON JSON_CONTAINS(r.VienaClasses, JSON_QUOTE(v.codigo_completo))
WHERE v.codigo_categoria = 3  -- Animales
AND v.seccion_nombre LIKE '%León%'
ORDER BY r.FilingDate DESC;
```

---

## 5. VALIDACIÓN DE INTEGRIDAD

```javascript
// Funciones de validación necesarias

function validarCodigoViena(codigo) {
  // Formato: CC.DD.SSSS.AA
  const regex = /^\d{2}\.\d{2,3}\.\d{4}\.\d{4}$/;
  return regex.test(codigo);
  // Retorna: true si es válido
}

function validarClaseNiza(clase) {
  // Rango 1-45
  return clase >= 1 && clase <= 45;
}

function validarRegistro(record) {
  // Validar estructura completa
  return (
    record.BrandName && record.BrandName.length > 0 &&
    record.RegistrationNumber && record.RegistrationNumber.length > 0 &&
    record.Status && ['Vigente', 'Rechazado', 'Expirado', 'En Trámite'].includes(record.Status) &&
    Array.isArray(JSON.parse(record.NizaClasses || '[]')) &&
    Array.isArray(JSON.parse(record.VienaClasses || '[]'))
  );
}
```

---

## 6. IMPORTANCIA PARA EL SISTEMA

### Niza es crucial porque:
1. Define QUÉ se protege (productos/servicios)
2. Facilita búsquedas por tipo de negocio
3. Evita conflictos entre marcas en diferentes clases
4. Estandarización OMPI internacional

### Viena es crucial porque:
1. Define CÓMO se ve (elementos visuales)
2. Facilita búsqueda por similitud visual
3. Base para algoritmo IA de comparación
4. Clasificación de logos y diseños

### Sin Viena + Niza, el sistema NO PUEDE:
- ❌ Hacer búsquedas de marcas similares
- ❌ Clasificar logos automáticamente
- ❌ Comparar por elementos visuales
- ❌ Cumplir marco legal INAPI

---

## 7. PRÓXIMOS PASOS

1. **Obtener datos OMPI oficiales** de Viena y Niza
2. **Normalizar estructura** en SQLite
3. **Cargar 45 clases Niza** completas
4. **Cargar 29 categorías + 145 divisiones Viena**
5. **Cargar 2009-2025 de registros** del INAPI
6. **Implementar búsqueda** en ambas clasificaciones
7. **Integrar con IA** para comparación visual
