# VIDENTIA Demo — Production QA 2026-08-24

## Alcance

Validación de producción de la demo pública de VIDENTIA sobre `https://videntia.app`, con foco en entradas por imagen, precedencia del nombre entregado por el usuario, contexto Niza, análisis figurativo/Viena y validaciones de payload.

Fecha local de la sesión: 2026-08-24 (Chile). Ejecuciones de infraestructura registradas en UTC durante 2026-08-25 01:xxZ.

## Entorno y método

- Producción: Vercel, proyecto `videntia`.
- API bajo prueba: `/api/v1/public/trademark-preview`.
- Se usaron imágenes reales ya servidas por la aplicación; no se mockearon OpenAI, Viena, Niza ni la API pública.
- Se creó temporalmente `/api/health/demo-qa-suite` para ejecutar el flujo desde la misma infraestructura de producción y se eliminó al terminar.
- El Browser plugin no estaba disponible en esta sesión. El fallback Playwright local no pudo navegar a producción por una restricción del entorno (`ERR_BLOCKED_BY_ADMINISTRATOR`). Por eso esta batería valida el flujo real de backend/IA en producción, pero no sustituye una prueba de clicks, upload y viewport ejecutada desde un navegador interactivo con salida a Internet.

## Casos ejecutados

### 1. Imagen con texto estilizado + actividad jurídica

Entrada:
- `legal-protection-icon.jpg`
- Sin nombre escrito por el usuario.
- Actividad: servicios jurídicos, asesoría legal y representación de clientes.

Objetivo:
- Si dos lecturas independientes de la denominación coinciden, permitir búsqueda por nombre.
- Si difieren, no forzar una denominación: caer a `visual-only`, conservar Viena/Niza y ejecutar cero búsquedas denominativas.

Resultado final: PASS.

En el pase final:
- HTTP 200.
- `analysis_mode: trademark`.
- denominación consensuada: `TMB`.
- confianza mínima del consenso: 0.93.
- Niza sugerida: 45 y 35.
- 3 señales Viena.
- 53 resultados observados.
- 1 estrategia denominativa ejecutada.

Durante repeticiones anteriores, la misma imagen produjo lecturas distintas (`MTB`, `TBM`, `TMB`) con un único lector. Con el consenso de dos lecturas, una ejecución discordante cayó correctamente a `visual-only`, con cero búsquedas denominativas. Esto se considera el comportamiento seguro esperado para una sigla visualmente ambigua.

### 2. Nombre escrito por usuario + imagen con texto distinto + actividad de software

Entrada:
- `nombre: VIDENTIA`.
- `legal-protection-icon.jpg` como imagen contradictoria.
- Actividad: software para análisis, búsqueda y vigilancia de marcas comerciales.

Objetivo:
- El nombre explícito del usuario debe tener precedencia sobre cualquier OCR/detección desde imagen.
- Debe conservar análisis visual y aplicar Niza con el contexto entregado.

Resultado final: PASS.

- HTTP 200.
- `analysis_mode: trademark`.
- `marca: VIDENTIA`.
- `denomination_source: user`.
- Niza en el pase final: 42 y 45; en otras repeticiones aparecieron combinaciones relevantes como 09/42/45.
- 2 señales Viena.
- 50 resultados observados.

### 3. Imagen sin denominación

Entrada:
- `fraud-detection-icon.jpg`.
- Sin nombre.
- Sin actividad.

Objetivo:
- No inventar texto.
- Entrar a análisis figurativo.
- `denomination_confidence` debe ser `null` cuando no existe denominación aceptada.
- No ejecutar búsquedas por nombre.

Resultado: PASS en ejecuciones repetidas.

Pase final:
- HTTP 200.
- `analysis_mode: visual-only`.
- `marca: Marca figurativa`.
- `denomination_source: not-detected`.
- `denomination_confidence: null`.
- 6 señales Viena.
- Elementos detectados incluyeron lupa, documento/página, símbolos decorativos y paleta azul marino/burdeos.
- 0 resultados denominativos.
- 0 estrategias denominativas.

### 4. MIME inválido

Entrada:
- `data:text/plain;base64,SG9sYQ==`.

Objetivo:
- Rechazar un payload que no sea una imagen permitida antes de ejecutar análisis.

Resultado: PASS.

- HTTP 415.
- Mensaje: `Formato de imagen no soportado.`

## Defectos encontrados y corregidos durante la batería

### D1 — OCR de siglas estilizadas demasiado confiado

Síntoma:
- La misma imagen fue interpretada como `MTB`, `TBM` y `TMB` entre ejecuciones.

Riesgo:
- Ejecutar una búsqueda denominativa real con una transcripción dudosa puede producir antecedentes irrelevantes y dar una falsa sensación de precisión.

Corrección:
- Imagen enviada con detalle alto.
- Prompt endurecido para conservar orden visual y no completar letras dudosas.
- Dos lecturas independientes en paralelo.
- Sólo se acepta la denominación si ambas lecturas normalizadas coinciden; en desacuerdo, el sistema vuelve a `visual-only` y no busca por nombre.

Commits principales:
- `c6aecd3116ba5071510ba18b0a4a672222a81fed` — improve image denomination reading precision.
- `4330dba0155f3a2af7a0c05ebc2207f7ef330df6` — require consensus for image denomination.

### D2 — Parse estructurado agotó el presupuesto de salida

Síntoma:
- Al introducir dos lectores, un caso mixto devolvió HTTP 500.
- Runtime log: `Could not parse response content as the length limit was reached`.

Corrección:
- `max_completion_tokens` del lector estructurado aumentado de 160 a 512.

Commit:
- `f34fbabfa96991f487523c7af49864379c38cd77`.

Revalidación:
- El caso dejó de producir 500 y la batería volvió a completar todas las rutas.

### D3 — Confianza de denominación sin denominación

Síntoma detectado en una prueba previa de imagen sin texto:
- El modelo podía devolver `denominacion: null` junto a una confianza alta.

Corrección:
- La confianza pública sólo se conserva cuando existe una denominación normalizada y aceptada.

Commit:
- `b9e953e2f0eb9918ace43cbfd1c12bcd27773e16`.

## Pase final de aceptación

Ejecución: `2026-08-25T01:29:54.590Z`.

Aserciones: 8/8 PASS.

- `mixedHandledSafely`: PASS.
- `mixedUsesNizaContext`: PASS.
- `mixedHasVisualSignals`: PASS.
- `overrideRespectsUserName`: PASS.
- `overrideUsesNizaContext`: PASS.
- `visualOnlyDoesNotInventName`: PASS.
- `visualOnlyHasSignals`: PASS.
- `invalidMimeRejected`: PASS.

## Riesgos residuales / pruebas siguientes

1. **OCR de siglas o lettering muy estilizado:** el consenso reduce búsquedas inseguras, pero dos lecturas de modelo todavía pueden coincidir en una lectura que un humano considere ambigua. Cuando el usuario conoce el nombre, la entrada explícita sigue siendo la fuente preferida.
2. **Variabilidad Niza:** las clases sugeridas pueden variar entre ejecuciones aun con el mismo texto de actividad. La próxima batería recomendada debe medir estabilidad y grounding contra un set de actividades con clases esperadas.
3. **Browser E2E pendiente:** esta sesión no pudo ejecutar el recorrido físico `upload → click → loader → resultados → contacto` en un navegador interactivo. Debe ejecutarse cuando el Cloud Browser/Browser plugin esté disponible.
4. **Responsive/mobile:** pendiente de inspección visual interactiva en viewport móvil real.

## Criterio de esta batería

El flujo de producción de imagen/nombre/contexto funciona con semántica segura, las rutas visual-only y typed-name se comportan correctamente, el MIME inválido se rechaza, y los fallos encontrados durante las pruebas fueron corregidos y revalidados. La siguiente prioridad técnica es estabilidad/grounding de Niza y, en paralelo, E2E interactivo de UI cuando exista navegador disponible.
