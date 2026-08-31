# VIDENTIA — ROADMAP CANÓNICO GRADE A

> **Fuente de verdad del proyecto hasta su cierre.**
>
> Este archivo debe mantenerse actualizado después de cada bloque relevante mergeado a `main`. No se reemplaza por un roadmap paralelo mientras VIDENTIA siga en desarrollo.

## 1. Objetivo final

Convertir VIDENTIA en una plataforma Grade A de inteligencia de propiedad intelectual, tecnológica y competitiva para Chile, capaz de transformar datos oficiales y señales externas en decisiones trazables y acciones concretas.

Promesa operativa:

> **VIDENTIA identifica qué están haciendo los competidores, hacia dónde avanzan las tecnologías y dónde aparecen nuevas oportunidades, manteniendo marcas, patentes, Niza, Viena, logos y expedientes como base factual del sistema.**

Secuencia de producto:

`Fuente → Evidencia → Cambio observado → Inteligencia → Recomendación → Acción → Seguimiento → Outcome`

Principio de credibilidad:

`Hecho observado → Señal → Interpretación → Hipótesis → Recomendación`

VIDENTIA nunca debe presentar una predicción, intención empresarial o conclusión jurídica como hecho si la evidencia no lo demuestra.

---

## 2. Estado de referencia

Baseline actualizado después de **#165, #167, #168, #169, #170 y #171**, sobre la foundation de **#158, #160, #161 y #163**.

- Repositorio: `traviscomber/0-visual-compare-chile`
- Rama productiva: `main`
- Commit productivo: `197fca7585aacbd7e9e83a5587a50f0b0892a7f6`
- Producto: `https://videntia.app`
- Vercel de `main`: `SUCCESS` sobre `197fca7585aacbd7e9e83a5587a50f0b0892a7f6`
- CI de `main` #865: `success`
- CodeQL de `main`: `success`
- Stack: Next.js 16.2.4 + Supabase + Vercel + OpenAI + fuentes públicas externas

### PRs recientes que cambian el baseline funcional

- **#165** — Action lifecycle: una acción no puede cerrarse sin outcome atribuible; autor/timestamps se derivan en PostgreSQL y la reapertura queda auditada.
- **#167** — navegación móvil persistente y visible.
- **#168** — `Crear tarea` desde contexto estratégico, separado explícitamente de `Crear vigilancia`, reutilizando Caso + Evidencia + Acción.
- **#169** — Recommendation lifecycle persistente: nueva → revisada → aceptada | descartada → convertida en acción; dedupe, auditabilidad y conversión idempotente a trabajo.
- **#170** — `/oportunidades`: bandeja ejecutiva sobre recomendaciones persistidas, sin recalcular inteligencia ni crear trabajo automáticamente.
- **#171** — Dashboard consume el lifecycle persistido de Oportunidades, prioriza recomendaciones aceptadas/altas y mantiene el descubrimiento `Dashboard → Oportunidades → Brechas`.

### Baseline de confianza

- Quality checks: **9 checks / 0 fallas críticas / 1 warning**.
- Warning real: Change Engine **0/4 baselines**; debe cerrarse por ciclo cron natural. No fabricar baseline sintético.
- INAPI Open Data: operativo dentro de SLA diario.
- TDPI: operativo dentro de SLA semanal.
- Fuentes bajo demanda se distinguen de fuentes programadas; catálogo no automatizado no aparenta operación.

### Baseline de identidad

`VIDENTIA company identity benchmark v1`:

- 21 casos curados.
- Precision: **1.000**.
- Recall: **0.909**.
- Accuracy: **0.952**.
- 0 falsos positivos.
- 1 falso negativo conocido por boilerplate jurídico extenso.

### Baseline tecnológico

- OpenAlex: señal conservadora de investigación, normalización, retry y caché.
- Patentes INAPI: eje independiente de protección.
- Crossref: evidencia contextual filtrada por relevancia.
- GDELT: sólo contexto; una caída no se convierte en “cero actividad”.
- Confidence tecnológica v1 no supera `Media` con sólo dos ejes duros.

### Leyenda

- `DONE`: criterio de salida cumplido y verificado en producción.
- `IN PROGRESS`: capacidad operativa, pero faltan criterios Grade A.
- `NEXT`: siguiente foco prioritario.
- `PLANNED`: diseñado, aún no iniciado.
- `BLOCKED`: depende de credenciales, proveedor o decisión externa.

---

## 3. Roadmap por fases

| Fase | Objetivo | Estado | Criterio de salida |
| --- | --- | --- | --- |
| **1. Trust Layer** | Que nunca dudemos de la plataforma | **IN PROGRESS — cerca de cierre** | Freshness, degradación, reconciliación y fallos totalmente observables |
| **2. Intelligence Quality** | Que las conclusiones sean defendibles | **IN PROGRESS — avanzado** | Inteligencia reproducible, calibrada y auditada |
| **3. Executive Intelligence** | Responder las preguntas clave en 1–2 clics | **IN PROGRESS — muy avanzado** | Seis preguntas trazables de punta a punta, incluidas Oportunidades |
| **4. Recommendation Engine** | Pasar de señal a decisión | **IN PROGRESS — lifecycle operativo** | Todo cambio relevante produce recomendación o descarte explicado y medible |
| **5. Action Layer** | Que VIDENTIA haga trabajo | **IN PROGRESS — lifecycle + outcome operativos** | Señal → recomendación → acción → responsable → seguimiento → outcome |
| **6. Coverage Moat** | Ventaja de datos difícil de replicar | **IN PROGRESS** | Inteligencia multi-source real enlazada a empresa/tecnología/mercado |
| **7. Enterprise Grade** | Poder venderlo seriamente a corporativos | **IN PROGRESS — foundations** | RBAC, aislamiento, SSO, SLA, cuotas, observabilidad y recovery verificados |
| **8. Product Polish** | Que el producto se sienta Grade A | **IN PROGRESS — avanzado** | UX coherente, responsive y dashboards ejecutivos completos |

---

# FASE 1 — TRUST LAYER

## Ya construido y verificado

- Catálogo de fuentes y políticas de automatización.
- `intelligence_sources`, source state, ingestion runs y source events.
- Freshness y health visibles en `/fuentes`.
- Cron INAPI instrumentado de punta a punta.
- `completed / partial / failed` con semántica explícita.
- Retry/backoff acotado y circuit breaker `open / half_open / closed`.
- Health sweep independiente del cron de ingestión.
- SLA explícito por cadencia.
- Historial de health/freshness y alertas de degradación/resolución.
- Quality checks persistentes.
- Reconciliación de conteos del pipeline INAPI.
- Separación de fecha jurídica, actualización de fuente y observación por VIDENTIA.

## Pendiente real

1. Confirmar **4/4 baselines** del Change Engine por ciclo cron natural. Estado: `0/4`.
2. Observar ciclos productivos normales suficientes con los contratos actuales de health/alerts.
3. Exigir telemetría, SLA, health y quality contract antes de activar toda nueva fuente programada.
4. Extender reconciliación a nuevas ingestiones programadas.

## Criterio de salida

- 100% de fuentes programadas con health/freshness.
- 0 fallas críticas abiertas.
- Change Engine 4/4 baselines reales.
- 0 fallos silenciosos.
- Toda corrida deja evidencia de inicio, fin, duración, filas y resultado.

---

# FASE 2 — INTELLIGENCE QUALITY

## Ya construido y verificado

- Identity resolution corporativa conservadora.
- Alias y normalización de razones sociales.
- Entity Graph V2 no destructivo.
- Benchmark versionado y obligatorio en CI.
- Precision/recall/accuracy repetibles.
- Auto-link conservador; ambiguos quedan `review_required`.
- Merge/split manual auditado con snapshots y guardrails.
- Feedback `relevant / irrelevant / false_match / identity_incorrect`.
- Calibration snapshots persistentes.
- Dedupe de señales y expedientes.
- Change Engine y Strategic Change Engine.
- Quality gate que impide patrón estratégico con evidencia insuficiente.
- Trayectoria empresarial 360 días.
- Experimental separado de patrón estratégico.
- Scores explicables del Recommendation Engine.
- Corroboración tecnológica OpenAlex + INAPI.
- Filtros de relevancia Crossref/patentes.

## Pendiente real

1. Expandir benchmark de identidad; 21 casos es gate de no-regresión, no calidad poblacional.
2. Incorporar más empresas chilenas, grupos, subsidiarias, cambios de razón social y boilerplate.
3. Mejorar recall sin sacrificar precision 1.000.
4. Conseguir sample size real para calibration snapshots.
5. Crear benchmark etiquetado de patrones estratégicos.
6. Dedupe cross-source de publicaciones/versiones equivalentes.
7. Calibrar confidence por tipo de evidencia al agregar demanda, regulación e inversión.
8. Aumentar relaciones parent/subsidiary/group sólo con evidencia verificable.
9. Extender identity resolution a CMF, Mercado Público y EPO antes de elevar materialidad.

---

# FASE 3 — EXECUTIVE INTELLIGENCE

## Las seis preguntas canónicas

1. ¿Qué cambió esta semana?
2. ¿Qué está protegiendo ahora que hace seis meses no protegía?
3. ¿Dónde está llevando su tecnología?
4. ¿Quién está entrando en mi espacio?
5. ¿Qué tecnologías están acelerándose?
6. ¿Dónde aparecen oportunidades?

## Ya construido y verificado

- Dashboard con seis preguntas canónicas.
- Brief estratégico semanal.
- Change Engine / Strategic Change Engine.
- `/empresas`: comparación temporal, trayectoria y relaciones verificadas.
- `/tecnologias`: investigación + patentes + evidencia + fuerza de señal + CTAs.
- `/espacios`: entrantes, aceleración, consolidación y experimental.
- `/brechas`: comparación competitiva y Recommendation Engine.
- `/oportunidades`: recomendaciones persistidas, priorizadas y auditables.
- Dashboard muestra oportunidades activas y prioriza aceptadas/alta prioridad en la bandeja.
- `Dashboard → Oportunidades → Brechas` preserva una sola fuente de verdad para lifecycle y un acceso explícito al descubrimiento.
- Vigilancias estratégicas y deep-links contextuales.
- `Empresa → Espacio` y `Espacio → Brecha` cubiertos por gates contractuales.
- Confirmación de vigilancia separa navegación de mutación.
- Creación de vigilancia estratégica idempotente.
- `Executive flow gates regression` obligatorio.
- `Opportunities workspace regression` obligatorio.
- `Dashboard opportunities regression` obligatorio.

## Pendiente real

1. QA autenticado físico `Empresa → Espacio → Brecha` con binding aislado.
2. Crear efectivamente una vigilancia en navegador autenticado y verificar persistencia.
3. QA físico `Dashboard → Oportunidades → Brechas` con recomendaciones reales/controladas.
4. QA físico `Dashboard → análisis contextual` con una señal estratégica real/controlada.
5. Unificar actor vs mercado y actor vs portafolio propio donde corresponda.
6. Coherencia temporal `90d / 180d / 365d / histórico`.
7. Validar las seis preguntas en estados con datos, sin datos y error.

---

# FASE 4 — RECOMMENDATION ENGINE

## Ya construido y verificado

- Recommendation Engine V1.
- Portfolio Gap y Competitive Spaces.
- Score determinista 0–100.
- Materialidad, novedad, convergencia, persistencia y proximidad explicables.
- Guardrails jurídicos/estratégicos.
- Recommendation lifecycle persistente (#169):
  - `new`
  - `reviewed`
  - `accepted`
  - `discarded`
  - `converted_to_action`
- Descarte exige motivo.
- Conversión exige aceptación previa.
- Dedupe estable por organización + empresa propia + competidor + activo + clasificación.
- La recomendación se revalida server-side antes de persistirse; el navegador no dicta score/evidencia.
- Conversión idempotente a Caso + Evidencia + Acción.
- `/oportunidades` opera sobre recomendaciones persistidas y nunca recalcula el score en cliente.

## Pendiente real

1. Extender lifecycle/recomendaciones más allá de Portfolio Gap a nuevos actores, aceleración, clase nueva, cambio de titular, convergencia y maduración.
2. Emerging whitespace con evidencia suficiente; no usar actividad débil como predicción.
3. Mejorar proximidad al portafolio propio donde exista fundamento semántico.
4. Conectar feedback/calibración al ranking sin alterar hechos fuente.
5. Medir acceptance/rejection/conversion rate por tipo de recomendación.
6. Evaluar stale/refresh policy para recomendaciones cuyo contexto fuente cambie.

## Criterio de salida

Ninguna señal material queda como texto muerto: termina en recomendación accionable o descarte explicado, auditado y medible.

---

# FASE 5 — ACTION LAYER

## Estado actual

La foundation de #160 ya evolucionó:

- `create_intelligence_action` convierte inteligencia en Caso + Evidencia + Acción de forma atómica e idempotente.
- #168 expone `Crear tarea` desde contexto estratégico y mantiene `Crear vigilancia` como decisión independiente.
- #169 convierte recomendaciones aceptadas a trabajo y conserva `case_id/action_id`.
- #165 exige outcome atribuible antes de completar una acción y permite reapertura limpia.

Secuencia actualmente demostrable por contratos:

`Señal / contexto → Recomendación → Acción → Outcome`

Todavía falta completar el tramo operativo enterprise:

`Responsable → due date → seguimiento → recordatorio/SLA`

## Pendiente real

1. Responsable explícito y asignación.
2. Due date y SLA por acción.
3. Inbox de acciones pendientes/en revisión/resueltas/descartadas.
4. Recordatorios/notificaciones.
5. Métricas de ageing, tiempo a decisión y completion rate.
6. Brief/reporting trazable a evidencia y outcome.
7. QA autenticado de creación/conversión/cierre/reapertura en navegador.

## Criterio de salida

Una señal relevante termina en una acción asignada, seguida y cerrada dentro de VIDENTIA, preservando evidencia, responsable, decisión y outcome.

---

# FASE 6 — COVERAGE MOAT

## Cobertura actual

- INAPI marcas.
- INAPI patentes.
- TDPI.
- OpenAlex.
- Crossref.
- GDELT contextual.
- Corroboración tecnológica OpenAlex + INAPI.
- CMF disponible bajo demanda en la arquitectura.
- Mercado Público parcial por proveedor/RUT.
- EPO OPS catalogado, no operativo como eje.
- WIPO GBD como referencia/manual sin automatización no autorizada.

## Pendiente real

1. Capa semántica `tecnología → conceptos → CPC/IPC → productos/servicios → licitaciones/OC`.
2. Mercado Público como eje independiente de demanda.
3. CMF al entity graph y movimientos verificables.
4. EPO OPS: familias/estado legal/CPC como expansión internacional.
5. Regulación como eje independiente cuando exista fuente trazable.
6. Ciencia → tecnología → empresa → IP.
7. Empresa → IP → mercado → compras públicas → contexto.
8. Cross-source identity resolution antes de elevar confidence.
9. Source health obligatorio para cada conector.
10. Contener latencia/fallo de GDELT.
11. Dedupe de versiones/publicaciones equivalentes.

---

# FASE 7 — ENTERPRISE GRADE

## Foundations existentes

- APIs autenticadas con private/no-store.
- Tablas sensibles restringidas a service role cuando corresponde.
- RLS/SECURITY INVOKER en flujos de acción.
- Regresiones de roles y colaboración.
- API keys con ruta canónica y gate.
- Analytics privacy regression.
- Auditoría de identidad, feedback, lifecycle de recomendaciones y outcomes.
- Separación por organización en capacidades críticas.

## Pendiente real

### Seguridad y acceso

- RBAC formal por organización/capacidad.
- Tenant-isolation suite transversal.
- SSO SAML/OIDC.
- MFA compatible con política enterprise.
- Audit log consolidado/exportable.
- Rotación de secretos/API keys.

### Operación

- SLA/SLO.
- Quotas por plan/organización.
- Rate limiting verificable.
- Synthetic monitoring.
- P95 por rutas críticas.
- Runtime monitoring y alertas operativas.

### Recovery

- Backup policy.
- Restore drill real.
- Migration replay desde cero.
- Incident runbook.
- Rollback probado.
- RPO/RTO.

### Compliance readiness

- Retención de auditoría.
- Exportación de audit log.
- Revocación de acceso.
- Política de datos por tenant.
- Registro de fuentes/términos.
- Advisors sin warnings accionables antes del cierre.

---

# FASE 8 — PRODUCT POLISH

## Ya avanzado

- `/tecnologias` usa lenguaje ejecutivo y separa resultado, significado, evidencia y próximo paso.
- `/oportunidades` agrega una bandeja ejecutiva de recomendaciones persistidas.
- Dashboard prioriza decisiones y oportunidades sobre navegación técnica.
- Navegación móvil persistente (#167): Resumen, Marcas, Patentes, Casos y Más.
- Estados activos y safe area móvil.
- CTAs contextuales hacia vigilancia, acciones, brechas y evidencia.

## Pendiente real

### Arquitectura de información

- Simplificar la navegación final y retirar rutas legacy/duplicadas.
- Jerarquía coherente entre Resumen, Marcas, Patentes, Tecnologías, Empresas, Espacios, Brechas, Oportunidades, Vigilancia y Casos.

### UX y copy

- Aplicar `qué pasó → por qué importa → evidencia → acción` a Empresas, Espacios y Brechas.
- 1–2 CTAs relevantes por superficie ejecutiva.
- GDELT sólo dentro de Contexto/Noticias cuando falle.
- Empty/loading/error states consistentes.
- Responsive desktop/tablet/mobile.
- Teclado/accesibilidad.
- Overflow y datasets largos.
- Validation/error recovery.

### Dashboard

- Primer viewport ejecutivo: avanzado con #171.
- Oportunidades/recomendaciones: operativo.
- Casos/cambios prioritarios: operativo.
- Acciones pendientes con responsable/SLA: pendiente de Fase 5.
- Health de fuentes discreto pero visible: revisar integración final.

### QA visual final

- Auditoría ruta por ruta.
- Desktop + mobile.
- Estados con datos / sin datos / error.
- Visual regressions.
- Print/PDF cuando corresponda.

---

# 4. Ejecución por bloques

## Bloque A — Fases 1–3

Estado: **muy avanzado; gates contractuales fuertes, pero todavía faltan baselines naturales y QA físico autenticado.**

Cierre pendiente:

1. Change Engine 4/4 por ciclo natural.
2. QA autenticado real de Brecha con binding controlado.
3. Submit real de vigilancia y persistencia.
4. Dashboard contextual + Oportunidades en navegador con evidencia/recomendación controlada.
5. Expandir benchmark/calibración.

## Bloque B — Fases 4–6

Estado:

- Fase 4: lifecycle canónico mergeado y Oportunidades operativa; faltan nuevas familias de recomendación y métricas de aceptación.
- Fase 5: creación, conversión, outcome y reapertura operativos; faltan responsable, due date, SLA e inbox de seguimiento.
- Fase 6: v1 multi-source tecnológica operativa; cobertura comercial/empresa global parcial.

Orden operativo recomendado:

1. Cerrar QA físico residual del Bloque A cuando el navegador automatizado esté disponible.
2. Completar responsable + due date + inbox/SLA del Action Layer.
3. Medir acceptance/rejection/conversion de recomendaciones.
4. Extender recomendaciones a nuevas señales estratégicas.
5. Construir demanda comercial semántica antes de ponderar Mercado Público.
6. Incorporar CMF/EPO con entity resolution y health.
7. Validar cross-source reasoning con dataset curado.

## Bloque C — Fases 7–8

1. RBAC/tenant isolation/SSO/quotas.
2. Observabilidad/SLA/recovery.
3. UX/copy/CTAs ruta por ruta.
4. QA visual y responsive integral.
5. Audit técnico final.
6. Soak productivo.
7. Cierre Grade A.

---

# 5. Gaps prioritarios actuales

## P0 — bloquean declarar Grade A

1. **Change Engine 0/4 baselines** — sólo ciclo cron natural.
2. **QA autenticado físico residual** — Brecha, vigilancia, Dashboard contextual y Oportunidades.
3. **Action Layer sin responsable/due date/SLA/inbox operativo completo.** Outcome ya está implementado; no volver a listar outcome como faltante.
4. **Cobertura comercial insuficiente** — Mercado Público aún no puede ponderarse semánticamente por tecnología.
5. **Enterprise Grade incompleto** — RBAC transversal, tenant isolation, SSO, quotas, recovery y observabilidad formal.

## P1 — elevan calidad y valor diferencial

1. Expandir benchmark de identidad y patrones estratégicos.
2. Nuevas familias de recomendación y métricas acceptance/rejection/conversion.
3. Demanda comercial, CMF, EPO y regulación como ejes independientes.
4. Dedupe de versiones equivalentes en evidencia científica.
5. Contener latencia/fallo de GDELT.
6. Instrumentar cuota/costo OpenAlex si pasa a control operativo.
7. Aplicar narrativa ejecutiva + CTAs a Empresas, Espacios y Brechas.
8. QA responsive completo y eliminación de superficies legacy.

## P2 — cierre enterprise/productivo

1. SLO/SLA y dashboards de observabilidad.
2. Synthetic monitoring.
3. Backup/restore drill + RPO/RTO.
4. Audit log exportable y compliance readiness.
5. Soak productivo y audit de migrations 1:1.

---

# 6. Gates obligatorios de ingeniería

Para cada PR relevante:

1. Regression tests del dominio.
2. `tsc --noEmit`.
3. Next.js production build.
4. CodeQL.
5. Preview Vercel `READY/SUCCESS`.
6. Migrations/Advisors cuando hay DB.
7. Smoke auth/authorization.
8. Smoke funcional de ruta principal.
9. Merge a `main` sólo con gates verdes sobre el mismo SHA.
10. Production deployment `READY/SUCCESS`.
11. Production smoke.
12. Runtime error scan cuando la herramienta esté disponible.

Para RLS/auth/SECURITY DEFINER/datos cross-tenant/migraciones destructivas se exige además prueba transaccional/rollback-safe.

---

# 7. Métricas Grade A

## Data

- ≥99% sync success en ventana operativa.
- 100% fuentes programadas con freshness visible.
- 0 eventos relevantes sin source/evidence traceability.
- 0 partial failures reportados como éxito completo.
- Change Engine 4/4 baselines reales.

## Intelligence

- Benchmark representativo y versionado.
- Precision/recall documentados.
- 0 patrones estratégicos presentados como hechos sin evidencia suficiente.
- 100% recomendaciones con explicación/evidencia.
- Confidence separado de momentum y madurez comercial.
- Acceptance/rejection/conversion medibles por tipo de recomendación.

## Reliability / Performance

- CI/TypeScript/build/CodeQL obligatorios.
- P95 interactivo <1 s donde no dependa de fuentes externas lentas.
- P95 RPC críticos preferentemente <300 ms.
- P95 navegación útil <2 s salvo dependencia externa justificada.
- Retry/circuit breaker donde corresponda.
- Fuentes lentas no bloquean ejes duros.

## Security

- 0 WARN accionables de Security Advisor antes del cierre.
- RLS/grants auditados.
- Tenant isolation transversal.
- Secret/API-key lifecycle documentado.
- SSO/RBAC enterprise antes de cerrar Fase 7.

## UX

- Rutas críticas verificadas desktop/mobile.
- Sin dead ends.
- Empty/loading/error states diseñados.
- Toda señal material conduce a contexto, recomendación o acción.
- Fallos contextuales no aparentan fallo del análisis completo.

---

# 8. Definition of Done

VIDENTIA es **Grade A / proyecto cerrado** sólo cuando:

1. Las 8 fases están `DONE`.
2. Las seis preguntas funcionan de punta a punta.
3. Todas las fuentes productivas tienen health/freshness observable.
4. Intelligence Quality alcanza umbrales acordados sobre muestra representativa.
5. Recomendaciones relevantes se convierten en acciones dentro del producto.
6. Action Layer incluye responsable, seguimiento y outcome.
7. Coverage multi-source está operativa, no sólo catalogada.
8. Enterprise security/recovery tiene evidencia verificable.
9. QA visual desktop/mobile completo.
10. Migration history y producción están 1:1.
11. Release final tiene CI/CodeQL/typecheck/build verdes.
12. No quedan P0/P1 conocidos.
13. Soak productivo final sin incidentes críticos.
14. Puede demostrarse `fuente → evidencia → conclusión → recomendación → acción → outcome` sobre caso real/controlado.

---

# 9. Regla de mantenimiento

Después de cada bloque mergeado:

- actualizar fases afectadas;
- registrar PR/commit relevante;
- marcar criterios cumplidos;
- conservar deuda/riesgo residual;
- actualizar baseline;
- no eliminar pendientes sólo porque existe una feature;
- no declarar `DONE` sin evidencia de producción.

El roadmap describe resultados y criterios, no sólo features. Hasta el cierre, **`ROADMAP.md` sigue siendo la fuente canónica del proyecto**.
