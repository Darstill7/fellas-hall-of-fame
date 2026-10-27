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

### Continuation — historical manager display hardening
- Updated `assets/manager-historical-records.js` in commit `15c1645` to read the generated career core alongside the specialty historical record-book dataset. The visible regular-season WLT, game count, annual WLT and head-to-head table now come from `career_core_generated.json`; specialty best/worst week, margin extremes and postseason notes remain in the separate archive rather than being thrown away.
- Updated `scripts/verify-core-consumers.mjs` in commit `f300244` to reject a regression to duplicated historical-panel career statistics.
- This **does not** remove the historical archive JSON dependency: the archive contains specialty records not defined in the canonical WLT projection. Remaining references need classification and further consolidation. CI result for this latest change must be inspected; live-browser/mobile behavior is still unverified.

### Continuation — canonical weekly matchup archive
- Before this change, validated successful GitHub Actions canonical CI and Pages deployment for prior head `58fe26d`.
- Commit `adb4da5` switched `seasons/weekly-matchup-archive.html` from `season_weekly_matchups_2016_2026_v1.json` to `unified_record_book_2016_2026.json`. The browser builds yearly game collections and regular-season standings (WLT, PF, PA, game counts) from ledger matchup scores; postseason remains separate. The season selector now starts at latest covered year instead of hardcoded 2025.
- Commit `347cd7c` adds binding/regression assertions in `scripts/verify-core-consumers.mjs` to reject duplicate matchup snapshot usage in this archive.
- The weekly archive does **not** certify official season tiebreaker order; reconstructed sorting uses winning percentage and points scored. The separate season guide generator still uses the legacy weekly snapshot and must be migrated with a regenerated output comparison. Preserve the snapshot until all consumers are confirmed migrated and parity checks pass.
- Release gate remains **closed** pending CI for this batch, an executable browser check of this new page, mobile overflow/touch checks, ranked legacy composite audit and remaining dependency consolidation.

### Continuation — canonical season-guide generation and Legacy method guard
- Verified GitHub Actions canonical validation success at prior commit `58fe26d` and `ec19772`. A Pages deployment for `58fe26d` succeeded; later Pages jobs were cancelled by rapid commits or were pending as observed.
- Independently rebuilt per-season standings in memory directly from the `unified_record_book_2016_2026.json` ledger and compared them with `season_weekly_matchups_2016_2026_v1.json` and `season_guide.json`. **All 11 seasons, 2016–2026, matched exactly**, including sorted manager order, WLT, PF/PA and game counts (695 regular-season games).
- Commit `7c56709` migrates `scripts/generate-season-guide.mjs` to construct game lists/standings straight from canonical ledger rather than the old weekly snapshot. The existing generator `--check` is the executable output-parity gate; do not claim success on the new revision until its Actions run finishes.
- Commit `3ab05bb` adds a core-consumer assertion preventing the guide generator from regressing to the duplicate snapshot source.
- Inspected the embedded `analytics/legacy.html` composite model. The displayed six category weights total 100 (30/20/20/15/10/5); title component formula `30*sqrt(titles/4)` and regular-season win percentage including half credit for a tie are consistent with current displayed records. **No definitive 100-point Legacy ranking is published** while playoff/all-play/peak/season evidence is incomplete. Commit `e576f94` adds executable invariants for weights, championship points, win percentage and withholding the incomplete full rankings.
- Still outstanding: remaining specialty-data references, proper editorial source classification and ranking evidence; live browser/mobile QA, navigation and deployment confirmation on latest head. Release gate is still closed.

### Continuation — manager archive browser canonicalization
- GitHub Actions canonical verification completed successfully at prior head `38dde5e`. Its Pages deployment was still in progress when inspected; do not infer browser validation from it.
- Commit `7fdd3d2`: `managers/record-books.html` now fetches `career_core_generated.json` alongside the historical record-book specialty archive. Visible regular-season WLT/game count, opponent breakdown, and annual results are sourced from the canonical core. Specialty scoring extremes, postseason notes and the retired-manager archive are retained.
- Commit `0ebc266`: added automated source-binding and duplicate-WLT regression checks to `scripts/verify-core-consumers.mjs`.
- The old `manager_record_books_2016_2026.json` reference remains intentional for specialty scoring and postseason fields. Replacing that file entirely requires matching those historical calculations against the ledger before removal.
- Outstanding release gates: latest CI and deploy, live browser tests, actual iPhone-size overflow/touch checks, and evidence audit for composite Legacy categories. The project remains NOT READY TO SHARE.

### Continuation — specialty record integrity and HTTP regression gates
- The preceding head `cb16865` had successful canonical CI and Pages deployment (confirmed via the GitHub Actions runs endpoint).
- New `scripts/verify-specialty-records.mjs` (commit `22bb12e`) independently reconstructs **all 14 historical managers'** regular and postseason games/WLT, first and last seasons, best/worst scoring weeks, win/loss margin extremes, best postseason scoring matchup, opponent WLT and annual WLT from 799 ledger games. It fails on mismatches rather than trusting the archived specialty JSON.
- An independent in-memory check of canonical ledger against the archive returned **zero mismatches** for all 14 managers on career/postseason WLT and scoring extrema. This is not a substitute for full CI running the committed test.
- Commit `306e6a5` adds the audit to required GitHub Actions steps, including JavaScript syntax checking.
- Commit `65b410e` broadens the local-HTTP static smoke suite to historical manager record books, the weekly archive, old Records and Legacy views, and the specialty JSON files. This does **not** test JS rendering, touchscreen interaction, or actual phone browser performance.
- **Release not approved** pending a successful CI and Pages deployment for latest HEAD, real browser and mobile verification, legacy fallback review, and evidence/content parity across older dossiers.

### Continuation — fail-closed historical career fallback
- GitHub Actions canonical CI succeeded at `306e6a5` with the new specialty-record integrity gate, and at `65b410e` with expanded static HTTP route coverage. This confirms test execution in CI, **not** actual JS browser rendering or mobile behavior.
- Commit `746be52` changes `analytics/records-archive.html` to hide embedded stale career ranking rows pending the fetch of `career_core_generated.json`; if the fetch fails, the career ranking is withheld with an explicit unavailable message instead of showing saved fallback values. Other historical categories and championship chronology remain separately labelled.
- Commit `14a9d25` adds a blocking source-consumer regression assertion that this page fails closed.
- Remaining: obtain green CI and Pages deployment on final head, test live mobile/browser navigation and overflow, review full editorial dossier parity and any remaining specialty provenance. **Not ready for public sharing.**

### Continuation — actual headless Chromium release verification
- Confirmed **both canonical CI and Pages deployment succeeded** for preceding head `fcb04cc` (GitHub Actions statuses).
- Committed `scripts/test-browser-release.mjs` (`c3cbe44`): runs a local HTTP server at the Pages subpath and exercises homepage, Seasons, weekly archive, manager archives, Records, Legacy, rivalries and ten current manager profiles in **Chromium at 390px touch/mobile-emulated and 1280px desktop viewports**. It captures uncaught JS errors, top-level horizontal overflow, blank page content, and explicitly changes the weekly season and manager archive selectors.
- Committed `376e681`: canonical CI now installs Chromium through Playwright and runs this real-browser test as a blocking job. First run outcome must be inspected. **Mobile-emulated Chromium does NOT certify physical iPhone Safari**, and this does not establish complete route/UX parity or full editorial correctness.
- CI browser assertions may expose existing site bugs. Inspect workflow failure logs and repair issues rather than weakening/omitting meaningful checks. No release approval until this job is green and Safari/mobile visual QA, editorial evidence and navigation checks are completed.

### Continuation — first Chromium failure triage and runtime syntax fixes
- Inspected run [40594354046](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40594354046): canonical/ledger/specialty/link/static HTTP checks all passed; the new Chromium job FAILED when `seasons/weekly-matchup-archive.html` had no populated `#year` options, timing out after 30 seconds. Pages deployment for that commit succeeded, demonstrating why deployment alone is insufficient.
- Commit `c384514` changes browser tests to report failed requests and the actual archive initialization message rather than timing out blindly on nonexistent select options.
- Source inspection identified invalid JavaScript string escaping (`'&quot;':'&quot;'`) within object literals in three files. Commits `1f253d5`, `260379a`, and `380f422` fix the malformed quote mappings in `seasons/weekly-matchup-archive.html`, `managers/record-books.html`, and `assets/manager-historical-records.js`, respectively. The broken syntax prevented inline/archive scripts from executing.
- **Await full latest-head Chromium CI and Pages result.** Distinguish JS syntax corrections from confirmed browser passes. After first green, continue checking remaining routes and Safari/physical-phone presentation. Release remains blocked.

### Continuation — Chromium shared-profile failures and preventive JS syntax gate
- The first retest of repaired archives on CI run [40594891605](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40594891605) **FAILED** in Chromium, despite successful Pages deployment and all prior canonical/static/specialty checks. The weekly year selector now initialized; remaining failures were two `Unexpected token ':'` JS errors on *each of the 10 manager profile pages* at both 390px and 1280px.
- Traced the repeated errors to shared manager modules containing malformed duplicate `'&quot;':'&quot;'` key-value text: `assets/manager-trophy-cases.js` and `assets/espn-franchise-lineage.js`. Corrected all occurrences in commits `85323ac` and `2c0a5f3` rather than changing ten profile pages.
- Commit `ec1855d` enforces `node --check` on **every** shipped `assets/*.js` script in CI so malformed shared JavaScript cannot slip past the targeted checks again.
- These fixes require a new completed canonical CI/browser and Pages run before asserting success. Physical iPhone Safari and broader editorial QA remain unverified. **Release blocked.**
