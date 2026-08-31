# VIDENTIA — ROADMAP CANÓNICO V2

> Fuente de verdad del producto desde el reenfoque de 31-08-2026.
>
> VIDENTIA no se desarrolla como tres productos independientes ni como una colección de módulos internos. Es una sola plataforma de **IP & Technology Intelligence** con tres verticales: **Brands, Patents y Technologies**.

## 1. North Star

**VIDENTIA — Intelligence for intellectual property and technology.**

**Brands. Patents. Technologies. Search once—or keep watching.**

Motor común de producto:

`SEARCH → COMPARE → EVALUATE → WATCH → REPORT`

Motor operativo interno ya construido:

`Fuente → Evidencia → Cambio observado → Inteligencia → Recomendación → Acción → Seguimiento → Outcome`

Ambas secuencias son compatibles. La primera organiza lo que entiende y compra el cliente; la segunda conserva la trazabilidad y el trabajo interno que ya existe.

Principio de credibilidad:

`Hecho observado → Señal → Interpretación → Hipótesis → Recomendación`

VIDENTIA nunca presenta predicción, intención empresarial, registrabilidad, patentabilidad o libertad de operación como hecho cuando la evidencia no lo permite.

---

## 2. Baseline productivo que se conserva

Repositorio: `traviscomber/0-visual-compare-chile`

Baseline de partida: `main` `54d18ef5eb4da4fff4066059de22598fec5b836d`.

Capacidades valiosas ya operativas y que **no se reconstruyen**:

- corpus real de marcas INAPI y clasificaciones Niza/Viena;
- comparación denominativa, fonética y visual;
- corpus real de patentes INAPI con IPC, solicitantes, inventores, fechas y estado observado;
- Technology Intelligence con OpenAlex + Crossref + INAPI Patents + GDELT contextual;
- entity/company intelligence, espacios competitivos y brechas IP;
- Recommendation lifecycle persistente;
- `/oportunidades` como bandeja ejecutiva;
- Caso + Evidencia + Acción idempotentes;
- outcome atribuible, responsable, due date y estados SLA visibles;
- vigilancia marcaria y estratégica;
- source health, freshness, quality gates y degradación explícita;
- dashboard ejecutivo y navegación móvil;
- RLS, auditoría y guardrails de revisión humana.

Deuda real conocida que se conserva como deuda, pero deja de dictar el orden del producto:

- Change Engine requiere baselines naturales completos;
- QA físico autenticado sigue pendiente en algunos flujos;
- leaked-password protection de Supabase continúa como warning global;
- coverage internacional de patentes todavía es insuficiente para vender FTO/patentability como conclusión madura.

---

## 3. Arquitectura de producto obligatoria

### Vertical 1 — BRANDS

Pregunta principal: **Can I use and protect this brand?**

Antes de registro:

- nombre;
- logo;
- goods/services;
- jurisdicción;
- similitud denominativa;
- similitud fonética;
- similitud visual;
- Niza/Viena;
- titulares;
- estado;
- evidencia oficial;
- findings priorizados.

Después de registro:

- watch recurrente;
- variantes;
- clases;
- competidores;
- cambios de titularidad/estado;
- solicitudes similares;
- reportes recurrentes.

### Vertical 2 — PATENTS

Pregunta principal: **Does this invention already exist?**

V1 realista:

- búsqueda por lenguaje natural/título/solicitante/IPC;
- prior-art candidates;
- solicitantes e inventores;
- prioridades/PCT observadas;
- fechas y estado;
- similitud explicada;
- evidencia oficial;
- competitor watch.

Antes de vender Patentability/FTO como modos maduros deben existir:

- family resolution canónica;
- jurisdictions;
- legal-status model más robusto;
- citations;
- cobertura internacional EPO/WIPO o equivalente validado.

Regla permanente:

`SOURCE ≠ ANALYSIS ≠ LEGAL CONCLUSION`

### Vertical 3 — TECHNOLOGIES

Pregunta principal: **Where is this technology moving?**

Ejes actuales:

- research;
- patents;
- companies;
- contextual news.

Ejes a completar sólo con fuentes defendibles:

- commercial adoption;
- new companies;
- regulation;
- funding/demand cuando exista evidencia suficiente.

Output firma:

`WHAT CHANGED → WHY IT MATTERS → WHO IS MOVING → WHAT TO WATCH NEXT`

---

## 4. Arquitectura pública

La landing deja de vender VIDENTIA como producto de marcas.

Navegación pública objetivo:

`PLATFORM / BRANDS / PATENTS / TECHNOLOGIES / PRICING / RESOURCES / LOG IN / START A SEARCH`

Home debe incluir, en este orden conceptual:

1. umbrella hero;
2. three questions / three verticals;
3. Brand Intelligence;
4. Patent Intelligence;
5. Technology Intelligence;
6. one intelligence engine;
7. interactive 3-mode product demo;
8. intelligence reporting;
9. one-time check → watch → subscription → team workspace;
10. audiences;
11. real proof only;
12. commercial tiers;
13. final 3-way CTA.

No usar:

- landing centrada sólo en marcas;
- tres tarjetas SaaS desconectadas;
- gradientes como lenguaje de marca;
- glassmorphism;
- colores distintos por vertical;
- métricas inventadas;
- generic Lucide icon language como identidad final.

---

## 5. Arquitectura autenticada

Top-level objetivo:

`OVERVIEW / BRANDS / PATENTS / TECHNOLOGIES / WATCHES / REPORTS`

El home autenticado responde primero:

**WHAT REQUIRES ATTENTION?**

Los módulos internos existentes no se eliminan; cambian de jerarquía:

- Empresas vive dentro de contexto de Patents/Technologies;
- Espacios y Brechas viven como análisis competitivo;
- Oportunidades vive como decisión ejecutiva;
- Portfolio vive dentro de Brands/organization context;
- Casos vive como Team Workspace/Action Layer;
- Notificaciones vive como apoyo de Watches/Attention.

La navegación debe reflejar objetivos del usuario, no la estructura del backend.

---

## 6. Watch Model canónico

Objetivo: todo seguimiento recurrente se percibe como **un solo objeto WATCH**, aunque la migración técnica sea progresiva.

Contrato objetivo:

- `type: brand | patent | technology`;
- subject/query;
- scope;
- geography;
- frequency;
- competitors;
- Nice/IPC cuando aplique;
- active/paused;
- last_checked_at;
- last_reviewed_at;
- signal_count;
- evidence refs;
- organization/user ownership.

Estado actual a unificar:

- `trademark_watches`;
- `patent_watches`;
- `intelligence_watches`.

No borrar historial ni forzar big-bang migration. Primero contrato/API/UI común; después adapters/migración.

---

## 7. Reporting canónico

Todo reporte debe responder:

1. WHAT CHANGED
2. WHAT MATTERS
3. EVIDENCE
4. RECOMMENDED REVIEW
5. WATCH NEXT

Crear un snapshot/version de intelligence report independiente del vertical y trazable a fuentes/evidencia.

No prometer PDF, versionado documental o envío recurrente hasta que exista persistencia canónica y QA real.

---

## 8. Commercial architecture

Conversión principal:

`ONE-TIME CHECK → CREATE A WATCH → INTELLIGENCE SUBSCRIPTION → TEAM WORKSPACE`

Entrada comercial objetivo:

- One-time Check;
- VIDENTIA Pro;
- VIDENTIA Enterprise.

No fijar pricing final sin validación comercial.

El producto debe crear naturalmente la pregunta:

**Would you like VIDENTIA to keep watching this for you?**

---

## 9. Sistema visual

Paleta bloqueada:

- `#0F2A33` main background;
- `#091A20` deep background;
- `#E7DFCE` major headings;
- `#FFFFFF` body;
- `#4A7F74` brand green;
- `#96B5A6` sage;
- `#B7D3D1` pale mineral;
- `#456E8E` muted blue;
- `#BDBEBD` secondary text.

Montserrat only. Major headings Light/Regular.

Firma geométrica por vertical, sin cambiar color:

- BRAND = dos formas casi idénticas / similarity;
- PATENTS = estructuras anidadas / prior art / structure;
- TECHNOLOGIES = señales convergiendo / movement / emergence.

Icon family final construida con:

- circle;
- semicircle;
- quarter circle;
- square;
- rectangle;
- diagonal;
- grid;
- dot cluster;
- overlap.

Mucho espacio negativo. Si hay duda: **remove, enlarge spacing, simplify**.

---

## 10. Nuevo orden de desarrollo — grupos de 2

### Grupo 1 — Producto y superficie pública

**1. Product architecture / canonical roadmap — NOW**

- este archivo;
- detener priorización anterior por deuda interna;
- conservar backend valioso;
- fijar verticales, engine, Watch y Report como arquitectura oficial.

**2. Public product / landing umbrella — NOW**

- hero umbrella;
- 3 verticals;
- Brand/Patent/Technology storytelling;
- common engine;
- product demo;
- report pattern;
- watch/subscription progression;
- commercial architecture;
- `/es/tecnologias` y `/en/technologies` públicos;
- metadata deja de ser trademark-only.

### Grupo 2 — Portal y Watches

**3. Portal IA**

- simplificar top-level a Overview/Brands/Patents/Technologies/Watches/Reports;
- preservar deep links y módulos actuales;
- elevar atención/decisiones, no KPIs decorativos.

**4. Common Watches**

- contrato API/UI común;
- adapters a tablas existentes;
- frecuencia/geografía/scope consistentes;
- un solo inbox de señales.

### Grupo 3 — Patents y Reports

**5. Patent V1 real**

- family resolution;
- prioridades/PCT;
- jurisdictions;
- legal status;
- citations;
- prior-art workflow;
- competitor watch;
- expansión EPO antes de FTO/Patentability maduros.

**6. Common Reports**

- snapshot canónico;
- 5 preguntas comunes;
- evidencia trazable;
- versionado;
- report history por vertical.

### Grupo 4 — Technology y Action

**7. Technology signature**

- output firma;
- commercial adoption / companies / regulation cuando haya evidencia;
- watch conversion integrada.

**8. Action + Enterprise**

- retomar reminders/escalations por `due_at`;
- ageing/time-to-decision/completion metrics;
- enterprise hardening;
- SSO/recovery/cuotas sólo donde sean necesarias.

### Grupo 5 — Visual y Comercial

**9. Final visual system**

- Bauhaus icons;
- vertical geometry;
- retirar Lucide del marketing;
- responsive;
- accessibility;
- visual QA.

**10. Proof + commercial validation**

- sólo cifras reales;
- corpus/freshness/coverage medible;
- tiers definitivos;
- conversion instrumentation;
- pricing después de evidencia comercial.

---

## Definition of Grade A

VIDENTIA llega a Grade A cuando:

1. una persona entiende Brands / Patents / Technologies en menos de un minuto;
2. las tres verticales comparten el mismo motor conceptual y visual;
3. Search puede convertirse naturalmente en Watch;
4. Watch produce señales priorizadas y Report consistente;
5. toda conclusión importante conserva evidencia y límites explícitos;
6. el portal muestra primero qué requiere atención;
7. Patents no promete más cobertura legal/técnica de la que realmente posee;
8. Technology distingue investigación, patentes y contexto;
9. una recomendación puede convertirse en trabajo y outcome sin perder trazabilidad;
10. datos, diseño, seguridad y QA sostienen la misma promesa comercial.

Hasta entonces, nuevas features que no mejoren directamente esta arquitectura quedan subordinadas al roadmap.