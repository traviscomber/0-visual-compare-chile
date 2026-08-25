# VIDENTIA — Cross-browser Validation 2026-08-24

## Resumen

Validación real de `https://videntia.app` ejecutada con Browserin mediante el fallback cloud Playwright autorizado en GitHub Hosted Actions.

Resultado final: **PASS — 7 pruebas ejecutadas correctamente + 2 skips deliberados**.

Cobertura:

- Chromium: E2E real de producción + smoke desktop + smoke mobile.
- Firefox: smoke desktop + smoke mobile.
- WebKit: smoke desktop + smoke mobile.
- Safari real/macOS: **no probado**. WebKit es cobertura del motor Playwright en Linux y no debe presentarse como Safari real.

## Infraestructura

Workflow: `.github/workflows/e2e-cloud-browser.yml`

Suite:

- `e2e/playwright.config.mjs`
- `e2e/cloud-browser.spec.mjs`

Runner final:

- GitHub Hosted Compute Agent
- Ubuntu 24.04.4 LTS
- Azure region `centralus`
- Node.js 22.23.2
- Playwright 1.55.0
- Chromium 140.0.7339.16 / Playwright build v1187
- Firefox 141.0 / Playwright build v1490
- WebKit 26.0 / Playwright build v2203
- `workers: 1`
- base URL `https://videntia.app`

La suite mantiene una sola investigación pública real por run para no multiplicar cuota, coste ni variabilidad de OpenAI/INAPI. El recorrido vivo se ejecuta en Chromium; Firefox y WebKit validan interacción, upload, navegación, responsive y salud del browser sin segundo submit real.

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

## Run final

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
- sólo un live submit cuando hay cuota/coste;
- fixtures de upload no degenerados;
- ignorar `role=alert` vacío como falso positivo;
- demostrar hidratación React antes de acciones stateful;
- revisar trace antes de cambiar producto;
- normalizar scroll para screenshots full-page con elementos sticky;
- no llamar Safari a Playwright WebKit.

## Estado

**PASS cross-browser del alcance definido.**

Riesgo residual principal: Safari real en macOS/iOS y dispositivos físicos no están cubiertos por este runner Linux. Para esas plataformas se requiere infraestructura macOS/device-cloud específica.
