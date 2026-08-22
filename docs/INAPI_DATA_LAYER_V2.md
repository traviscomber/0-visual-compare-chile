# INAPI Data Layer v2

## Objective

Use the synchronized INAPI corpus in Supabase as the primary low-latency search layer and reserve `buscadormarcas.inapi.cl` for selective live verification and non-name lookups.

## Runtime path

1. Name query enters `/api/inapi/search`.
2. `search_inapi_local` searches `trademark_records` with accent-insensitive `pg_trgm`, ranks name similarity, Niza overlap and active status, and returns at most 50 candidates.
3. The API reports corpus freshness from `last_synced_at`.
4. Live INAPI verification runs only for stale/unknown data or materially strong candidates (exact/high-similarity + class overlap).
5. If live verification fails, the synchronized local result is still returned with `liveVerificationError` instead of failing the user request.
6. Non-name lookups keep using the existing managed live queue because they are exact operational queries.

## Official refresh completed

On 2026-08-22 the 2026 official INAPI open-data resources were pulled from `datos.gob.cl` CKAN DataStore directly from Supabase:

- `Applications-2026.xlsx`: 34,970 rows fetched.
- `Registers-2026.xlsx`: 14,200 rows fetched.
- 48,220 canonical `sol:<ApplicationNumber>` records were created/enriched.
- 36,328 Niza relationships were loaded from the official data.
- The 2026 resources currently expose no non-empty `VienaClasses`; no Vienna codes were fabricated.
- 1,481 legacy duplicate application rows were merged into their canonical application record after transferring Niza/Vienna relationships and metadata.
- Duplicate non-null `numero_solicitud` count after reconciliation: 0.
- INAPI corpus now contains 113,334 records, including 48,220 canonical open-data records.

The official `Solicitudes de Marcas` dataset declares daily frequency and its package metadata was updated on 2026-08-21. The 2026 applications resource observed during the refresh was modified on 2026-08-20.

## Performance evidence

On the original 66,595-row corpus, the first fuzzy RPC took ~537 ms for a representative `COCA COLA` query. Bounding the trigram candidate set before Niza joins reduced the same database call to ~29 ms in `EXPLAIN ANALYZE`.

Search is now accent-insensitive. A production-data check for `DEFIENDETE` returns `DefiéndeTE` as `exact_name=true` with `name_similarity=1` and Niza class 45.

## Freshness policy

- `fresh`: <= 36 hours
- `aging`: > 36 hours and <= 7 days
- `stale`: > 7 days
- `unknown`: no synchronized timestamp

The refreshed 2026 corpus is now fresh. Individual hits sourced only from older legacy data can still report an older timestamp, which intentionally keeps selective live verification conservative.

## Synchronization

Use:

```bash
pnpm sync:inapi:open-data
```

The synchronizer discovers CKAN resources dynamically, defaults to the current UTC year, paginates DataStore JSON, upserts by application/registration identity, stores Niza/Vienna relations when supplied, and records runs in `inapi_sync_runs`.

Useful controls:

- `INAPI_OPEN_DATA_MIN_YEAR` — default current UTC year.
- `INAPI_OPEN_DATA_PAGE_SIZE` — default 1000.
- `INAPI_OPEN_DATA_MAX_ROWS` — optional safety cap for canary runs.
- `INAPI_OPEN_DATA_CKAN_BASE` — defaults to `https://datos.gob.cl/api/3/action`.

## Safety

- The fuzzy RPC is `security definer` with a fixed `search_path` and execute permission only for `service_role`.
- Public/anon clients cannot call the RPC directly.
- Existing INAPI global rate controls, cache, retries and request logging remain in place for live verification.
- Live failure degrades to synchronized evidence instead of turning a search into HTTP 502 when local data is available.
- `pg_net` is enabled for controlled database-side refresh operations; normal application traffic does not depend on it.

## Operational targets

- Keep official open-data freshness under 36 hours.
- Target local database latency <100 ms p95 before network/API overhead.
- Track `search_history.metadata.freshness`, `live_verified`, `live_error` and request duration.
- Alert if no successful `inapi-open-data` sync is recorded within 36 hours.
