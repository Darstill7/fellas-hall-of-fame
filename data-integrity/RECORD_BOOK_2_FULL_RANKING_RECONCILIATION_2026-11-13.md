# Record Book 2.0 — Full historical manager-index reconstruction

**2026-11-13 · research branch only · no public data changes**

## Result

All **21 truncated published expanded categories** have been regenerated as complete ranked event/season/rivalry datasets. Inputs are the 705 canonical regular-season pairings / 1,410 two-sided results through 2026 Week 9 and the verified 2016–2025 final placement history.

`node scripts/reconstruct-expanded-record-rankings.mjs > /tmp/record-book-2-full-expanded.json`

The standalone CI checks:
- 21 category IDs and 21 complete reconstructed manager ranking indexes;
- zero row-count discrepancies against the existing `entries` manifest;
- zero #1 leader/value discrepancies;
- **zero archived top-20 manager/value/event/competition-rank discrepancies**, verified after resolving the 2016 season-tie policy;
- 705 distinct games, 1,410 team appearances, no duplicates inferred.

The universal research registry now reports **93 unique ID-level entries**, of which **74 have complete numerical manager indexes** (44 existing expanded + 23 Phase 2 + seven existing postseason families). **19 Legendary items** are qualitative narrative exhibits and correctly remain exempt from an artificial numerical 14-manager ranking. Phase 2 proposals remain provisional despite completeness; they are not newly certified public records.

## Critical historical scoring-rule discovery

The 2016 ESPN season featured tied games. The *published* expanded record `season-win-rate` uses **wins / games played**, not **(wins + 0.5 × ties) / games played**. A reconstruction using half-win credits inserted 2016 Halderman's 8–4–1 season at 65.38%, shifting five existing top-20 rank positions. Following the published definition, his win rate is 8/13 = 61.54%; the five displaced ranks now match the archived category exactly.

These are **two different legitimate analytical definitions** and must not be silently mixed. Retain published wins/games for `season-win-rate`; if a future adjusted standings percentage is introduced, give it its own ID and explicit tie rules. Career win-rate / all-play expected-wins definitions may use half-win tie accounting as already documented; do not generalize the published season definition into them.

## Data-flow preservation

- `scripts/reconstruct-expanded-record-rankings.mjs`: rebuilds all 21 previously truncated categories and verifies archived top 20.
- `scripts/build-record-book-phase2.mjs`: exports a full manager-best index for 23 research-only proposal categories.
- `scripts/build-record-book-2-registry.mjs`: consumes both source generators; creates one record registry and all 14 historical manager portfolios, retaining source/status, tie and negative-record distinctions.
- `.github/workflows/research-reconstruct-expanded.yml`: independently tests 21 reconstructed ranks and archived leader parity.
- `.github/workflows/research-record-book-2-registry.yml`: tests 74 complete statistical ranking indexes, 19 qualitative unranked exhibits, cross-links and publication status.

**Do not publish without** independent provider sample checks for early ESPN extrema, source-manifest compatibility across Week N updates, approval of exact category semantics, and full canonical/Chromium/WebKit/Pages checks on the exact intended release SHA.

## Follow-on production design

The proposed Record Book and manager portfolio UI should consume **a versioned, generated, approved registry** rather than manually copy JSON between pages. Every record links to its underlying source game, season or rivalry; all co-holders share first place; performance, luck, Hall of Shame and Legendary storytelling appear in separate visible groups. The manager selector must accept all 14 historical owners and correct aliasing (Tom = Thommy; Schermerhorn distinct; Evans owns 2023; JMid begins 2024).

The current branch implements data/research generation and validation, **not the public site interface**.
