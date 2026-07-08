# Arquitectura de Módulos - Sistema de Consulta de Marcas V2

## Descripción General

El sistema está organizado en **4 módulos pilares** que representan las funcionalidades clave del portal:

```
┌─────────────────────────────────────────────────────────┐
│   PORTAL DE CONSULTA DE MARCAS REGISTRADAS              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  1. MÓDULO DE CARGA (LoadDBModule)             │  │
│  │  • Upload de archivos (CSV, JSON, SQLite)      │  │
│  │  • Validación de estructura                     │  │
│  │  • Importación de 350K+ registros              │  │
│  │  • Monitoreo de progreso                        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  2. MÓDULO DE BÚSQUEDA (SearchModule)          │  │
│  │  • Búsqueda por nombre de marca                 │  │
│  │  • Búsqueda por clasificación Viena            │  │
│  │  • Búsqueda por clasificación Niza             │  │
│  │  • Interfaz de búsqueda avanzada               │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  3. MÓDULO DE VISUALIZACIÓN (VisualizationModule) │ │
│  │  • Renderizado de tablas de resultados         │  │
│  │  • Visualización de códigos Viena/Niza         │  │
│  │  • Detalles expandibles                         │  │
│  │  • Vistas grid/list intercambiables            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  4. MÓDULO DE UTILIDADES (UtilitiesModule)     │  │
│  │  • Gestión de historial de búsquedas           │  │
│  │  • Exportación de datos (CSV, JSON)            │  │
│  │  • Estadísticas de búsqueda                     │  │
│  │  • Utilidades de fecha/hora                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos Detallados

### 1. LoadDBModule (Módulo de Carga de Base de Datos)

**Ubicación:** `components/consulta/modules/load-db-module.tsx`

**Responsabilidades:**
- Upload de archivos (CSV, JSON, SQLite)
- Validación de estructura de BD
- Importación de 350K+ registros
- Monitoreo de carga con barra de progreso
- Mensajes de estado (éxito, error, progreso)

**Interfaz:**
```typescript
interface LoadDBModuleProps {
  onLoadComplete?: (recordCount: number) => void
}
```

**Estados:**
- `idle` - Esperando archivo
- `loading` - Importando datos
- `success` - Carga exitosa
- `error` - Fallo en importación

**Características:**
- Drag & drop compatible
- Feedback visual de progreso (0-100%)
- Información sobre formatos soportados
- Validación de MIME types

---

### 2. SearchModule (Módulo de Búsqueda)

**Ubicación:** `components/consulta/modules/search-module.tsx`

**Responsabilidades:**
- Interfaz de búsqueda textual
- Selector de tipo de búsqueda (nombre/Viena/Niza)
- Búsqueda fuzzy con Fuse.js
- Tips de búsqueda avanzada

**Interfaz:**
```typescript
interface SearchModuleProps {
  isLoading?: boolean
  onSearch: (query: string, type: 'nombre' | 'niza' | 'viena') => void
  resultCount?: number
}
```

**Tipos de búsqueda:**
1. **Por Nombre** - Búsqueda textual en nombre de marca
2. **Por Viena** - Búsqueda por código de clasificación figurativa
3. **Por Niza** - Búsqueda por clase de producto/servicio

**Características:**
- Tabs para cambiar tipo de búsqueda
- Input con placeholder dinámico
- Botón de búsqueda activo/desactivo
- Botón limpiar si hay texto
- Contador de resultados
- Tips de búsqueda avanzada

---

### 3. VisualizationModule (Módulo de Visualización)

**Ubicación:** `components/consulta/modules/visualization-module.tsx`

**Responsabilidades:**
- Renderizado de resultados de búsqueda
- Visualización de clasificaciones Viena/Niza
- Detalles expandibles por marca
- Vistas intercambiables (grid/list)

**Interfaz:**
```typescript
interface VisualizationModuleProps {
  resultados: SearchResult[]
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  favoritos?: Set<string>
  onToggleFavorito?: (id: string) => void
}
```

**Características:**
- Tarjetas expandibles (clic para abrir)
- Toggle entre vistas grid/list
- Badges para clasificaciones
- Favoritos con almacenamiento local
- Metadata (registro, país, descripción)
- Loading state
- Empty state

---

### 4. UtilitiesModule (Módulo de Utilidades)

**Ubicación:** `components/consulta/modules/utilities-module.tsx`

**Responsabilidades:**
- Gestión de historial de búsquedas
- Exportación de datos (CSV/JSON)
- Estadísticas de búsqueda
- Utilidades de fecha/hora

**Interfaz:**
```typescript
interface UtilitiesModuleProps {
  resultados: SearchResult[]
  searchHistory?: Array<{
    query: string
    type: string
    timestamp: Date
    resultCount: number
  }>
  onClearHistory?: () => void
}
```

**Tabs:**

1. **Exportar**
   - Botón para exportar resultados
   - Formatos: CSV, JSON
   - Información de registros

2. **Historial**
   - Últimas 10 búsquedas
   - Query, tipo, resultado count, timestamp
   - Botón limpiar historial
   - Scroll si hay muchos items

3. **Estadísticas**
   - Total de marcas
   - Desglose por estado (registrada, pendiente, denegada)
   - Clases Niza únicas
   - Códigos Viena únicos
   - Países representados

---

## Estructura de Carpetas

```
components/consulta/
├── modules/
│   ├── index.ts                    (exporta todos los módulos)
│   ├── load-db-module.tsx          (Módulo 1)
│   ├── search-module.tsx           (Módulo 2)
│   ├── visualization-module.tsx    (Módulo 3)
│   └── utilities-module.tsx        (Módulo 4)
├── search-panel.tsx                (componente legacy - deprecado)
├── marca-card.tsx                  (componente reutilizable)
└── export-dialog.tsx               (componente reutilizable)

app/consulta/
└── page.tsx                        (página principal que integra módulos)

lib/
├── search-engine.ts                (lógica de búsqueda)
└── export-utils.ts                 (utilidades de exportación)

hooks/
├── useSearch.ts                    (hook de búsqueda)
└── useAuditLog.ts                  (hook de auditoría)

types/
└── marca.ts                        (tipos TypeScript)
```

---

## Flujo de Datos

```
Page Component (app/consulta/page.tsx)
│
├─ State Management:
│  ├─ showLoadDB: boolean
│  ├─ viewMode: 'grid' | 'list'
│  ├─ favoritos: Set<string>
│  └─ searchHistory: HistoryItem[]
│
├─ Hooks:
│  └─ useSearch(MARCAS_DEMO)
│     ├─ search()
│     ├─ resultados: SearchResult[]
│     └─ cargando: boolean
│
├─ Render Modules:
│  ├─ LoadDBModule
│  │  └─ onLoadComplete callback
│  │
│  ├─ SearchModule
│  │  ├─ onSearch callback → handleSearch()
│  │  └─ resultCount: number
│  │
│  ├─ VisualizationModule
│  │  ├─ resultados: SearchResult[]
│  │  ├─ onViewModeChange
│  │  ├─ onToggleFavorito
│  │  └─ favoritos: Set
│  │
│  └─ UtilitiesModule
│     ├─ resultados: SearchResult[]
│     ├─ searchHistory
│     └─ onClearHistory
```

---

## Composición de Módulos

Los módulos se envuelven en `sections` con estilos glassmorphism:

```typescript
<section className="rounded-xl border border-slate-700/30 p-8 bg-slate-800/20 backdrop-blur-sm">
  <ModuleComponent {...props} />
</section>
```

---

## Integración con Dependencias

### Búsqueda
- **Fuse.js**: Búsqueda fuzzy en SearchModule
- **SearchEngine**: Lógica en lib/search-engine.ts
- **useSearch**: Hook que gestiona estado

### Exportación
- **export-utils.ts**: Generación de CSV/JSON
- **ExportDialog**: Modal de selección de formato
- **UtilitiesModule**: UI de exportación

### Favoritos
- **localStorage**: Persistencia de favoritos
- **Set<string>**: Almacenamiento en memoria
- **MarcaCard**: Renderizado con estado favorito

---

## Composables Reutilizables

### MarcaCard
- Tarjeta individual de marca
- Props: resultado, esFavorito, onFavorito, isExpanded
- Usado por VisualizationModule

### ExportDialog
- Modal de exportación
- Props: resultados, isOpen, onClose, onExport
- Usado por UtilitiesModule

### SearchPanel (Deprecated)
- Versión anterior de SearchModule
- Mantener solo para compatibilidad

---

## Validación de Tipos

Todos los módulos están completamente tipados con TypeScript:

```typescript
// Types principales
interface Marca {
  id: string
  nombre: string
  solicitante: string
  numeroRegistro: string
  niza: string[]
  viena: string[]
  estado: 'Registrada' | 'Pendiente' | 'Denegada'
  fecha: string
  pais: string
  descripcion?: string
}

interface SearchResult {
  marca: Marca
  relevancia: number
  tipoMatch: 'exact' | 'partial' | 'fuzzy'
}
```

---

## Performance Targets

| Métrica | Target |
|---------|--------|
| Carga BD | <5 segundos |
| Búsqueda | <200ms |
| Renderizado | <1 segundo |
| Export CSV | <3 segundos |
| Type Check | 0 errores |

---

## Próximas Mejoras

1. **Backend Integration**
   - Reemplazar MARCAS_DEMO con datos de Supabase
   - Implementar búsqueda backend
   - Agregar paginación

2. **Características Avanzadas**
   - Búsqueda por rango de fechas
   - Filtros por estado
   - Ordenamiento personalizado
   - Favoritos en Supabase

3. **UX Enhancements**
   - Autocomplete en búsqueda
   - Sugerencias de búsqueda
   - Guardar búsquedas frecuentes
   - Compartir búsquedas

4. **Optimización**
   - Virtualización de lista de resultados
   - Lazy loading de imágenes
   - Cache de búsquedas
   - Web workers para operaciones pesadas

---

## Testing

Cada módulo tiene:
- Props validadas con TypeScript
- Error boundaries implícitos
- Loading states
- Empty states
- Fallback UI

Pruebas recomendadas:
- Unit tests para hooks (useSearch, useAuditLog)
- Integration tests para módulos
- E2E tests para flujos completos
- Visual regression tests

---

Versión: 2.0.0
Última actualización: 11 Mayo 2026
Autor: v0 AI
