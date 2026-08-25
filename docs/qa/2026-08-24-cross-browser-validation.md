# VIDENTIA — Cross-browser Validation 2026-08-24

## Resumen

Validación real de `https://videntia.app` ejecutada con Browserin mediante el fallback cloud Playwright autorizado en GitHub Hosted Actions.

Resultado de validación viva: **PASS — 7 pruebas ejecutadas correctamente + 2 skips deliberados**.

Estado automático seguro actual: **PASS — 18 pruebas ejecutadas correctamente + 3 skips deliberados, 0 fallos**, con `E2E_LIVE=0` y sin investigación pública real.

Cobertura:

- Chromium: E2E real de producción opt-in + smoke, resultados controlados, teclado, rutas públicas y responsive.
- Firefox: smoke, resultados controlados, teclado, rutas públicas y responsive.
- WebKit: smoke, resultados controlados, teclado, rutas públicas y responsive.
- Safari real/macOS: **no probado**. WebKit es cobertura del motor Playwright en Linux y no debe presentarse como Safari real.

## Infraestructura

Workflow: `.github/workflows/e2e-cloud-browser.yml`

Suite:

- `e2e/playwright.config.mjs`
- `e2e/cloud-browser.spec.mjs`
- `e2e/README.md`

Runner final:

- GitHub Hosted Compute Agent
- Ubuntu 24.04.4 LTS
- Node.js 22.23.2
- Playwright 1.55.0
- Chromium 140.0.7339.16 / Playwright build v1187
- Firefox 141.0 / Playwright build v1490
- WebKit 26.0 / Playwright build v2203
- `workers: 1`
- base URL `https://videntia.app`

La suite tiene tres niveles. Los pushes ejecutan smoke y estados de resultado controlados cross-browser sin una investigación pública real. El recorrido vivo requiere `workflow_dispatch` con `live=true` y mantiene una sola investigación pública real, en Chromium, para no multiplicar cuota, coste ni variabilidad de OpenAI/INAPI. Firefox y WebKit no repiten el submit vivo.

## Matriz final

### Chromium

**E2E real desktop — PASS**

- carga `/demo`;
- prueba de hidratación React;
- nombre `VIDENTIA`;
- actividad `software para análisis de datos`;
- upload PNG válido 128×128;
- click real en `Investigar marca`;
- loading visible;
- nombre, actividad y file input bloqueados durante la petición;
- resultado real completado;
- Niza 09 visible;
- fuente `N3uralia Intelligence + INAPI live` visible;
- CTA `Continuar investigación`;
- navegación real a `/contacto`;
- contexto preservado: `origen=demo`, `marca=VIDENTIA`, `resultados > 0`;
- sin `pageerror` ni console errors relevantes.

**Smoke desktop — PASS**

- upload;
- preview;
- botón habilitado;
- `/contacto` con contexto;
- sin overflow horizontal.

**Smoke mobile 390×844 — PASS**

- formulario interactivo;
- upload;
- preview;
- botón habilitado;
- sin overflow horizontal.

### Firefox

**Smoke desktop — PASS**

- carga e hidratación;
- formulario controlado;
- upload y preview;
- botón habilitado;
- contacto con contexto;
- sin overflow horizontal;
- sin `pageerror` ni console errors relevantes.

**Smoke mobile 390×844 — PASS** con los mismos criterios responsive/upload.

El E2E real se omite deliberadamente en Firefox para proteger la cuota pública.

### WebKit

**Smoke desktop — PASS** y **smoke mobile 390×844 — PASS**:

- carga;
- hidratación;
- inputs;
- upload/preview;
- estado del CTA;
- continuidad de contacto;
- overflow;
- browser health.

El E2E real se omite deliberadamente en WebKit para proteger la cuota pública.

## Hallazgo durante la primera matriz

Run inicial: `32801618465`.

Resultado: **6 PASS, 2 SKIP, 1 FAIL**.

El único fallo fue Chromium mobile. A primera vista parecía que el file upload no generaba preview. El trace mostró algo diferente:

- Playwright sí había seleccionado el archivo y el `<input type=file>` contenía el `fakepath` esperado;
- el input de nombre mostraba texto;
- sin embargo, `Investigar marca` seguía `disabled` y no aparecía el preview.

Eso demostraba que el navegador había interactuado con el DOM renderizado por servidor antes de que React/Next.js terminara de hidratar. El DOM aceptó los valores, pero el estado React no recibió los eventos.

No se modificó producto para ocultar el problema. Se corrigió el harness.

## Fix de hidratación

Commit probado: `cef13b35765fcb23db5f16ecc63f2f9c62535825`.

La suite ahora:

1. navega con `DOMContentLoaded`;
2. espera `networkidle`;
3. escribe primero un nombre en el input controlado;
4. exige que React habilite `Investigar marca`;
5. sólo después ejecuta upload u otras acciones stateful.

Esto convierte la hidratación en una condición observable y evita falsos defectos de upload en browsers rápidos.

## Run vivo validado

Run ID: `32801999461`.

Resultado Playwright:

- 9 casos definidos;
- 7 PASS;
- 2 SKIP deliberados;
- 0 FAIL;
- duración de tests: **43.6 s**.

Los skips corresponden exclusivamente al E2E vivo en Firefox y WebKit.

Artifact:

- nombre `videntia-cloud-browser-cross-browser-evidence`;
- artifact ID `9546854904`;
- 13 archivos de evidencia;
- tamaño aproximado 2.69 MB;
- retención 14 días.

## Runner seguro: smoke vs live

Después de validar el recorrido real se endureció el runner para impedir consumo involuntario de cuota al modificar el harness.

Commits:

- `30a98ea48cb1fcd5e915d7852451be3cbc26aec6` — el test vivo sólo corre cuando `E2E_LIVE=1`;
- `31bc1b2dd0c22ee55443937176a4095e1e620cda` — `workflow_dispatch` expone un booleano `live`, mientras los pushes fuerzan `E2E_LIVE=0`.

Semántica actual:

- push que cambia `e2e/**` o el workflow: smoke Chromium/Firefox/WebKit, sin investigación pública intencional;
- estados `trademark` y `visual-only`: respuesta del endpoint público interceptada dentro del browser; frontend, hidratación, navegación y render siguen siendo reales;
- `workflow_dispatch` con `live=false`: misma matriz segura;
- `workflow_dispatch` con `live=true`: matriz segura + una única investigación pública real en Chromium.

Validación inicial del modo seguro:

- run `32802818781`;
- `E2E_LIVE=0` confirmado en logs;
- 9 casos definidos;
- **6 PASS**;
- **3 SKIP** del test vivo;
- 0 FAIL;
- duración de tests: **24.1 s**;
- artifact `9547120353`, 10 archivos, ~1.96 MB;
- no se ejecutó el submit público real en ese push.

Para el mismo commit `31bc1b2dd0c22ee55443937176a4095e1e620cda`, CI pasó Niza regression, Analytics privacy regression, TypeScript y Next.js production build; CodeQL también terminó en success. El deployment de producción quedó READY.

## Hallazgo semántico y fix de producto

Al ampliar la cobertura de teclado Browserin detectó HTML interactivo anidado en `/demo`: tres CTA usaban el patrón `Link > Button`. Aunque podían funcionar con mouse, esa composición genera semántica inválida y puede producir navegación/foco inconsistente para tecnologías asistivas.

Se corrigieron los tres casos usando la composición soportada por Radix/shadcn:

- `Button asChild` + `Link` para `Iniciar sesión`;
- `Button asChild` + `Link` para `Solicitar acceso`;
- `Button asChild` + `Link` para `Continuar investigación`.

Commit de producto: `70f79bfc2f1892d40c4f8225c2191a4f288ba79b`.

Después del fix, el CTA `Continuar investigación` expone correctamente rol de enlace y la suite mantiene una regresión explícita que exige cero coincidencias para `a button, button a`.

Commit de la guardia: `09c46cc81de74b0e054c8c1320d26f2a27129ea5`.

## Cobertura automática segura actual

La matriz automática fue ampliada sin aumentar consumo de OpenAI, INAPI ni cuota pública.

Incluye, por motor:

- smoke desktop de `/demo` y continuidad hacia `/contacto`;
- smoke mobile 390×844;
- upload real de un PNG generado y preview;
- hidratación React observable antes de acciones stateful;
- teclado: foco, tabulación, `Enter` sobre upload y continuidad del formulario;
- navegación por teclado entre `/privacidad` y `/terminos`;
- estado `trademark` controlado: antecedentes, Niza, fuente, resultados bloqueados y CTA contextual;
- estado `visual-only` controlado: sin denominación inventada, señales Viena, sin antecedentes denominativos y retorno con imagen conservada;
- auditoría de rutas públicas `/`, `/demo`, `/contacto`, `/privacidad`, `/terminos`;
- status HTTP < 400;
- título VIDENTIA;
- exactamente un H1 visible;
- landmark `main` presente;
- IDs DOM únicos;
- cero controles interactivos anidados;
- cero overflow horizontal en desktop y mobile;
- cero `pageerror` y cero console errors relevantes.

Commits principales de esta ampliación:

- `70f5c1eb1a2cccf5d1db7d4334b9aafe5ecbd02f` — teclado y rutas legales;
- `09c46cc81de74b0e054c8c1320d26f2a27129ea5` — guardia semántica;
- `92bc84dc2dc842d9afb33f0a403b9b0cc6a6cbb9` — estados de resultado `trademark` y `visual-only` controlados;
- `cbb9378ce71e67384a87347140c9dc1605690e64` — auditoría semántica de rutas públicas;
- `509b92632346b2b4943b07aecde3061d10b7a95b` — documentación del contrato smoke/mock/live y validación final de la matriz.

### Run seguro final

Run ID: `32804145359`.

- `E2E_LIVE=0` confirmado en logs;
- **21 casos definidos**;
- **18 PASS**;
- **3 SKIP deliberados**;
- **0 FAIL**;
- duración de tests: **1.2 min**;
- Chromium, Firefox y WebKit: PASS dentro del alcance seguro definido;
- no se ejecutó ninguna investigación pública real en esta corrida.

Los tres skips corresponden al test de investigación pública real, una vez por proyecto de browser. Sólo queda habilitado cuando el workflow se ejecuta manualmente con `live=true`.

Artifact:

- nombre `videntia-cloud-browser-cross-browser-evidence`;
- artifact ID `9547581341`;
- 22 archivos;
- tamaño `3,159,204` bytes;
- SHA-256 `34563d354a42f65021c3c9a90b1105589be5b15479c1dca91b1857c4cc675566`;
- retención 14 días.

Verificación del mismo commit `509b92632346b2b4943b07aecde3061d10b7a95b`:

- CI run `32804145363`: success; Niza regression, Analytics privacy regression, TypeScript y Next.js production build en verde;
- CodeQL run `32804145388`, job `97670783341`: success;
- deployment Vercel `dpl_GrCqChMKKEKEBby6WSgJTHgzrtz7`: production READY.

## Revisión visual

Se revisaron screenshots desktop y mobile de Chromium, Firefox y WebKit.

El contenido, formulario, upload, CTA y panel lateral se mantienen utilizables y sin overflow horizontal en los tres motores.

Durante la revisión de screenshots `fullPage` se observó que un sticky header puede quedar representado en una posición intermedia cuando el browser mantiene scroll después de una interacción. Las assertions DOM/layout y el viewport real pasan; se clasifica como un efecto de captura stitched/full-page, no como defecto de layout. Browserin fue actualizado para normalizar `scrollTop=0` antes de usar screenshots full-page como comparación visual estricta.

## Browserin

La Skill Browserin quedó ampliada para usar esta arquitectura como fallback real cuando no existe Browser plugin/agent-browser en la sesión y el usuario ha autorizado infraestructura:

1. browser nativo;
2. agent-browser;
3. cloud Playwright autorizado (GitHub Actions preferido);
4. HTTP sólo como evidencia estática, nunca presentado como E2E.

También incorpora los aprendizajes de esta ronda:

- matriz Chromium/Firefox/WebKit;
- smoke por defecto sin consumo de APIs con cuota/coste;
- estados de resultado controlados para cubrir UI sin consumo externo;
- live submit como opt-in explícito;
- sólo un live submit cuando hay cuota/coste;
- fixtures de upload no degenerados;
- ignorar `role=alert` vacío como falso positivo;
- demostrar hidratación React antes de acciones stateful;
- validar teclado y semántica de controles;
- auditar rutas públicas, H1, `main`, IDs y overflow;
- revisar trace antes de cambiar producto;
- normalizar scroll para screenshots full-page con elementos sticky;
- no llamar Safari a Playwright WebKit.

## Estado

**PASS cross-browser del alcance definido. El runner automático seguro cubre 18 casos efectivos en tres motores, con 3 skips deliberados para la investigación viva y sin consumo de cuota en pushes normales.**

Riesgo residual principal: Safari real en macOS/iOS y dispositivos físicos no están cubiertos por este runner Linux. Para esas plataformas se requiere infraestructura macOS/device-cloud específica.
