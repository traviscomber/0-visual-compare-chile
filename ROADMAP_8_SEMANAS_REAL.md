# 🚀 ROADMAP 8 SEMANAS - Logo Similarity Chile MVP

## OBJETIVO FINAL
Plataforma funcional para comparación visual de logos con:
- ✅ Autenticación Supabase
- ✅ Upload de logos
- ✅ Búsqueda por similitud (pHash)
- ✅ Historial de búsquedas
- ✅ Comparación lado a lado
- ✅ Gestión de dataset

---

## SEMANA 1-2: FUNDACIÓN & SUPABASE (CRÍTICA)

### DÍA 1: Setup Supabase
- [ ] Crear cuenta Supabase (free tier)
- [ ] Crear nuevo proyecto
- [ ] Obtener credentials (URL + ANON_KEY + SERVICE_KEY)
- [ ] Agregar variables de entorno a .env.local
- [ ] Instalar @supabase/supabase-js + @supabase/auth-helpers-nextjs

### DÍA 2: Database Schema
- [ ] Crear migration SQL con 8 tablas exactas (copiar de document.md líneas 571-684)
  - profiles
  - trademarks
  - logo_assets
  - logo_searches
  - logo_search_matches
  - classification_nice
  - classification_vienna
  - usage_logs
- [ ] Crear índices (11 índices exactos)
- [ ] Activar RLS en todas las tablas
- [ ] Crear 11 políticas RLS exactas

### DÍA 3: RLS Policies
- [ ] Implementar políticas de acceso para cada tabla
- [ ] Verificar que usuarios solo ven sus propios datos
- [ ] Revisar que los índices están activos

### DÍA 4: Supabase Storage
- [ ] Crear bucket "logo-assets" (private)
- [ ] Configurar RLS para storage
- [ ] Crear policy que solo deja acceso a user_id propietario

### DÍA 5: Supabase Client Setup
- [ ] Crear lib/supabase/client.ts (client-side)
- [ ] Crear lib/supabase/server.ts (server-side)
- [ ] Crear lib/supabase/middleware.ts (para protected routes)
- [ ] Configurar Auth middleware en layout

### RESULTADO SEMANA 1-2:
- [ ] Base de datos 100% funcional
- [ ] Storage privado configurado
- [ ] Supabase auth listo para integración
- [ ] Middleware protegiendo rutas

---

## SEMANA 3: AUTENTICACIÓN

### DÍA 1-2: Login/Signup Page (/auth/login)
- [ ] Reemplazar mock auth con Supabase Auth
- [ ] Form con email + password
- [ ] Validación Zod
- [ ] Errores claros
- [ ] Link "Forgot password"
- [ ] Link "Sign up"

### DÍA 3: Sign Up Page (/auth/signup)
- [ ] Form con email + password + confirm password
- [ ] Validación de password fuerte
- [ ] Auto-login post signup
- [ ] Link back to login

### DÍA 4: Protected Routes Middleware
- [ ] Middleware.ts que protege /dashboard, /search, /logos, /results, /settings
- [ ] Redirige a /login si no autenticado
- [ ] Obtiene user_id de session

### DÍA 5: Dashboard Post-Login
- [ ] Mostrar nombre del usuario
- [ ] Botón "Logout" funcional
- [ ] Redirect a /login post logout

### RESULTADO SEMANA 3:
- [ ] Login/signup 100% funcional
- [ ] Routes protegidas
- [ ] Session management correcto
- [ ] Logout funcional

---

## SEMANA 4: PÁGINA DE BÚSQUEDA & UPLOAD

### DÍA 1-2: /search Page - Upload Component
- [ ] Drag & drop area (o browse)
- [ ] Validación de archivo:
  - Tipos: jpg, jpeg, png, webp
  - Max: 10 MB
  - Mostrar error si invalido
- [ ] Preview de imagen subida
- [ ] Botón "Limpiar" para empezar de nuevo

### DÍA 3: /search Page - Metadata Fields
- [ ] Nombre de marca (text)
- [ ] Titular/empresa (text)
- [ ] Clase Niza preliminar (select - 45 opciones)
- [ ] Código Viena preliminar (select - cargar desde BD)
- [ ] País (select - default CL)
- [ ] Comentarios (textarea)

### DÍA 4: /search Page - Search Filters
- [ ] Filter: Todas las clases (default)
- [ ] Filter: Clase Niza específica
- [ ] Filter: Código Viena específico
- [ ] Filter: País
- [ ] Filter: Solo coincidencias altas (checkbox)
- [ ] Filter: Rango de fecha

### DÍA 5: Search Action
- [ ] Crear server action "performSearch"
- [ ] Validar datos con Zod
- [ ] Subir logo a Supabase Storage
- [ ] Calcular SHA-256
- [ ] Guardar en logo_assets
- [ ] Guardar búsqueda en logo_searches

### RESULTADO SEMANA 4:
- [ ] Upload funcional
- [ ] Metadata opcional
- [ ] Filtros implementados
- [ ] Datos guardados en BD

---

## SEMANA 5: SIMILITUD & RESULTADOS

### DÍA 1-2: Perceptual Hash (pHash)
- [ ] Instalar librería phash (jimp + perceptual-hash)
- [ ] Crear función para calcular pHash de imagen subida
- [ ] Calcular pHash de todas las imágenes en dataset
- [ ] Guardar pHash en logo_assets.phash

### DÍA 3: Similarity Matching
- [ ] Crear función para comparar pHash
- [ ] Calcular similitud entre imágenes (0-100)
- [ ] Filtrar por score > threshold (ej. > 50)
- [ ] Ordenar por similitud descendente

### DÍA 4: Results Page (/search - POST results)
- [ ] Mostrar best similarity score (grande, destacado)
- [ ] Mostrar número de matches
- [ ] Mostrar clasificación (very_high, high, medium, low, none)
- [ ] Mostrar recomendación exacta (según documento)
- [ ] Disclaimer legal
- [ ] Botones: "Ver resultado completo", "Nueva búsqueda"

### DÍA 5: Guardar Match en DB
- [ ] Insertar registros en logo_search_matches
- [ ] Con similarity_score, phash_similarity, etc.
- [ ] Relacionar con search_id

### RESULTADO SEMANA 5:
- [ ] pHash calculado para todas las imágenes
- [ ] Similitud funcional
- [ ] Resultados guardados
- [ ] Vista de resultados

---

## SEMANA 6: DETALLE DE RESULTADO & HISTORIAL

### DÍA 1-2: /results Page (Historial)
- [ ] Tabla con últimas búsquedas:
  - Fecha
  - Logo consultado (thumbnail)
  - Mejor score
  - Número de matches
  - Clasificación
  - Acción: Ver resultado
- [ ] Filtrar por clasificación
- [ ] Buscar por nombre de marca
- [ ] Empty state si no hay búsquedas

### DÍA 3: /results/[id] Page (Detalle)
- [ ] Mostrar logo consultado (izquierda)
- [ ] Best similarity score (grande)
- [ ] Clasificación
- [ ] Recomendación
- [ ] Metadata de búsqueda
- [ ] Technical signals panel

### DÍA 4: Matched Logos Grid
- [ ] Para cada match:
  - Logo thumbnail (derecha)
  - Nombre de marca
  - Owner/titular
  - Similarity score
  - Niza classes
  - Vienna codes
  - País
  - Botón "Ver comparación"

### DÍA 5: Side-by-Side Comparison
- [ ] Layout: Left (searched) | Right (matched)
- [ ] Technical metrics:
  - SHA-256 match
  - pHash distance
  - pHash similarity %
  - Metadata similarity %
  - Image dimensions
  - File types/sizes
- [ ] Botones: "Volver", "Nueva búsqueda"

### RESULTADO SEMANA 6:
- [ ] Historial completo funcional
- [ ] Detalle de cada resultado
- [ ] Comparación lado a lado
- [ ] Métricas técnicas

---

## SEMANA 7: DATASET & SETTINGS

### DÍA 1-2: /logos Page (Dataset)
- [ ] Tabla con todos los logos:
  - Thumbnail
  - Nombre de marca
  - Owner
  - Niza class
  - Vienna code
  - País
  - Fecha
  - Acción: Ver detalle
- [ ] Filtrar por marca
- [ ] Filtrar por Niza
- [ ] Filtrar por Vienna
- [ ] Filtrar por país
- [ ] Botón "Agregar logo"
- [ ] Empty state

### DÍA 3: /logos/new Page (Add Logo)
- [ ] Upload logo
- [ ] Nombre de marca
- [ ] Owner/titular
- [ ] Número de solicitud/registro
- [ ] País
- [ ] Niza class
- [ ] Vienna code
- [ ] Descripción
- [ ] Fuente
- [ ] Estado (draft, active)
- [ ] Comentarios internos
- [ ] Botón "Guardar"

### DÍA 4-5: /settings Page
- [ ] Sección: Cuenta
  - Email (mostrar)
  - Nombre opcional
  - Empresa opcional
- [ ] Sección: Privacidad
  - Texto sobre almacenamiento privado
- [ ] Sección: Scope del sistema
  - Texto sobre MVP
- [ ] Sección: Futuras mejoras
  - Texto sobre expansión
- [ ] Botón: Logout

### RESULTADO SEMANA 7:
- [ ] Dataset management 100% funcional
- [ ] Add logo page funcional
- [ ] Settings page funcional

---

## SEMANA 8: BRAND & QA

### DÍA 1: Brand Book Implementation
- [ ] Actualizar colores (globals.css):
  - Background: #F8FAFC
  - Primary teal: #0F766E
  - Navy: #0F172A
  - Accent blue: #2563EB
- [ ] Importar Geist font
- [ ] Actualizar tipografía
- [ ] Remover neon/gradients
- [ ] Asegurar rounded-2xl en cards

### DÍA 2: Brand Consistency
- [ ] Actualizar nombre: "Logo Similarity Chile"
- [ ] Agregar "Powered by N3uralia" footer
- [ ] Revisar tone of voice (Spanish)
- [ ] Revisar disclaimers legales

### DÍA 3: Testing & Fixes
- [ ] Test login/logout
- [ ] Test upload con archivos grandes
- [ ] Test búsqueda con 0 resultados
- [ ] Test comparación lado a lado
- [ ] Test historial
- [ ] Verificar RLS (no puedes ver datos de otros usuarios)

### DÍA 4: Performance & UX
- [ ] Optimizar queries (índices)
- [ ] Loading states
- [ ] Error messages claros
- [ ] Mobile responsiveness
- [ ] Accessibility (colores, contraste)

### DÍA 5: Deployment
- [ ] Deploy a Vercel
- [ ] Verificar env vars en producción
- [ ] Test en staging
- [ ] Monitor logs
- [ ] Preparar handoff

### RESULTADO SEMANA 8:
- [ ] MVP 100% completo
- [ ] Brand correcto
- [ ] QA pasado
- [ ] Listo para producción

---

## 📊 TABLA SEMANAL

| Semana | Tema | Deliverable |
|--------|------|-------------|
| 1-2 | Supabase + DB | Schema 100%, Storage listo, RLS activo |
| 3 | Auth | Login/signup funcional, protected routes |
| 4 | Search & Upload | Upload + metadata + filters |
| 5 | Similarity | pHash + matching + results |
| 6 | Detail & History | /results + /results/[id] + comparación |
| 7 | Dataset & Settings | /logos + /logos/new + /settings |
| 8 | Brand & QA | Brand book + testing + deployment |

---

## ⚠️ BLOQUEADORES

- [ ] **ACCESO A SUPABASE**: Necesitas crear account esta semana
- [ ] **INAPI DATOS**: Si quieres dataset real de marcas chilenas (OPCIONAL para MVP)
- [ ] **IMÁGENES LOGO**: Necesitas logos iniciales para dataset test

---

## ✅ CHECKLIST FINAL

- [ ] Todas las rutas funcionan
- [ ] Login/logout funcional
- [ ] Upload funcional
- [ ] Búsqueda por similitud funcional
- [ ] Historial guardado
- [ ] Comparación lado a lado
- [ ] RLS activo (no puedes ver datos de otros)
- [ ] Brand correcto
- [ ] Disclaimers legales
- [ ] Mobile responsive
- [ ] Deployment listo

---

## 📞 NEXT STEP

**Necesitas crear Supabase account ESTA SEMANA.**

Una vez tengas las credenciales:
1. .env.local con NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
2. Ejecutar migration SQL
3. Empezar Semana 1

¿Vamos?
