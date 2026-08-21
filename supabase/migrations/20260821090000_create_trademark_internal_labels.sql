create table if not exists public.trademark_internal_labels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  category text not null check (category in ('case_status','risk','relevance','action','monitoring')),
  description text not null default '',
  color text not null default 'secondary',
  is_system boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.trademark_comparison_labels (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  label_id uuid not null references public.trademark_internal_labels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  confidence numeric(5,2),
  source text not null default 'manual' check (source in ('manual','rule','reclassification')),
  created_at timestamptz not null default now(),
  unique (comparison_id, label_id)
);

create table if not exists public.trademark_label_audit_log (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  label_id uuid not null references public.trademark_internal_labels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('assigned','removed','reclassified')),
  previous_label_id uuid references public.trademark_internal_labels(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_trademark_labels_org on public.trademark_internal_labels(organization_id, category);
create index if not exists idx_trademark_comparison_labels_comparison on public.trademark_comparison_labels(comparison_id);
create index if not exists idx_trademark_label_audit_comparison on public.trademark_label_audit_log(comparison_id, created_at desc);

alter table public.trademark_internal_labels enable row level security;
alter table public.trademark_comparison_labels enable row level security;
alter table public.trademark_label_audit_log enable row level security;

-- Access is scoped to the authenticated user's organization or personal records.
drop policy if exists trademark_labels_select on public.trademark_internal_labels;
create policy trademark_labels_select on public.trademark_internal_labels for select to authenticated
using (organization_id is null or organization_id in (select organization_id from public.organization_members where user_id = auth.uid()));

drop policy if exists trademark_labels_insert on public.trademark_internal_labels;
create policy trademark_labels_insert on public.trademark_internal_labels for insert to authenticated
with check (created_by = auth.uid() and (organization_id is null or organization_id in (select organization_id from public.organization_members where user_id = auth.uid())));

drop policy if exists trademark_comparison_labels_select on public.trademark_comparison_labels;
create policy trademark_comparison_labels_select on public.trademark_comparison_labels for select to authenticated
using (user_id = auth.uid());

drop policy if exists trademark_comparison_labels_insert on public.trademark_comparison_labels;
create policy trademark_comparison_labels_insert on public.trademark_comparison_labels for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists trademark_comparison_labels_delete on public.trademark_comparison_labels;
create policy trademark_comparison_labels_delete on public.trademark_comparison_labels for delete to authenticated
using (user_id = auth.uid());

drop policy if exists trademark_audit_select on public.trademark_label_audit_log;
create policy trademark_audit_select on public.trademark_label_audit_log for select to authenticated
using (user_id = auth.uid());

drop policy if exists trademark_audit_insert on public.trademark_label_audit_log;
create policy trademark_audit_insert on public.trademark_label_audit_log for insert to authenticated
with check (user_id = auth.uid());

insert into public.trademark_internal_labels (organization_id, name, slug, category, description, color, is_system)
values
(null, 'Nuevo', 'nuevo', 'case_status', 'Caso recientemente creado y pendiente de revisión.', 'secondary', true),
(null, 'En revisión', 'en-revision', 'case_status', 'Caso actualmente siendo revisado por el equipo.', 'secondary', true),
(null, 'Informe enviado', 'informe-enviado', 'case_status', 'El informe fue enviado al cliente.', 'secondary', true),
(null, 'Riesgo bajo', 'riesgo-bajo', 'risk', 'No se observan conflictos relevantes.', 'secondary', true),
(null, 'Riesgo medio', 'riesgo-medio', 'risk', 'Existen elementos que requieren revisión.', 'outline', true),
(null, 'Riesgo alto', 'riesgo-alto', 'risk', 'Existe una coincidencia relevante que requiere opinión legal.', 'destructive', true),
(null, 'Antecedente relevante', 'antecedente-relevante', 'relevance', 'Antecedente que puede afectar la estrategia del caso.', 'outline', true),
(null, 'Misma clase', 'misma-clase', 'relevance', 'Coincidencia en la clasificación Niza.', 'outline', true),
(null, 'Clase relacionada', 'clase-relacionada', 'relevance', 'Productos o servicios relacionados aunque no sean idénticos.', 'outline', true),
(null, 'Requiere opinión legal', 'requiere-opinion-legal', 'action', 'Debe ser revisado por un abogado.', 'destructive', true),
(null, 'Monitorear', 'monitorear', 'monitoring', 'Debe revisarse periódicamente por cambios.', 'secondary', true),
(null, 'Cerrada', 'cerrada', 'case_status', 'Caso finalizado sin acciones pendientes.', 'secondary', true)
on conflict (organization_id, slug) do nothing;
