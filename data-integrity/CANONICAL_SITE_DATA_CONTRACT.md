# Fellas Hall of Fame — Canonical Data Contract
Last audit: October 27, 2026 · Latest scores: 2026 Week 7

## Source-of-truth hierarchy

1. **Original game event ledger:** `data/unified_record_book_2016_2026.json` — archived regular-season and postseason matchup results from ESPN and Sleeper. 2016–2019 ESPN matchups and original championship outcomes remain separately traceable to `data/espn_history_2016_2019.json`.
2. **Canonical manager career materialization:** `data/manager_record_books_2016_2026.json` — all-time regular-season win/loss/tie records, individual weekly records, annual records and pairwise head-to-head results. Manager alias `Tom` is displayed for Zach Prescott/Thommy in some old pages, never Tom Schermerhorn.
3. **Canonical annual/week view:** `data/season_weekly_matchups_2016_2026_v1.json` — the same archived games regrouped for annual standings and clickable weekly logs.
4. **Derived specialist data:** luck, schedule scenarios, WAR and trade analysis retain their own provenance and coverage. Never silently label Sleeper-only derived player metrics as full 2016–2026.

## Site pages converted to canonical career data
- Both `managers/{slug}/index.html` and `managers/{slug}.html` for all 10 current managers now use `assets/canonical-manager-record.js` to load career headline results from source (2) at runtime.
- `assets/manager-weekly-game-log.js` uses source (3) for all ten profiles, both URL formats.
- `analytics/records.html`: primary Career Records tab reads (2), and regular-season scoring boards derive from (3); a source-aligned fallback is embedded in the HTML.
- `analytics/records-archive.html`: archived Career Records tab now loads (2), with corrected source-aligned fallback.
- `managers/record-books.html`: already read (2).
- `data/league.json`: stored headline records aligned with (2) for compatibility.
- `analytics/rivalries.html`: underlying rivalry archive contains ESPN 2016–2019 and Sleeper 2020–2026 Week 7, and the visible coverage label is aligned.
- `seasons/weekly-matchup-archive.html`: source (3).
- `seasons/all-time-schedule-swap.html`: reconstructed cross-era schedule matrix; the old `analytics/schedule-matrix.html` and `analytics/what-if.html` intentionally remain labeled *legacy analyses*, with links to this full archive.

## Continuous QA
`.github/workflows/verify-canonical-history.yml` executes `scripts/verify-canonical-history.mjs` on pushes and pull requests. The script fails on stale current-manager headline records, missing per-profile weekly logs, mismatched shared league totals, annual records that fail to reconcile, or embedded career-board fallbacks that drift from canonical totals. It also reconciles annual game counts and total game count to the original unified ledger.

## Outstanding migration and coverage risks
- **Not all historical analytics are ready for cross-era classification.** Specialized WAR, franchise legends, trade ROI, draft productivity, advanced metrics, season stories and other editorial pages can contain Sleeper-only sources. These MUST retain their source-window labels until their methodology and underlying player data are rebuilt.
- Several older routes embed pre-2026-Week-7 specialized scoring summaries. They are not silently certified all-time; old schedule what-if routes now explicitly link the unified alternative.
- Adding a new weekly matchup requires updating the derived manager record book and annual matchup materialization together. QA detects discrepancies; it does **not** yet automatically recompute the full complex manager record book.
- Embedded HTML fallback records need updating when new weeks are published. QA catches a mismatch; the runtime component displays canonical data when loaded.
- User-facing Github Pages deployments and GitHub Actions statuses must be checked separately from successful GitHub commits.

## Operational rule
**Never edit displayed manager records in a page as the primary fix.** Correct the underlying archived matchup ledger, regenerate derived records and annual matchups, run canonical validation, and publish. Keep the original historical owner mappings and exclude confirmed playoff byes from regular-season game counts.
