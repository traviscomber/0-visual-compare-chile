# SEMANA 1: Setup Supabase Integration - Step by Step

## Objetivos
- [ ] Supabase account + configuración
- [ ] Database schema creado
- [ ] Auth integrado (signup + login)
- [ ] Dashboard protegida
- [ ] Flujo end-to-end funcional

---

## PASO 1: Crear Supabase Account (15 min)

### 1.1 Signup
1. Ir a https://supabase.com
2. Click "Start your project"
3. Usar GitHub o email
4. Create organization "LogoCompare-Chile"
5. Create project "logo-compare-prod"

### 1.2 Obtener credenciales
Después de crear proyecto:
- Copiar **Project URL**: `https://xxxxx.supabase.co`
- Copiar **Anon Key**: `eyJhbGc...`

---

## PASO 2: Configurar variables de entorno (5 min)

### 2.1 Crear `.env.local`
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Para API routes
```

### 2.2 Obtener SERVICE_ROLE_KEY
En Supabase dashboard:
1. Settings → API
2. Copy "service_role key" (NO COMPARTIR PÚBLICAMENTE)

---

## PASO 3: Instalar dependencias (3 min)

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

---

## PASO 4: Crear Supabase Client (10 min)

### 4.1 Crear `lib/supabase.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### 4.2 Crear `lib/supabase-server.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie errors
          }
        },
      },
    }
  )
}
```

---

## PASO 5: Crear Auth Context (20 min)

### 5.1 Crear `lib/auth-context.tsx`
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [supabase])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 5.2 Actualizar `app/layout.tsx`
```typescript
import { AuthProvider } from '@/lib/auth-context'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## PASO 6: Crear Schema (15 min)

### 6.1 En Supabase SQL Editor, ejecutar:

```sql
-- 1. Uploads table
CREATE TABLE uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_hash text NOT NULL UNIQUE,
  file_url text,
  status text DEFAULT 'processing',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 2. Searches table
CREATE TABLE searches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  query text NOT NULL,
  search_type text,
  results jsonb,
  created_at timestamp DEFAULT now()
);

-- 3. Audit logs table
CREATE TABLE audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  created_at timestamp DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can only see their own uploads"
  ON uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only see their own searches"
  ON searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches"
  ON searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only see their own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);
```

---

## PASO 7: Actualizar Auth Pages (30 min)

### 7.1 Actualizar `app/auth/signup/page.tsx`
```typescript
'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    // ... form JSX
  )
}
```

### 7.2 Actualizar `app/auth/login/page.tsx`
```typescript
'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    // ... form JSX
  )
}
```

---

## PASO 8: Proteger Dashboard (10 min)

### 8.1 Actualizar `app/dashboard/page.tsx`
```typescript
'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) return <div>Cargando...</div>
  if (!user) return null

  return (
    // ... dashboard JSX
  )
}
```

---

## PASO 9: Crear Auth Callback Route (5 min)

### 9.1 Crear `app/auth/callback/route.ts`
```typescript
import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
```

---

## PASO 10: Testing (15 min)

### 10.1 Flujo completo
1. `npm run dev`
2. Ir a http://localhost:3000
3. Click "Comenzar"
4. Llenar signup
5. ✅ Debe crear usuario en Supabase
6. ✅ Debe redirigir a dashboard
7. Click "Salir"
8. ✅ Debe ir a landing

### 10.2 Testing login
1. Ir a http://localhost:3000/auth/login
2. Usar credenciales del signup
3. ✅ Debe loguear y ir a dashboard

### 10.3 Testing protección
1. Eliminar cookies (DevTools)
2. Ir a http://localhost:3000/dashboard
3. ✅ Debe redirigir a login

---

## Checklist Final

- [ ] Supabase account creado
- [ ] Credenciales en `.env.local`
- [ ] `@supabase/supabase-js` instalado
- [ ] `lib/supabase.ts` creado
- [ ] `lib/supabase-server.ts` creado
- [ ] Auth context implementado
- [ ] Layout.tsx actualizado con AuthProvider
- [ ] Schema SQL ejecutado en Supabase
- [ ] Signup page actualizada
- [ ] Login page actualizada
- [ ] Dashboard protegida
- [ ] Auth callback route creado
- [ ] Flujo completo testeado ✅

---

## Troubleshooting

**"Cannot find module @supabase/supabase-js"**
→ `pnpm add @supabase/supabase-js`

**"User is null on dashboard"**
→ Verify auth context is wrapping the app

**"CORS error"**
→ Agrega URL a Supabase Settings → Authentication → Authorized redirect URLs

**"Invalid credentials"**
→ Verifica que el usuario existe en Supabase Auth

---

## Resultado

✅ Semana 1 completada:
- Auth real con Supabase
- Dashboard protegida
- Schema de BD
- RLS policies
- Listo para agregar funcionalidad

**SIGUIENTE:** Semana 2 - Comparador + Búsqueda
