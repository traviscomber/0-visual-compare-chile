# Checklist de entrega y aceptación — Visual Compare Chile

## A. Acceso y cuentas

- [ ] Dominio de producción definido y accesible.
- [ ] Usuario administrador del cliente creado.
- [ ] Roles de Analista/Auditor validados si aplican.
- [ ] Acceso administrativo a GitHub documentado.
- [ ] Acceso administrativo a Vercel documentado.
- [ ] Acceso administrativo a Supabase documentado.
- [ ] Propiedad y recuperación de la cuenta OpenAI documentadas.
- [ ] 2FA habilitado en cuentas críticas.

## B. Flujo web

- [ ] Login funciona.
- [ ] Logout funciona.
- [ ] Dashboard carga sin errores.
- [ ] Evaluación preliminar de marca funciona por nombre.
- [ ] Evaluación con logo funciona con archivo válido.
- [ ] Comparación visual funciona.
- [ ] Historial muestra resultados persistidos.
- [ ] Detalle de comparación abre correctamente.
- [ ] Consulta INAPI devuelve antecedentes.
- [ ] Patent Intelligence responde búsquedas.
- [ ] Perfil competitivo por empresa responde.
- [ ] Alertas competitivas pueden crearse, pausarse y eliminarse.
- [ ] Settings carga correctamente.
- [ ] Reportes disponibles abren/generan correctamente.

## C. Datos INAPI

- [ ] Mirror de marcas reporta `fresh`.
- [ ] Mirror de patentes reporta `fresh`.
- [ ] Última sincronización exitosa visible en health/operación.
- [ ] Búsqueda por nombre tolera tildes/variantes básicas.
- [ ] Clases Niza aparecen cuando existen.
- [ ] IPC aparece en patentes cuando existe.
- [ ] El sistema no presenta datos históricos importados como alertas nuevas.
- [ ] Sync fallido no marca la fuente como fresca.

## D. IA

- [ ] `OPENAI_API_KEY` configurada sólo server-side.
- [ ] Clasificación Niza devuelve output estructurado.
- [ ] Clasificación Viena devuelve output estructurado cuando corresponde.
- [ ] Router Luna → Terra → Sol configurado.
- [ ] Códigos fuera de catálogo se rechazan.
- [ ] Se registra modelo/tier/costo cuando corresponde.
- [ ] Resultados muestran advertencia de carácter orientativo.

## E. Cron y automatización

- [ ] `CRON_SECRET` configurado en Vercel Production.
- [ ] Endpoint de cron rechaza solicitudes no autorizadas.
- [ ] Vercel Cron está activo.
- [ ] Marcas actuales se sincronizan diariamente.
- [ ] Patentes actuales se sincronizan diariamente.
- [ ] Detector de alertas corre antes del backfill histórico.
- [ ] `inapi_sync_runs` registra las ejecuciones.

## F. API

- [ ] Health endpoint responde `200` en estado sano.
- [ ] API keys se pueden emitir/revocar según permisos.
- [ ] Cuotas y rate limiting funcionan.
- [ ] Respuesta `429` aparece cuando se supera cuota configurada.
- [ ] API Playground o mecanismo de prueba está disponible.
- [ ] No existen secretos en responses ni frontend.

## G. Seguridad

- [ ] RLS validado en tablas de usuario y alertas.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no está en frontend.
- [ ] Ningún secreto real está versionado en GitHub.
- [ ] `SECURITY.md` existe.
- [ ] CODEOWNERS existe.
- [ ] Dependabot está habilitado.
- [ ] CodeQL está habilitado.
- [ ] CI TypeScript + build está habilitado.
- [ ] `main` requiere PR/checks en GitHub Settings cuando la configuración de cuenta lo permita.

## H. Producción y observabilidad

- [ ] Último deployment figura `READY`.
- [ ] Revisión Git del health coincide con el deployment esperado.
- [ ] No hay errores críticos recurrentes en Vercel.
- [ ] Frescura de marcas < 36 h.
- [ ] Frescura de patentes < 36 h.
- [ ] Backups/recuperación de Supabase definidos.
- [ ] Contacto de soporte técnico definido.

## I. Documentación entregada

- [ ] Manual de usuario entregado.
- [ ] Arquitectura y operación entregadas.
- [ ] Seguridad y mantenimiento entregados.
- [ ] API v1 documentada.
- [ ] README técnico del repositorio actualizado.
- [ ] Diagrama completo de arquitectura disponible.
- [ ] Limitaciones y alcance explicados al cliente.

## J. Aceptación funcional sugerida

Se considera que la plataforma está lista para aceptación funcional cuando:

1. el sitio productivo está accesible;
2. login, análisis de marca, comparación, búsqueda INAPI y patentes funcionan;
3. health está sano y fuentes oficiales están frescas;
4. cron y alertas están configurados;
5. no existen errores críticos abiertos;
6. documentación y accesos administrativos han sido transferidos;
7. el cliente entiende que las conclusiones de IA son orientativas y no sustituyen una decisión jurídica.

## Firma / registro de aceptación

**Cliente:** ______________________________  
**Representante:** _________________________  
**Fecha:** _________________________________  
**Proveedor / responsable técnico:** ________  
**Observaciones:** __________________________
