# Vercel And Supabase Canonical Fix

## Objetivo

Cerrar los ultimos `FAIL` de `pnpm release:gate`:

- `active site origin`
- `active callback url`
- `canonical root`
- `canonical health`

## Estado probado hoy

Fecha: `2026-07-12`

Commit activo publicado:

- `2cd759ddd0ec7216319d36c7d536e2a4b1f6d636`

Health del deployment activo:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "revision": "2cd759ddd0ec7216319d36c7d536e2a4b1f6d636",
  "host": "v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app",
  "config": {
    "supabase_project_ref": "btyylseeswnvsuaojvjx",
    "site_origin": "https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app",
    "callback_urls": [
      "https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app/auth/callback",
      "https://v0-visual-compare-chile-6ihgnjdbn-travis-projects-c14a785a.vercel.app/auth/callback"
    ]
  }
}
```

Dominio canonico actual:

- `https://v0-visual-compare-chile.vercel.app`
- responde `404`

## Diagnostico

El deploy ya es correcto.

Lo que falta no es codigo:

1. El dominio canonico no esta asignado o no apunta a un deployment valido.
2. `NEXT_PUBLIC_SITE_URL` en el runtime publico no esta resolviendo al dominio canonico.
3. Supabase Auth todavia esta alineado a URLs preview, no a la URL canonica final.

## Checklist de correccion

### 1. Vercel domain

En el proyecto correcto de Vercel:

- abrir `Settings -> Domains`
- confirmar que existe `v0-visual-compare-chile.vercel.app`
- si no existe, agregarlo
- si existe pero apunta mal, reasignarlo al proyecto actual
- confirmar que el dominio canonico quede marcado como dominio principal de produccion

Resultado esperado:

- `https://v0-visual-compare-chile.vercel.app/` responde `200`
- `https://v0-visual-compare-chile.vercel.app/api/v1/health` responde `200`

### 2. Vercel environment variables

En `Settings -> Environment Variables`, confirmar:

- `NEXT_PUBLIC_SUPABASE_URL=https://btyylseeswnvsuaojvjx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<valor real>`
- `SUPABASE_SERVICE_ROLE_KEY=<valor real>`
- `NEXT_PUBLIC_SITE_URL=https://v0-visual-compare-chile.vercel.app`

Si `NEXT_PUBLIC_SITE_URL` cambia:

- hacer redeploy de produccion

Resultado esperado en `/api/v1/health`:

- `config.site_origin === "https://v0-visual-compare-chile.vercel.app"`

### 3. Supabase Auth redirect URLs

En el proyecto Supabase `btyylseeswnvsuaojvjx`:

- abrir `Authentication -> URL Configuration`
- agregar como minimo:
  - `https://v0-visual-compare-chile.vercel.app/auth/callback`
  - `https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app/auth/callback`

Si se usan previews efimeras de Vercel:

- agregar tambien las previews necesarias para pruebas

Resultado esperado en `/api/v1/health`:

- `config.callback_urls` incluye la URL canonica esperada

### 4. Redeploy final

Despues de corregir dominio y env:

- disparar redeploy del proyecto en Vercel
- esperar que produccion quede `Ready`

## Verificacion final

```bash
ACTIVE_DEPLOYMENT_URL=https://v0-visual-compare-chile-git-main-travis-projects-c14a785a.vercel.app
CANONICAL_DEPLOYMENT_URL=https://v0-visual-compare-chile.vercel.app
EXPECTED_REVISION=2cd759ddd0ec7216319d36c7d536e2a4b1f6d636
EXPECTED_SUPABASE_PROJECT_REF=btyylseeswnvsuaojvjx
EXPECTED_SITE_ORIGIN=https://v0-visual-compare-chile.vercel.app
EXPECTED_CALLBACK_URL=https://v0-visual-compare-chile.vercel.app/auth/callback
pnpm release:gate
```

## Criterio de cierre

La configuracion queda cerrada solo si:

1. `active revision` pasa
2. `active supabase project` pasa
3. `active site origin` pasa
4. `active callback url` pasa
5. `canonical root` pasa
6. `canonical health` pasa
