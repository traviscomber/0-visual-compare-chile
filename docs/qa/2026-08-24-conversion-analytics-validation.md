# VIDENTIA — Conversion Analytics QA 2026-08-24

## Objetivo

Instrumentar el funnel público de VIDENTIA sin enviar contenido de la investigación a la capa de analítica.

Funnel operativo:

`landing -> demo -> solicitud -> resultado -> contacto`

La implementación separa dos fuentes de medición:

1. pageviews de Web Analytics para `/`, `/demo` y `/contacto`;
2. eventos agregados del backend para solicitudes y resultados de la demo.

## Principio de privacidad

No se envían como atributos personalizados de Analytics:

- nombre de marca;
- texto de actividad/productos/servicios;
- imagen ni representación de la imagen;
- dirección IP;
- user-agent;
- resultados concretos de antecedentes;
- query params de continuidad comercial.

La ruta de contacto conserva contexto funcional mediante parámetros como `marca` y `resultados`, pero esos parámetros se eliminan del URL de Web Analytics antes del envío del pageview.

## Implementación

### Web Analytics

Componente:

`components/videntia-analytics.tsx`

Se monta en `app/layout.tsx` mediante `@vercel/analytics/next`.

Antes de enviar cada evento de navegación se ejecuta `redactAnalyticsUrl()`, que elimina:

- toda la query string;
- todo el hash/fragment.

Ejemplo de regresión:

Entrada:

`https://videntia.app/contacto?origen=demo&marca=MARCA-SECRETA&resultados=50#continuar`

Salida enviada como URL de Analytics:

`https://videntia.app/contacto`

Esto permite medir llegada a contacto sin transmitir la marca investigada ni el volumen observado.

### Helpers de privacidad

Archivo:

`lib/analytics/privacy.ts`

Funciones principales:

- `redactAnalyticsUrl()`;
- `getDemoInputMode()`;
- `buildDemoRequestAnalytics()`;
- `buildDemoResultAnalytics()`.

Los builders reciben únicamente booleanos y enums, por lo que el esquema no acepta directamente nombre, actividad o imagen del usuario.

### Eventos server-side de la demo

Ruta:

`app/api/v1/public/trademark-preview/route.ts`

Eventos:

#### `Demo Request`

Atributos permitidos:

- `input_mode`: `name`, `image` o `name_image`;
- `has_activity`: boolean.

#### `Demo Result`

Atributos permitidos:

- `input_mode`;
- `has_activity`;
- `analysis_mode`: `trademark` o `visual-only`.

#### `Demo Error`

Atributos permitidos:

- `category: processing`.

No se envía el mensaje de error concreto para evitar propagar accidentalmente datos de entrada.

Los eventos se programan con `after()` de Next.js, por lo que el tracking ocurre como side effect posterior y no se incorpora al camino crítico de la respuesta. El fallo del proveedor de analítica se captura y no transforma un resultado correcto de la demo en error.

### Política de privacidad

`app/privacidad/page.tsx` fue actualizada para declarar:

- métricas de navegación y uso agregado;
- eliminación de query params antes del envío de pageviews;
- esquema agregado de los eventos de la demo;
- ausencia de nombre, actividad e imagen en los atributos personalizados enviados por VIDENTIA.

## Regression gate permanente

Archivo:

`scripts/analytics-privacy-regression.mts`

Comando:

`pnpm test:analytics`

Aserciones:

1. el URL de contacto pierde query string y hash;
2. la marca de prueba no sobrevive a la redacción;
3. las tres modalidades de input se clasifican correctamente;
4. `Demo Request` contiene exactamente `has_activity,input_mode`;
5. `Demo Result` contiene exactamente `analysis_mode,has_activity,input_mode`;
6. los payloads no contienen claves de nombre, marca, actividad, imagen, IP o user-agent.

El comando se incorporó a `.github/workflows/ci.yml` antes de TypeScript y del build de producción.

## Validación de CI

Run de referencia para el commit de gate `02537019e38b7e29efbbf9bbd5452e8c35da165f`:

- Niza regression: PASS;
- Analytics privacy regression: PASS;
- TypeScript: PASS;
- Next.js production build: PASS;
- job `quality`: SUCCESS.

## Validación de producción

### Cliente de Web Analytics

En producción:

`https://videntia.app/_vercel/insights/script.js`

Resultado:

- HTTP 200;
- script oficial de Web Analytics disponible.

El HTML/RSC de `/contacto` en el deployment instrumentado incluye el componente `VidentiaAnalytics`.

### Smoke real del backend

Se creó temporalmente:

`/api/health/analytics-funnel-smoke`

El probe ejecutó un POST real contra `/api/v1/public/trademark-preview` en el mismo deployment.

Resultado:

- HTTP del probe: 200;
- HTTP del preview: 200;
- tiempo observado: 7.793 ms;
- `analysis_mode`: `trademark`;
- `niza_context_provided`: `true`;
- Niza: `09`;
- error: `null`.

Después de la ejecución se consultaron logs `warning`, `error` y `fatal` del deployment durante la ventana de prueba y no hubo entradas. Esto incluye ausencia de la advertencia que el código emitiría si el envío server-side a Analytics fallara.

El endpoint temporal fue eliminado al terminar la prueba.

## Limitación de evidencia

El conector de Vercel disponible en esta sesión no expone consultas al dashboard de Web Analytics ni una API de lectura de eventos de Web Analytics. Por lo tanto:

- sí se verificó integración del SDK;
- sí se verificó que el script de Web Analytics está disponible;
- sí se verificó el POST real de la demo con tracking habilitado y sin warnings/errors;
- sí se verificó la redacción de URL mediante un regression test permanente;
- **no se afirma haber visto el evento ya materializado en la interfaz del dashboard de Analytics**.

La visibilidad final de conteos en el dashboard debe comprobarse cuando haya acceso a esa superficie, una vez lleguen visitas reales o de QA no headless.

## Commits principales

- `c12ac149bc6fa3818d20729fd282d58edb481012` — helpers de privacidad.
- `dca22541f9dc375e972e80771e805446de6ba39b` — componente Web Analytics con redacción.
- `90c4734422550b84fe1c1da029774223e9f478c1` — Web Analytics montado en root layout.
- `0037265ba085b04e4fd0c404652b4ae858acbe66` — eventos server-side del funnel.
- `aeb14adf1c4c4bf822dc23507b179ddbac80bfd3` — disclosure de analítica en privacidad.
- `b15fa7f50754a0fd7ae6e9f4760420e967e3b28c` — regression test de privacidad.
- `291ef2d2c1dd2299f60f7d5b8e4af84f9232f078` — script `test:analytics`.
- `02537019e38b7e29efbbf9bbd5452e8c35da165f` — gate de Analytics en CI.
- `a7e573b923f3cac3ee2d8f482ec7b5934ea3a427` — probe de producción temporal.
- `dccb3868f70f9104ae1617be7cd1c852174e2899` — eliminación del probe temporal.

## Criterio de cierre

**PASS técnico.**

El funnel público queda medible con pageviews y eventos agregados, con redacción explícita de URLs y sin contenido de marca/actividad/imagen en los atributos personalizados. La única evidencia pendiente es una lectura directa del dashboard de Web Analytics, no disponible desde el conector usado en esta sesión.
