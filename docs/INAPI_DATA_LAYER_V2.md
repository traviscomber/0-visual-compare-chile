# INAPI Data Layer v2

## Objective

Use the synchronized INAPI corpus in Supabase as the primary low-latency search layer and reserve `buscadormarcas.inapi.cl` for selective live verification and non-name lookups.

## Runtime path

1. Name query enters `/api/inapi/search`.
2. `search_inapi_local` searches `trademark_records` with `pg_trgm`, ranks name similarity, Niza overlap and active status, and returns at most 50 candidates.
3. The API reports corpus freshness from `last_synced_at`.
4. Live INAPI verification runs only for stale/unknown data or materially strong candidates (exact/high-similarity + class overlap).
5. If live verification fails, the synchronized local result is still returned with `liveVerificationError` instead of failing the user request.
6. Non-name lookups keep using the existing managed live queue because they are exact operational queries.

## Performance evidence

On the current 66,595-row INAPI corpus, the initial fuzzy RPC took ~537 ms for a representative `COCA COLA` query. Bounding the trigram candidate set before Niza joins reduced the same database call to ~29 ms in `EXPLAIN ANALYZE`.

## Freshness policy

- `fresh`: <= 36 hours
- `aging`: > 36 hours and <= 7 days
- `stale`: > 7 days
- `unknown`: no synchronized timestamp

The current corpus is stale and must be refreshed before relying on local-only results in production. Staleness therefore forces live verification.

## Safety

- The fuzzy RPC is `security definer` with a fixed `search_path` and execute permission only for `service_role`.
- Public/anon clients cannot call the RPC directly.
- Existing INAPI global rate controls, cache, retries and request logging remain in place for live verification.
- Live failure degrades to synchronized evidence instead of turning a search into HTTP 502 when local data is available.

## Operational next step

Refresh the official INAPI dataset into `trademark_records` using the existing sync pipeline, then monitor `search_history.metadata.freshness`, `live_verified`, `live_error` and request duration. Target local database latency is <100 ms p95 before network/API overhead.
