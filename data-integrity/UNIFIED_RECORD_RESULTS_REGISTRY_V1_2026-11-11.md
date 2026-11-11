# Unified Record Results Registry v1 — architectural bridge

**November 11, 2026 | Research implementation; no live site data source changed**

The taxonomy crosswalk controls *identity*. This new generator controls the actual **record results**: known holders, ranked leaderboards, evidence, source status and the current managers' source-recovered record portfolios.

```bash
node scripts/build-unified-record-results-registry.mjs > /tmp/unified-record-results.json
node scripts/verify-unified-record-results-registry.mjs
```

The self-contained GitHub Actions gate creates `unified_record_results_registry_2016_2026w9_v1.json` as a **reviewable Actions artifact**, available from the workflow execution. It is intentionally not automatically committed or served by Pages. The review artifact is generated reproducibly from source-controlled files, so the merged source files are the auditable authority.

## Current sources and status
- **44 existing expanded categories:** Retain original IDs, definitions, recovered ranks, exact source evidence and publication status from `data/expanded_records_verified_v1.json`.
- **19 curated Legendary categories:** Retain original story, holder identities, stated metric and rule from `data/legendary_records_2016_2025_v1.json`; do not convert human narrative metrics into invented numbers.
- **23 Phase 2 proposal definitions:** Recompute against the canonical matchup ledger via `scripts/build-record-book-phase2.mjs`. Apply the consolidated taxonomy aliases. **Keep every one provisional** and never silently overwrite existing record holders.
- **Manager index:** Produce the same ten managers' existing-record items from underlying league leaderboards and original manager signature highlights. A separate `candidateManagerIndex` contains proposed leaderboard appearances. The former is *source recovered, not guaranteed complete*: original source top-20 limits and signature highlights mean a manager may have additional personal marks outside the recovered ranks.

## Data-contract promises
1. Every result has a category ID, source, publication/verification marker, and at least one original holder. Existing expanded categories retain source leaderboards, and candidate categories have recomputed score receipts.
2. Existing `Tom` site keys map to **Thommy**, but historic Schermerhorn is never combined. 2023 Evans records remain Evans's, and current JMid records start when JMid joined.
3. New research results remain `candidate-not-published`, even where a new formula is an alias of a previously curated Legendary claim.
4. The current regular-season cutoff is **2026 Week 9**, while completed-season and postseason records end in 2025.
5. A manager record portfolio must use the same category IDs as the global Record Book. A truncated top-ten leaderboard cannot be treated as an exhaustive manager portfolio.
6. No generated result is called fully provider-independent certified without original league source and eligibility checks.
7. Production rollout of the generated JSON requires separate final approval, source completeness certification, browser-gate validation, and replacement of incomplete personal ranks.

## Further development
- Merge (after checks) source-valid collapse, comeback and playoff upset engines into `main`, and expand this results generator with their actual **numeric results**, not taxonomy-only placeholders.
- Add a complete manager best-mark reducer for every approved category rather than relying on truncated source leaderboards.
- Deduplicate overlapping definitions and show one record globally, with crosslinks to related editorial categories.
- Publish a versioned JSON in `data/` only after exact-head checks and commissioner/source certification. Render it across the league Record Book and manager record portfolios without duplicate data entry.

This is a functioning shared result-calculation pipeline with a review artifact, **not** a claim the full historical website has already switched to it.
