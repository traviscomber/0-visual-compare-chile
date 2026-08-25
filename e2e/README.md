# Browserin E2E

Browserin valida `https://videntia.app` con Playwright en Chromium, Firefox y WebKit usando GitHub Hosted Actions cuando no hay un browser interactivo nativo disponible en la sesión.

## Modos

- **Smoke seguro (default en push):** navegación, upload, teclado, responsive, rutas públicas, semántica DOM y continuidad hacia contacto. No ejecuta la investigación pública real.
- **Resultados mockeados (default en push):** intercepta únicamente `/api/v1/public/trademark-preview` dentro del browser para renderizar y validar los estados `trademark` y `visual-only` sin consumir OpenAI, INAPI ni cuota pública.
- **Live (manual):** `workflow_dispatch` con `live=true`. Ejecuta una sola investigación pública real en Chromium; Firefox y WebKit no repiten el submit vivo.

## Invariantes de la suite

- `E2E_LIVE=0` en pushes normales.
- El frontend, hidratación, navegación y render React/Next.js son reales incluso cuando la respuesta del preview está mockeada.
- Las rutas públicas `/`, `/demo`, `/contacto`, `/privacidad` y `/terminos` se auditan por status HTTP, H1 único, exactamente un landmark `main`, IDs únicos, ausencia de controles interactivos anidados y overflow horizontal en desktop/mobile.
- Cada ruta pública debe publicar exactamente un `meta[name=description]` útil y un `link[rel=canonical]` cuyo pathname coincida con la ruta visitada.
- WebKit de Playwright no se reporta como Safari real.
- Antes de cambiar producto por un fallo, revisar trace/screenshot y clasificar si el defecto pertenece al harness o a la aplicación.
