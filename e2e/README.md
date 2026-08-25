# Browserin E2E

Browserin valida `https://videntia.app` con Playwright en Chromium, Firefox y WebKit usando GitHub Hosted Actions cuando no hay un browser interactivo nativo disponible en la sesión.

## Modos

- **Smoke seguro (default en push):** navegación, upload, teclado, responsive, rutas públicas, semántica DOM y continuidad hacia contacto. No ejecuta la investigación pública real.
- **Resultados mockeados (default en push):** intercepta únicamente `/api/v1/public/trademark-preview` dentro del browser para renderizar y validar los estados `trademark` y `visual-only` sin consumir OpenAI, INAPI ni cuota pública.
- **Accesibilidad automática (default en push):** Axe recorre en Chromium las seis rutas públicas indexables y, además, los estados renderizados `trademark` y `visual-only`; bloquea violaciones WCAG de impacto `serious` o `critical`. Firefox y WebKit mantienen la cobertura de interacción cross-browser sin triplicar reglas determinísticas de Axe.
- **Live (manual):** `workflow_dispatch` con `live=true`. Ejecuta una sola investigación pública real en Chromium; Firefox y WebKit no repiten el submit vivo.

## Invariantes de la suite

- `E2E_LIVE=0` en pushes normales.
- El frontend, hidratación, navegación y render React/Next.js son reales incluso cuando la respuesta del preview está mockeada.
- Las rutas públicas indexables declaradas en el sitemap —`/`, `/demo`, `/contacto`, `/docs`, `/privacidad` y `/terminos`— se auditan por status HTTP, H1 único, exactamente un landmark `main`, IDs únicos, ausencia de controles interactivos anidados y overflow horizontal en desktop/mobile.
- Cada ruta pública debe publicar exactamente un `meta[name=description]` útil y un `link[rel=canonical]` cuyo pathname coincida con la ruta visitada.
- `robots.txt` debe mantener `/api/` fuera del rastreo y declarar `https://videntia.app/sitemap.xml`; las rutas del sitemap deben coincidir exactamente con la matriz pública de Browserin.
- Los enlaces internos descubiertos en las seis rutas públicas deben resolver sin error HTTP ni redirección fuera de `videntia.app`.
- Los enlaces públicos hacia `/auth/login` no usan prefetch especulativo de Next.js; la navegación al login ocurre sólo cuando la persona la solicita, evitando tráfico RSC innecesario contra una superficie protegida.
- Axe adjunta evidencia JSON por ruta o estado renderizado y no se silencian reglas para ocultar defectos de producto; una violación seria o crítica debe corregirse en la aplicación o clasificarse explícitamente como problema del harness antes de modificar la puerta.
- Los hallazgos de Axe de las seis rutas base se acumulan antes de fallar, de modo que una corrida entregue el mapa completo y no sólo el primer defecto.
- La auditoría de resultados usa respuestas sintéticas sólo en el browser. El fixture `visual-only` mantiene `denomination_confidence: null` cuando no existe una denominación aceptada.
- Los bloques de código horizontalmente desplazables de `/docs` deben permanecer accesibles por teclado.
- WebKit de Playwright no se reporta como Safari real.
- Antes de cambiar producto por un fallo, revisar trace/screenshot y clasificar si el defecto pertenece al harness o a la aplicación.
