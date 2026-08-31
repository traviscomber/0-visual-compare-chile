# VIDENTIA — ROADMAP CANÓNICO GRADE A

> **Fuente de verdad del proyecto hasta su cierre.**
>
> Este archivo debe mantenerse actualizado después de cada bloque relevante mergeado a `main`. No se reemplaza por un roadmap paralelo mientras VIDENTIA siga en desarrollo.

## 1. Objetivo final

Convertir VIDENTIA en una plataforma Grade A de inteligencia de propiedad intelectual, tecnológica y competitiva para Chile, capaz de transformar datos oficiales y señales externas en decisiones trazables y acciones concretas.

La promesa operativa del producto es:

> **VIDENTIA identifica qué están haciendo los competidores, hacia dónde avanzan las tecnologías y dónde aparecen nuevas oportunidades, manteniendo marcas, patentes, Niza, Viena, logos y expedientes como base factual del sistema.**

La secuencia de producto que guía todas las fases es:

`Fuente → Evidencia → Cambio observado → Inteligencia → Recomendación → Acción → Seguimiento → Outcome`

Principio de credibilidad:

`Hecho observado → Señal → Interpretación → Hipótesis → Recomendación`

VIDENTIA nunca debe presentar una predicción, intención empresarial o conclusión jurídica como hecho si la evidencia no lo demuestra.

---

## 2. Estado de referencia

Baseline actualizado después del merge del **PR #158 — Grade A Block A**:

- Repositorio: `traviscomber/0-visual-compare-chile`
- Rama productiva: `main`
- Commit productivo: `189530a03f38e4b358cd0e47866ad8d46dd2a76a`
- PR relevante: `#158`, merged a `main`
- Producto productivo: `https://videntia.app`
- Deployment productivo: `dpl_DBDktMpJm2CzZPUed83fmhT8KyPa` — `READY`
- CI post-merge `#832`: `success`
- CodeQL post-merge `#833`: `success`
- Stack: Next.js 16.2.4 + Supabase + Vercel + OpenAI + fuentes públicas externas

### Baseline de confianza actual

- Quality checks: **9 checks / 0 fallas críticas / 1 warning**.
- Único warning real: Change Engine **0/4 baselines**; se mantiene hasta que el ciclo cron normal produzca evidencia real.
- Cobertura de health de fuentes programadas: check `scheduled_source_health_coverage` en PASS.
- INAPI Open Data: operativo y dentro de SLA diario.
- TDPI: operativo y dentro de SLA semanal.
- Fuentes bajo demanda se distinguen de fuentes programadas; fuentes de catálogo no automatizadas quedan inactivas y no aparentan operación.

### Baseline de calidad de identidad

`VIDENTIA company identity benchmark v1`:

- 21 casos curados.
- Precision: **1.000**.
- Recall: **0.909**.
- Accuracy: **0.952**.
- 0 falsos positivos en el benchmark actual.
- 1 falso negativo conocido por boilerplate legal extenso de razón social.

### Baseline de inteligencia tecnológica

- OpenAlex activo como señal conservadora de investigación, normalizado para variantes frecuentes y con caché de 6 h.
- Patentes INAPI activas como eje independiente de protección tecnológica.
- Crossref aporta evidencia contextual filtrada por relevancia.
- GDELT se usa sólo como contexto; una caída de GDELT no se convierte en “cero actividad”.
- La confianza tecnológica v1 no puede superar `Media` con sólo dos ejes duros disponibles.

### Leyenda de estado

- `DONE`: criterio de salida cumplido y verificado en producción.
- `IN PROGRESS`: capacidad operativa, pero faltan criterios Grade A.
- `NEXT`: siguiente foco prioritario.
- `PLANNED`: diseñado, aún no iniciado.
- `BLOCKED`: depende de credenciales, proveedor o decisión externa.

---

## 3. Roadmap por fases

| Fase | Objetivo | Estado | Criterio de salida |
| --- | --- | --- | --- |
| **1. Trust Layer** | Que nunca dudemos de la plataforma | **IN PROGRESS — cerca de cierre** | Sabemos exactamente qué fuente está fresca, degradada o incompleta |
| **2. Intelligence Quality** | Que las conclusiones sean defendibles | **IN PROGRESS — avanzado** | Inteligencia reproducible, calibrada y auditada |
| **3. Executive Intelligence** | Responder las preguntas clave en 1–2 clics | **IN PROGRESS — avanzado** | Las seis preguntas estratégicas tienen respuesta trazable de punta a punta |
| **4. Recommendation Engine** | Pasar de señal a decisión | IN PROGRESS | Cada cambio relevante produce recomendación o descarte explicado |
| **5. Action Layer** | Que VIDENTIA haga trabajo | **NEXT** | Señal → acción sin salir de VIDENTIA |
| **6. Coverage Moat** | Crear una ventaja de datos difícil de replicar | IN PROGRESS | Inteligencia multi-source real, enlazada a empresa/tecnología/mercado |
| **7. Enterprise Grade** | Poder venderlo seriamente a corporativos | **IN PROGRESS — foundations** | Seguridad, RBAC, SSO, SLA, cuotas, observabilidad y recovery verificados |
| **8. Product Polish** | Que el producto se sienta Grade A | **IN PROGRESS** | Coherencia visual, UX, responsive y dashboards ejecutivos completos |

---

# FASE 1 — TRUST LAYER

## Objetivo

Que cada dato y conclusión tenga contexto operativo suficiente para saber si puede ser utilizado con confianza.

## Ya construido y verificado

- Catálogo de fuentes y políticas de automatización.
- `intelligence_sources`, source state, ingestion runs y source events.
- Freshness y health visibles en `/fuentes`.
- Cron INAPI instrumentado de punta a punta.
- Una corrida sólo queda `completed` después del pipeline y los quality checks.
- `partial` conserva el último éxito anterior y degrada el health de la fuente.
- Retry/backoff acotado para errores recuperables.
- Circuit breaker por fuente con `open / half_open / closed`.
- Health sweep independiente del cron de ingestión.
- SLA explícito por cadencia.
- Historial de health/freshness.
- Alertas de degradación con apertura y resolución.
- Quality checks persistentes.
- Reconciliación visible de conteos de corrida INAPI.
- Vista operativa de corridas, duración, retries, etapa fallida, contadores y reconciliación.
- Separación entre fecha jurídica, fecha de actualización de la fuente y fecha de observación por VIDENTIA.
- Fuentes bajo demanda, manuales e inactivas no se presentan como fuentes programadas fallidas.

## Pendiente real para Grade A

1. **Confirmar los 4 baselines del Change Engine mediante el ciclo cron normal.** Estado actual: `0/4`. No fabricar baseline sintético.
2. Observar al menos un ciclo productivo normal post-merge con los nuevos contratos de `completed / partial / failed`, health sweep y alertas.
3. Mantener la regla: toda nueva fuente programada debe incorporar telemetría, SLA, health y quality contract **antes** de activarse.
4. Ampliar la reconciliación más allá del pipeline INAPI cuando nuevas ingestiones programadas sean incorporadas.

## Criterio de salida

- 100% de fuentes programadas publican health/freshness.
- 0 fallas críticas abiertas en quality checks.
- Change Engine con sus 4 baselines reales.
- No existen fallos silenciosos.
- Todo cron deja evidencia de inicio, fin, duración, filas procesadas y resultado.
- Una fuente degradada se identifica antes de que el usuario interprete su ausencia de datos como ausencia de actividad.

---

# FASE 2 — INTELLIGENCE QUALITY

## Objetivo

Que las conclusiones de VIDENTIA sean defendibles, reproducibles y medibles.

## Ya construido y verificado

- Identity resolution corporativa conservadora.
- Alias y normalización de razones sociales.
- Entity Graph V2 no destructivo.
- Benchmark versionado `benchmarks/company-identity-v1.json` y gate obligatorio de CI.
- Precision/recall/accuracy repetibles en CI.
- Política de auto-link conservadora: sólo normalización exacta, confidence mínima y contexto de país.
- Casos ambiguos quedan en `review_required`.
- Merge/split manual de identidades con operación auditada, snapshots before/after y guardrails.
- Feedback `relevant / irrelevant / false_match / identity_incorrect` con API autenticada y audit trail.
- Calibration snapshots persistentes con sample size y false-positive rate.
- Dedupe de señales y expedientes.
- Change Engine persistente.
- Strategic Change Engine basado en convergencia de evidencia.
- Quality check que impide presentar cambios estratégicos sostenidos por menos de dos evidencias.
- Trayectoria empresarial 360 días.
- Distinción entre señal experimental y patrón estratégico.
- Scores explicables en Recommendation Engine V1.
- Corroboración tecnológica v1: investigación OpenAlex + patentes INAPI como ejes independientes.
- Filtros de relevancia para evitar falsos positivos de Crossref y patentes tecnológicamente parecidas pero incorrectas.

## Pendiente real para Grade A

1. **Expandir el benchmark de identidad.** 21 casos es un gate de no-regresión, no una muestra suficiente para declarar calidad poblacional.
2. Incorporar más empresas chilenas, grupos, subsidiarias, cambios de razón social y boilerplate jurídico al set curado.
3. Mejorar recall sin sacrificar el actual `1.000` de precision; el benchmark mantiene un falso negativo conocido.
4. Obtener sample size real suficiente en calibration snapshots; `insufficient_sample` debe desaparecer por evidencia, no por bajar el mínimo.
5. Crear benchmark etiquetado para medir falsos positivos/falsos negativos de **patrones estratégicos**, no sólo de identidad.
6. Consolidar dedupe cross-source de publicaciones/versiones equivalentes; OpenAlex puede devolver versiones con títulos equivalentes y DOI distintos.
7. Calibrar confidence por tipo de evidencia cuando se incorporen demanda comercial, regulación e inversión.
8. Aumentar cobertura de relaciones `parent / subsidiary / group` sólo con evidencia verificable.
9. Llevar la misma resolución de identidad a CMF, Mercado Público y EPO antes de usarlos para subir materialidad.

## Criterio de salida

- Benchmark versionado y suficientemente representativo.
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

## Ya construido y verificado

- Dashboard con las seis preguntas canónicas y rutas ejecutivas.
- Brief estratégico semanal.
- Change Engine observado por VIDENTIA.
- Strategic Change Engine.
- `/empresas` con comparación temporal, trayectoria y relaciones verificadas.
- `/tecnologias` con investigación, patentes INAPI, evidencia trazable, fuerza de señal y CTAs.
- `/espacios` con entrantes, aceleración, consolidación y experimental.
- `/brechas` para comparación competitiva.
- Vigilancias estratégicas.
- Contexto persistente en URL y deep-links entre Empresas, Tecnologías, Espacios, Brechas y Vigilancias.
- Navegación `Empresa → Espacio` verificada con SQM / H02J3/32.
- Navegación `Espacio → Brecha` verificada hasta el guardrail de empresa propia.
- Pantalla de confirmación `Tecnología → Vigilar` verificada; navegar hacia ella no crea una vigilancia por accidente.
- Interfaz de Tecnología simplificada a lenguaje ejecutivo: qué pasa, qué significa, evidencia y próximo paso.

## Pendiente real para Grade A

1. **Cerrar `Empresa → Espacio → Brecha` de punta a punta** con un binding de empresa propia en fixture/organización aislada. No usar organizaciones reales como datos descartables.
2. **Ejercitar la creación efectiva de una vigilancia estratégica** mediante submit real y verificar persistencia/resultado.
3. **Cerrar `Dashboard → análisis contextual`** con una vigilancia y señal estratégica de prueba realmente existentes.
4. Unificar actor vs mercado y actor vs portafolio propio en las superficies ejecutivas donde corresponda.
5. Asegurar filtros temporales coherentes `90d / 180d / 365d / histórico` en los módulos que lo necesitan.
6. Consolidar “oportunidades” como una superficie ejecutiva propia, evitando convertir whitespace o actividad débil en predicción.
7. Validar que cada una de las seis preguntas abre evidencia relevante en un clic bajo estados con datos y sin datos.

## Criterio de salida

Las seis preguntas deben responderse de punta a punta sin conocer la estructura interna de VIDENTIA, sin navegar por tablas técnicas y sin depender de fixtures incompletos.

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
- Factores del score trazables.
- Feedback de relevancia disponible como infraestructura de calibración.

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
7. Conectar feedback/calibración al ranking sin alterar los hechos fuente.
8. Medir acceptance/rejection rate por tipo de recomendación.

## Criterio de salida

Ninguna señal material queda como texto muerto. Cada cambio relevante termina en una recomendación accionable o en un descarte justificado y auditado.

---

# FASE 5 — ACTION LAYER

## Objetivo

Que VIDENTIA convierta inteligencia en trabajo ejecutable sin obligar al usuario a salir del sistema.

## Estado actual

Este es el **siguiente foco prioritario**.

Ya existen piezas reutilizables —casos, vigilancia, notificaciones, briefs y CTAs— pero todavía no existe un modelo canónico que complete:

`Señal → Recomendación → Acción → Responsable → Seguimiento → Outcome`

La creación de vigilancia estratégica es el primer flujo de acción a cerrar E2E.

## Plan de construcción

### 5.1 Canonical Action Model

Antes de crear nuevas tablas, mapear `casos`, notificaciones, vigilancia, intervenciones y cualquier sistema de tareas existente.

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
- OpenAlex con API key, normalización, retry y caché.
- Crossref con filtro de relevancia.
- GDELT como contexto de bajo peso; disponibilidad intermitente.
- Tecnología Corroboration v1: OpenAlex + INAPI.
- CMF disponible bajo demanda en la arquitectura.
- Mercado Público disponible parcialmente por proveedor/RUT.
- EPO OPS catalogado, todavía no operativo como eje del producto.
- WIPO Global Brand Database: referencia/manual, sin automatización no autorizada.

## Siguiente construcción

1. **Demanda comercial:** construir una capa semántica `tecnología → conceptos → CPC/IPC → productos/servicios → licitaciones/OC` antes de ponderar Mercado Público.
2. Incorporar Mercado Público como eje independiente de demanda, no como simple keyword count.
3. Incorporar CMF al entity graph corporativo y movimientos empresariales verificables.
4. Activar EPO OPS y usar familias/estado legal/CPC como expansión internacional del eje patentario.
5. Añadir regulación como eje separado cuando exista fuente trazable suficiente.
6. Enlazar ciencia → tecnología → empresa → IP.
7. Enlazar empresa → IP → mercado → compras públicas → contexto público.
8. Cross-source entity resolution antes de elevar confidence.
9. Normalización de evidencia externa al mismo modelo de trazabilidad.
10. Source health obligatorio para cada nuevo conector.
11. Evitar scraping de fuentes cuyo contrato no lo permita.
12. Contener la latencia de GDELT para que una fuente contextual lenta no retrase investigación/patentes.
13. Instrumentar consumo OpenAlex por análisis si el control exacto de cuota/costo pasa a ser operativo.
14. Dedupe de versiones/publicaciones equivalentes para limpiar evidencia sin colapsar trabajos legítimamente distintos.

## Modelo objetivo de corroboración

Cada tecnología debe poder separar al menos:

- **Investigación:** OpenAlex / Crossref.
- **Protección:** INAPI / EPO.
- **Demanda comercial:** Mercado Público u otra evidencia transaccional trazable.
- **Movimiento empresarial:** CMF + entity graph.
- **Regulación/contexto:** fuentes regulatorias y noticias.

La **dirección de la señal**, la **madurez comercial** y la **confianza** deben ser métricas distintas.

## Criterio de salida

VIDENTIA puede explicar un movimiento usando múltiples dominios independientes de evidencia: propiedad industrial, empresa/mercado, ciencia y actividad pública, sin que una sola fuente “infle” la conclusión.

---

# FASE 7 — ENTERPRISE GRADE

## Objetivo

Poder vender VIDENTIA a un cliente corporativo serio sin depender de excepciones operativas.

## Foundations ya existentes

- APIs de inteligencia con boundary autenticado y headers privados/no-store.
- Superficies DB sensibles de inteligencia restringidas a `service_role` donde corresponde.
- Regresiones de roles de casos y seguridad de colaboración.
- API keys con ruta canónica y regresión de listado.
- Analytics privacy regression.
- Auditoría de feedback y operaciones de identidad.
- Separación por organización presente en varias capacidades, pero todavía no certificada como matriz enterprise completa.

## Pendiente para Grade A

### Seguridad y acceso

- RBAC formal por organización y capacidad.
- Matriz de permisos documentada y testeada E2E.
- Tenant isolation regression tests transversales a todos los módulos críticos.
- SSO SAML/OIDC.
- MFA compatible con política enterprise.
- Audit log consolidado de acciones críticas.
- Rotación de secretos y API keys con proceso operativo.
- Leaked Password Protection activada cuando el plan/configuración de Supabase lo permita.

### Operación

- SLA/SLO definidos.
- Quotas por plan/organización.
- Rate limiting verificable.
- Synthetic monitoring.
- Alertas de cron/source failure conectadas a operación real.
- API latency monitoring y P95 por ruta crítica.
- Runtime error monitoring.
- Dashboards de observabilidad.

### Recovery

- Backup policy documentada.
- Restore drill real.
- Migration replay desde cero.
- Runbook de incidente.
- Rollback de deploy probado.
- RPO / RTO definidos.

### Compliance readiness

- Retención de auditoría.
- Exportación de audit log.
- Gestión de usuarios y revocación de acceso.
- Política de datos por tenant.
- Registro de fuentes y términos de uso.
- Security/Performance Advisors sin warnings accionables antes del cierre.

## Criterio de salida

Existe evidencia, no sólo documentación, de que auth, permisos, aislamiento, restore, quotas, monitoring y recuperación funcionan en escenarios reales.

---

# FASE 8 — PRODUCT POLISH

## Objetivo

Que VIDENTIA se sienta como un producto Grade A, no como una colección de módulos técnicamente buenos.

## Ya avanzado

- `/tecnologias` migró de lenguaje metodológico a lenguaje ejecutivo.
- La pantalla tecnológica ahora separa resultado, significado, evidencia y próximo paso.
- CTAs contextuales: vigilar, revisar patentes, evaluar otra tecnología y ver evidencia.
- Fuentes y metodología se conservan sin dominar la lectura principal.
- Empty state inicial explica el valor antes de ejecutar una consulta.

## Pendiente

### Arquitectura de información

- Navegación final simplificada.
- Jerarquía coherente entre Resumen, Marcas, Patentes, Tecnologías, Empresas, Espacios, Brechas, Vigilancia, Casos y Acciones.
- Retirar o redirigir rutas legacy/duplicadas que compitan con superficies canónicas.

### UX y copy

- Aplicar el patrón `qué pasó → por qué importa → evidencia → acción` a Dashboard, Empresas, Espacios y Brechas.
- Toda superficie ejecutiva debe terminar con 1–2 CTAs relevantes, no con tablas muertas.
- **GDELT contextual no debe aparecer como una alerta global que parezca error de toda la consulta.** Si sólo falla GDELT, el aviso debe quedar dentro de Contexto/Noticias.
- Empty states útiles.
- Loading states consistentes.
- Error states accionables.
- Responsive completo desktop/tablet/mobile.
- Teclado y accesibilidad.
- Text overflow y datasets largos.
- Formularios con validation/error recovery.
- Mantener términos técnicos correctos cuando son necesarios: Niza, Viena, IPC/CPC, patente, marca, expediente, evidencia.

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

## Bloque A — Fases 1–3

**Trust Layer + Intelligence Quality + Executive Intelligence**

Estado: **MERGED a `main` en PR #158; criterios de salida finales aún abiertos.**

Lo que quedó cerrado:

- lifecycle de ingestión y partial success;
- retry/circuit/health sweep/history/alerts;
- benchmark de identidad como gate CI;
- política de auto-link y revisión;
- feedback, merge/split y calibration auditables;
- cross-links y contexto persistente;
- corroboración tecnológica OpenAlex + INAPI;
- lenguaje ejecutivo y CTAs en Tecnología.

Cierre pendiente de Bloque A:

1. Change Engine `4/4` por ciclo natural.
2. Brecha E2E con binding de portafolio controlado.
3. Creación efectiva de vigilancia E2E.
4. Dashboard contextual con señal estratégica real/controlada.
5. Expandir benchmark y calibración antes de declarar Intelligence Quality `DONE`.

## Bloque B — Fases 4–6

**Recommendation Engine + Action Layer + Coverage Moat**

Estado:

- Fase 4: avanzada, lifecycle incompleto.
- Fase 5: **NEXT**.
- Fase 6: v1 multi-source tecnológica operativa; mercado/empresa global aún parcial.

Orden operativo recomendado:

1. Cerrar los tres gates E2E residuales del Bloque A sin fabricar datos.
2. Mapear `casos + vigilancia + notificaciones + briefs` y definir Canonical Action Model.
3. Cerrar `Vigilar tecnología` como primera acción completa.
4. Implementar recommendation lifecycle y conversión a acción.
5. Construir capa semántica de demanda comercial y luego conectar Mercado Público.
6. Incorporar CMF al entity graph y EPO al eje patentario.
7. Añadir regulación/demanda como nuevos ejes de confidence.
8. Validar cross-source reasoning con dataset curado.

## Bloque C — Fases 7–8 + cierre final

**Enterprise Grade + Product Polish + Grade A Audit**

Orden operativo:

1. RBAC/tenant isolation/SSO/quotas.
2. Observabilidad/SLA/recovery.
3. Simplificación UX/copy/CTAs ruta por ruta.
4. QA visual y responsive integral.
5. Audit técnico final.
6. Soak productivo.
7. Cierre Grade A.

---

# 5. Gaps prioritarios actuales

## P0 — bloquean declarar Grade A

1. **Change Engine 0/4 baselines.** Debe cerrarse por ciclo cron normal.
2. **Brecha E2E incompleta** por ausencia de empresa propia vinculada en el fixture autenticado probado.
3. **Creación efectiva de vigilancia no ejercitada E2E.** La confirmación existe; falta probar el POST real y su persistencia.
4. **Dashboard contextual no ejercitado con una señal estratégica real/controlada.**
5. **Action Layer no canónico.** Existen piezas, pero todavía no hay `señal → responsable → outcome` unificado.
6. **Cobertura comercial insuficiente.** Mercado Público aún no puede ponderarse semánticamente por tecnología con la precisión exigida.
7. **Enterprise Grade incompleto.** Faltan RBAC transversal, tenant-isolation suite, SSO, quotas, recovery drill y observabilidad formal.

## P1 — elevan calidad y valor diferencial

1. Expandir benchmark de identidad y patrones estratégicos.
2. Añadir demanda comercial, CMF, EPO y regulación como ejes independientes.
3. Contener latencia/fallo de GDELT y bajar su aviso a la sección de contexto.
4. Dedupe de versiones equivalentes en evidencia científica.
5. Instrumentar costo/cuota de OpenAlex si pasa a ser un control operativo.
6. Recommendation lifecycle + dedupe + acceptance metrics.
7. Aplicar narrativa ejecutiva + CTAs a Dashboard, Empresas, Espacios y Brechas.
8. QA visual responsive completo y eliminación de superficies legacy/duplicadas.

## P2 — cierre enterprise/productivo

1. SLO/SLA y dashboards de observabilidad.
2. Synthetic monitoring.
3. Backup/restore drill + RPO/RTO.
4. Audit log exportable y compliance readiness.
5. Soak productivo final y audit de migrations 1:1.

---

# 6. Gates obligatorios de ingeniería

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

# 7. Métricas Grade A

## Data

- ≥99% de sync success en ventana operativa.
- 100% de fuentes programadas con freshness visible.
- 0 eventos relevantes sin source/evidence traceability.
- 0 partial failures reportados como éxito completo.
- Change Engine 4/4 baselines reales.

## Intelligence

- Benchmark versionado y representativo.
- Entity resolution con precision/recall documentados.
- 0 patrones estratégicos presentados como hechos sin evidencia suficiente.
- 100% de recomendaciones con explicación y evidencia.
- Confidence separado de momentum y madurez comercial.

## Performance

- P95 búsquedas interactivas < 1 s donde no dependan de fuentes externas lentas.
- P95 RPC críticos preferentemente < 300 ms.
- P95 navegación interna útil < 2 s salvo operaciones externas justificadas.
- Sin queries conocidas que dependan de seq scans evitables en tablas grandes.
- Fuentes contextuales lentas no bloquean resultados de ejes duros.

## Reliability

- 0 errores críticos conocidos abiertos.
- CI/TypeScript/build/CodeQL obligatorios.
- Runtime monitoring activo.
- Cron/source monitoring activo.
- Retry/circuit breaker donde corresponda.

## Security

- 0 WARN accionables de Security Advisor antes del cierre.
- RLS/grants auditados.
- Tenant isolation testeado transversalmente.
- Secret/API-key lifecycle documentado y verificado.
- SSO/RBAC enterprise disponibles antes de declarar fase 7 cerrada.

## UX

- Rutas críticas verificadas en desktop y mobile.
- Sin dead ends.
- Empty/loading/error states diseñados.
- Toda señal material conduce a contexto, recomendación o acción.
- Fallos de fuentes contextuales no parecen fallos del análisis completo.

---

# 8. Definition of Done del proyecto

VIDENTIA se declara **Grade A / proyecto cerrado** únicamente cuando se cumplan simultáneamente estas condiciones:

1. Las 8 fases tienen estado `DONE`.
2. Las seis preguntas estratégicas se responden de punta a punta.
3. Todas las fuentes productivas tienen freshness y health observables.
4. El benchmark de Intelligence Quality alcanza los umbrales acordados sobre una muestra representativa.
5. Las recomendaciones relevantes pueden convertirse en acciones dentro del producto.
6. La cobertura multi-source está operativa, no sólo catalogada.
7. Enterprise security/recovery tiene pruebas verificables.
8. Auditoría visual completa desktop/mobile terminada.
9. Migration history y producción están 1:1.
10. CI, CodeQL, typecheck y production build están verdes en el release final.
11. No quedan P0/P1 conocidos.
12. Se completa un soak productivo final sin incidentes críticos.
13. Runtime y source monitoring no muestran degradaciones no explicadas.
14. El equipo puede demostrar: `fuente → evidencia → conclusión → recomendación → acción → outcome` sobre un caso real/controlado.

Una vez cumplido, este archivo puede marcarse `COMPLETED` y archivarse como registro del desarrollo. Hasta entonces, **`ROADMAP.md` sigue siendo la fuente canónica del proyecto**.

---

# 9. Regla de mantenimiento de este archivo

Después de cada bloque mergeado:

- actualizar estado de las fases afectadas;
- agregar PR/commit relevante cuando aporte trazabilidad;
- marcar claramente qué criterio de salida quedó cumplido;
- registrar deuda o riesgo residual;
- actualizar el baseline;
- no eliminar pendientes simplemente porque una feature ya existe;
- no declarar `DONE` sin evidencia de producción.

El roadmap describe **resultado y criterios**, no sólo features. Una capacidad puede estar implementada y seguir `IN PROGRESS` si todavía no cumple su estándar Grade A.
