# Manual de usuario — Visual Compare Chile

## 1. Objetivo de la plataforma

Visual Compare Chile centraliza análisis preliminar de marcas, comparación visual, consulta de antecedentes oficiales, inteligencia de patentes y vigilancia competitiva. Está orientada a analistas, auditores y administradores que necesitan trabajar con evidencia trazable y reducir consultas manuales repetitivas.

## 2. Acceso y roles

El acceso al área privada requiere sesión. La aplicación contempla roles de **Administrador**, **Analista** y **Auditor**. El contenido visible y las acciones disponibles pueden variar según permisos.

Para integraciones externas existe una API con API keys, cuotas y rate limiting. Las API keys no sustituyen la sesión web del usuario; son un mecanismo separado para integraciones máquina a máquina.

## 3. Mapa del sitio

### Sitio público

- `/` — presentación de la plataforma y acceso a los principales casos de uso.
- `/auth/login` — inicio de sesión.
- `/auth/sign-up` — registro de usuario cuando está habilitado.
- páginas informativas, comerciales y de documentación pública según la navegación disponible.

### Área privada

- `/dashboard` — inicio operativo.
- `/agente` — evaluación preliminar de una marca.
- `/compare` — comparación visual de imágenes.
- `/history` — historial de análisis/comparaciones.
- `/comparisons/[id]` — detalle trazable de una comparación.
- `/consulta-inapi` y flujos de consulta — búsqueda de antecedentes marcarios.
- `/patentes` — búsqueda de patentes y perfiles competitivos.
- `/patentes/alertas` — vigilancia por empresa o IPC.
- `/reportes` — acceso a reportes disponibles.
- `/settings` — perfil, cuenta y configuración.
- `/admin` — operación administrativa para usuarios autorizados.
- `/dashboard/playground` — pruebas de API cuando corresponda.

## 4. Dashboard

El dashboard funciona como punto de entrada al trabajo diario. Permite iniciar análisis, acceder a búsquedas y revisar configuración. El flujo principal recomendado es:

1. ingresar con una cuenta autorizada;
2. elegir el módulo de análisis;
3. ejecutar la consulta o cargar imágenes;
4. revisar evidencia, nivel de riesgo y clasificación;
5. guardar o consultar el resultado en el historial;
6. escalar a revisión humana cuando el resultado lo requiera.

## 5. Evaluación preliminar de marca

El módulo `/agente` permite analizar una marca por nombre y, opcionalmente, por logo/signo gráfico.

### Entrada

- nombre de la marca;
- imagen opcional en PNG, JPEG, WebP o GIF;
- el frontend limita la imagen del agente a aproximadamente 4,5 MB.

### Proceso

La plataforma combina:

- búsqueda denominativa;
- antecedentes INAPI;
- clasificación Niza;
- clasificación Viena cuando existe componente figurativo;
- análisis de conflictos;
- resumen ejecutivo;
- nivel de riesgo;
- métricas de calidad y cobertura.

### Salida

El usuario recibe una evaluación preliminar con:

- marca analizada;
- nivel de riesgo global;
- resumen ejecutivo;
- evidencia INAPI;
- número de resultados y resultados activos;
- cobertura de clases;
- advertencias;
- fuente y fecha de consulta;
- recomendación operativa.

El sistema distingue claramente entre evidencia disponible y ausencia de fuente. No debe interpretarse “sin antecedentes detectados” como una garantía jurídica de registrabilidad.

## 6. Comparación visual

El módulo de comparación permite enfrentar dos imágenes para identificar similitudes, duplicados o variaciones cercanas.

El pipeline puede utilizar huellas exactas, señales perceptuales y análisis visual complementario. El resultado persiste junto con señales técnicas y queda disponible para trazabilidad.

Interpretación general:

- coincidencia exacta: alta probabilidad de duplicado;
- duplicado cercano: revisión requerida;
- visualmente similar: revisión requerida;
- parcialmente similar: revisar contexto;
- diferente: sin similitud relevante detectada por el motor.

La clasificación es una ayuda para el analista y no sustituye un juicio jurídico final.

## 7. Consulta de marcas INAPI

La consulta de marcas usa una arquitectura **local-first**:

1. busca primero en el mirror local de Supabase;
2. aplica búsqueda fuzzy y normalización de tildes;
3. pondera similitud de nombre, clases Niza y estado;
4. cuando agrega valor, verifica candidatos contra INAPI live;
5. si INAPI live no está disponible, conserva el resultado local y expone la frescura del dato.

Esto permite mayor velocidad y continuidad operacional sin depender de una consulta web remota para cada búsqueda.

## 8. Clasificaciones Niza y Viena

### Niza

Clasifica productos y servicios en clases internacionales. El sistema la utiliza para contextualizar antecedentes y mejorar el ranking de posibles conflictos.

### Viena

Clasifica elementos figurativos de marcas. Se utiliza cuando existe un signo gráfico y el análisis visual aporta valor.

La clasificación generada por IA usa salidas estructuradas y validación de schema. Los códigos que no pertenecen a los catálogos canónicos se rechazan.

## 9. Patent Intelligence

El módulo `/patentes` permite buscar información de patentes por:

- título o tecnología;
- solicitante/empresa;
- clasificación IPC;
- contexto de actividad reciente.

La información sincronizada incluye, cuando está disponible:

- número de solicitud y registro;
- título;
- solicitantes;
- inventores;
- clasificación IPC;
- estado;
- fechas;
- país y región;
- datos PCT y prioridades.

## 10. Competitive Intelligence

Dentro del módulo de patentes existe una vista de perfil competitivo por empresa. Permite observar:

- cartera registrada y en trámite;
- actividad reciente;
- familias tecnológicas observadas;
- IPC dominantes;
- inventores recurrentes;
- últimos movimientos.

Las métricas interanuales sólo deben mostrarse cuando el histórico requerido esté completo. La plataforma bloquea métricas YoY cuando la cobertura histórica aún no permite una conclusión responsable.

## 11. Alertas competitivas

En `/patentes/alertas` un usuario puede crear vigilancias por:

- empresa/solicitante;
- prefijo IPC.

Después de cada sincronización del año actual, el sistema detecta nuevas coincidencias y genera eventos. El backfill histórico se ejecuta después de esta detección para evitar alertas falsas por registros antiguos ingresados recientemente.

Las vigilancias se pueden pausar, reactivar o eliminar. Los eventos se almacenan por usuario y están protegidos mediante RLS.

## 12. Historial y trazabilidad

Los análisis y comparaciones relevantes se persisten. El historial permite volver a resultados previos, revisar señales y evitar repetir trabajo innecesariamente.

La trazabilidad puede incluir:

- fecha;
- usuario;
- resultado;
- señales técnicas;
- fuente de datos;
- modelo de IA utilizado;
- escalamiento de modelo;
- tokens y costo estimado;
- latencia;
- errores o advertencias.

## 13. Reportes

Cuando el flujo lo habilita, la plataforma genera reportes y documentos de apoyo. El objetivo es conservar una salida compartible sin perder la relación con la evidencia y el análisis original.

## 14. Configuración

`/settings` concentra configuración de cuenta y opciones disponibles para el usuario. La administración de secretos de producción, Supabase, Vercel o OpenAI no debe hacerse desde el navegador del cliente salvo que exista una interfaz explícitamente creada para ello.

## 15. Buenas prácticas de uso

- usar nombres de marca completos y bien escritos;
- subir imágenes limpias, recortadas y legibles;
- revisar clases Niza relevantes antes de concluir un conflicto;
- tratar el nivel de riesgo como priorización, no como sentencia jurídica;
- confirmar casos de alto impacto con evidencia oficial y revisión profesional;
- no compartir API keys ni credenciales;
- revisar la frescura del sistema si una fuente oficial parece desactualizada.

## 16. Qué hacer ante un problema

1. revisar si la sesión sigue activa;
2. volver a intentar una vez si fue un error transitorio;
3. consultar `/api/v1/health` o pedir al administrador revisar el health;
4. verificar que marcas y patentes estén `fresh`;
5. registrar el momento, módulo, entrada y mensaje de error;
6. escalar al responsable técnico si el problema persiste.

## 17. Limitaciones y criterio profesional

Visual Compare Chile no reemplaza a INAPI, a un abogado de propiedad industrial ni a una decisión administrativa. Su objetivo es mejorar velocidad, cobertura, trazabilidad y capacidad de análisis previo.