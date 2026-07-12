# Agente IA + INAPI Integration — Julio 12, 2026

## Flujo Completo de Análisis de Marcas

El usuario ahora tiene un flujo **end-to-end** para registrar marcas en Chile:

```
USUARIO
  ↓
1. Upload logo + nombre
  ↓
2. Agente IA (4 pasos en paralelo):
   a) GPT-4o Vision → Clasificación Viena (colores, elementos visuales)
   b) GPT-4o Text → Clasificación Niza (clases de registro por nombre/descripción)
   c) Conflict Engine → Análisis de conflictos en base de demo marcas
   d) NEW: INAPI Search → Verificación REAL de disponibilidad en Chile
  ↓
3. Resultado compilado:
   ✓ Score visual + recomendación Viena
   ✓ Clases Niza recomendadas
   ✓ Conflictos teóricos (demo) vs. REALES (INAPI)
   ✓ Disponibilidad ACTUAL en Chile + estado de marca si existe
   ↓
4. Decisión del usuario:
   - Si disponible: "Proceder con confianza" → enlace a abogado
   - Si no disponible: "Busca alternativa" → campo de nombre alternativo
```

---

## Componentes Integrados

### 1. **Backend: TrademarkAgent (lib/agent/trademark-agent.ts)**

**Nuevo campo en TrademarkInsightReport:**
```typescript
registrabilidad?: {
  disponible: boolean                    // ✓ se puede registrar
  marca_encontrada?: {                   // si existe en INAPI
    nombre: string
    solicitante: string
    clase_niza: string
    estado: string                       // "vigente", "solicitada", "cancelada", etc.
    fecha_registro?: string
    pais: 'Chile'
  }
  conflictos_reales: number             // count de marcas similares en INAPI
  recomendacion: string                 // acción clara para el usuario
}
```

**Nuevo método: `searchInapiAvailability(nombreMarca, nizaClases)`**
- Búsqueda 1: Por nombre exacto (`type=nombre, match=1`)
- Búsqueda 2: Por clases Niza similares (`type=clase_niza, match=2`)
- Retorna disponibilidad + detalles de marca si existe
- Graceful fallback: si INAPI falla, continúa sin ese dato

---

### 2. **UI: Agent Page (/app/(app)/agente/page.tsx)**

**Nuevo componente visualizado entre Summary y Stats:**

**Si disponible (verde):**
```
✓ Disponible en Chile
Tu marca VISUAL COMPARE está disponible para registrar.
Puedes proceder con confianza.
```

**Si no disponible (rojo):**
```
✗ No disponible
Esta marca ya existe registrada en Chile por: COMPANY X
Estado: vigente
No es registrable. Considera un nombre alternativo.
```

**Información embebida (si existe marca):**
- Nombre registrado
- Solicitante/Titular
- Estado (vigente, solicitada, cancelada, rechazada)

---

## Flujo de Datos

```
POST /api/v1/agent/analyze
├─ Body:
│  ├─ image (base64)
│  ├─ nombre
│  ├─ descripcion (opcional)
│  └─ industria (opcional)
├─ Paso 1: VienaClassifier
├─ Paso 2: NizaClassifier
├─ Paso 3: ConflictEngine (demo repo)
├─ Paso 3.5: NEW searchInapiAvailability()
│  ├─ Fetch /api/inapi/search?q=NOMBRE&type=nombre
│  ├─ Parse results
│  └─ Return registrabilidad object
├─ Paso 4: GenerateReport (IA)
└─ Response:
   ├─ viena, niza, conflictos (existentes)
   ├─ registrabilidad (NEW)
   ├─ informe
   └─ metadata
```

---

## Ejemplo de Respuesta (JSON)

```json
{
  "marca": "VISUAL COMPARE",
  "registrabilidad": {
    "disponible": true,
    "conflictos_reales": 0,
    "recomendacion": "✓ No se encontraron conflictos en el registro de INAPI. Marca disponible para registrar en Chile."
  },
  "viena": {
    "codes": [...],
    "elementos_detectados": ["Hexágono", "Azul", "Blanco"]
  },
  "niza": {
    "clases": [
      { "numero": 42, "titulo": "Software...computer services", "tipo": "principal" }
    ]
  },
  "conflictos": {
    "conflictos": [],
    "breakdown": { "alto": 0, "medio": 0, "bajo": 0 }
  },
  "informe": {
    "resumen_ejecutivo": "Tu marca VISUAL COMPARE está disponible...",
    "nivel_riesgo_global": "BAJO"
  }
}
```

---

## Requisitos para INAPI Integration

✅ `/api/inapi/search` endpoint debe estar operativo
✅ `NEXT_PUBLIC_API_BASE` environment variable configurada (o localhost:3000 por defecto)
✅ INAPI scraper en Fase 1 debe estar corriendo (para datos reales)

---

## Próximos Pasos

1. **Testing en Vercel**: Verificar que searchInapiAvailability() funciona en serverless
2. **Sync INAPI periódico**: Aumentar dataset de 45 marcas demo a 10K+ reales
3. **Registrabilidad IA**: GPT-4o analiza riesgo basado en INAPI + Niza + Viena
4. **Exportar PDF**: Incluir sección "Disponibilidad en Chile" en el PDF de 5 páginas

---

## Estado Actual (July 12, 2026)

- ✅ Agente IA: 4 pipeline steps (Viena + Niza + Conflicts + Report)
- ✅ INAPI search: endpoint live en `/api/inapi/search`
- ✅ Registrabilidad: integrated en TrademarkAgent.analyze()
- ✅ UI: Shows disponible/no disponible con color coding (verde/rojo)
- ⏳ Fase 1: Sync 10K+ marcas chilenas reales desde INAPI

