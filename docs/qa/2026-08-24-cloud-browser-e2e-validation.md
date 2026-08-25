# VIDENTIA — Cloud Browser E2E Validation 2026-08-24

## Resumen

Validación E2E real de `https://videntia.app` ejecutada en un navegador Chromium alojado en GitHub Actions, después de autorización explícita del usuario para usar GitHub Hosted Playwright como cloud browser de VIDENTIA.

Resultado final: **PASS — 2/2 pruebas de navegador**.

El recorrido desktop ejecutó una investigación real contra producción, incluyendo upload, loading, bloqueo de controles, Niza, antecedentes y continuidad a contacto. El recorrido mobile verificó layout y upload a 390 × 844 sin consumir una segunda investigación pública.

## Por qué se usó este runner

El Browser plugin nativo no estaba expuesto en la sesión actual de ChatGPT. Conforme al flujo de QA de Browserin, se utilizó Playwright en infraestructura cloud con salida real a Internet en vez de reemplazar interacción con simples requests HTTP.

Runner final:

- GitHub Hosted Compute Agent;
- Ubuntu 24.04.4 LTS;
- Azure region: `centralus`;
- Node.js 22.23.2;
- Playwright 1.55.0;
- Chromium 140.0.7339.16, Playwright build v1187;
- base URL: `https://videntia.app`.

## Infraestructura agregada

### Workflow

Archivo: `.github/workflows/e2e-cloud-browser.yml`

Características:

- ejecución manual mediante `workflow_dispatch`;
- ejecución en push cuando cambia `e2e/**` o el workflow;
- Playwright instalado de forma aislada en el runner, sin agregarlo al bundle ni al lockfile de producción;
- Chromium instalado con sus dependencias;
- un solo worker para evitar consumir cuota pública en paralelo;
- evidencia subida como artifact por 14 días;
- `cancel-in-progress: true` para evitar correr versiones obsoletas del test en paralelo.

### Suite

Archivos:

- `e2e/playwright.config.mjs`;
- `e2e/cloud-browser.spec.mjs`.

El fixture de imagen final es un PNG válido de 128 × 128 generado en runtime con `pngjs`, por lo que la prueba no depende de un archivo privado ni de una URL externa.

## Recorrido desktop

Viewport: **1440 × 1000**.

Pasos ejecutados contra producción:

1. Navegar a `/demo`.
2. Verificar título y H1 `Entrega la marca. Revisa la evidencia.`.
3. Subir `videntia-cloud-e2e.png` por el input de archivo real.
4. Verificar preview `Marca cargada` y `Imagen lista para investigar`.
5. Escribir denominación `VIDENTIA`.
6. Escribir actividad `software para análisis de datos`.
7. Click real en `Investigar marca`.
8. Verificar `role=status` durante loading.
9. Verificar que nombre, actividad y file input quedan `disabled` durante la solicitud.
10. Esperar `Investigación completada` o un error visible real.
11. Verificar heading `VIDENTIA`.
12. Verificar Niza 09.
13. Verificar `Fuente N3uralia Intelligence + INAPI live`.
14. Verificar CTA `Continuar investigación`.
15. Click real en el CTA.
16. Verificar navegación a `/contacto` con:
    - `origen=demo`;
    - `marca=VIDENTIA`;
    - `resultados > 0`.
17. Verificar `Investigación iniciada en la demo` y el contexto de VIDENTIA en la pantalla comercial.
18. Verificar ausencia de `pageerror` y errores de consola del navegador.

Resultado observado en producción:

- 50 resultados únicos;
- 50 activos observados;
- 5 imágenes comparadas;
- 4 antecedentes visibles en la demo;
- 46 antecedentes adicionales bloqueados por preview;
- Niza 09 para la descripción entregada;
- señales visuales/Viena visibles para el fixture;
- CTA de continuidad preservó VIDENTIA y el conteo de 50 resultados hasta `/contacto`.

## Recorrido mobile

Viewport: **390 × 844**.

Pasos:

1. Navegar a `/demo`.
2. Verificar H1.
3. Completar nombre y actividad.
4. Subir el PNG válido.
5. Verificar preview y botón `Investigar marca` visibles.
6. Medir `document.documentElement.scrollWidth` y `document.body.scrollWidth`.
7. Exigir que ambos sean `<= viewport + 1 px`.
8. Verificar ausencia de `pageerror` y errores de consola.
9. Capturar screenshot full-page.

Resultado: **PASS**. No hubo overflow horizontal. La carga de imagen, nombre, actividad, CTA y secciones explicativas permanecen utilizables en 390 px de ancho.

La prueba mobile no ejecuta una segunda investigación para evitar consumo innecesario de la cuota pública y variabilidad externa.

## Evidencia visual revisada

El run final generó y se revisaron visualmente:

- `desktop-loading.png` — estado de investigación real con inputs bloqueados y preview de imagen;
- `desktop-results.png` — resultados completos, Niza 09, antecedentes, señales visuales, limitaciones y CTA;
- `desktop-contact.png` — continuidad comercial con `VIDENTIA` y `50 resultados observados`;
- `mobile-upload.png` — demo completa en 390 × 844, sin clipping/overflow horizontal.

Artifact final:

- nombre: `videntia-cloud-browser-evidence`;
- artifact ID: `9546500807`;
- retención configurada: 14 días.

## Runs y hallazgos durante la puesta a punto

### Run 1 — fixture demasiado artificial

Run ID: `32800694119`.

Resultado: desktop FAIL, mobile PASS.

El fixture inicial era un PNG mínimo 1 × 1. El frontend lo aceptó como archivo PNG, pero el procesador visual aguas abajo respondió:

`400 You uploaded an unsupported image. Please make sure your image is valid.`

La API pública terminó en HTTP 500 y la suite esperó el resultado. Esto no se trató como defecto funcional de la UI: el fixture se reemplazó por un PNG 128 × 128 válido generado con `pngjs`.

Este es el único error/fatal de producción observado durante la puesta a punto y está asociado a ese fixture inicial.

### Run 4 — falso positivo de accesibilidad

Run ID: `32800914001`.

Resultado: desktop FAIL, mobile PASS.

La evidencia (`error-context.md`) mostró que la aplicación seguía correctamente en loading y que Next/Sonner mantenía un elemento `role=alert` vacío en el DOM. El test lo interpretó inicialmente como error aunque no existía texto ni error visible.

Se cambió la espera para considerar sólo alerts con contenido no vacío (`hasText: /\S/`). No se modificó lógica de producto.

### Run 5 — final

Run ID: `32801065801`.

Commit probado: `d30daa7d01f5c552734d09c2c8fea830a3e433f7`.

Resultado Playwright:

- desktop: PASS;
- mobile: PASS;
- total: **2 passed (14.0 s)**;
- artifact upload: PASS.

No se registraron `pageerror` ni errores de consola en las aserciones de la suite final.

## Calidad del commit final

Para `d30daa7d01f5c552734d09c2c8fea830a3e433f7`:

- Cloud Browser E2E: **PASS**;
- Niza regression: **PASS**;
- Analytics privacy regression: **PASS**;
- TypeScript: **PASS**;
- Next.js production build: **PASS**;
- CodeQL JavaScript/TypeScript: **PASS**;
- Vercel production deployment: **READY**;
- deployment: `dpl_CUoPnXH5ypaQyzAN7KjugSauF7Ck`;
- alias de producción: `videntia.app`.

Runtime posterior al run final, ventana desde aproximadamente 02:20 UTC: **sin logs error/fatal**.

## Riesgo residual

Esta ronda prueba Chromium en Linux, desktop y viewport mobile. No equivale a una matriz cross-browser con Safari/WebKit y Firefox reales.

El desktop utiliza una consulta real y por tanto depende de OpenAI/INAPI/índice N3uralia y de la cuota pública. Para mantener el runner defendible y evitar flakiness innecesario, sólo una prueba por run consume la investigación real; el caso mobile valida interacción y layout sin segundo submit.

## Estado

**PASS técnico y visual.**

El pendiente que existía por falta de browser interactivo en la sesión de ChatGPT quedó cubierto mediante un cloud browser real en GitHub Hosted Playwright, con navegación, upload, click, espera de estados dinámicos, verificación de URL, assertions DOM y screenshots revisados.
