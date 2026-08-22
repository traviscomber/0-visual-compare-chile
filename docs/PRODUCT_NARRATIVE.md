# Product Narrative — Visual Compare Chile

## Posicionamiento

Visual Compare Chile deja de presentarse como una herramienta aislada para comparar o revisar marcas. La plataforma se presenta como un sistema de **inteligencia de propiedad industrial** para organizaciones que necesitan tomar mejores decisiones antes de solicitar protección, investigar su entorno competitivo y monitorear señales nuevas.

## Promesa principal

> **Decide antes. Investiga mejor. Vigila lo que cambia.**

La plataforma combina datos oficiales INAPI, búsqueda local, IA multimodelo y trazabilidad para transformar información dispersa de marcas y patentes en decisiones accionables.

## Tres momentos de producto

### 1. Evaluar

Antes de solicitar o avanzar con una marca, el usuario puede revisar antecedentes, clases Niza/Viena, similitud visual y señales de riesgo.

Capacidades asociadas:
- agente de análisis de marca;
- clasificación Niza y Viena;
- comparación visual;
- antecedentes INAPI;
- informes e historial.

### 2. Investigar

El usuario puede explorar el patrimonio industrial propio, de competidores o de un sector para comprender actividad, tecnologías, solicitantes e inventores.

Capacidades asociadas:
- búsqueda de marcas;
- Patent Intelligence;
- Competitive Intelligence;
- actividad anual y YoY;
- IPC, inventores y últimos movimientos.

### 3. Monitorear

Después de definir qué importa, el usuario puede mantener vigilancia sobre empresas o tecnologías y detectar nuevas señales sin repetir búsquedas manuales.

Capacidades asociadas:
- alertas competitivas;
- watches por empresa e IPC;
- actualización diaria con INAPI;
- health y frescura de datos.

## Lenguaje de interfaz

### Sí usar
- evaluar
- investigar
- monitorear
- señal
- evidencia
- antecedente
- actividad
- riesgo
- oportunidad
- cartera
- inteligencia

### Evitar como narrativa principal
- endpoint
- scraping
- pg_trgm
- cron
- RPC
- pipeline
- tier de modelo
- procesamiento

Estos términos pueden aparecer en documentación técnica o administración, pero no deben definir la experiencia principal del cliente.

## Jerarquía de navegación

### Principal
1. Inicio
2. Evaluar marca
3. Investigar marcas
4. Inteligencia de patentes
5. Monitoreo

### Secundaria / herramientas
- Historial
- Comparar imágenes
- Base indexada
- API Playground
- Operaciones
- Configuración

## Regla de diseño

Cada pantalla debe responder primero una pregunta de negocio y sólo después mostrar herramientas técnicas.

Ejemplos:
- No: “Marcas INAPI”.
- Sí: “Investiga marcas y antecedentes”.

- No: “Patentes”.
- Sí: “Descubre actividad tecnológica y competitiva”.

- No: “Alertas competitivas”.
- Sí: “Monitorea empresas y tecnologías”.

## Home pública

La landing debe comunicar cuatro ideas en este orden:

1. Visual Compare Chile es una plataforma de inteligencia de propiedad industrial.
2. Permite evaluar, investigar y monitorear.
3. Se apoya en datos oficiales INAPI + IA, con trazabilidad.
4. El usuario puede comenzar por una decisión concreta: evaluar una marca o explorar inteligencia.

## Dashboard

El dashboard no es una colección de accesos. Es un **centro de decisiones** con tres rutas claras:

- ¿Quieres validar una marca antes de avanzar? → Evaluar.
- ¿Quieres entender qué está haciendo una empresa o sector? → Investigar.
- ¿Quieres enterarte cuando algo cambie? → Monitorear.

## Principio de confianza

La plataforma debe ser explícita respecto de su alcance: entrega inteligencia y apoyo preliminar, no reemplaza una decisión jurídica ni a INAPI.