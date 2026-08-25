# VIDENTIA — Public Legal & Privacy QA 2026-08-24

## Alcance

Validación de cierre de las superficies legales públicas de VIDENTIA antes de adquisición pública más amplia.

Objetivos:

- publicar una política de privacidad técnicamente consistente con el flujo real de la demo;
- publicar términos de uso que delimiten la naturaleza de los resultados y el uso permitido;
- exponer enlaces legales en landing, demo y contacto;
- mantener sitemap, canonical y directivas de indexación coherentes;
- evitar afirmar RUT, domicilio, razón social, proveedores específicos o plazos de retención no verificados;
- documentar el uso de analítica de forma coherente con la implementación;
- verificar build, TypeScript, regresiones, CodeQL y producción.

## Flujo técnico verificado

La ruta pública `app/api/v1/public/trademark-preview/route.ts` acepta:

- nombre de marca;
- descripción opcional de productos o servicios (`actividad`);
- imagen opcional PNG/JPEG/WebP/GIF dentro de los límites definidos por la ruta.

La demo usa esos datos para investigación marcaria, análisis figurativo cuando corresponde y clasificación Niza cuando existe contexto suficiente.

El limitador `lib/public-demo-rate-limit.ts` deriva una identidad técnica desde IP + user-agent y la transforma con HMAC-SHA256 antes de reservar cuota. La clave almacenada por ese mecanismo no contiene la IP ni el user-agent en texto legible.

La analítica pública implementada posteriormente elimina query strings antes de los pageviews y usa eventos agregados cuyos atributos personalizados no incluyen marca, actividad ni imagen. El detalle técnico está en `docs/qa/2026-08-24-conversion-analytics-validation.md`.

## Marco normativo contrastado

Se revisaron fuentes oficiales de la Biblioteca del Congreso Nacional de Chile:

- Ley 19.628, régimen vigente durante esta sesión;
- Ley 21.719, con entrada en vigencia diferida al 1 de diciembre de 2026.

La política informa esa transición sin afirmar que el régimen futuro ya esté vigente.

Referencias oficiales:

- https://www.bcn.cl/leychile/navegar?idNorma=141599
- https://www.bcn.cl/leychile/navegar?idNorma=1209272

## Implementación

### Privacidad

Ruta: `/privacidad`

Archivo: `app/privacidad/page.tsx`

Cubre:

1. alcance;
2. información que puede procesarse;
3. finalidades;
4. proveedores tecnológicos y fuentes externas en términos generales;
5. conservación sin inventar un plazo no verificado;
6. seguridad;
7. derechos y solicitudes a `info@n3uralia.com`;
8. marco normativo y transición Ley 19.628 / Ley 21.719;
9. métricas de uso agregadas y redacción de query params para Analytics.

La página advierte que la demo no está diseñada para recibir datos personales sensibles, secretos o documentación confidencial y que los resultados no son una decisión jurídica automatizada.

### Términos

Ruta: `/terminos`

Archivo: `app/terminos/page.tsx`

Cubre:

- naturaleza de VIDENTIA como apoyo a investigación;
- no garantía de registro ni sustitución de INAPI, tribunales o revisión profesional;
- dependencia y posible desactualización de fuentes externas;
- límites de la demo;
- uso permitido y antiabuso;
- contenido enviado por el usuario;
- propiedad intelectual;
- disponibilidad y cambios;
- limitaciones de responsabilidad dentro de la ley aplicable;
- ley chilena y contacto.

### Enlaces públicos

`components/public-legal-footer.tsx` es un Server Component y se monta en:

- `app/demo/layout.tsx`;
- `app/contacto/layout.tsx`.

Incluye:

- `/privacidad`;
- `/terminos`;
- `info@n3uralia.com`.

La landing principal ya tenía footer propio. Se actualizó en `app/page.tsx` para incluir también `Privacidad` y `Términos`.

Commit landing: `6f39a9f7111aa63a9caa9bcf4cd67da7ca7ddebd`.

Las páginas legales se enlazan entre sí.

### Sitemap e indexación

`app/sitemap.ts` incluye `/privacidad` y `/terminos`.

Durante QA se detectó que `proxy.ts` sólo consideraba indexables `/`, `/demo`, `/contacto` y `/docs`, por lo que las nuevas páginas legales recibían `X-Robots-Tag: noindex, nofollow, noarchive` aunque su metadata declaraba `index, follow`.

Fix: `946e7dc4a118a18b084afbf715ac2d966874d0e5`.

Después del fix, `/privacidad` y `/terminos` no reciben el header restrictivo y mantienen metadata `robots=index, follow`.

El sitemap XML conserva `X-Robots-Tag: noindex`; esto impide indexar el XML como página y no elimina las URLs declaradas dentro de él.

## Verificación de producción

### `/privacidad`

PASS:

- HTTP 200;
- title `Privacidad | VIDENTIA`;
- canonical `https://videntia.app/privacidad`;
- meta robots `index, follow`;
- sin `X-Robots-Tag: noindex`;
- contenido legal esperado visible.

### `/terminos`

PASS:

- HTTP 200;
- title `Términos de uso | VIDENTIA`;
- canonical correcto;
- meta robots `index, follow`;
- sin `X-Robots-Tag: noindex`;
- contenido legal esperado visible.

### `/`

PASS:

- HTTP 200;
- footer de landing incluye enlaces `Privacidad` y `Términos`.

Deployment de referencia para ese cambio:

- `dpl_3xrmLUp18ZZC9CFL8iUvdhRAcyXC`;
- commit `6f39a9f7111aa63a9caa9bcf4cd67da7ca7ddebd`;
- READY;
- alias `videntia.app`.

### `/demo`

PASS por HTML de producción:

- HTTP 200;
- footer `VIDENTIA · un desarrollo de N3uralia`;
- enlaces a privacidad, términos y contacto.

### `/contacto?origen=demo&marca=VIDENTIA&resultados=50`

PASS por HTML de producción:

- HTTP 200;
- conserva contexto de investigación;
- footer legal presente;
- enlaces a privacidad, términos y contacto.

La capa de Analytics redacciona la query string antes de enviar el pageview, por lo que esos parámetros de continuidad no forman parte de la URL enviada por VIDENTIA a Web Analytics.

### `/sitemap.xml`

PASS:

- HTTP 200;
- contiene `https://videntia.app/privacidad`;
- contiene `https://videntia.app/terminos`.

## Calidad e infraestructura

Los cambios legales se validaron en GitHub CI y Vercel. Para el commit de landing `6f39a9f7111aa63a9caa9bcf4cd67da7ca7ddebd`:

- CI: PASS;
- Niza regression: PASS;
- TypeScript: PASS;
- Next.js production build: PASS.

La ronda posterior de Analytics añadió además `pnpm test:analytics` al CI; ese gate, Niza, TypeScript y build quedaron todos PASS en el run asociado a `02537019e38b7e29efbbf9bbd5452e8c35da165f`.

## Commits principales

- `e2c22b735b3e1e4d0390389cfd0ad7c8bc25ccfe` — privacidad.
- `ce808ce9622cbae9dff4bcccadb7ba56e459a9a6` — términos.
- `6cb6a449c1cbb8a01f3d316bb07c30eaef418dbd` — footer legal inicial.
- `acd11b1bce2dc7d79f46128134eb3d4147582d61` — footer como Server Component.
- `07a45bfbf5c2d6032120e39429b3b5ff526195c3` — footer fuera del root global.
- `c369b7ec1618a3690dfcd29e18995220f27cf73d` — footer en demo.
- `7de2e8334e778870030dae7ae2922c23b27118df` — footer en contacto.
- `1d1a3923f6a27360873da5edb6d19cf0d4035473` — sitemap legal.
- `946e7dc4a118a18b084afbf715ac2d966874d0e5` — indexación legal en proxy.
- `6f39a9f7111aa63a9caa9bcf4cd67da7ca7ddebd` — enlaces legales en landing.
- `aeb14adf1c4c4bf822dc23507b179ddbac80bfd3` — disclosure de analítica en privacidad.

## Limitaciones y revisión recomendada

Esta implementación es una base operativa técnicamente fundamentada, no una certificación ni una revisión jurídica externa. Antes de utilizarla como documentación contractual definitiva para clientes enterprise, debe revisarla un abogado chileno, especialmente de cara a la entrada en vigencia de la Ley 21.719 el 1 de diciembre de 2026.

La validación se hizo mediante código, CI, build y HTML/headers reales de producción. La prueba visual interactiva de browser sigue bloqueada en este entorno por `ERR_BLOCKED_BY_ADMINISTRATOR`; está documentada en `docs/qa/2026-08-24-mobile-upload-validation.md`.

## Estado de cierre

**PASS técnico.**

Privacidad, términos, exposición desde landing/demo/contacto, sitemap, canonical, indexación y disclosure de Analytics quedaron implementados y validados. La revisión legal profesional externa permanece como control recomendado antes de formalizar condiciones contractuales enterprise.
