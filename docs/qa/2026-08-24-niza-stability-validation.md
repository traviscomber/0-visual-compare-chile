# VIDENTIA Niza — Stability & Grounding QA 2026-08-24

## Alcance

Validación de producción del clasificador Niza de VIDENTIA, con foco en:

- repetibilidad ante entradas idénticas;
- distinción entre producto de software (clase 09) y software como servicio / desarrollo tecnológico (clase 42);
- prevención de falsos positivos en clase 35 y clase 45;
- conservación de clases correctas cuando el servicio sí está expresamente descrito;
- integración final con `/api/v1/public/trademark-preview`.

Fecha local de la sesión: 2026-08-24 (Chile). Ejecuciones de infraestructura registradas en UTC durante 2026-08-25 01:xxZ.

## Base normativa utilizada

Se contrastó el comportamiento con la Clasificación de Niza NCL 13-2026 publicada por OMPI/WIPO:

- Clase 09: incluye software, archivos descargables y productos informáticos. Referencia: https://www.wipo.int/classifications/nice/nclpub/es/en/?basic_numbers=show&class_number=9
- Clase 42: incluye diseño y desarrollo de software y, expresamente, SaaS/PaaS. Referencia: https://nclpub.wipo.int/esen/pdf-download.pdf?dateInForce=20260101&lang=en&tab=class_headings
- Clase 45: servicios jurídicos y ciertos servicios de seguridad/personal/social. Referencia: https://nclpub.wipo.int/esen/pdf-download.pdf?classNumber=45&dateInForce=20260101&lang=en&viewMode=flat
- Clase 35: publicidad, gestión/administración comercial y servicios afines; no debe agregarse automáticamente por el simple hecho de comercializar los propios productos.

## Baseline antes del fix

Entrada repetida 5 veces:

- Marca: `VIDENTIA`
- Descripción: `software para análisis, búsqueda y vigilancia de marcas comerciales`

Resultado: FAIL de estabilidad.

Sets observados en cinco ejecuciones idénticas:

1. `42, 35`
2. `09, 42, 35`
3. `09, 42, 45`
4. `09, 42, 45`
5. `09, 42`

Frecuencia:

- 42: 5/5
- 09: 4/5
- 35: 2/5
- 45: 2/5

Conclusión del baseline: el modelo distinguía mal entre la modalidad ofrecida y el tema del software, y usaba clases defensivas de forma demasiado amplia. En particular, 35 y 45 aparecían sin que la descripción ofreciera publicidad/gestión comercial ni servicios jurídicos.

## Corrección aplicada

Commit principal: `2fad9e0dc40e6305cbda0ac7422142f692aac56f` — `fix(niza): stabilize classes with semantic guardrails`.

Cambios en `lib/agent/niza-classifier.ts`:

1. Prompt más estricto: sólo clases respaldadas por productos/servicios efectivamente descritos.
2. Distinción de modalidad:
   - software genérico / producto de software -> 09;
   - SaaS/PaaS, plataforma web, hosting, diseño/desarrollo de software -> 42;
   - SaaS + software descargable/instalable -> 09 + 42.
3. Clase 35 se filtra salvo que existan servicios explícitos de publicidad, marketing, administración/gestión comercial, retail, marketplace o intermediación.
4. Clase 45 se filtra salvo que existan servicios jurídicos, representación, arbitraje/mediación, tramitación de marcas, seguridad física/personal u otros servicios propios de la clase.
5. Un software cuyo tema sea jurídico o marcario no se convierte por ese solo hecho en clase 45.
6. Deduplicación y orden determinista de clases.
7. Guardrails deterministas complementan la salida del modelo; no se depende sólo de la variabilidad generativa.

## Validación post-fix

### Repetibilidad de VIDENTIA

Se ejecutaron tres pases completos consecutivos con 5 clasificaciones idénticas de VIDENTIA en cada pase.

Resultado: PASS.

- 15/15 ejecuciones -> exactamente `09`.
- 0/15 -> clase 35.
- 0/15 -> clase 45.
- 0/15 -> clase 42 para la descripción genérica de software, ya que no declara SaaS/PaaS/hosting/desarrollo.

### Controles semánticos

Todos PASS:

- `servicios jurídicos, asesoría legal y representación de clientes` -> `45`.
- `software como servicio SaaS para análisis de datos empresariales` -> `42`, sin `09`.
- `bebidas no alcohólicas, jugos y aguas saborizadas` -> `32`, sin `35` defensiva automática.
- `servicios de publicidad y marketing para terceros` -> `35`.
- `software como servicio SaaS para gestión de expedientes jurídicos` -> `42`, sin `45` ni `09`.
- `software como servicio SaaS y aplicación móvil descargable para análisis de datos` -> `09, 42`.

Tres pases ampliados consecutivos: `10/10`, `10/10`, `10/10` aserciones PASS.

### Smoke end-to-end de la demo pública

Se agregó temporalmente una comprobación desde el probe hacia `/api/v1/public/trademark-preview` con la misma descripción de VIDENTIA.

Resultado: PASS.

- HTTP 200.
- `niza_context_provided: true`.
- clases devueltas por la demo pública: `09`.
- sin error.
- corrida final de la suite con integración: `11/11` aserciones PASS.

## Infraestructura y commits de prueba

- `4d6f75e9de9b489d81b3866bd9441cf07d8024fb` — probe temporal inicial de estabilidad.
- `2fad9e0dc40e6305cbda0ac7422142f692aac56f` — fix del clasificador.
- `c00da009c3b6a97371136abeafc383312854f047` — cobertura ampliada de modalidad y falsos positivos.
- `2d8f2650521c88a097aa15cc59724fe64156d8ab` — smoke de integración con la demo pública.

El endpoint temporal usado para QA fue `/api/health/niza-qa-suite` y debe quedar eliminado después de esta validación.

## Riesgos residuales

1. Los guardrails deterministas cubren explícitamente las confusiones observadas alrededor de 09, 35, 42 y 45; no constituyen una taxonomía determinista completa de las 45 clases.
2. La clasificación sigue dependiendo de la precisión de la descripción de productos/servicios entregada por el usuario. Si falta la modalidad, VIDENTIA evita inventarla y clasifica sobre lo literalmente descrito.
3. La lista interna usa títulos resumidos de las 45 clases; para una solicitud real debe revisarse la especificación detallada de productos/servicios y la fuente oficial vigente.
4. Esta salida es asistencia para investigación y no reemplaza una revisión profesional de la estrategia de clases ni la validación final ante INAPI.

## Estado de cierre

El defecto de inestabilidad observado para VIDENTIA quedó reproducido, corregido y revalidado en producción. El criterio de cierre de esta ronda Niza es PASS.
