# Roadmap MVP - Visual Compare Chile

## Objetivo
Entregar un MVP funcional y vendible para comparar imagenes de marca con flujo real de autenticacion, carga, comparacion, historial y despliegue estable.

## Estado actual
- La UI ya existe.
- La autenticacion ya se integro a Supabase.
- La subida de imagenes y el motor de comparacion ya estan conectados a endpoints reales.
- Falta cerrar consistencia, tests, datos y despliegue productivo.

## Alcance del MVP
### Incluye
- Landing publica.
- Registro e inicio de sesion con Supabase.
- Carga de imagenes JPG, PNG, WebP y TIFF hasta 50 MB.
- Comparacion de dos imagenes con:
  - SHA-256 exacto
  - pHash perceptual
  - score final y clasificacion
- Historial de comparaciones.
- Vista de detalle de comparacion.
- Rutas protegidas.
- Validaciones, mensajes de error y logging basico.
- Deploy en Vercel con variables de entorno reales.

### No incluye
- Dataset masivo externo.
- Embeddings avanzados o ML pesado.
- Exportaciones complejas.
- Multi-tenant administrativo completo.
- Paneles de analitica avanzados.

## Roadmap Propuesto

### Semana 1: Cierre de fundaciones
Objetivo: dejar el esqueleto estable para trabajar sin romper auth ni rutas.

- Revisar variables de entorno.
- Confirmar auth Supabase en login, signup y callback.
- Dejar middleware de sesion activo.
- Eliminar rutas o links rotos.
- Normalizar textos y limites visibles de producto.
- Verificar build de produccion.

Entrega:
- App navegable sin 404 en los flujos principales.
- Sesion real funcionando.
- Build OK.

### Semana 2: Flujo de carga
Objetivo: dejar la carga de imagenes confiable y consistente.

- Unificar validaciones entre UI y backend.
- Mantener soporte JPG, PNG, WebP y TIFF.
- Mantener limite de 50 MB.
- Confirmar deduplicacion por SHA-256.
- Verificar subida y lectura desde storage.
- Probar manejo de errores de archivo invalido.

Entrega:
- Subida estable desde la UI.
- Contrato unico de validacion.
- Respuestas correctas ante errores.

### Semana 3: Motor de comparacion
Objetivo: producir un resultado util, consistente y trazable.

- Usar pHash real en ambos endpoints de carga.
- Mantener score final unificado en `/api/compare`.
- Confirmar clasificacion y recomendacion.
- Guardar resultado JSON completo.
- Validar acceso por usuario a comparaciones.

Entrega:
- Comparacion completa de principio a fin.
- Resultado reproducible.
- Persistencia correcta.

### Semana 4: Historial y detalle
Objetivo: poder revisar resultados sin tocar backend manualmente.

- Dejar lista la lista de comparaciones.
- Dejar lista la vista de detalle por ID.
- Confirmar borrado seguro de comparaciones.
- Revisar visualizacion de diff y metadatos.

Entrega:
- Historial util.
- Detalle navegable.
- Borrado controlado.

### Semana 5: QA y seguridad
Objetivo: reducir riesgo antes de lanzar.

- Revisar RLS o policies necesarias.
- Verificar que no se pueda leer data de otro usuario.
- Probar login/logout, upload y compare.
- Revisar mensajes de error.
- Hacer smoke test mobile.

Entrega:
- Checklist de seguridad minimo pasado.
- Flujos principales testeados.

### Semana 6: Deploy y estabilizacion
Objetivo: dejar el MVP listo para demo o primer piloto.

- Configurar Vercel production.
- Verificar env vars.
- Revisar logs de errores.
- Corregir regresiones visuales.
- Preparar nota de handoff.

Entrega:
- MVP desplegado.
- Documento de estado final.
- Lista de pendientes post-MVP.

## Criterios de exito
- Login y signup funcionan.
- Upload acepta los formatos definidos.
- Compare devuelve score, clasificacion y recomendacion.
- Historial y detalle funcionan.
- No hay rutas rotas en el flujo principal.
- Build de produccion pasa.

## Riesgos principales
- Desalineacion entre docs y codigo.
- Policies de Supabase insuficientes.
- Falta de datos reales para probar calidad.
- Dependencias pesadas como `sharp` o entorno local inconsistente.

## Prioridad real
1. Auth y rutas estables.
2. Upload consistente.
3. Comparacion confiable.
4. Historial y detalle.
5. QA y deploy.

