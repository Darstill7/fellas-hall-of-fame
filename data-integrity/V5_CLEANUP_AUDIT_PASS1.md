# Fellas OS v5 — Repository cleanup audit (Pass 1)
Date: 2026-10-27
Status: INITIAL INVENTORY — not a complete recursive repository scan. Do not delete anything based solely on this pass.
Live site: https://darstill7.github.io/fellas-hall-of-fame/
Repository: https://github.com/Darstill7/fellas-hall-of-fame

## Target architecture
Immutable imported ESPN/Sleeper evidence + explicit manager-identity mapping -> canonical game/event ledger -> deterministic generator -> derived read-only JSON -> generated web pages. One command must validate, generate, and verify. No manual editing of derived W-L records in HTML or JSON.

## File decisions (grounded in files opened and the existing canonical contract)

| Path(s) | Current use | Decision | Next action |
|---|---|---|---|
| data/unified_record_book_2016_2026.json | Unified 2016–2026 game-event archive | KEEP as canonical game ledger for matchup-derived metrics | Document schema, provenance, dedupe keys, and 2026 refresh contract; reconcile with primary evidence |
| data/espn_history_2016_2019.json | Source evidence for historical ESPN outcomes | KEEP source archive | Protect immutable imports; compare to ledger; do not overwrite |
| data/manager_record_books_2016_2026.json | Current manager career records, annual records, H2H | GENERATE from ledger | Write deterministic generator; never edit manually |
| data/season_weekly_matchups_2016_2026_v1.json | Season/week projection and manager game logs | GENERATE from ledger | Same build; validate games and annual totals |
| data/league.json | 2026 standing/week snapshot plus copied historical manager fields and rivalry matrix | SPLIT then GENERATE/RETAIN | Retain current-season snapshot and editorial fields where needed; derive historical manager W-L/H2H from canonical projections; audit consumers before removing keys |
| assets/canonical-manager-record.js | Fetches canonical manager W-L at runtime with HTML fallback | KEEP temporarily then REFACTOR | Remove stale HTML numerical fallbacks via build-time generation or safe loading placeholders; remove hard-coded 'W7' after refresh |
| assets/manager-weekly-game-log.js | Uses season weekly archive | KEEP then REFACTOR | Remove hard-coded 2026/W7 text; keep safe rendering and year handling |
| managers/{slug}/index.html (10) | Canonical profile route | KEEP | Normalize to one profile template and generated content |
| managers/{slug}.html (10) | Second independently maintained profile URL | REDIRECT after dependency/link audit | Preserve old inbound links; use redirects instead of parallel pages |
| analytics/records.html | Current records page | KEEP | Generate records board; eliminate embedded JSON fallback as manually maintained source |
| analytics/records-archive.html | Older records presentation | ARCHIVE/REDIRECT after comparison | Preserve unique historic information before retirement |
| managers/record-books.html | Separate manager record presentation | CONSOLIDATE | Decide whether its unique drill-down belongs under Managers or Records |
| analytics/rivalries.html | Historical rivalry view | AUDIT | Verify all public rivalry entry routes share one derived H2H feed |
| seasons/weekly-matchup-archive.html | Unified weekly results | KEEP | Make canonical season navigation entry |
| seasons/all-time-schedule-swap.html | Full cross-era schedule analysis | KEEP under Labs | Verify inputs and coverage labels |
| analytics/schedule-matrix.html; analytics/what-if.html | Older limited-scope analyses | ARCHIVE/REDIRECT only after feature comparison | Retain unique methodology with explicit 'legacy' labels if needed |
| .github/workflows/verify-canonical-history.yml | Runs node validator on EVERY main push and PR | REFACTOR | Trigger on relevant changes or gate with a stable aggregate validation workflow after generator lands; preserve real failure alerts |
| scripts/verify-canonical-history.mjs | Compares repeated copies and page markup; reconciles game counts | KEEP then REPLACE with schema/lineage/build checks | Remove brittle string-matching dependency on HTML; validate generated artifacts, identities, coverage |
| index.html | Main navigation/homepage with many direct feature links | REDESIGN (after data refactor) | Main navigation: Home, Managers, Seasons, Records, Rivalries, Labs |

## Verified issues
1. CI validator inspects HTML string fragments such as `>65–77</strong><small>All-time regular-season W–L`. A harmless markup redesign can fail validation despite correct data.
2. The validator requires manual embedded JSON fallbacks in both records pages to agree with the career file. That is duplication, not a one-source pipeline.
3. `data/league.json` embeds historic career and rivalry results alongside a weekly 2026 scoreboard. These should not be one manually maintained object.
4. Runtime manager records fetch the canonical career file, but the script and profile text still hard-code Week 7 references.
5. There is no root `package.json` available in the inspected default branch; README's update guidance is still manual: update league.json and regenerate pages. Confirm generators and alternate tooling before selecting a build system.
6. Two manager-profile URL layouts remain in active validation. Consolidation is overdue.
7. Core analytical pages can contain a mix of all-era matchup evidence and Sleeper-only advanced metrics. Era coverage must be per metric, not inferred from site branding.

## Safety rules
- No destructive deletion in Pass 1. Archive or redirect old routes only after comparing unique content and inbound links.
- Never merge distinct franchise owners because they shared a team name or alias. Identity map must be explicit and versioned.
- Preserve champion, runner-up, postseason, and old ESPN source facts separately from regular-season W-L.
- Build outputs may only be committed if source verification, provenance and deterministic rebuild tests pass.
- Keep current site published during staging; don't redirect live routes without link and mobile checks.

## Next implementation sequence
1. Enumerate full tree with paths, sizes and consumers; classify every file KEEP / GENERATE / ARCHIVE / DELETE-CANDIDATE. This pass sampled known files and is NOT full coverage.
2. Establish canonical game schema + manager identity registry and source snapshots; write fixture tests covering Stilly–Tony H2H, Stover historical mapping, titles, 2016–2019 outcomes and tied games.
3. Implement one command to regenerate manager books, seasons, H2H, league compatibility values and records page data. Verify output reproducibility.
4. Simplify GitHub Actions to run generator in `--check` mode and one clear validation report; inspect failed runs before changing notifications.
5. Replace HTML number copies with generated pages; pick `/managers/{slug}/` as canonical, then redirect legacy routes.
6. Consolidate Labs pages, remove duplicate nav links, mobile smoke-test, and conduct a no-contradictions QA before invitation.

## Known limitations of this audit
This pass inspected README, index, canonical contract, validator workflow/script, two assets and league snapshot, plus repository commit history. A complete directory tree and each analytics page's dependencies were not available from the connector in this pass; therefore DELETE is *not* approved for any file. GitHub Actions failure causes are not proven by this inventory.
