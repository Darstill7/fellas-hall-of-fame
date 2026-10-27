# Fellas OS v5 — Dependency audit, Phase 1 completion
Date: 2026-10-27
Status: Repository-wide path inventory + targeted runtime dependency inspection; remaining opaque dependencies identified.
Reference: V5_CLEANUP_AUDIT_PASS1.md

## Method / coverage disclaimer
Compared commit 6814603aa44bfb9ebb30b0cd9e36c0f6f12d7a60 to main (724 commits, 252 changed file paths), then opened authoritative documentation, identity registry, CI script, core runtime scripts and 14 representative routes. GitHub's comparison is **not a full recursive tree snapshot** and omits unchanged baseline files. Some runtime dependencies are constructed dynamically, embedded as JSON, or loaded by other JS. Treat counts as lower bounds, NOT a guarantee of exhaustive edge tracing. A complete static analyzer and full-tree enumeration are still needed before deletions. This document finishes the **actionable dependency audit and risk triage**, not a proof of every reachable file.

## Inventory categories from the 252 changed paths
- Core HTML: main index, alternate home, hall, managers, seasons, weeks, analytics.
- Profile duplicates: 10 /managers/{slug}/index.html pages plus 10 /managers/{slug}.html pages.
- Rivalry duplicates: pairs under /rivalries/{pair}.html and /rivalries/{pair}/index.html (high-volume route duplication).
- Shared JS/CSS: assets with individual analytics/profile renderers, plus inline styles in many HTML pages.
- JSON: raw acquisitions (2020–26), starter points (2020–26), ESPN reconstruction, unified games, identity, record projections, WAR, trades, awards, season summaries, luck, schedules.
- Documentation: README_V9_* and data-integrity research.
- CI: one canonical records validation workflow/script observed.

## Actual inspected dependency edges
| Consumer | Immediate dependencies | Decision |
|---|---|---|
| managers/stilly/index.html | franchise-legends, legacy-resume, manager-season-history, manager-rivalry-resume, manager-h2h-explorer, manager-rivalry-analytics, manager-weekly-game-log, canonical-manager-record | KEEP canonical URL; unify component/template; transitive dependencies not yet proven |
| managers/stilly.html | manager-dossier CSS, manager-historical-records, manager-verified-season-endings, manager-trophy-cases, espn-franchise-lineage, manager-weekly-game-log, canonical-manager-record | ARCHIVE/REDIRECT only after content and unique sections migrated |
| assets/canonical-manager-record.js | data/manager_record_books_2016_2026.json | KEEP short term; generate markup from canonical data |
| assets/manager-weekly-game-log.js | data/season_weekly_matchups_2016_2026_v1.json | KEEP; remove hard-coded Week 7 |
| analytics/records.html | manager_record_books, season_weekly_matchups and embedded records JSON | KEEP; eliminate manually maintained fallbacks |
| analytics/rivalries.html | assets/rivalry-archive-v3.js | KEEP pending transitive audit |
| analytics/schedule-matrix.html | schedule-matrix.js, schedule-superlatives.js, all-time-luck.js | LEGACY; ensure distinct coverage labels |
| analytics/what-if.html | alternate-history-what-if.js | LEGACY; compare with new lab before redirect |
| seasons/all-time-schedule-swap.html | data/all_time_schedule_matrix_v2.json | KEEP: full-era schedule consumer; v1 vs v2 audit required |
| seasons/weekly-matchup-archive.html | data/season_weekly_matchups_2016_2026_v1.json | KEEP: season archive |
| analytics/fellas-war.html | six named WAR JSON files plus dynamically chosen war_2025_w{week}_roster_replacement.json | KEEP with explicit 2025/2020+ scope, never silently call all-time |
| analytics/awards-show.html | data/fellas_awards_by_season.json | KEEP; audit historical award sourcing |
| analytics/franchise-encyclopedia.html | data/manager_franchise_enrichment_v1.json | KEEP; audit provenance |
| analytics/trades.html | references data/v9_trade_engine.json | BLOCKER: referenced path absent from 252 changed-file comparison; confirm whether it exists in unchanged baseline or is a missing artifact before claiming functionality |
| hall/index.html and home/index.html | no external assets found by simple data/assets string matching | AUDIT INLINE data/narratives; do not assume self-contained means canonical |
| scripts/verify-canonical-history.mjs | manager book, weekly archive, league snapshot, HTML current manager URLs, records embedded JSON, unified game ledger | KEEP but replace markup string-matching with output/schema validation |

## Dataset ownership and disposition
### Preserve as source/evidence
- data/espn_history_2016_2019.json, ESPN reconstructed rosters/drafts, ESPN provenance/ID reconciliation artifacts
- data/manager_identity_map_v1.json; explicit historical owner mapping must remain versioned
- data/unified_record_book_2016_2026.json: **authoritative matchup event ledger** with raw provider evidence preserved; separate player-, draft- and transaction-level inputs are needed for specialist analyses
- data/acquisitions_2020..2026.json, data/player_starts_2020..2026.json: source-like specialist inputs pending provenance check
### Generate, not independently edit
- data/manager_record_books_2016_2026.json, data/season_weekly_matchups_2016_2026_v1.json, and copied historical W-L/H2H in data/league.json
- data/all_rivalry_matchups_v3.json and historical rivalry analytics (ensure 695 verified regular games / mirrored series where applicable)
- scoring superlatives/record books, schedule matrices v1/v2, luck, season standings and search index (each conditional on validated source coverage)
### Retain specialist/editorial with caveats
- WAR and franchise player metrics are not derivable from only matchup totals.
- Trade lineage, waiver award candidates, narrative biographies, season stories, and official championship/finalist evidence require independent transaction/player/playoff evidence, human corrections and provenance.
- Manager `pf` values in league.json remain labeled older Sleeper coverage and must not be passed off as ESPN+Sleeper totals.
### Candidates for archive/redirect after verification
- manager .html duplicate routes; rivalry pair .html duplicates; analytics/records-archive.html; older schedule-matrix/what-if routes; home/index.html if navigation is unified.
### Delete candidates
NONE currently authorized. Only delete after complete tree, transitive reference, inbound link, distinctive content, redirect and smoke-test checks.

## Critical contradictions and defects discovered
1. The historical dependency document still describes all_time_schedule_matrix_v1 as pending, while the site exposes v2 as a full-era lab. Documentation needs an effective-version registry.
2. Historical guide material inspected contains `Roster 8 (prior owner)` and `Roster 2 (prior owner)` in standings while identity mapping says Stover's old Roster 8 must not be treated as another owner. Rebuild and verify season_guide.json from owner registry before using it for public all-time statements.
3. Historical season guide material still says 2016–19 detailed matchups unavailable, whereas recovered ESPN weekly archive now holds 242 regular-season games. Clearly stale narration/data; **highest-priority repair**.
4. Rivalry engine is reconstructed from 695 archived regular games but other analytic derivatives have not all been rebuilt; ensure pairs/claims derive from ledger.
5. `Tom` canonical legacy site key means Zach Prescott (Thommy); historical Tom Schermerhorn is distinct. All transformations must use manager IDs, not display-name string replacement.
6. Profile URL variants load different script sets and content; do not blanket-redirect until complete profile details are migrated.
7. `analytics/trades.html` references `data/v9_trade_engine.json` not present in comparison output; uncertain existence, test for broken fetch/link.
8. CI validates embedded page fallbacks by brittle markup patterns and will repeatedly email failure on every main push; do not disable protections without fixing the pipeline.
9. Hard-coded 2026 Week 7 occurs in runtime scripts, so weekly import alone cannot produce an accurate refresh.
10. Root package.json not found in prior inspection; need an intentionally chosen deterministic build orchestrator.

## Dependency priority graph
RAW ESPN + SLEEPER MATCHUPS + MANAGER ID REGISTRY
  -> canonical game ledger
     -> annual/week archive
     -> manager W-L and H2H
     -> rivalry archives / matchup leaderboards
     -> standings / record boards / schedule swap / luck
     -> compatibility league.json and generated site pages
Independent provider transaction/draft/player scoring evidence
  -> trade ROI / WAR / franchise player legends / awards (WITH COVERAGE TAGS)
Human-verified title/runner-up/season placements
  -> trophy case / bios / league history (KEEP PROVENANCE)

## Next gate to implement
1. Perform a true recursive checkout/tree inventory and build a machine-readable dependency graph, including JS imports/fetches and generated file references.
2. Fix the **season_guide stale historical narrative and owner placeholders** first; verify against manager identity map and ESPN archive.
3. Reconcile schedule matrix v1/v2, rivalry versions and all redundant record files.
4. Build one deterministic generator with --check, replace hard-coded HTML career records and year/week text, then update CI.
5. Only then merge alternate profiles/rivalry URLs and reduce homepage navigation.
