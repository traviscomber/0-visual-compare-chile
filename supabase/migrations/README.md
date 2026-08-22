# Migration history safety

The active production Supabase project is `btyylseeswnvsuaojvjx` (`visualcompare`).

This directory is **not yet a complete canonical replay of production history**. Before using the migration tree for a fresh environment, `supabase db reset`, history repair, or automated push, reconcile it against `supabase_migrations.schema_migrations` in the active project.

## Confirmed production history gaps

Production records applied migrations that are not currently represented by matching files in this directory, including:

- `20260711045527_003_seed_test_user`
- `20260711045807_002_storage_bucket`
- `20260711045817_003_seed_test_user`
- `20260712161749_full_schema_v1`
- `20260722235549_add_inapi_global_rate_control`
- `20260723021128_extend_search_history_for_inapi_traceability`
- `20260723025343_harden_admin_role_and_public_users`
- `20260723025721_harden_comparison_and_audit_insert_scope`
- `20260723031137_harden_api_key_quota_and_rotation`

`20260821151545_fix_trademark_label_read_policy.sql` was restored from the production migration record because it is small, current, and its exact applied statement could be verified safely.

## Repository-only history

Several timestamped files in this directory do not have a matching version/name entry in the current production migration history. They may represent superseded, manually applied, or never-applied work. Do not delete or replay them solely from filename comparison.

## Rule for reconciliation

Treat production migration records as evidence of what was applied, not automatically as a desired fresh-install baseline. Historical migrations containing seed/demo data or superseded security policies must be reviewed before they are restored to Git or replayed anywhere.

No migration-history repair should modify production schema or rows unless the intended DDL/data change has been reviewed separately.
