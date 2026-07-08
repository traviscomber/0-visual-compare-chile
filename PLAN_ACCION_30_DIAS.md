# ⚡ PLAN DE ACCIÓN INMEDIATA - 30 DÍAS

## HOY (Hora 0)

- [ ] Leer: `EXECUTIVE_SUMMARY_UNA_PAGINA.md` (5 min)
- [ ] Entender: Hay 85% de gap entre Fase 0 y MVP real
- [ ] Decisión: ¿Empezar nuevo proyecto o rehacer Fase 0?
  - **Recomendación**: Empezar nuevo (más rápido)

---

## SEMANA 1 (Días 1-7): DECISIÓN & SETUP INICIAL

### Lunes - Kickoff Meeting
- [ ] Reunión con stakeholders
- [ ] Presentar: EXECUTIVE_SUMMARY_UNA_PAGINA.md
- [ ] Decidir: Supabase en esta semana ¿SÍ o NO?
- [ ] Aprobación: Roadmap 8 semanas

### Martes - Supabase Account
- [ ] Visitar: https://supabase.com
- [ ] Crear account (free tier ok para MVP)
- [ ] Crear nuevo proyecto
- [ ] **Guardar 3 credenciales**:
  1. NEXT_PUBLIC_SUPABASE_URL
  2. NEXT_PUBLIC_SUPABASE_ANON_KEY
  3. SUPABASE_SERVICE_ROLE_KEY

### Miércoles - Variables de Entorno
- [ ] Crear archivo `.env.local` en proyecto root
- [ ] Agregar 3 credenciales Supabase
- [ ] Instalar: `pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs`
- [ ] Verificar: No commitear .env.local a git

### Jueves - Database Schema
- [ ] Abrir: document.md (líneas 571-684)
- [ ] Copiar: Todo el SQL (schema + RLS + índices)
- [ ] En Supabase, ir a: SQL Editor
- [ ] Pegar y ejecutar el migration SQL
- [ ] Verificar: 8 tablas creadas

### Viernes - Verificación
- [ ] Verificar que RLS está activo
- [ ] Crear bucket "logo-assets" (private)
- [ ] Probar: conexión Supabase desde Next.js
- [ ] Crear: `lib/supabase/client.ts`

### Checklist Semana 1
- [ ] Supabase account creado
- [ ] Proyecto Supabase listo
- [ ] Schema SQL ejecutado
- [ ] 8 tablas + índices visibles
- [ ] RLS activo
- [ ] Storage privado configurado
- [ ] Credenciales en .env.local
- [ ] Conexión testeada

**Entregable**: Base de datos 100% funcional

---

## SEMANA 2 (Días 8-14): AUTENTICACIÓN COMPLETA

### Lunes - Supabase Auth Setup
- [ ] En Supabase: Authentication → Providers
- [ ] Habilitar: Email/Password
- [ ] Copiar: Endpoint de auth
- [ ] Documentar: Procedure de signup/login

### Martes - Login Page
- [ ] Actualizar: `app/auth/login/page.tsx`
- [ ] Reemplazar: localStorage mock con Supabase Auth
- [ ] Campos:
  - Email (text)
  - Password (password)
  - "Forgot password" (placeholder ok)
  - "Sign up" link
- [ ] Validación: Zod
- [ ] Error: Mensajes claros en español

### Miércoles - Signup Page
- [ ] Crear: `app/auth/signup/page.tsx`
- [ ] Campos:
  - Email
  - Password
  - Confirm Password
  - Validación de password fuerte
- [ ] Post-signup: Auto-login
- [ ] Error: Email ya existe, passwords no coinciden

### Jueves - Protected Routes Middleware
- [ ] Crear: `middleware.ts` en root
- [ ] Proteger routes: /dashboard, /search, /logos, /results, /settings
- [ ] Redirigir: A /login si no autenticado
- [ ] Session: Obtener user_id de Supabase

### Viernes - Logout & Profile
- [ ] Botón logout en todas las páginas
- [ ] Profile fetch: Traer nombre del usuario
- [ ] Mostrar email + nombre en header
- [ ] Redirect post-logout: A landing page

### Checklist Semana 2
- [ ] Login funcional (Supabase Auth)
- [ ] Signup funcional
- [ ] Protected routes activas
- [ ] Session management correcto
- [ ] Logout funcional
- [ ] Errores en español
- [ ] Mobile responsive

**Entregable**: Autenticación 100% funcional

---

## SEMANA 3 (Días 15-21): UPLOAD DE LOGOS

### Lunes - Upload Component
- [ ] Crear: `/app/search/page.tsx`
- [ ] Drag & drop área
- [ ] Browse file button
- [ ] Validación:
  - Tipos: jpg, jpeg, png, webp
  - Max: 10 MB
- [ ] Error messages claros

### Martes - Image Preview
- [ ] Mostrar preview después de upload
- [ ] Dimensiones: Mostrar ancho x alto
- [ ] File size: Mostrar tamaño
- [ ] Botón "Clear" para rehacer

### Miércoles - Metadata Fields
- [ ] Campos (opcionales):
  - Nombre de marca
  - Titular/empresa
  - Clase Niza (select)
  - Código Viena (select)
  - País (select)
  - Comentarios (textarea)
- [ ] Pre-cargar clasificaciones desde BD

### Jueves - Search Filters
- [ ] Filtros:
  - Todas las clases (default)
  - Clase Niza específica
  - Código Viena
  - País
  - Solo coincidencias altas (checkbox)
  - Fecha de registro (rango)

### Viernes - Save to Storage
- [ ] Crear server action "performSearch"
- [ ] Validar con Zod
- [ ] Subir logo a Supabase Storage
- [ ] Calcular SHA-256
- [ ] Guardar en tabla `logo_assets`
- [ ] Guardar búsqueda en `logo_searches`

### Checklist Semana 3
- [ ] Upload validado
- [ ] Metadata guardada
- [ ] Storage privado funcionando
- [ ] SHA-256 calculado
- [ ] Búsqueda guardada en BD

**Entregable**: Upload & Storage 100% funcional

---

## SEMANA 4 (Días 22-28): SIMILITUD & MATCHING

### Lunes - pHash Library
- [ ] Instalar: `pnpm add jimp phash`
- [ ] Crear: `lib/phash.ts`
- [ ] Función: Calcular pHash de imagen
- [ ] Test: Con imágenes de prueba

### Martes - Pre-calculate pHash
- [ ] Script: Calcular pHash para todos los logos en dataset
- [ ] Guardar: En tabla `logo_assets.phash`
- [ ] Verificar: Todos tienen pHash

### Miércoles - Similarity Algorithm
- [ ] Crear: Función de similitud (0-100)
- [ ] Comparar: pHash de query vs. dataset
- [ ] Ordenar: Por similitud descendente
- [ ] Filtrar: Score >= threshold (ej. 50)

### Jueves - Save Matches
- [ ] Guardar: Cada match en `logo_search_matches`
- [ ] Fields:
  - search_id (referencia)
  - matched_logo_asset_id
  - similarity_score
  - phash_similarity
  - otros metrics
- [ ] Relacionar: Con search_id

### Viernes - Results Page Preview
- [ ] Mostrar: Best similarity score (grande)
- [ ] Mostrar: Número de matches
- [ ] Mostrar: Clasificación (very_high, high, medium, low, none)
- [ ] Mostrar: Recomendación (selon document.md)
- [ ] Disclaimer legal

### Checklist Semana 4
- [ ] pHash calculado para todas las imágenes
- [ ] Similitud funcional (0-100)
- [ ] Matches guardados en BD
- [ ] Clasificación correcta
- [ ] Resultados mostrados

**Entregable**: Similitud y Matching 100% funcional

---

## SEMANA 5-8: CONTINUACIÓN (Según ROADMAP_8_SEMANAS_REAL.md)

### Semana 5: Detalles
- Historial de búsquedas
- Comparación lado a lado
- Métricas técnicas

### Semana 6: Dataset
- /logos page (tabla)
- /logos/new (agregar logo)
- /settings (cuenta y privacidad)

### Semana 7: Polish
- Brand book implementation
- Colores exactos
- Tipografía Geist
- QA completo

### Semana 8: Deploy
- Vercel deployment
- Env vars en producción
- Testing en staging
- Monitoreo

---

## 📋 CHECKLIST 30 DÍAS

### Semana 1: Supabase
- [ ] Account creada
- [ ] Schema ejecutado
- [ ] RLS activo
- [ ] Storage listo

### Semana 2: Auth
- [ ] Login funcional
- [ ] Signup funcional
- [ ] Routes protegidas
- [ ] Logout funcional

### Semana 3: Upload
- [ ] Upload validado
- [ ] Metadata guardada
- [ ] Storage funcionando
- [ ] Búsqueda guardada

### Semana 4: Similitud
- [ ] pHash funcionando
- [ ] Similitud calculada
- [ ] Matches guardados
- [ ] Resultados visibles

---

## 🚨 BLOQUEADORES POTENCIALES

| Bloqueador | Solución | Timeline |
|-----------|----------|----------|
| Sin credenciales Supabase | Crear account (15 min) | HOY |
| pHash library no funciona | Usar phash-js alternativa | Semana 4 |
| Performance lento | Optimizar índices BD | Semana 7 |
| Brand incorrecto | Actualizar globals.css | Semana 8 |

---

## 💡 TIPS DE VELOCIDAD

1. **Usa templates shadcn/ui** - No reinventes componentes
2. **Postgresql indices bien** - Performance desde el inicio
3. **Test pronto** - No dejes testing para Semana 8
4. **Pequeños commits** - Facilita debug si algo falla
5. **Documentación en vivo** - Actualiza README conforme avanzas

---

## ✅ DEFINICIÓN DE "HECHO" (DoD)

### Cada Semana
- [ ] Code está en repositorio
- [ ] Tests pasan
- [ ] No hay console errors
- [ ] Mobile responsive
- [ ] Documentación actualizada
- [ ] Almenos una review

### Deliverable Final (Semana 8)
- [ ] MVP 100% funcional
- [ ] Supabase integrado
- [ ] Brand correcto
- [ ] Deployed en Vercel
- [ ] Documentación completa

---

## 📞 NEXT STEP

**ACCIÓN INMEDIATA**: 

Hoy mismo:
1. Leer: EXECUTIVE_SUMMARY_UNA_PAGINA.md (5 min)
2. Reunión con stakeholders (30 min)
3. Decisión: ¿Empezamos Supabase esta semana? (SÍ/NO)

Si es SÍ → Mañana inicia Semana 1 de este plan  
Si es NO → ¿Cuál es el bloqueador?

---

**Plan preparado**: 10 de Mayo 2025  
**Validado contra**: document.md (brief oficial)  
**Status**: LISTO PARA EJECUTAR MAÑANA
