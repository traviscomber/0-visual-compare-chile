# AI R&D Eval Gate — Niza + Viena

This document defines the gate for changing production classifier models. A newer model is not promoted because it is newer; it must beat the current baseline on a fixed representative set.

## Baseline

- Niza: `gpt-4o`
- Viena: `gpt-4o`
- Output contract: strict schema via OpenAI Structured Outputs
- Production model stays unchanged until the candidate passes this gate.

## Candidate configuration

Use environment overrides rather than editing source:

- `OPENAI_CLASSIFIER_MODEL` for both classifiers
- `OPENAI_NIZA_MODEL` for Niza only
- `OPENAI_VIENA_MODEL` for Viena only

This permits preview-only comparisons against newer multimodal models without changing the production default.

## Evaluation set

Maintain at least 30 reviewed cases before a model promotion:

1. 10 simple denominative marks with an obvious primary Niza class.
2. 10 multi-service/product marks where primary vs defensive Niza classes matter.
3. 10 figurative or combined marks covering geometry, stylized letters, animals/objects and multiple colors for Viena.

For each case store only non-sensitive test assets and reviewer-approved expected labels.

## Metrics

### Niza

- Primary-class recall: >= 95%
- Unsupported/invented class rate: 0%
- Defensive-class precision: >= 85%
- Schema-valid response rate: 100%

### Viena

- Reviewer-approved code precision: >= 90%
- Reviewer-approved code recall: >= 90%
- Unsupported/invented code rate: 0%
- Schema-valid response rate: 100%

### Operational

- p95 latency must not regress by more than 25% unless quality gain is material.
- Median estimated request cost must not exceed 2x baseline without a documented quality reason.
- No increase in route 5xx rate.

## Promotion rule

Promote a candidate only if:

1. It meets every hard safety/validity gate above.
2. It improves the combined reviewed quality score by at least 3 percentage points, or materially reduces cost/latency without quality regression.
3. The candidate has been exercised on a Vercel preview using the exact candidate SHA.
4. Rollback is one environment-variable change back to the baseline model.

## Experiment record

For every run capture:

- git SHA
- model identifier
- date/time
- test-set version
- per-case expected vs actual labels
- token usage
- latency
- parse/schema failures
- reviewer notes

Do not publish generic model accuracy percentages unless they come from this project-specific eval set.
