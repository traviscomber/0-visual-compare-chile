# Visual Compare Chile
## Dossier de funcionamiento y propuesta de valor

**Documento para presentación al cliente**  
**Versión:** 1.0  
**Fecha:** 6 de agosto de 2026

---

## 1. Resumen ejecutivo

Visual Compare Chile es una plataforma para apoyar el análisis de marcas mediante dos capacidades complementarias:

1. **Comparación visual de imágenes:** permite comparar logos, diseños y otros elementos gráficos, identificando coincidencias exactas, duplicados cercanos y similitudes visuales.
2. **Consulta y explotación de información de marcas:** permite buscar antecedentes de marcas y trabajar sobre una base de datos local sincronizada con información de INAPI, incluyendo clasificaciones Niza y Viena.

La solución no se limita a mostrar un resultado aislado. Construye un flujo trazable: recibe la imagen o consulta, procesa la información, calcula señales de similitud, conserva el resultado y entrega una recomendación para revisión humana.

El principal diferencial técnico es una **política de consumo inteligente**, denominada internamente *tokenless / smart spend*: el sistema evita gastar llamadas externas, CPU, almacenamiento y cuotas cuando puede reutilizar información ya disponible. No significa que una API externa opere sin autenticación; significa que se consume únicamente cuando es necesario y con controles de costo y rendimiento.

---

## 2. Recorrido completo del sitio

### 2.1 Acceso seguro

El usuario ingresa mediante autenticación de sesión. La plataforma separa:

- La experiencia web para usuarios del portal.
- Las integraciones externas mediante API keys con cuotas configurables.
- Las funciones administrativas de sincronización, diagnóstico y operación.

Las claves API se almacenan protegidas mediante hash, pueden tener expiración, se pueden revocar y mantienen registro de último uso.

### 2.2 Carga de imágenes

El usuario puede cargar imágenes en formatos habituales como JPEG, PNG, WebP y TIFF, con validación de tipo y tamaño. Durante la carga se generan metadatos técnicos y huellas de imagen que luego permiten evitar procesamiento repetido.

El sistema contempla controles de acceso, almacenamiento privado, límites de carga y protección contra abusos.

### 2.3 Comparación visual

El motor combina distintas señales:

- Coincidencia exacta mediante SHA-256.
- Similitud perceptual mediante pHash y distancia de Hamming.
- Comparación de dimensiones, formato y tamaño.
- Clasificación del resultado en cinco niveles.

La salida incluye un porcentaje de similitud, señales que explican el resultado y una recomendación operativa:

| Resultado | Interpretación | Recomendación |
|---|---|---|
| `exact_match` | Coincidencia exacta o prácticamente idéntica | `REJECT_DUPLICATE` |
| `near_duplicate` | Copia o variación mínima | `REVIEW` |
| `visually_similar` | Similitud visual relevante | `REVIEW` |
| `partially_similar` | Coincidencias parciales | `REVIEW` |
| `different` | No se observa similitud relevante | `APPROVE` |

La recomendación es una ayuda para el análisis; no reemplaza la revisión jurídica o técnica definitiva.

### 2.4 Consulta de marcas

La plataforma permite consultar antecedentes sobre marcas registradas y solicitudes. La información se normaliza para facilitar búsquedas, filtros y comparación histórica.

El sistema contempla búsquedas por nombre y una estructura preparada para búsquedas por solicitante, registro y clasificación. El estado de cada modalidad debe validarse según la versión desplegada y la configuración de la API.

### 2.5 Resultados, historial y trazabilidad

Cada operación relevante puede conservar:

- Consulta realizada.
- Fecha y duración.
- Resultado obtenido.
- Registros insertados o actualizados.
- Señales de comparación.
- Consumo de cuota.
- Estado final y eventuales errores.

Esta trazabilidad permite explicar cómo se obtuvo un resultado y facilita auditoría, soporte y mejora continua.

---

## 3. Información sincronizada desde INAPI y fuentes oficiales

### 3.1 Qué se construyó

El proyecto incorpora un pipeline de sincronización compuesto por:

- Cliente de consulta a la fuente oficial.
- Gestión de sesión y límites entre solicitudes.
- Parser y reparación de problemas de codificación.
- Normalización de estados.
- Deduplicación mediante inserción/actualización.
- Extracción de clasificaciones Niza y Viena.
- Registro de cada ciclo de sincronización.
- Reintentos y seguimiento de trabajos.

La documentación técnica del ciclo registra **66.595 registros de marcas** y **177 ejecuciones completadas**, correspondientes a la evidencia disponible al momento de la prueba documentada. Estas cifras deben entenderse como una fotografía del entorno de datos de esa ejecución y no como una promesa de crecimiento automático permanente.

### 3.2 Diario Oficial

El sistema considera el Diario Oficial dentro del flujo de fuentes oficiales y seguimiento de publicaciones relacionadas con marcas. La implementación actual debe presentarse con precisión: el código y la documentación disponible evidencian un pipeline de extracción/sincronización conectado al buscador oficial de INAPI y preparado para el flujo de publicaciones oficiales; no debe comunicarse como una garantía de actualización diaria independiente si esa tarea programada no está habilitada en el entorno productivo.

El beneficio de esta integración es contar con una base operativa propia, normalizada y consultable, en lugar de depender de una llamada remota para cada búsqueda.

### 3.3 Beneficio de haber extraído la data

La extracción y persistencia de datos produce beneficios concretos:

1. **Velocidad:** las búsquedas sobre la base local evitan repetir toda la consulta remota.
2. **Continuidad:** el portal puede seguir trabajando sobre datos ya sincronizados aunque la fuente externa esté lenta o temporalmente no disponible.
3. **Histórico:** se puede analizar evolución de marcas, estados, solicitantes y clasificaciones.
4. **Menor presión sobre INAPI:** se reducen solicitudes repetidas y se respetan pausas entre llamadas.
5. **Consistencia:** las respuestas se normalizan y se pueden comparar bajo una misma estructura.
6. **Trazabilidad:** cada ciclo registra cuándo se ejecutó, qué consultó y cuántos registros insertó o actualizó.
7. **Base para alertas:** la información persistida permite detectar nuevos registros, cambios de estado y posibles conflictos.
8. **Escalabilidad:** las consultas posteriores se apoyan en índices, paginación y caché en vez de descargar nuevamente el universo de datos.

En la prueba documentada, una consulta local se estimó en el rango de decenas de milisegundos, frente a consultas remotas del orden de cientos o miles de milisegundos. El rendimiento exacto depende de índices, carga y entorno.

---

## 4. Política “tokenless / smart spend”

### 4.1 Qué significa

En este proyecto, *tokenless* no significa una API sin seguridad ni una promesa de costo cero. Es el nombre interno de una política de **uso eficiente de recursos**:

> No consumir una llamada externa, un ciclo de CPU, una cuota o un procesamiento costoso si el sistema puede reutilizar un resultado válido que ya posee.

La autenticación de integraciones externas continúa protegida mediante API keys y cuotas. La optimización opera en la cantidad y calidad de las llamadas, no eliminando controles de seguridad.

### 4.2 Ciclo de decisión eficiente

```text
1. Validar entrada y permisos
2. Revisar caché vigente
3. Consultar índices y base local
4. Reutilizar resultado si está disponible
5. Consultar fuente externa solo si falta información
6. Procesar por lotes y respetar pausas
7. Persistir respuesta, metadatos y huellas
8. Entregar resultado y actualizar métricas
```

### 4.3 Controles implementados

- Caché con TTL diferenciado según el tipo de resultado.
- Consultas locales antes de acudir a INAPI.
- Deduplicación y actualización incremental.
- Paginación y límites máximos.
- Lotes de trabajo para sincronizaciones extensas.
- Pausas entre solicitudes para no saturar la fuente externa.
- Cuotas diarias y mensuales por API key.
- Rate limiting y respuesta `429` cuando corresponde.
- Reintentos controlados y backoff ante fallos.
- Cancelación y seguimiento de jobs de procesamiento.
- Persistencia de hashes y metadatos para no recalcular innecesariamente.
- Registro de duración, estado y consumo para detectar desperdicio.

### 4.4 Resultado para el cliente

Esta política permite:

- Reducir costos variables y consumo de cuotas.
- Disminuir dependencia de servicios externos.
- Evitar recalcular imágenes ya procesadas.
- Mantener tiempos de respuesta previsibles.
- Proteger la estabilidad de la plataforma.
- Escalar de forma responsable antes de aumentar infraestructura.

La cifra de ahorro debe medirse continuamente en producción. Por eso el sistema registra uso, tiempos, resultados de caché y ejecuciones de sincronización, en vez de basarse solo en estimaciones.

---

## 5. API y capacidades de integración

La API v1 permite integrar la plataforma con otros sistemas mediante endpoints para:

- Health check.
- Carga de imágenes.
- Comparación de imágenes.
- Consulta de comparaciones históricas.
- Detalle de una comparación.
- Estadísticas de uso.
- Búsqueda de marcas.
- Análisis visual avanzado, según configuración del entorno.

Las API keys son por organización, se almacenan como hash, admiten revocación y cuotas configurables. El API Playground permite probar endpoints, observar respuestas, tiempos y encabezados de cuota sin construir primero una integración externa.

La experiencia web no requiere que el usuario copie tokens para realizar su trabajo diario; la complejidad de autenticación y consumo queda encapsulada por la aplicación. Para integraciones máquina a máquina sí se utiliza una API key explícita.

---

## 6. Funcionalidades adicionales de valor

Además del alcance central, la plataforma cuenta con capacidades que pueden aportar valor operativo:

- API v1 documentada y API Playground.
- Procesamiento en segundo plano con estados de trabajo.
- Reintentos y cancelación de trabajos.
- Métricas de procesamiento.
- Historial de consultas y comparaciones.
- Auditoría de sincronizaciones.
- Clasificaciones Niza y Viena.
- Panel administrativo para operaciones INAPI.
- Gestión de API keys, cuotas y expiración.
- Agente para análisis de elementos figurativos, según configuración.
- Reportes y exportaciones como línea de evolución del producto.

Estas capacidades permiten transformar una herramienta de consulta en una plataforma operativa, integrable y medible.

---

## 7. Matriz de estado y desviaciones

| Área | Estado comunicado | Evidencia | Desviación o consideración |
|---|---|---|---|
| Autenticación web | Implementada | Sesiones y rutas protegidas | Validar configuración final de producción |
| Comparación de imágenes | Implementada | SHA-256, pHash y metadatos | La decisión final requiere revisión humana |
| API de imágenes | Implementada | Upload, compare, historial y usage | Requiere API key para consumo externo |
| Búsqueda por nombre | Probada | Respuesta HTTP 200 en ciclo documentado | Mantener pruebas de regresión |
| Búsqueda por solicitante/registro/clase | Parcial según prueba | La prueba documentada devolvió HTTP 400 | Corregir validación o habilitación de tipos |
| Data sincronizada | Implementada | 66.595 registros en evidencia de ciclo | Actualizar cifras conforme continúe la ingesta |
| Niza/Viena | Estructura implementada | Tablas y extracción en pipeline | Validar cobertura efectiva por registro |
| Caché y consumo eficiente | Implementada | TTL, consultas locales, cuotas y jobs | Medir ahorro real en producción |
| Diario Oficial | Flujo contemplado | Pipeline oficial y documentación de integración | Confirmar job independiente y frecuencia diaria |
| Dashboard de auditoría | Parcial | Auditoría persistida | Falta visualización completa si el cliente la requiere |
| Exportación CSV | En evolución | Datos listos para exportar | Agregar interfaz si es requisito contractual |

---

## 8. Guion sugerido para la demostración

1. Ingresar al portal con un usuario autorizado.
2. Cargar una imagen de marca.
3. Mostrar validación, metadatos y huellas generadas.
4. Compararla con otra imagen.
5. Explicar el porcentaje, clasificación, señales y recomendación.
6. Buscar una marca en la base local.
7. Mostrar el resultado y su clasificación Niza/Viena cuando esté disponible.
8. Abrir el detalle y explicar la trazabilidad.
9. Mostrar el historial o las métricas de uso.
10. Abrir API Playground y ejecutar health, usage o search.
11. Mostrar cómo las cuotas y encabezados hacen visible el consumo.
12. Explicar el ciclo smart spend: caché, base local, consulta externa solo cuando es necesaria.
13. Mostrar el panel de sincronización y explicar insertados, actualizados, duración y estado.

---

## 9. Cierre para el cliente

Visual Compare Chile entrega una base tecnológica sólida para comparar imágenes y apoyar la evaluación de marcas con información oficial sincronizada. Su valor no está únicamente en el algoritmo de similitud: está en combinar análisis visual, datos históricos, trazabilidad, API, seguridad y una arquitectura que prioriza el uso responsable de recursos.

La política *tokenless / smart spend* permite crecer gastando bien: reutilizar lo que ya fue calculado, consultar fuentes externas solo cuando agrega valor, procesar en lotes, controlar cuotas y medir cada operación. De esta forma, la plataforma queda preparada para aumentar cobertura y automatización sin convertir cada búsqueda en una llamada costosa o innecesaria.

**Mensaje principal:** una solución funcional, integrable y orientada a operación real, con datos propios y consumo eficiente como principio de diseño.

---

## Nota de alcance

Este documento distingue entre capacidades implementadas, capacidades verificadas en pruebas y capacidades preparadas para evolución. Antes de enviarlo como acta contractual, conviene actualizar las cifras de registros, fecha de última sincronización, frecuencia efectiva del Diario Oficial y estado de los tipos de búsqueda conforme al entorno productivo final.
