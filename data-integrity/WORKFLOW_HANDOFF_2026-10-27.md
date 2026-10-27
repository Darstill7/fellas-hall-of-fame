# Fellas Hall of Fame — Workflow Handoff (2026-10-27)

## Project and launch rule
GitHub repository: https://github.com/Darstill7/fellas-hall-of-fame
Published site: https://darstill7.github.io/fellas-hall-of-fame/
**Do not claim the project is complete or ready to share until CI, live-browser and mobile testing, historical data, editorial accuracy, and navigation have been reviewed.** The owner explicitly wants to finish the entire project before sharing.

## Canonical history and identities
- `data/unified_record_book_2016_2026.json`: 799 archived games, 695 regular-season and 104 postseason, ESPN 2016–19 plus Sleeper 2020–2026 Week 7.
- `scripts/generate-career-core.mjs` generates `data/career_core_generated.json` (14 historical identities, including ten current managers).
- `data/manager_identity_map_v1.json`: **Tom profile is Thommy / Zach Prescott**, not Tom Schermerhorn; Stover / Gurt / DillonPanthers15 / Yogurt Slinger is Landon Stover.
- The ten current regular-season career records (through 2026 Week 7):
  Stilly 65–77; Stew 66–76; Thommy 67–74–1; Stover 75–67; Birch 72–55; Tony 72–56; Mitch 70–46; Kuhl 51–66; JMid 24–25; Scott 16–19.
- Regular-season matchup scores are canonical for career, rivalries, weekly results, and annual WLT. Keep championship finishes, historical trades, player acquisition evidence, rosters, and awards as separately verified specialty data. Never infer those fields from WLT.

## Work completed
1. All ten primary manager pages `managers/<slug>/index.html` include a biography, historical panels, archived front-office highlights and a link to their longer historical dossier `managers/<slug>.html`. Retain old dossier pages until unique editorial information and links are safely migrated.
2. Manager career headline, season history WLT, head-to-head explorer, rivalry résumé and analytics, weekly game log, primary Records board, archived Records board all now read canonical matchup / generated career data. Identity normalization for Tom/Thommy added where necessary.
3. Both the `data/manager_legacy_resumes.json` fallback records and the embedded All-Time Legacy page (`analytics/legacy.html`) career records were reconciled for all ten current managers; regression checks added.
4. The Seasons guide covers 2016–2026 Week 7 via `scripts/generate-season-guide.mjs`, `data/season_guide.json`, and embedded `seasons/index.html` data. Its weekly intermediate source still merits consolidation.
5. All 45 unique present-day rivalry destination `.html` files were checked to exist; validator now checks them.
6. QA scripts: `scripts/generate-career-core.mjs --check`, `scripts/generate-season-guide.mjs --check`, `scripts/verify-ledger-projections.mjs`, `scripts/verify-core-consumers.mjs`, `scripts/verify-canonical-history.mjs`, `scripts/audit-internal-links.mjs`, `scripts/audit-site-dependencies.mjs`, `scripts/smoke-static-site.mjs`.
7. `.github/workflows/verify-canonical-history.yml` runs audits/smoke tests, supports manual workflow_dispatch, cancels redundant in-progress runs, and uploads link/dependency reports.

## Verified versus NOT verified
- Manually compared all ten legacy résumé and All-Time Legacy embedded WLT against generated career core: **matched** as of Oct 27.
- Verified 799/695 counts and all 45 matchup destinations via GitHub file lookups.
- **NOT CONFIRMED**: successful GitHub Actions execution. GitHub connector `fetch_commit_workflow_runs` filters to PR-triggered runs, returning empty for push commits; empty results must NOT be described as success/failure. See https://github.com/Darstill7/fellas-hall-of-fame/actions/workflows/verify-canonical-history.yml
- **NOT CONFIRMED**: public website loading in a browser or responsive mobile QA. The static HTTP smoke test is committed but needs real execution.

## Immediate next actions
1. Run the actual GitHub Actions workflow (manual **Run workflow** on main if needed), inspect failure step logs and uploaded `internal-link-audit` artifact, fix errors and obtain a verified green run. Use GitHub connector workflow job/log endpoints if a run ID is available. Avoid repeated trivial commits that generate more failure emails.
2. Review dependency inventory for remaining legacy sources; classify as stale WLT duplicates vs genuine editorial/award specialty data. Avoid deleting unique verified research.
3. Audit the **All-Time Legacy rankings and weights**: its embedded career WLT now matches canonical, but derived composite rankings may remain stale and must not be represented as recalculated.
4. Test live HTTP fetches, scripts and navigation across primary manager pages, Records, Seasons, all rivalry pages, plus iPhone-sized touch and overflow behaviors; repair all broken links.
5. Investigate any remaining site-wide hardcoded record statistics and duplicated data in `data/league.json`, old embedded fallbacks and historic HTML; add blocking invariants before retiring old routes.
6. Complete unique-editorial migration / layout polish, keep old dossier links or add safe redirects once content parity and testing have passed.

## Working procedure
Discover connected GitHub tools using `ALL_TOOLS` inside `functions.exec`, for example `tools.mcp__GitHub__fetch_file({repository_full_name:"Darstill7/fellas-hall-of-fame",path:"..."})`, then `update_file` with current SHA, content and commit message. Batch related changes to avoid many CI emails. Don't claim CI or mobile tests passed without actual evidence. Updated project progress should be appended to this handoff file whenever work is completed.

## Continuation — October 27, 2026 (CI evidence and release gate)
- Independently inspected GitHub Actions run [#137](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40592022102), commit `41a3ccf8a787acbc549acae1ef3df73abf6e7053`: **canonical validation succeeded**; its job steps for generation, reconciliation, consumer checks, syntax and static smoke checks succeeded. Pages deployment run `40592020107` also succeeded on that commit.
- Read the actual CI job logs (`122498411913`): **207 HTML pages scanned; 0 unresolved local links**. Dependency inventory: **39 consumer files, 61 JSON references, 5 references to legacy sources**. These five are: `analytics/records-archive.html` and `assets/manager-historical-records.js` and `managers/record-books.html` -> `manager_record_books_2016_2026.json`; `assets/legacy-resume.js` -> `manager_legacy_resumes.json`; `seasons/weekly-matchup-archive.html` -> `season_weekly_matchups_2016_2026_v1.json`.
- Committed stricter release protection in `70941de3f05a27ccfcf8dffa0fdddd3a680654e6`: `.github/workflows/verify-canonical-history.yml` now runs `node scripts/audit-internal-links.mjs --strict`, so any unresolved local link fails CI rather than merely reporting it. **Verify this new commit's workflow result before calling the new gate green.**
- Legacy references remain intentionally unmodified pending proof that their content can be replaced without deleting distinct editorial or historical context; dependency audit is still advisory.
- **NOT RELEASE-READY:** no real device/browser responsiveness and touch-overflow testing; live network data loading and navigation are not yet verified; ranking/weight methodology and unique dossier data parity are not fully audited. CI cannot replace these checks.
- Next: inspect new CI result; work through the five remaining legacy consumers and retire duplicate statistics safely; add invariant tests for composite legacy rankings; run actual mobile/browser cross-route checks and record evidence.
