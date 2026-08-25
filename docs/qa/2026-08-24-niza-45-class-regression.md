# VIDENTIA Niza — 45-Class Regression QA 2026-08-24

## Objetivo

Convertir la validación de Clasificación Niza en una regresión permanente y cubrir las 45 clases de NCL (13-2026) con casos simples, inequívocos y etiquetados.

Esta ronda complementa `docs/qa/2026-08-24-niza-stability-validation.md`, que corrigió la inestabilidad observada en 09/35/42/45.

## Fuente normativa

La matriz se preparó contra NCL (13-2026), vigente desde el 1 de enero de 2026, usando la publicación oficial de OMPI/WIPO y los títulos de clase internos de VIDENTIA.

Referencias:

- https://www.wipo.int/es/web/classification-nice
- https://nclpub.wipo.int/esen/pdf-download.pdf?dateInForce=20260101&lang=esen&tab=class_headings
- https://www.wipo.int/classifications/nice/nclpub/es/en/?basic_numbers=show&class_number=9
- https://www.wipo.int/classifications/nice/nclpub/es/en/?basic_numbers=show&class_number=42

## Artefactos permanentes

### Fixture 01–45

Archivo:

`tests/fixtures/niza-regression-cases.json`

Contiene exactamente un caso base por cada clase 01–45. Cada caso tiene:

- `id` estable (`niza-01` … `niza-45`);
- clase esperada;
- descripción simple del producto o servicio.

El objetivo del fixture es detectar pérdida de cobertura, duplicados, clases faltantes y servir como corpus común para futuras corridas live.

### Guardrails compartidos

Archivo:

`lib/agent/niza-guardrails.ts`

La lógica determinista que antes estaba embebida en `niza-classifier.ts` fue extraída a un módulo reutilizable. El clasificador de producción ahora usa exactamente el mismo módulo que valida el regression runner.

Cobertura determinista crítica:

- software producto -> 09;
- SaaS/PaaS/hosting/desarrollo -> 42;
- SaaS + aplicación descargable -> 09 + 42;
- legal-tech SaaS no implica 45;
- servicios jurídicos explícitos -> 45;
- producto propio no implica 35;
- publicidad/marketing explícitos -> 35;
- deduplicación y prioridad `principal` deterministas.

### Runner de CI

Archivo:

`scripts/niza-regression.mts`

Comando:

`pnpm test:niza`

El runner no usa red ni OpenAI. Valida:

1. exactamente 45 fixtures;
2. cobertura única de 01 a 45;
3. IDs consistentes;
4. descripciones no vacías;
5. 8 aserciones deterministas de guardrails.

Se agregó el paso `Niza regression` a `.github/workflows/ci.yml` antes de TypeScript y del build de Next.js.

## Validación live de las 45 clases

Se creó temporalmente `/api/health/niza-45-suite` para ejecutar el `NizaClassifier` real de producción sobre los 45 fixtures.

Configuración:

- modelo de entrada observado: `gpt-5.6-luna`;
- ejecución en lotes de 5 casos;
- criterio 1: la clase esperada debe estar presente;
- criterio 2 estricto: el resultado debe ser exactamente la única clase esperada;
- errores de modelo o schema se contabilizan como FAIL.

### Pase live 1

Hora UTC: 2026-08-25T01:46:54Z.

Resultado:

- total: 45;
- clase esperada presente: 45/45;
- exact single-class: 45/45;
- errores: 0;
- failures: 0;
- non-exact: 0.

### Pase live 2

Hora UTC: 2026-08-25T01:47:28Z.

Resultado:

- total: 45;
- clase esperada presente: 45/45;
- exact single-class: 45/45;
- errores: 0;
- failures: 0;
- non-exact: 0.

Resultado acumulado de estabilidad: **90/90 clasificaciones exactas** en dos pases completos consecutivos.

## Commits de implementación

- `bae841c6d3815bf6ca9e0ebd7d82ddca5b6afdec` — extracción de guardrails deterministas.
- `86cdf3284f92496b6ef3c2ff0006f56e5f5b34ba` — clasificador usa el módulo compartido.
- `fbd7b33a8438c2bc011c69c039b6bee76c474caa` — fixture permanente 01–45.
- `54ae178c7e8789dc8c8fdb258ba91584fae324ab` — runner determinista.
- `23e08621fcc3ef45d596e93e395ef5c186509b01` — comando `pnpm test:niza`.
- `a668b3d6c3455d2d9e5aa2111645dd09be00c372` — regression gate agregado a CI.
- `1479a5721b933101a7a56452e23612265bbebe12` — probe live temporal de 45 clases.

## Criterio de cierre

PASS si:

- fixture cubre 01–45 sin duplicados;
- `pnpm test:niza` pasa en CI;
- TypeScript pasa;
- Next.js production build pasa;
- dos corridas live consecutivas obtienen 45/45 clase esperada y 45/45 exact single-class;
- el probe temporal se elimina al finalizar.

## Riesgos residuales

1. Los 45 casos base son deliberadamente simples y unívocos; no cubren todavía descripciones multi-producto o multi-servicio complejas.
2. La exactitud en solicitudes reales depende de la especificación concreta de productos/servicios y de su modalidad.
3. El fixture debe revisarse cuando cambie la edición/version de la Clasificación de Niza.
4. La regresión live no corre en cada CI para evitar costo, dependencia de red y flakiness generativa; CI protege la integridad del corpus y los guardrails deterministas.
5. La recomendación de clases sigue siendo asistencia técnica y no reemplaza la revisión final de una estrategia marcaria ante INAPI.
