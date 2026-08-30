# VIDENTIA — ROADMAP CANÓNICO GRADE A

> **Fuente de verdad del proyecto hasta su cierre.**
>
> Este archivo reemplaza el roadmap anterior de Visual Compare Chile y debe mantenerse actualizado después de cada bloque relevante mergeado a `main`. No se elimina ni se reemplaza por un documento paralelo mientras VIDENTIA siga en desarrollo. El historial anterior permanece disponible en Git.

## 1. Objetivo final

Convertir VIDENTIA en una plataforma Grade A de inteligencia de propiedad intelectual, tecnológica y competitiva para Chile, capaz de transformar datos oficiales y señales externas en decisiones trazables y acciones concretas.

La promesa operativa del producto es:

> **VIDENTIA identifica qué están haciendo los competidores, hacia dónde avanzan las tecnologías y dónde aparecen nuevas oportunidades, manteniendo marcas, patentes, Niza, Viena, logos y expedientes como base factual del sistema.**

La secuencia de producto que guía todas las fases es:

`Fuente → Evidencia → Cambio observado → Inteligencia → Recomendación → Acción → Seguimiento`

Principio de credibilidad:

`Hecho observado → Señal → Interpretación → Hipótesis → Recomendación`

VIDENTIA nunca debe presentar una predicción, intención empresarial o conclusión jurídica como hecho si la evidencia no lo demuestra.

---

## 2. Estado de referencia

Último baseline al actualizar este documento:

- Repositorio: `traviscomber/0-visual-compare-chile`
- Rama productiva: `main`
- Commit base: `f18cfd89ce9655706c76150742ffa470019204dc`
- Producto productivo: `https://videntia.app`
- Stack: Next.js + Supabase + Vercel + OpenAI
- Estado actual: bloques de inteligencia competitiva, espacios, brechas y recomendaciones ya integrados en producción.

### Leyenda de estado

- `DONE`: criterio de salida cumplido y verificado.
- `IN PROGRESS`: capacidad operativa, pero faltan criterios Grade A.
- `NEXT`: siguiente foco prioritario.
- `PLANNED`: diseñado, aún no iniciado.
- `BLOCKED`: depende de credenciales, proveedor o decisión externa.

---

## 3. Roadmap por fases

| Fase | Objetivo | Estado | Criterio de salida |
| --- | --- | --- | --- |
| **1. Trust Layer** | Que nunca dudemos de la plataforma | IN PROGRESS | Sabemos exactamente qué fuente está fresca, degradada o incompleta |
| **2. Intelligence Quality** | Que las conclusiones sean defendibles | IN PROGRESS | Inteligencia reproducible, calibrada y auditada |
| **3. Executive Intelligence** | Responder las preguntas clave en 1–2 clics | IN PROGRESS | Las seis preguntas estratégicas tienen respuesta trazable |
| **4. Recommendation Engine** | Pasar de señal a decisión | IN PROGRESS | Cada cambio relevante produce recomendación o descarte explicado |
| **5. Action Layer** | Que VIDENTIA haga trabajo | **NEXT** | Señal → acción sin salir de VIDENTIA |
| **6. Coverage Moat** | Crear una ventaja de datos difícil de replicar | IN PROGRESS | Inteligencia multi-source real, enlazada a empresa/tecnología/mercado |
| **7. Enterprise Grade** | Poder venderlo seriamente a corporativos | PLANNED | Seguridad, RBAC, SSO, SLA, cuotas, observabilidad y recovery verificados |
| **8. Product Polish** | Que el producto se sienta Grade A | PLANNED | Coherencia visual, UX, responsive y dashboards ejecutivos completos |

---

# FASE 1 — TRUST LAYER

## Objetivo

Que cada dato y conclusión tenga contexto operativo suficiente para saber si puede ser utilizado con confianza.

## Ya construido

- Catálogo de fuentes y políticas de automatización.
- `intelligence_sources` / source state / ingestion runs.
- Freshness y health visibles en `/fuentes`.
- Cron INAPI instrumentado.
- Quality checks persistentes.
- Circuit state y estado de degradación.
- Trazabilidad de eventos observados.
- Separación entre fecha jurídica, fecha de actualización de la fuente y fecha de observación por VIDENTIA.

## Pendiente para Grade A

1. Completar telemetría para **100% de fuentes programadas**.
2. Confirmar los 4 baselines del Change Engine mediante el ciclo cron normal.
3. Retry con backoff para fuentes recuperables.
4. Circuit breaker explícito por fuente externa.
5. Alerta interna cuando una fuente supere SLA de freshness.
6. Reconciliación automática de conteos de ingestión.
7. Data-quality checks después de cada ingestión relevante.
8. Detección de partial success: una corrida parcial nunca debe aparecer como éxito completo.
9. Historial de health/freshness para identificar degradaciones sostenidas.
10. Vista administrativa de ingestiones, fallos, reintentos y cobertura.

## Criterio de salida

- 100% de fuentes programadas publican health/freshness.
- 0 fallas críticas abiertas en quality checks.
- No existen fallos silenciosos.
- Todo cron deja evidencia de inicio, fin, duración, filas procesadas y resultado.
- Una fuente degradada se identifica antes de que el usuario interprete su ausencia de datos como ausencia de actividad.

---

# FASE 2 — INTELLIGENCE QUALITY

## Objetivo

Que las conclusiones de VIDENTIA sean defendibles, reproducibles y medibles.

## Ya construido

- Identity resolution corporativa conservadora.
- Alias y normalización de razones sociales.
- Entity Graph V2 no destructivo.
- Dedupe de señales y expedientes.
- Change Engine persistente.
- Strategic Change Engine basado en convergencia de evidencia.
- Trayectoria empresarial 360 días.
- Distinción entre señal experimental y patrón estratégico.
- Scores explicables en Recommendation Engine V1.

## Pendiente para Grade A

1. Crear **benchmark dataset curado** de empresas, alias, marcas, patentes y relaciones.
2. Medir precision/recall de entity resolution.
3. Definir umbral mínimo de calidad para auto-link y cuándo exigir revisión manual.
4. Incorporar merge/split manual auditado de identidades.
5. Confidence por evidencia y por relación corporativa.
6. Dedupe cross-source estable por DOI, expediente, actor y entidad.
7. Feedback `relevante / irrelevante / falso match / identidad incorrecta`.
8. Medición de falsos positivos y falsos negativos en patrones estratégicos.
9. Calibración periódica de scores contra un set de referencia.
10. Parent/subsidiary/group relationships sólo con evidencia verificable.

## Criterio de salida

- Benchmark versionado en repo.
- Métricas de precision/recall visibles y repetibles.
- Ninguna relación corporativa crítica se crea sólo por similitud textual.
- Ningún patrón estratégico depende de una sola señal salvo que esté explícitamente clasificado como experimental.
- Toda conclusión importante puede reconstruirse desde sus evidencias fuente.

---

# FASE 3 — EXECUTIVE INTELLIGENCE

## Objetivo

Responder en 1–2 clics las preguntas que realmente importan al usuario ejecutivo.

## Las seis preguntas canónicas

1. **¿Qué cambió esta semana?**
2. **¿Qué está protegiendo ahora que hace seis meses no protegía?**
3. **¿Dónde está llevando su tecnología?**
4. **¿Quién está entrando en mi espacio?**
5. **¿Qué tecnologías están acelerándose?**
6. **¿Dónde aparecen oportunidades?**

## Ya construido

- Brief estratégico semanal.
- Change Engine observado por VIDENTIA.
- Strategic Change Engine.
- `/empresas` con comparación temporal y trayectoria.
- `/tecnologias` con actividad científica y señales públicas.
- `/espacios` con entrantes, aceleración, consolidación y experimental.
- `/brechas` para comparación competitiva.
- Vigilancias estratégicas.
- Evidencia trazable y guardrails de interpretación.

## Pendiente para Grade A

1. Unificar las seis preguntas en una superficie ejecutiva coherente.
2. Cada respuesta debe abrir evidencia en un clic.
3. Resumen por empresa, tecnología, competidor y espacio.
4. Filtros 90d / 180d / 365d / histórico.
5. Comparar actor vs mercado y actor vs portafolio propio.
6. Consolidar oportunidades emergentes sin convertirlas en predicciones no sustentadas.
7. Dashboard ejecutivo con cambios de alta materialidad, nuevos actores y áreas emergentes.
8. Cross-linking entre Empresas, Tecnologías, Espacios, Brechas y Vigilancias.

## Criterio de salida

Las seis preguntas deben poder responderse sin conocer la estructura interna de VIDENTIA y sin navegar por tablas técnicas.

---

# FASE 4 — RECOMMENDATION ENGINE

## Objetivo

Pasar de observar un cambio a sugerir qué revisar o hacer a continuación.

## Ya construido

- Recommendation Engine V1.
- Portfolio Gap.
- Competitive Spaces.
- Score determinista 0–100.
- Componentes explicables: materialidad, novedad, convergencia, persistencia y proximidad.
- Guardrails jurídicos y estratégicos.

## Pendiente para Grade A

1. Todo cambio estratégico relevante debe producir:
   - recomendación, o
   - descarte explícito con razón.
2. Recommendation lifecycle: `nueva`, `revisada`, `aceptada`, `descartada`, `convertida en acción`.
3. Deduplicación de recomendaciones equivalentes.
4. Emerging whitespace basado en evidencia de mercado/tecnología.
5. Priorización por cercanía al portafolio propio.
6. Recomendaciones específicas por tipo de señal:
   - nuevo actor,
   - aceleración,
   - clase nueva,
   - cambio de titular,
   - convergencia marca/patente,
   - maduración de portafolio,
   - brecha competitiva.
7. Mostrar siempre los factores que explican el score.
8. Feedback del usuario para mejorar ranking sin alterar los hechos fuente.

## Criterio de salida

Ninguna señal material queda como texto muerto. Cada cambio relevante termina en una recomendación accionable o en un descarte justificado y auditado.

---

# FASE 5 — ACTION LAYER

## Objetivo

Que VIDENTIA convierta inteligencia en trabajo ejecutable sin obligar al usuario a salir del sistema.

## Alcance

Este es el **siguiente foco prioritario**.

La historia de usuario canónica es:

`Señal → Recomendación → Acción → Responsable → Seguimiento → Resultado`

## Plan de construcción

### 5.1 Canonical Action Model

Antes de crear nuevas tablas, mapear `casos`, notificaciones, vigilancia y cualquier sistema de tareas existente.

Si no existe una fuente canónica suficiente, introducir `intelligence_actions` con:

- organización/tenant;
- usuario creador;
- origen (`signal`, `strategic_change`, `recommendation`, `gap`, `space`);
- tipo de acción;
- responsable;
- estado;
- prioridad;
- due date;
- vínculo a evidencia;
- outcome;
- audit trail.

Toda creación debe ser atómica e idempotente.

### 5.2 One-click actions

Desde cualquier señal/recomendación relevante:

- Crear vigilancia.
- Abrir caso.
- Crear tarea/acción.
- Asignar responsable.
- Agregar competidor.
- Seguir tecnología.
- Comparar con portafolio.
- Generar brief.
- Generar reporte/PDF.
- Marcar irrelevante.

### 5.3 Seguimiento

- Inbox de acciones pendientes.
- Estados `pendiente / en revisión / resuelta / descartada`.
- SLA/due dates.
- Responsable y última actividad.
- Recordatorios y notificaciones.
- Outcome: qué decisión se tomó y por qué.

### 5.4 Reporting

- Brief PDF con evidencia.
- Brief por email.
- Exportación para directorio/comité.
- Historial de briefs enviados.
- Trazabilidad hasta la señal original.

## Criterio de salida

Una señal relevante puede terminar en una acción asignada y cerrada sin abandonar VIDENTIA, conservando evidencia, responsable, decisión y outcome.

---

# FASE 6 — COVERAGE MOAT

## Objetivo

Crear una ventaja de datos que sea difícil de replicar con una búsqueda simple o un único proveedor.

## Cobertura actual

- INAPI marcas.
- INAPI patentes.
- TDPI.
- OpenAlex.
- Crossref.
- GDELT.
- CMF y Mercado Público disponibles parcialmente en la arquitectura.
- EPO OPS catalogado, condicionado a credenciales.
- WIPO Global Brand Database: referencia/manual, sin automatización no autorizada.

## Plan de construcción

1. Activar EPO OPS con credenciales y políticas de uso correctas.
2. Incorporar CMF al entity graph corporativo.
3. Incorporar Mercado Público como señal comercial/contratación.
4. Enlazar ciencia → tecnología → empresa → IP.
5. Enlazar empresa → IP → mercado → compras públicas → noticias.
6. Cross-source entity resolution.
7. Normalización de evidencia externa al mismo modelo de trazabilidad.
8. Source health obligatorio para cada nuevo conector.
9. Evitar scraping de fuentes cuyo contrato no lo permita.
10. Construir señales multi-source que exijan convergencia antes de subir materialidad.

## Criterio de salida

VIDENTIA puede explicar un movimiento usando múltiples dominios independientes de evidencia: propiedad industrial, empresa/mercado, ciencia y actividad pública.

---

# FASE 7 — ENTERPRISE GRADE

## Objetivo

Poder vender VIDENTIA a un cliente corporativo serio sin depender de excepciones operativas.

## Plan de construcción

### Seguridad y acceso

- RBAC formal por organización.
- Matriz de permisos documentada y testeada.
- SSO SAML/OIDC.
- MFA compatible con política enterprise.
- Tenant isolation regression tests.
- Audit log de acciones críticas.
- Rotación de secretos y API keys.
- Leaked Password Protection activada cuando el plan/configuración de Supabase lo permita.

### Operación

- SLA/SLO definidos.
- Quotas por plan/organización.
- Rate limiting verificable.
- Synthetic monitoring.
- Alertas de cron/source failure.
- API latency monitoring.
- Runtime error monitoring.
- Dashboards de observabilidad.

### Recovery

- Backup policy documentada.
- Restore drill real.
- Migration replay desde cero.
- Runbook de incidente.
- Rollback de deploy probado.
- Recovery Point Objective / Recovery Time Objective definidos.

### Compliance readiness

- Retención de auditoría.
- Exportación de audit log.
- Gestión de usuarios y revocación de acceso.
- Política de datos por tenant.
- Registro de fuentes y términos de uso.

## Criterio de salida

Existe evidencia, no sólo documentación, de que auth, permisos, restore, quotas, monitoring y recuperación funcionan en escenarios reales.

---

# FASE 8 — PRODUCT POLISH

## Objetivo

Que VIDENTIA se sienta como un producto Grade A, no como una colección de módulos técnicamente buenos.

## Plan de construcción

### Arquitectura de información

- Navegación final simplificada.
- Jerarquía coherente entre Resumen, Marcas, Patentes, Tecnologías, Empresas, Espacios, Brechas, Vigilancia, Casos y Acciones.
- Evitar rutas duplicadas o conceptos que compitan entre sí.

### UX

- Empty states útiles.
- Loading states consistentes.
- Error states accionables.
- Responsive completo desktop/tablet/mobile.
- Teclado y accesibilidad.
- Text overflow y datasets largos.
- Formularios con validation/error recovery.

### Copy

- Reemplazar metadata/copy legacy centrada sólo en “marcas”.
- Narrativa ejecutiva consistente en español.
- Mantener términos técnicos correctos: Niza, Viena, IPC, patente, marca, expediente, evidencia.
- Explicar qué hace cada capacidad en lenguaje concreto.

### Dashboards

- Primer viewport ejecutivo.
- Cambios prioritarios.
- Recomendaciones.
- Acciones pendientes.
- Health de fuentes discreto pero visible.
- Evidencia disponible sin saturar la vista principal.

### QA visual final

- Auditoría ruta por ruta.
- Desktop + mobile.
- Visual regressions.
- Estados con datos / sin datos / error.
- Print/PDF donde corresponda.

## Criterio de salida

Un usuario puede entender qué está pasando, por qué importa y qué puede hacer a continuación sin explicación externa del equipo.

---

# 4. Ejecución por bloques

Trabajaremos en bloques de tres fases o equivalentes de alcance, manteniendo cada bloque mergeable y verificable.

## Bloque A — Fases 1–3

**Trust Layer + Intelligence Quality + Executive Intelligence**

Estado: `IN PROGRESS / avanzado`.

Cierre pendiente:

- terminar source telemetry y baselines;
- benchmark de calidad;
- cerrar las seis preguntas en una experiencia ejecutiva unificada.

## Bloque B — Fases 4–6

**Recommendation Engine + Action Layer + Coverage Moat**

Estado:

- Fase 4: avanzada;
- Fase 5: **NEXT**;
- Fase 6: parcial.

Orden operativo:

1. Cerrar recommendation lifecycle.
2. Construir Action Layer.
3. Integrar CMF / Mercado Público / EPO y fusionar señales externas.
4. Validar cross-source reasoning con dataset curado.

## Bloque C — Fases 7–8 + cierre final

**Enterprise Grade + Product Polish + Grade A Audit**

Orden operativo:

1. Security/RBAC/SSO/quotas.
2. Observabilidad/SLA/recovery.
3. QA visual y responsive integral.
4. Audit técnico final.
5. Soak productivo.
6. Cierre Grade A.

---

# 5. Gates obligatorios de ingeniería

Ningún bloque se considera terminado sólo porque “funciona en local” o porque Vercel compiló.

Para cada PR relevante:

1. Regression tests del dominio.
2. `tsc --noEmit`.
3. Build Next.js productivo.
4. CodeQL.
5. Preview Vercel `READY`.
6. Validación de migrations y Advisors cuando hay DB.
7. Smoke auth/authorization.
8. Smoke funcional de la ruta principal.
9. Merge a `main` sólo con gates verdes.
10. Production deployment `READY`.
11. Production smoke.
12. Runtime error scan.

Para cambios de alto riesgo —RLS, auth, SECURITY DEFINER, datos cross-tenant, migraciones destructivas— se exige además prueba transaccional/rollback-safe antes de persistir.

---

# 6. Métricas Grade A

## Data

- ≥99% de sync success en ventana operativa.
- 100% de fuentes programadas con freshness visible.
- 0 eventos relevantes sin source/evidence traceability.
- 0 partial failures reportados como éxito completo.

## Intelligence

- Benchmark versionado.
- Entity resolution con métrica de precisión documentada.
- 0 patrones estratégicos presentados como hechos sin evidencia suficiente.
- 100% de recomendaciones con explicación y evidencia.

## Performance

- P95 búsquedas interactivas < 1 s.
- P95 RPC críticos preferentemente < 300 ms.
- P95 navegación interna útil < 2 s salvo operaciones externas justificadas.
- Sin queries conocidas que dependan de seq scans evitables en tablas grandes.

## Reliability

- 0 errores críticos conocidos abiertos.
- CI/TypeScript/build/CodeQL obligatorios.
- Runtime monitoring activo.
- Cron/source monitoring activo.
- Retry/circuit breaker donde corresponda.

## Security

- 0 WARN accionables de Security Advisor antes del cierre.
- RLS/grants auditados.
- Tenant isolation testeado.
- Secret/API-key lifecycle documentado y verificado.
- SSO/RBAC enterprise disponibles antes de declarar fase 7 cerrada.

## UX

- Rutas críticas verificadas en desktop y mobile.
- Sin dead ends.
- Empty/loading/error states diseñados.
- Toda señal material conduce a contexto, recomendación o acción.

---

# 7. Definition of Done del proyecto

VIDENTIA se declara **Grade A / proyecto cerrado** únicamente cuando se cumplan simultáneamente estas condiciones:

1. Las 8 fases tienen estado `DONE`.
2. Las seis preguntas estratégicas se responden de punta a punta.
3. Todas las fuentes productivas tienen freshness y health observables.
4. El benchmark de Intelligence Quality alcanza los umbrales acordados.
5. Las recomendaciones relevantes pueden convertirse en acciones dentro del producto.
6. La cobertura multi-source está operativa, no sólo catalogada.
7. Enterprise security/recovery tiene pruebas verificables.
8. Auditoría visual completa desktop/mobile terminada.
9. Migration history y producción están 1:1.
10. CI, CodeQL, typecheck y production build están verdes en el release final.
11. No quedan P0/P1 conocidos.
12. Se completa un soak productivo final sin incidentes críticos.
13. Runtime y source monitoring no muestran degradaciones no explicadas.
14. El equipo puede demostrar: `fuente → evidencia → conclusión → recomendación → acción → outcome` sobre un caso real.

Una vez cumplido, este archivo puede marcarse `COMPLETED` y archivarse como registro del desarrollo. Hasta entonces, **`ROADMAP.md` sigue siendo la fuente canónica del proyecto**.

---

# 8. Regla de mantenimiento de este archivo

Después de cada bloque mergeado:

- actualizar estado de las fases afectadas;
- agregar PR/commit relevante cuando aporte trazabilidad;
- marcar claramente qué criterio de salida quedó cumplido;
- registrar deuda o riesgo residual;
- actualizar el `Último baseline`;
- no eliminar pendientes simplemente porque una feature ya existe;
- no declarar `DONE` sin evidencia de producción.

El roadmap describe **resultado y criterios**, no sólo features. Una capacidad puede estar implementada y seguir `IN PROGRESS` si todavía no cumple su estándar Grade A.
