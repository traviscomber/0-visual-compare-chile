# Visual Compare Chile

MVP para comparación visual de marcas con auth Supabase, upload consistente, comparación auditada, historial y rutas protegidas.

## Estado

- Auth Supabase integrada.
- Upload soporta JPG, PNG, WebP y TIFF hasta 50 MB.
- Comparación persiste score, clasificación, recomendación y señales forenses.
- Historial y detalle están protegidos por sesión.
- Build de producción pasa.

## Flujo principal

1. Crear cuenta o iniciar sesión.
2. Subir dos imágenes desde `/compare`.
3. Revisar score, clasificación y diff.
4. Consultar historial en `/history`.
5. Abrir detalle de cada comparación en `/comparisons/[id]`.

## Rutas principales

- `/`
- `/auth/login`
- `/auth/sign-up`
- `/dashboard`
- `/compare`
- `/history`
- `/settings`
- `/demo`

## Requisitos locales

- Node.js 18+
- pnpm
- Variables de Supabase en `.env.local`

## Variables de entorno

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Instalar y correr

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

```bash
pnpm smoke
```

## Deploy

- Validate env first:

```bash
pnpm check:env
```

- Sube el branch a GitHub.
- Configura las variables de entorno en Vercel.
- Ejecuta `pnpm smoke` contra la URL de despliegue.
- Asegura que la URL de producción sea pública y no esté bloqueada por Vercel SSO.
- Verifica login, upload, compare e historial en producción.

## Notas

- `app/demo` es una vista comercial de apoyo, no el flujo core.
- `app/auth/signup` redirige a `/auth/sign-up`.
- Los documentos de Fase 0 se conservan solo como referencia histórica.
