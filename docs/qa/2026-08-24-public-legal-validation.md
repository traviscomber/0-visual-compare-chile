# VIDENTIA — Public Legal & Privacy QA 2026-08-24

## Alcance

Validación de cierre de las superficies legales públicas de VIDENTIA antes de adquisición pública más amplia.

Objetivos:

- publicar una política de privacidad técnicamente consistente con el flujo real de la demo;
- publicar términos de uso que delimiten la naturaleza de los resultados y el uso permitido;
- exponer enlaces legales en los flujos públicos de demo y contacto;
- mantener sitemap, canonical y directivas de indexación coherentes;
- evitar afirmar RUT, domicilio, razón social, proveedores específicos o plazos de retención que no estén verificados en el producto;
- verificar build, TypeScript, regresión Niza, CodeQL y producción.

## Flujo técnico verificado

La ruta pública `app/api/v1/public/trademark-preview/route.ts` acepta:

- nombre de marca;
- descripción opcional de productos o servicios (`actividad`);
- imagen opcional en PNG/JPEG/WebP/GIF dentro de los límites de tamaño definidos por la ruta.

La demo utiliza esos datos para ejecutar investigación marcaria, análisis figurativo cuando corresponde y clasificación Niza sólo cuando existe contexto suficiente.

El limitador público `lib/public-demo-rate-limit.ts` deriva una identidad técnica desde IP + user-agent y la transforma con HMAC-SHA256 antes de reservar cuota. La clave guardada por ese mecanismo no contiene la IP ni el user-agent en texto legible.

## Marco normativo contrastado

Se revisaron fuentes oficiales de la Biblioteca del Congreso Nacional de Chile:

- Ley 19.628, régimen actualmente vigente durante esta sesión;
- Ley 21.719, cuya entrada en vigencia está diferida al 1 de diciembre de 2026.

La política informa esa transición sin afirmar que el régimen futuro ya esté vigente.

Referencias oficiales:

- https://www.bcn.cl/leychile/navegar?idNorma=141599
- https://www.bcn.cl/leychile/navegar?idNorma=1209272

## Implementación

### Privacidad

Ruta: `/privacidad`

Archivo: `app/privacidad/page.tsx`

Contenido principal:

1. alcance;
2. información que puede procesarse;
3. finalidades;
4. proveedores tecnológicos y fuentes externas en términos generales;
5. conservación sin prometer un plazo no verificado;
6. seguridad;
7. derechos y solicitudes a `info@n3uralia.com`;
8. marco normativo y transición Ley 19.628 / Ley 21.719.

La página advierte que la demo no está diseñada para recibir datos personales sensibles, secretos o documentación confidencial y que los resultados no son una decisión jurídica automatizada.

### Términos

Ruta: `/terminos`

Archivo: `app/terminos/page.tsx`

Contenido principal:

- naturaleza de VIDENTIA como apoyo a investigación;
- no garantía de registro ni sustitución de INAPI, tribunales o revisión profesional;
- dependencia y posible desactualización de fuentes externas;
- límites de la demo;
- uso permitido y prohibición de abuso;
- responsabilidad del usuario sobre imágenes y contenido enviado;
- propiedad intelectual;
- disponibilidad y cambios;
- limitaciones de responsabilidad dentro de la ley aplicable;
- ley chilena y contacto.

### Enlaces públicos

Componente: `components/public-legal-footer.tsx`

El footer se mantiene como Server Component, sin `usePathname` ni JavaScript de cliente adicional para resolver visibilidad.

Se monta desde:

- `app/demo/layout.tsx`;
- `app/contacto/layout.tsx`.

Incluye enlaces a:

- `/privacidad`;
- `/terminos`;
- `info@n3uralia.com`.

Las páginas legales además se enlazan entre sí.

### Sitemap e indexación

`app/sitemap.ts` incluye:

- `/privacidad`;
- `/terminos`.

Durante QA se detectó un defecto: `proxy.ts` sólo consideraba indexables `/`, `/demo`, `/contacto` y `/docs`, por lo que las nuevas páginas legales recibían `X-Robots-Tag: noindex, nofollow, noarchive` aunque su metadata declaraba `index, follow`.

Fix: commit `946e7dc4a118a18b084afbf715ac2d966874d0e5`.

Después del fix, `/privacidad` y `/terminos` ya no reciben el header `X-Robots-Tag` restrictivo y mantienen metadata `robots=index, follow`.

El sitemap XML conserva `X-Robots-Tag: noindex`; esto evita indexar el documento XML como una página y no cambia las URLs declaradas dentro de él.

## Verificación de producción

Deployment validado:

- Vercel deployment: `dpl_FJmS18DoydWxwwCZ5BjQs7D35pmj`;
- commit: `946e7dc4a118a18b084afbf715ac2d966874d0e5`;
- target: production;
- estado: READY;
- alias: `videntia.app`.

### `/privacidad`

PASS:

- HTTP 200;
- title `Privacidad | VIDENTIA`;
- canonical `https://videntia.app/privacidad`;
- meta robots `index, follow`;
- sin `X-Robots-Tag: noindex` después del fix;
- contenido legal esperado visible en HTML de producción.

### `/terminos`

PASS:

- HTTP 200;
- title `Términos de uso | VIDENTIA`;
- canonical `https://videntia.app/terminos`;
- meta robots `index, follow`;
- sin `X-Robots-Tag: noindex` después del fix;
- contenido legal esperado visible en HTML de producción.

### `/demo`

PASS por HTML de producción:

- HTTP 200;
- footer `VIDENTIA · un desarrollo de N3uralia`;
- enlace `Privacidad` -> `/privacidad`;
- enlace `Términos` -> `/terminos`;
- enlace de contacto a `info@n3uralia.com`.

### `/contacto?origen=demo&marca=VIDENTIA&resultados=50`

PASS por HTML de producción:

- HTTP 200;
- conserva el contexto de la investigación;
- footer legal presente;
- enlaces a privacidad, términos y contacto presentes.

### `/sitemap.xml`

PASS:

- HTTP 200;
- contiene `https://videntia.app/privacidad`;
- contiene `https://videntia.app/terminos`.

## Calidad e infraestructura

Para el commit de código final `946e7dc4a118a18b084afbf715ac2d966874d0e5`:

- GitHub CI: PASS;
- Niza regression: PASS;
- TypeScript: PASS;
- Next.js production build: PASS;
- CodeQL JavaScript/TypeScript: PASS;
- Vercel deployment: READY;
- runtime production error/fatal logs del deployment, ventana de 30 minutos: ninguno.

## Commits principales

- `e2c22b735b3e1e4d0390389cfd0ad7c8bc25ccfe` — privacidad.
- `ce808ce9622cbae9dff4bcccadb7ba56e459a9a6` — términos.
- `6cb6a449c1cbb8a01f3d316bb07c30eaef418dbd` — footer legal inicial.
- `acd11b1bce2dc7d79f46128134eb3d4147582d61` — footer convertido a Server Component.
- `07a45bfbf5c2d6032120e39429b3b5ff526195c3` — footer retirado del root global.
- `c369b7ec1618a3690dfcd29e18995220f27cf73d` — footer en demo.
- `7de2e8334e778870030dae7ae2922c23b27118df` — footer en contacto.
- `1d1a3923f6a27360873da5edb6d19cf0d4035473` — sitemap legal.
- `946e7dc4a118a18b084afbf715ac2d966874d0e5` — coherencia de indexación en proxy.

## Limitaciones y revisión recomendada

Esta implementación es una base operativa técnicamente fundamentada, no una certificación ni una revisión jurídica externa. Antes de utilizarla como documentación contractual definitiva para clientes enterprise, debe revisarla un abogado chileno, especialmente de cara a la entrada en vigencia de la Ley 21.719 el 1 de diciembre de 2026.

La validación de esta ronda se hizo mediante código, build y HTML/headers reales de producción. La prueba visual interactiva de browser sigue bloqueada en este entorno por `ERR_BLOCKED_BY_ADMINISTRATOR`; ese bloqueo ya está documentado separadamente en `docs/qa/2026-08-24-mobile-upload-validation.md`.

## Estado de cierre

**PASS técnico.**

Privacidad, términos, exposición desde los flujos públicos, sitemap, canonical, indexación, CI, CodeQL y runtime quedaron validados. La revisión legal profesional externa permanece como control recomendado antes de formalizar condiciones contractuales enterprise.
