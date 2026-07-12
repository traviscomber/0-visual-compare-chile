# Arquitectura del Agente IA: Clasificacion Niza + Viena para Visual Compare Chile

> Documento de diseno e investigacion. Fecha: Julio 2026.
> Autor: v0 + Travis — investigacion basada en WIPO, INAPI, y estado del arte en trademark AI.

---

## 1. Que son Niza y Viena — resumen tecnico

### Clasificacion Niza (NCL)
- **Creada por:** Acuerdo de Niza (1957), administrada por WIPO
- **Edicion vigente:** 13a edicion (en vigor desde 1 enero 2026 — INAPI Chile la adopto oficialmente)
- **Estructura:** 45 clases — Clases 1-34 para productos, 35-45 para servicios
- **Proposito:** Define el ambito comercial de una marca. Dos marcas visualmente identicas pueden coexistir si estan en clases distintas.
- **Granularidad:** Cada clase tiene cientos de terminos especificos (ej: Clase 25 incluye "calzado deportivo", "ropa de bano", "guantes")

### Clasificacion Viena (VCL)
- **Creada por:** Acuerdo de Viena (1973), administrada por WIPO
- **Edicion vigente:** 10a edicion (2026)
- **Estructura:** 29 categorias de primer nivel, ~150 secciones, ~800+ divisiones
- **Proposito:** Clasifica los ELEMENTOS VISUALES de un logo. Permite encontrar conflictos visuales aunque los nombres sean totalmente distintos.
- **Ejemplos:**
  - 26.03.01 — Circulos (simples)
  - 26.03.07 — Circulos que forman figuras geometricas
  - 27.05.01 — Letras estilizadas unicas
  - 03.01.01 — Leones (animales)
  - 29.01.01 — Colores: azul predominante

---

## 2. Fuentes de datos disponibles — lo que encontramos

### A. WIPO — Gratuito y programatico

| Recurso | URL | Formato | Uso |
|---|---|---|---|
| NCL Publication (ITS4NICE) | `https://nclpub.wipo.int/` | HTML + URL params | Consulta interactiva por clase |
| NCL URL API | `https://www.wipo.int/classifications/nice/nclpub/en/fr/?notion=class&lang=en&version=current&class_number=25` | URL-based | Acceso programatico a clases especificas |
| NCL Descarga completa | Portal WIPO | Excel, Word, PDF | Importar DB local completa |
| Viena Classification Assistant | `https://www3.wipo.int/bnd-api/vienna-classification-assistant/` | Web UI (sin API publica) | Solo uso manual interactivo |
| Global Brand Database | `https://branddb.wipo.int/` | Web search | Busqueda de marcas internacionales |
| WIPO IP API Catalog | `https://www.wipo.int/en/web/standards/ip-api-catalog/index` | REST APIs varios | APIs de oficinas IP mundiales |

### B. INAPI Chile — Datos abiertos

| Recurso | Descripcion | Formato |
|---|---|---|
| Portal Open Data INAPI | Listado de solicitudes y marcas registradas desde 2009 | CSV descargable |
| Busqueda web INAPI | `https://www.inapi.cl/portal/institucional/600/w3-article-897.html` | Web manual |
| Cobertura | ~350K registros, actualizado periodicamente | No hay API REST publica |

**Conclusion clave:** No existe una API REST publica en tiempo real de INAPI ni de WIPO para Vienna. Los datos deben construirse como **base de datos local** alimentada desde descargas periodicas.

### C. Herramientas AI existentes (competencia/referencia)

| Herramienta | Capacidad | Acceso |
|---|---|---|
| WIPO Vienna Classification Assistant | Sugiere codigos Viena para una imagen | Web UI, sin API |
| TrademarkVision / Corsearch | Vision embeddings para similitud visual + Viena | Comercial (SaaS) |
| T-RADAR / BranDiligence | Score de riesgo legal + analisis Niza/Viena | Comercial |
| EUIPO Similarity Tools | Similitud entre clases Niza | Solo para EUIPO |

---

## 3. La arquitectura que proponemos — el Agente Marca Intelligence

### Vision general

Un agente de IA con **3 capas de analisis** que opera sobre cada imagen de marca:

```
IMAGEN DE ENTRADA
       |
       v
[Capa 1] MOTOR VISUAL (ya existe en Visual Compare Chile)
  - SHA-256 (exactitud de pixeles)
  - pHash (similitud perceptual)
  - Embeddings visuales (CLIP / ViT)
  - Score 0-100% + clasificacion en 5 niveles
       |
       v
[Capa 2] CLASIFICADOR NIZA + VIENA (nuevo — el agente)
  - Vision AI: GPT-4o Vision / Gemini Pro Vision
  - Analiza la imagen y propone codigos Viena
  - Analiza el nombre/texto de la marca y propone clases Niza
  - Consulta DB local Niza/Viena para validar
       |
       v
[Capa 3] AGENTE DE CONFLICTOS (nuevo — el insight engine)
  - Busca en el repositorio INAPI (350K marcas) por:
    * Similitud visual (Viena matching)
    * Misma clase Niza
    * Score > threshold configurable
  - Genera reporte con:
    * Lista de marcas conflictivas encontradas
    * Nivel de riesgo legal (Alto / Medio / Bajo)
    * Razonamiento explicado en lenguaje natural
    * Recomendacion de accion (registrar, modificar, oponerse)
```

---

## 4. Implementacion tecnica — 3 enfoques posibles

### Opcion A: Local DB + Vision AI (RECOMENDADA para Chile)

**Idea central:** Importar las clasificaciones Niza y Viena completas como tablas SQL, y usar GPT-4o Vision para asignar codigos automaticamente a cada imagen.

**Componentes:**

```
1. Base de datos local (Supabase ya existente):
   - tabla `niza_classes` (45 filas) — numero, nombre, descripcion, terminos
   - tabla `niza_terms` (~10K filas) — termino, clase, idioma
   - tabla `viena_codes` (~800 filas) — codigo, descripcion, categoria, ejemplos
   - tabla `marca_clasificaciones` — marca_id, niza_classes[], viena_codes[]

2. Endpoint /api/classify (nuevo):
   - Recibe: imagen URL + nombre de marca
   - Llama: GPT-4o Vision con prompt especializado
   - Devuelve: { niza: [25, 35], viena: ["26.03.01", "27.05.01"], confidence: 0.87 }
   - Guarda en DB para cache y auditoria

3. Endpoint /api/conflicts (nuevo):
   - Recibe: niza_classes[], viena_codes[], similarity_score
   - Busca en marcas_registradas WHERE niza_class = ANY(niza_classes[]) 
   - Calcula overlap de codigos Viena
   - Devuelve: lista ordenada por riesgo

4. Agente de informe /api/report/trademark (nuevo):
   - Orquesta las 3 capas
   - Genera informe completo con AI (GPT-4o)
   - Output: markdown estructurado listo para abogado
```

**Costo estimado por analisis:**
- GPT-4o Vision para clasificacion Viena: ~$0.01 por imagen
- GPT-4o para informe final: ~$0.03 por analisis
- Total: ~$0.04 por consulta completa

---

### Opcion B: WIPO Vienna Assistant + scraping (no recomendada)

Hacer scraping del Vienna Classification Assistant de WIPO para obtener clasificaciones automaticas. **No recomendada** porque:
- No hay API publica documentada
- Terminos de uso de WIPO prohiben scraping automatizado
- Latencia alta (red externa)
- Riesgo de cambios en la interfaz

---

### Opcion C: Fine-tuned model propio (largo plazo)

Entrenar un modelo CNN/ViT con el dataset de marcas INAPI + sus codigos Viena asignados por examinadores humanos. **Largo plazo** (3-6 meses, requiere dataset etiquetado). Potencial para ser el activo tecnico diferenciador del producto.

---

## 5. El prompt del agente — diseno

### Prompt para clasificacion Viena (GPT-4o Vision)

```
Eres un experto en Clasificacion Viena (VCL) para marcas figurativas, segun el 
sistema de la OMPI (10a edicion, 2026).

Analiza la siguiente imagen de logo y:

1. Identifica todos los elementos visuales presentes (formas, figuras, letras 
   estilizadas, animales, objetos, colores dominantes, composicion general)

2. Para cada elemento, asigna el codigo Viena mas preciso posible, con esta estructura:
   - Categoria principal (2 digitos): ej. 26 = Figuras geometricas
   - Seccion (4 digitos): ej. 26.03 = Circulos
   - Division (7 digitos): ej. 26.03.01 = Circulos simples

3. Retorna SOLO JSON con este formato:
{
  "elementos_detectados": ["circulo azul", "texto estilizado", "figura humana"],
  "viena_codes": [
    { "code": "26.03.01", "elemento": "circulo principal", "confidence": 0.92 },
    { "code": "27.05.24", "elemento": "texto MARCA en arco", "confidence": 0.85 }
  ],
  "colores_dominantes": ["azul", "blanco"],
  "estilo_general": "geometrico_moderno"
}
```

### Prompt para clasificacion Niza (GPT-4o texto)

```
Eres un experto en Clasificacion Niza (NCL 13a edicion, WIPO 2026) para 
registro de marcas comerciales en Chile (INAPI).

Dado:
- Nombre de marca: "{nombre}"
- Descripcion del negocio: "{descripcion}"
- Industria: "{industria}"

Determina las clases Niza mas apropiadas para registrar esta marca, con:
1. Las 1-3 clases PRINCIPALES (donde opera el negocio core)
2. Las 1-2 clases DEFENSIVAS (para proteccion adicional recomendada)
3. Para cada clase: numero, nombre, razonamiento especifico

Retorna JSON:
{
  "clases_principales": [
    { "numero": 42, "nombre": "Servicios IT y desarrollo", "razon": "La empresa provee SaaS de comparacion de imagenes" }
  ],
  "clases_defensivas": [
    { "numero": 45, "nombre": "Servicios juridicos", "razon": "Proteger el uso en contexto de propiedad intelectual" }
  ],
  "riesgo_si_no_registra": "Alto — clase 42 es central para cualquier plataforma tech"
}
```

### Prompt para informe de conflictos (GPT-4o — el agente final)

```
Eres un analista senior de propiedad intelectual con experiencia en el sistema 
chileno (INAPI) e internacional (OMPI/WIPO).

Se te proporciona:
- Marca a analizar: "{nombre}" con logo adjunto
- Score de similitud visual: {score}% ({nivel})
- Clasificacion Viena asignada: {viena_codes}
- Clases Niza propuestas: {niza_classes}
- Marcas conflictivas encontradas: {conflictos_list}

Genera un informe ejecutivo de riesgo de marca con:
1. RESUMEN EJECUTIVO (2-3 oraciones, para el cliente)
2. ANALISIS DE CONFLICTOS (uno por cada marca conflictiva)
3. NIVEL DE RIESGO GLOBAL: ALTO / MEDIO / BAJO con justificacion
4. RECOMENDACIONES de accion (registrar ahora / modificar logo / consultar abogado)
5. PROXIMOS PASOS sugeridos

Tono: profesional, directo, orientado a la accion. Sin jerga tecnica innecesaria.
```

---

## 6. Schema de base de datos — lo que hay que crear en Supabase

```sql
-- Clasificacion Niza completa (45 clases)
CREATE TABLE niza_classes (
  id         SERIAL PRIMARY KEY,
  numero     INTEGER UNIQUE NOT NULL, -- 1-45
  nombre_es  TEXT NOT NULL,
  nombre_en  TEXT NOT NULL,
  descripcion TEXT,
  tipo       TEXT CHECK (tipo IN ('productos', 'servicios')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Terminos Niza (~10K terminos en espanol + ingles)
CREATE TABLE niza_terms (
  id         SERIAL PRIMARY KEY,
  clase_id   INTEGER REFERENCES niza_classes(id),
  termino_es TEXT NOT NULL,
  termino_en TEXT,
  basic_number TEXT, -- numero basico WIPO ej: "190153"
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clasificacion Viena completa (~800 codigos)
CREATE TABLE viena_codes (
  id          SERIAL PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL, -- ej: "26.03.01"
  categoria   INTEGER NOT NULL,    -- 1-29
  seccion     TEXT,
  division    TEXT,
  descripcion_es TEXT NOT NULL,
  descripcion_en TEXT,
  ejemplos    TEXT[],
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Clasificaciones asignadas a marcas del sistema
CREATE TABLE marca_clasificaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_name      TEXT NOT NULL,
  imagen_url      TEXT,
  niza_classes    INTEGER[],       -- array de numeros de clase
  viena_codes     TEXT[],          -- array de codigos ej: ["26.03.01"]
  viena_raw       JSONB,           -- respuesta completa del agente
  niza_raw        JSONB,
  confidence      DECIMAL(3,2),
  clasificado_por TEXT DEFAULT 'ai_agent', -- 'ai_agent' | 'human'
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Cache de conflictos detectados
CREATE TABLE conflictos_detectados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_origen_id   UUID REFERENCES marca_clasificaciones(id),
  marca_conflicto   TEXT NOT NULL,   -- nombre de la marca en conflicto
  numero_registro   TEXT,            -- numero INAPI
  similitud_visual  DECIMAL(5,2),    -- score 0-100
  viena_overlap     TEXT[],          -- codigos Viena en comun
  niza_overlap      INTEGER[],       -- clases Niza en comun
  nivel_riesgo      TEXT CHECK (nivel_riesgo IN ('alto', 'medio', 'bajo')),
  informe_ai        TEXT,            -- texto del informe generado
  created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Plan de implementacion — 4 fases

### Fase 1 — Base de datos Niza + Viena local (1-2 dias)
- [ ] Descargar NCL 13a edicion desde WIPO (Excel disponible gratuitamente)
- [ ] Descargar VCL 10a edicion desde WIPO
- [ ] Script de importacion a Supabase (tablas `niza_classes`, `niza_terms`, `viena_codes`)
- [ ] Verificar: 45 clases Niza, ~10K terminos, ~800 codigos Viena

### Fase 2 — Endpoint de clasificacion AI (2-3 dias)
- [ ] `POST /api/classify/viena` — recibe imagen, devuelve codigos Viena
- [ ] `POST /api/classify/niza` — recibe nombre+descripcion, devuelve clases
- [ ] Cache en `marca_clasificaciones` para no re-clasificar lo mismo
- [ ] Tests con 10 logos reales del mercado chileno

### Fase 3 — Motor de conflictos (3-4 dias)
- [ ] `POST /api/conflicts/search` — cruza Viena+Niza con base INAPI
- [ ] Algoritmo de scoring: visual_sim * 0.5 + viena_overlap * 0.3 + niza_overlap * 0.2
- [ ] Umbral configurable (default: >60% = alerta)
- [ ] Cache de conflictos en `conflictos_detectados`

### Fase 4 — Agente de informe completo (2-3 dias)
- [ ] `POST /api/report/trademark` — orquesta las 3 capas
- [ ] Genera informe markdown con GPT-4o
- [ ] UI en el panel: "Analizar marca" → resultado en pantalla
- [ ] Exportar informe como PDF

**Total estimado: 8-12 dias de desarrollo**

---

## 8. Arquitectura del agente — diagrama de flujo

```
Usuario sube imagen + nombre de marca
              |
              v
    [/api/classify/viena]
    GPT-4o Vision analiza imagen
    → Propone codigos Viena (ej: 26.03.01, 27.05.24)
    → Guarda en marca_clasificaciones
              |
              v
    [/api/classify/niza]
    GPT-4o analiza nombre + industria
    → Propone clases Niza (ej: [42, 45])
    → Guarda en marca_clasificaciones
              |
              v
    [/api/conflicts/search]
    Cruza con 350K marcas INAPI:
    - WHERE niza_class = ANY([42, 45])
    - AND viena_overlap > 0
    - ORDER BY similitud_visual DESC
    → Lista de conflictos potenciales
              |
              v
    [/api/report/trademark]
    GPT-4o recibe todo el contexto:
    - Score visual original (del motor SHA/pHash/embeddings)
    - Codigos Viena asignados
    - Clases Niza asignadas
    - Lista de conflictos con sus datos
    → Informe ejecutivo en lenguaje natural
    → Nivel de riesgo: ALTO / MEDIO / BAJO
    → Recomendaciones de accion
              |
              v
    UI: Resultado visual + informe descargable
```

---

## 9. Por que esto es un moat competitivo

1. **Datos locales INAPI** — nadie mas tiene 350K marcas chilenas indexadas con Niza+Viena
2. **Idioma** — el informe en espanol chileno, orientado a INAPI, no a USPTO/EUIPO
3. **Costo** — $0.04 por analisis completo vs. $50-200 que cobra un abogado por una busqueda manual
4. **Velocidad** — resultado en <10 segundos vs. semanas de due diligence manual
5. **Explicabilidad** — el agente explica su razonamiento, no es una caja negra

---

## 10. Archivos de referencia WIPO para descargar

| Archivo | URL | Tamano aproximado |
|---|---|---|
| NCL 13a edicion — Excel completo | https://www.wipo.int/classifications/nice/ (seccion descargas) | ~2MB |
| VCL 10a edicion — Excel completo | https://www.wipo.int/classifications/vienna/ (seccion descargas) | ~500KB |
| INAPI open data marcas | https://www.inapi.cl/portal/institucional/600/w3-article-897.html | ~50MB CSV |

---

*Documento guardado el 12 julio 2026. Proxima revision al completar Fase 1.*
