# Seguridad, mantenimiento y soporte — Visual Compare Chile

## 1. Modelo de seguridad

La plataforma utiliza autenticación Supabase para usuarios y API keys para integraciones externas. Las credenciales de alto privilegio permanecen en runtime server-side y no deben exponerse en el navegador ni almacenarse en documentación compartida.

Controles principales:

- sesiones autenticadas para áreas privadas;
- RLS en información de usuario, watches y alertas;
- `SUPABASE_SERVICE_ROLE_KEY` sólo server-side;
- cron protegido mediante `CRON_SECRET`;
- API keys con hash, revocación y cuotas;
- endpoints sensibles fuera de acceso público anónimo;
- health checks que no exponen secretos;
- Structured Outputs y validación Zod para respuestas de IA;
- CI, CodeQL, Dependabot y CODEOWNERS en GitHub.

## 2. Secretos y variables de entorno

Secretos críticos:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `OPENAI_API_KEY`;
- `CRON_SECRET`;
- API keys emitidas a integraciones.

Variables públicas como `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` pueden estar expuestas al navegador según su propósito, pero igualmente deben corresponder al entorno correcto.

Reglas:

1. nunca commitear secretos reales;
2. usar Vercel Environment Variables para producción;
3. rotar secretos ante sospecha de exposición;
4. revocar API keys no utilizadas;
5. limitar acceso administrativo a las cuentas Vercel, Supabase, GitHub y OpenAI.

## 3. Protección de datos

Los datos oficiales de INAPI se almacenan para búsqueda y análisis. Los datos de usuarios y resultados privados deben mantenerse protegidos por RLS y políticas de acceso.

Los archivos de imagen deben tratarse como contenido potencialmente sensible del cliente. Se recomienda definir contractualmente política de retención, respaldo y eliminación si el proyecto pasa a un SLA formal.

## 4. Mantenimiento diario automático

Vercel Cron ejecuta la sincronización oficial. El operador no necesita correr manualmente el importador durante la operación normal.

El health debe revisarse si:

- el sistema reporta estado degradado;
- una búsqueda parece desactualizada;
- el cron falla;
- hay errores repetidos en la API.

## 5. Mantenimiento semanal

Recomendado:

- revisar errores de Vercel;
- revisar estado de CI/CodeQL;
- revisar PRs de Dependabot;
- confirmar frescura de marcas y patentes;
- revisar crecimiento de tablas y almacenamiento;
- revisar alertas de seguridad de GitHub/Supabase;
- confirmar que no existan syncs fallidos recurrentes.

## 6. Mantenimiento mensual

- revisar costos de OpenAI, Vercel y Supabase;
- analizar porcentaje de escalamiento Luna → Terra → Sol;
- comprobar costo promedio por análisis;
- revisar índices y rendimiento de Supabase;
- auditar API keys activas;
- revisar usuarios y roles;
- confirmar backups y recuperación;
- actualizar dependencias seguras;
- revisar cobertura histórica de patentes hasta completar el backfill.

## 7. Política de cambios

Todo cambio de runtime debe:

1. realizarse en branch;
2. abrir PR;
3. pasar TypeScript y build;
4. pasar CodeQL cuando aplique;
5. construir preview Vercel;
6. revisar impacto de migraciones;
7. mergearse a `main` sólo después de validación;
8. verificarse en producción mediante health y smoke tests.

No se recomienda modificar directamente producción desde GitHub sin PR.

## 8. Incidentes

### INAPI o datos.gob.cl no disponible

- conservar mirror local;
- no marcar sync fallido como exitoso;
- permitir retry en siguiente cron;
- mostrar frescura real;
- usar INAPI live sólo cuando esté disponible.

### OpenAI no disponible

- devolver error explícito en el módulo afectado;
- no inventar clasificaciones ni reportes;
- conservar búsquedas y datos locales;
- reintentar sólo de forma controlada.

### Supabase no disponible

Impacto alto. Puede afectar auth, persistencia y búsqueda local. Revisar status del proveedor, credenciales, conexiones y logs. No migrar datos improvisadamente durante un incidente sin respaldo.

### Vercel no disponible

Impacta la aplicación y APIs desplegadas. Revisar deployment, dominio y status del proveedor. La base Supabase permanece independiente.

### Secreto expuesto

1. rotar inmediatamente;
2. revocar el secreto anterior;
3. actualizar Vercel/integraciones;
4. revisar logs de uso;
5. documentar el incidente.

## 9. Backups y propiedad de cuentas

Para una entrega formal se debe definir quién controla:

- organización/repo GitHub;
- proyecto Vercel;
- proyecto Supabase;
- cuenta/proyecto OpenAI;
- dominio DNS;
- correos de recuperación y 2FA.

El cliente debe disponer de una ruta documentada para recuperar acceso administrativo sin depender de una sola persona.

## 10. Soporte recomendado

Clasificación sugerida:

- **P1 crítico:** sitio caído, pérdida de auth, pérdida de datos, exposición de secretos.
- **P2 alto:** sync oficial detenido, comparaciones o análisis indisponibles para todos.
- **P3 medio:** módulo específico con error o degradación sin bloqueo total.
- **P4 bajo:** ajuste visual, contenido, mejora de UX o feature request.

El SLA final debe definirse comercialmente; este documento no fija tiempos contractuales por sí solo.

## 11. Seguridad de IA

La IA no es fuente oficial. Reglas del sistema:

- validar schemas;
- rechazar códigos inexistentes;
- conservar evidencia de origen;
- no publicar cifras de precisión sin evals;
- no usar confianza del modelo como sustituto de evidencia jurídica;
- registrar costo y escalamiento para controlar gasto.

## 12. Criterio de producción saludable

Una operación normal debe cumplir:

- deployment `READY`;
- health `200`;
- marcas `fresh`;
- patentes `fresh`;
- sin errores críticos recurrentes;
- cron funcionando;
- CI y CodeQL verdes en cambios recientes;
- secretos vigentes y no expuestos.