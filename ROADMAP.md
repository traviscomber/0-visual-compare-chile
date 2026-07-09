# Roadmap MVP - Visual Compare Chile

## Objetivo
Entregar en 8 semanas un MVP vendible y estable para comparar imagenes de marca, con autenticacion Supabase, flujo principal completo, localizacion ES/EN, historial, API compartida y deploy confiable en Vercel.

## Alcance congelado del MVP
Incluye:
- Login y signup con Supabase.
- Rutas protegidas y session refresh.
- Flujo principal de consulta, carga, comparacion e historial.
- Capa compartida `api/v1` para search, compare, images, registros y usage.
- Localizacion funcional entre ES/EN sin rutas rotas.
- Configuracion de Supabase, claves API y deploy estable.

Fuera de alcance por ahora:
- Nuevos productos o flujos paralelos.
- Redisenos grandes.
- Automatizaciones complejas.
- Dataset masivo o features enterprise.

## Estado actual
- La UI principal ya existe.
- La autenticacion ya esta integrada a Supabase.
- La consulta por marcas ya tiene motor funcional y API v1 compartida.
- La subida de imagenes y el motor de comparacion ya usan endpoints reales.
- Se alinearon contratos de `api/v1` para `search`, `compare`, `images`, `comparisons` y `usage`.
- Se corrigio el leakage de `comparisons` por usuario y la auditoria de `usage_logs` para legacy routes.
- Falta cerrar una pasada final de coherencia en runtime limpio y verificar que Vercel use la build correcta.

## Prioridad real
1. Auth y rutas estables.
2. Consulta consistente.
3. Upload consistente.
4. Comparacion confiable.
5. Historial, detalle, API keys y QA final.

## Plan de 8 semanas

### Semana 1: Auditoria y congelamiento
- Validar el flujo real en runtime limpio.
- Identificar rutas rotas o desalineadas.
- Confirmar variables de entorno y Supabase.
- Definir lo que entra y lo que queda fuera del MVP.

### Semana 2: Auth y rutas
- Cerrar login, signup, callback y logout.
- Mantener middleware y session refresh.
- Revisar proteccion de rutas principales.
- Eliminar links o redirects inconsistentes.

### Semana 3: ES/EN y navegacion
- Alinear localizacion sin romper la ruta canonica.
- Confirmar comportamiento de `/es` y `/en`.
- Mantener landing, dashboard y app core coherentes.
- Revisar textos y labels criticos del flujo.

### Semana 4: Consulta y API Portal
- Cerrar `/consulta` sobre la fuente compartida.
- Validar search por Niza y Viena.
- Mantener contratos de `api/v1` estables.
- Confirmar que los resultados no dependan de rutas legacy.

### Semana 5: Upload y comparacion
- Verificar upload real.
- Mantener deduplicacion y validaciones.
- Asegurar compare estable y user-scoped.
- Revisar persistencia de resultados y metadatos.

### Semana 6: Historial y detalle
- Cerrar historial.
- Cerrar detalle de comparacion.
- Revisar borrado seguro si sigue en scope.
- Confirmar permisos por usuario.

### Semana 7: Settings, API keys y QA
- Cerrar settings y gestion de claves API.
- Revisar mensajes de error y estados vacios.
- Ejecutar smoke test end to end.
- Revisar regresiones visuales y de navegacion.

### Semana 8: Deploy y estabilizacion
- Verificar build de produccion.
- Confirmar Vercel con variables correctas.
- Validar dominio final y rutas publicas.
- Dejar checklist de salida y handoff.

## Definicion de listo
El MVP queda listo cuando:
- Un usuario puede entrar, autenticarse y navegar sin rutas rotas.
- Puede consultar, subir, comparar y revisar historial.
- ES/EN no rompe el flujo.
- Supabase y Vercel estan configurados de forma estable.
- Smoke test y build de produccion pasan.

## Foco inmediato
- Validar `/consulta` con la fuente compartida.
- Cerrar settings y claves API.
- Verificar que no queden rutas rotas en el flujo principal.
- Confirmar que el servidor desplegado use el checkout actualizado y no una build vieja.
