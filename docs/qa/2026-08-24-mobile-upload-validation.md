# VIDENTIA Demo — Mobile & Upload QA 2026-08-24

## Estado

**PARCIAL / browser runtime bloqueado por el entorno.**

No se declara PASS visual ni E2E de browser en esta ronda porque el entorno de ejecución no permite navegar a `https://videntia.app/demo` desde Chromium.

## Flujo objetivo

`/demo` en viewport móvil -> cargar imagen -> completar nombre/actividad -> investigar -> verificar loading bloqueado -> revisar resultado sin clipping ni interacción duplicada.

## Browser path

El Browser plugin no está disponible en esta sesión, por lo que se siguió el fallback Playwright del flujo de QA.

Disponibilidad local detectada:

- ejecutable Playwright: `/opt/pyvenv/bin/playwright`;
- Chromium del sistema: `/usr/bin/chromium`;
- Node: v22.16.0.

El browser descargado propio de Playwright no estaba instalado. Se intentó entonces Playwright Python usando explícitamente `/usr/bin/chromium`.

Resultado de navegación:

`Page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at https://videntia.app/demo`

Por política del entorno, no fue posible obtener screenshot, DOM interactivo ni ejecutar upload/click real desde Chromium.

También se intentó clonar el repo para ejecutar la app localmente, pero el contenedor no resuelve `github.com`:

`Could not resolve host: github.com`

## Verificación de código realizada

Archivo inspeccionado: `app/demo/page.tsx`.

Confirmado:

1. `loadingWithNizaContext` captura el contexto Niza al iniciar la request, evitando que editar la actividad cambie el estado de loading de una petición ya iniciada.
2. `loadingFromImageOnly` captura si la request partió sólo desde imagen.
3. `handleFile` retorna inmediatamente si `loading` está activo.
4. El botón/zona de upload usa `disabled={loading}`.
5. El `<input type="file">` usa `disabled={loading}`.
6. Los inputs `Nombre de la marca` y `Productos o servicios` usan `disabled={loading}`.
7. `canRun` incluye `!loading`, evitando submit adicional mientras la petición está activa.
8. El drop handler ignora archivos mientras `loading` está activo.
9. La grilla principal cambia a columnas sólo desde `lg`; en móvil permanece apilada.
10. El formulario nombre/botón cambia a fila sólo desde `sm`; por debajo permanece en columna.
11. Las secciones de resultados usan layouts responsivos (`flex-col`, `sm:*`, `lg:*`, `md:grid-cols-2`) y no se observó en código un ancho fijo superior al viewport móvil para el contenedor principal.
12. La preview cargada usa `w-56` dentro de un contenedor flexible y `max-w-full`, compatible con el ancho útil del formulario móvil observado en las clases CSS.

## Evidencia funcional disponible fuera del browser

Las rondas anteriores ya validaron en producción:

- payload de imagen real -> análisis real;
- imagen sin texto -> `visual-only`;
- nombre del usuario prevalece sobre denominación contradictoria de imagen;
- MIME inválido -> HTTP 415;
- detección ambigua de siglas -> fallback seguro por consenso;
- ruta pública y clasificador Niza en producción.

Esto valida backend/upload semantics, pero **no sustituye** la prueba visual táctil/renderizada en un viewport móvil.

## Criterio pendiente para PASS

Repetir cuando exista un browser con acceso de red a producción o un Browser plugin conectado y comprobar:

- viewport 390x844 y un Android equivalente;
- upload mediante file chooser;
- reemplazo de imagen;
- drag/drop en desktop;
- inputs bloqueados durante loading;
- doble click / Enter repetido no duplica request;
- estados de error de archivo;
- resultado denominativo y visual-only;
- CTA `Continuar investigación`;
- ausencia de clipping/overflow horizontal;
- focus visible y navegación de teclado;
- console errors/warnings;
- screenshot de consulta, loading y resultado.

## Conclusión

No se detectó un nuevo defecto por inspección de código. El race de inputs/loading que estaba pendiente ya se encuentra corregido en la implementación actual. El único bloqueo de esta ronda es de infraestructura de browser del entorno, no un fallo observado de VIDENTIA.
