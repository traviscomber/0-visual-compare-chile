# NUEVO PROYECTO - LogoCompare MVPaligned

## Estado: LISTO PARA SUPABASE INTEGRATION (Semana 1)

### ✅ COMPLETADO

**Landing Page** (`/app/page.tsx`)
- Hero section profesional
- 6 feature cards
- "Cómo funciona" (3 pasos)
- Pricing section
- CTA buttons
- Footer con links
- Brand correcto: Teal (#0F766E) + Navy (#0F172A)

**Auth Pages**
- Signup (`/app/auth/signup/page.tsx`) - Formulario completo
- Login (`/app/auth/login/page.tsx`) - Formulario limpio

**Dashboard** (`/app/dashboard/page.tsx`)
- Header con logout
- Welcome section
- Quick stats (3 cards)
- Features grid (4 opciones)
- CTA para upgrade
- Logout functionality

**Brand & Design**
- Colores correctos en globals.css
- Tipografía: Geist (Next.js)
- Layout responsive
- Componentes shadcn/ui

---

### 🔴 BLOCKER: Conflicto de Rutas

**Problema:**
- `/app/(app)/dashboard/page.tsx` (vieja Fase 0)
- `/app/dashboard/page.tsx` (nueva limpia)
→ Causa: "Cannot have two parallel pages resolving to same path"

**Solución Inmediata:**
```bash
# Eliminar esta carpeta entera
rm -rf /app/(app)/
rm -rf /app/comparador/
rm -rf /app/consulta/
rm -rf /app/demo/
rm -rf /app/casos/
rm -rf /app/seguridad/
rm -rf /app/roadmap/
```

---

### 📋 PRÓXIMO: SEMANA 1 - Supabase Integration

**1. Conectar Supabase**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

**2. Crear Schema Básico**
```sql
-- auth.users (Supabase manages this)

-- app.uploads
CREATE TABLE uploads (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  file_url text,
  file_hash text UNIQUE,
  created_at timestamp,
  metadata jsonb
);

-- app.searches  
CREATE TABLE searches (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  query text,
  results jsonb,
  created_at timestamp
);

-- app.audit_logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  action text,
  details jsonb,
  created_at timestamp
);
```

**3. RLS Policies**
```sql
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own uploads"
  ON uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own uploads"
  ON uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**4. Update Auth Pages**
```typescript
// app/auth/signup/page.tsx
async function handleSignup(email, password) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${location.origin}/auth/callback`,
    },
  })
}

// app/auth/login/page.tsx
async function handleLogin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
}
```

**5. Create Auth Context with Supabase**
```typescript
// lib/auth-context.tsx
'use client'
import { createContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

### 📁 Estructura Correcta (Final)

```
/app
  /auth
    /login
      page.tsx ✅
    /signup
      page.tsx ✅
    /callback
      page.tsx (nuevo - OAuth redirect)
  /dashboard
    page.tsx ✅
    /comparador
      page.tsx (nuevo)
    /buscar
      page.tsx (nuevo)
    /reportes
      page.tsx (nuevo)
    /settings
      page.tsx (nuevo)
  page.tsx ✅ (landing)
  layout.tsx ✅
```

---

### 📊 Checklist Semana 1

- [ ] Eliminar `/app/(app)/` y rutas viejas
- [ ] Crear Supabase account + obtener credentials
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.local`
- [ ] Implementar Supabase client (`lib/supabase.ts`)
- [ ] Crear schema en Supabase dashboard
- [ ] Actualizar signup con Supabase auth
- [ ] Actualizar login con Supabase auth
- [ ] Crear auth context con Supabase
- [ ] Actualizar dashboard para protegida
- [ ] Testing del flujo completo: landing → signup → dashboard

---

### 🚀 Estado Final

**Cuando esto esté listo:**
- ✅ Landing page funcional
- ✅ Auth real (Supabase)
- ✅ Dashboard protegida
- ✅ Datos en BD real
- ✅ Listo para agregar comparador + búsqueda

**Timeline Realista:**
- Semana 1: Setup Supabase (3-4 horas)
- Semana 2-3: Módulos funcionales (comparador, búsqueda)
- Semana 4-5: IA + pHash
- Semana 6: Reportes + audit logs
- Semana 7: Polish + Deploy

---

### 📌 Archivos Críticos Nuevos

1. `/app/page.tsx` - Landing limpia
2. `/app/auth/login/page.tsx` - Login nuevo
3. `/app/auth/signup/page.tsx` - Signup nuevo
4. `/app/dashboard/page.tsx` - Dashboard nuevo
5. `app/globals.css` - Colores correctos (Teal + Navy)

Todos listos para Supabase integration.

**NEXT STEP:** Crear Supabase account y conectar auth.
