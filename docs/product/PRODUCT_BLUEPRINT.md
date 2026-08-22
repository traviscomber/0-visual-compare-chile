# Visual Compare — Product Blueprint

**Status:** working product contract for the refactor  
**Scope:** narrative, information architecture and UX direction only. Existing data, INAPI, AI, security and sync pipelines remain intact unless a later technical change is explicitly justified.

## 1. Product position

### Core promise

**Entiende el panorama antes de decidir.**

Visual Compare is an intelligence platform for industrial property in Chile. It combines trademarks, patents, official INAPI data, visual analysis, AI-assisted classification and competitive monitoring in one decision workflow.

### Supporting line

**Marcas, patentes e inteligencia competitiva en una sola plataforma.**

### Product model

Visual Compare is organized by user intent, not by technical capability:

1. **Evaluar** — reduce uncertainty before acting.
2. **Investigar** — understand companies, technologies, portfolios and prior rights.
3. **Monitorear** — keep watch after a decision and detect relevant movement.

A fourth idea is transversal rather than a navigation item:

**Anticipar** — turn historical and newly published signals into earlier decisions.

## 2. Competitive framing

International products increasingly sell outcomes rather than search boxes. Corsearch frames trademark work around screening, search and watch across the brand lifecycle. Questel positions patent intelligence around informed strategic decisions, technology scouting, competitive analysis and monitoring. PatSnap connects patent and non-patent data to explain technology and competitive landscapes.

Visual Compare should not imitate enterprise IP-management suites. Its position is simpler:

- local depth in Chile;
- official INAPI data;
- trademark and patent intelligence in the same environment;
- visual trademark analysis;
- accessible workflows for legal, innovation and business users;
- monitoring built into the same product used for evaluation and research.

## 3. Target users and jobs

### Legal / IP professional

**Job:** determine what deserves deeper legal review before filing, advising or escalating.

Needs:
- prior marks and status;
- Niza/Viena context;
- visual/denominative similarity;
- traceable evidence;
- saved history;
- monitoring after a filing or strategic decision.

### Innovation / R&D / strategy

**Job:** understand what competitors and technology actors are doing.

Needs:
- patent search;
- IPC exploration;
- company profiles;
- inventors and technology concentration;
- annual activity and change;
- watches for companies and IPC areas.

### Business / brand team

**Job:** decide whether a name or identity is worth advancing and identify early conflict signals.

Needs:
- guided evaluation;
- plain-language result;
- clear next action;
- evidence without requiring expert search syntax.

## 4. Information architecture

### Primary navigation

**Inicio**  
Intelligence Home: what needs attention, recent work and next actions.

**Evaluar**  
Primary workflow for a new trademark decision.

**Investigar**  
Unified discovery entry point. Tabs or sub-contexts:
- Marcas
- Patentes
- Empresas
- Tecnologías / IPC

**Monitorear**  
Watchlists, alerts and changes.

### Secondary / utility navigation

Keep these accessible but remove them from the product story:
- Historial
- Comparar imágenes
- API / Integraciones
- Operaciones
- Configuración
- Administración

These are tools and operational surfaces, not the mental model of the product.

## 5. Route mapping: new story over existing implementation

No large route migration is required for phase 1. We can preserve URLs and reorganize labels/navigation first.

| Product concept | Current implementation | Phase 1 action |
|---|---|---|
| Inicio | `/dashboard` | redesign as Intelligence Home |
| Evaluar | `/agente` | keep route, rewrite experience and hierarchy |
| Investigar · Marcas | `/consulta-inapi` and `/consulta` | expose one primary entry; keep advanced/indexed search secondary |
| Investigar · Patentes | `/patentes` search mode | keep route and improve narrative |
| Investigar · Empresas | `/patentes` company mode | elevate as first-class research path |
| Monitorear | `/patentes/alertas` | rename and expand narrative beyond “alerts” |
| Historial | `/history` / `/comparisons` | utility area |
| Comparar imágenes | `/compare` | expert utility, not primary nav |
| API | `/dashboard/playground` | Integraciones / API |
| Operaciones | `/dashboard/processing` | admin/ops utility |

## 6. Intelligence Home

The current dashboard is a welcome page and oversized CTA. The new home should answer four questions in under 10 seconds:

1. **¿Qué cambió?**
2. **¿Qué requiere atención?**
3. **¿Qué estaba investigando?**
4. **¿Qué puedo hacer ahora?**

### Recommended structure

#### A. Hero / command area

Headline:

**¿Qué quieres entender hoy?**

Primary actions:
- Evaluar una marca
- Investigar una empresa o tecnología
- Revisar monitoreos

Optional universal search later; do not block phase 1 on it.

#### B. Signals / attention

Compact cards, only when real data exists:
- new watch matches;
- high-risk or review-required trademark analyses;
- meaningful competitive activity;
- data freshness degradation.

Do not fill this area with vanity statistics.

#### C. Continue working

Recent evaluations, searches and company profiles.

#### D. Coverage / trust

Small, low-noise status strip:
- INAPI marks fresh;
- patents fresh;
- historical patent coverage complete;
- source and last refresh.

Trust should be visible but not dominate the page.

## 7. Journey: Evaluar

### User question

**“¿Vale la pena avanzar con esta marca y qué debería revisar antes?”**

### Experience

#### Step 1 — Identify
- brand/name required;
- logo optional;
- products/services or business context when available.

#### Step 2 — Analyze
System handles complexity behind the scenes:
- denominative search;
- INAPI evidence;
- Niza;
- Viena if logo exists;
- visual analysis;
- multimodel AI routing;
- risk synthesis.

Do not expose internal model tiers or implementation details in the main flow.

#### Step 3 — Decision view
Lead with:
- decision / risk;
- why;
- evidence that matters;
- recommended next action.

Then allow drill-down into:
- INAPI matches;
- classes;
- visual evidence;
- methodology;
- technical traceability.

### Copy principle

Replace implementation language with decision language.

Instead of: **Clasificación Niza**  
Use: **Dónde puede existir conflicto**

Instead of: **Antecedentes INAPI**  
Use: **Marcas que debes revisar**

Instead of: **Resultados activos**  
Use: **Antecedentes vigentes relevantes**

The exact legal terminology remains available inside details.

## 8. Journey: Investigar

### User question

**“¿Qué existe y qué me dice sobre este mercado, empresa o tecnología?”**

### One entry, multiple lenses

The user should not have to know whether to open “INAPI”, “Patentes” or “base indexada” first.

Start with a research intent selector or contextual search:
- Marca
- Empresa
- Tecnología
- Patente / IPC

### Company view

A company profile should become a reusable intelligence object, not just a search result.

Recommended hierarchy:
- observed portfolio;
- annual activity / trajectory;
- dominant technologies;
- recent movements;
- recurrent inventors;
- associated applicant-name variants;
- watch this company CTA.

### Technology view

- search concept;
- IPC groups;
- relevant applicants;
- activity over time;
- latest applications;
- monitor this area CTA.

## 9. Journey: Monitorear

### User question

**“¿Qué cambió desde la última vez que miré?”**

The word “alertas” describes a mechanism, not the user outcome. The product area should be **Monitorear**.

Objects:
- companies;
- IPC / technology areas;
- later: marks / names where evidence supports reliable monitoring.

Home of this journey:
- watchlist;
- new signals;
- unread / reviewed state;
- date and reason matched;
- jump directly to company, patent or evidence context.

### Event design

Every event must answer:
- what happened;
- why it matched my watch;
- when;
- why it may matter;
- what can I inspect next.

## 10. Landing page narrative

The public landing should stop presenting Visual Compare as only a pre-registration logo tool.

### Hero

**Entiende el panorama antes de decidir.**

Marcas, patentes e inteligencia competitiva en una sola plataforma, con datos oficiales de INAPI y análisis asistido por IA.

Primary CTA: **Entrar a Visual Compare**  
Secondary CTA: **Ver cómo funciona**

### Three outcome blocks

#### Evalúa antes de avanzar
Understand conflicts, classifications and relevant prior marks before investing more time.

#### Investiga el panorama
Explore companies, technologies, patents, IPC and industrial-property activity.

#### Monitorea lo que importa
Follow competitors and technology areas and see relevant new filings as they appear.

### Trust section

Explain quietly:
- official INAPI open data;
- daily synchronization;
- local-first search;
- traceable results;
- AI as analysis support, not authority.

Avoid leading with model names, token costs or infrastructure.

## 11. Language system

### Prefer
- panorama
- señales
- evidencia
- actividad
- antecedentes relevantes
- movimientos
- investigar
- evaluar
- monitorear
- decisión
- revisar
- trazabilidad

### Avoid in primary product copy
- pipeline
- RPC
- pg_trgm
- CKAN
- multimodelo
- service role
- embeddings
- endpoint
- “IA” in every title

These can exist in docs/admin surfaces.

### Risk language

Never imply legal certainty.

Prefer:
- “requiere revisión”
- “no se detectaron antecedentes activos relevantes en esta consulta”
- “señal preliminar”
- “evidencia observada”

Avoid:
- “registrable” as an unconditional conclusion;
- “aprobado”;
- “sin riesgo”.

## 12. Visual direction

The current product mixes dark gradients, glassmorphism and standard shadcn surfaces. The refactor should reduce visual modes.

Direction:
- editorial intelligence product rather than AI demo;
- calm neutral surfaces;
- one strong accent system;
- clear typographic hierarchy;
- dense information when useful, generous space around decisions;
- charts and rankings only when they answer a question;
- badges reserved for status, not decoration.

The authenticated product should feel more like an intelligence workspace than a marketing landing page.

## 13. Phase plan

### Phase 1 — Product shell
- landing narrative;
- navigation IA;
- Intelligence Home;
- shared page headers / action patterns;
- no data-pipeline change.

### Phase 2 — Evaluar
- simplify input flow;
- decision-first result layout;
- move technical evidence into progressive disclosure;
- preserve existing endpoint and report model.

### Phase 3 — Investigar
- unify entry points;
- improve patent/company views;
- connect search result → profile → monitor action.

### Phase 4 — Monitorear
- redesign watchlist/event inbox;
- make events explainable and actionable;
- connect back to research views.

### Phase 5 — Consolidation
- remove duplicate routes only after telemetry/usage validation;
- reconcile docs;
- update client handoff;
- accessibility and responsive pass.

## 14. Non-negotiables

- Do not break INAPI daily sync or freshness health.
- Do not change data semantics just to fit new copy.
- Do not expose internal AI routing as product complexity.
- Do not remove expert tools before the replacement path is validated.
- Do not merge a narrative/UI phase without TypeScript, build, CodeQL and Vercel preview passing.
- Keep legal uncertainty explicit and evidence traceable.

## 15. Success criteria

A new user should be able to explain Visual Compare after one screen as:

> “Me ayuda a evaluar una marca, investigar marcas/patentes/empresas y monitorear movimientos relevantes en Chile.”

A returning user should reach their next action from the dashboard in one click.

A legal or innovation user should be able to go from a signal to its underlying INAPI evidence without losing context.
