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

### Continuation — proactive inline-JavaScript syntax gate
- GitHub Pages deployment succeeded on prior head `e9d9131`, but its canonical validation workflow stayed pending with no runner jobs while checked, and was then cancelled by subsequent commits. Therefore the shared-profile fixes have **not yet earned a green complete Chromium run**.
- Added `scripts/audit-inline-js.mjs` (`44801e4`) to parse all nonempty inline text/javascript and module scripts in HTML with Node's JS parser, excluding JSON data islands and external script tags. This addresses the earlier error class in which inline archive scripts broke despite passing standalone JS checks.
- Added this blocking test to canonical Actions workflow (`366c4fb`), along with a JS syntax check of the audit script. New workflow needs to run to establish that the repository passes; if it reveals syntax faults, fix source defects rather than deleting the test.
- Do not mark mobile/Chromium/Safari launch tests passed solely from successful Pages deployments. **Release blocked**.

### Continuation — expanded Chromium regression coverage (verified green)
- Added five historically broken pages to `scripts/test-browser-release.mjs` in commit `9b0a503`: `analytics/awards-show.html`, `seasons/all-time-schedule-swap.html`, `seasons/espn-records.html`, `seasons/historical-awards.html` and `seasons/unified-record-book.html`.
- Added a browser-level interaction check that Awards Show year buttons render and switch displayed year on click.
- Inspected GitHub Actions [run 40596294368](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40596294368), commit `9b0a503`: **canonical job SUCCESS, real Chromium browser step SUCCESS**, testing 23 routes at 390px touch/mobile-emulated and 1280px desktop. Prior green checkpoint [40596037731](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40596037731) covered 18 routes.
- Pages deployment for this code commit remained pending when checked. Remember: desktop/mobile-emulated Chromium success does not certify physical iPhone Safari, complete visual/editorial QA, nor every route outside 23 sampled pages. Launch gate remains closed.

### Continuation — Schedule Swap interaction QA (verified green)
- Commit `ab40c49` expands `scripts/test-browser-release.mjs` with interaction assertions for `seasons/all-time-schedule-swap.html`: 10+ managers/owners loaded, comparison cards populated, owner switching to Stover changes rendered label, and filtering 2025 reduces annual rows to at most one. Added manager profile text-error guards for unavailable historical module / missing canonical manager.
- GitHub Actions [run 40596649400](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40596649400) completed **SUCCESS**, and its real desktop/mobile-emulated Chromium step completed **SUCCESS**. This is a confirmed green 23-route x two-viewport regression checkpoint.
- The earlier commit `51b106e` canonical validation also succeeded; its Pages deployment was not yet confirmed when starting this batch. Track GitHub Pages independently of the Chromium result.
- Still outstanding: editorial dossier parity and provenance review, physical iPhone Safari testing, additional route-level interactive coverage and latest Pages deployment confirmation. **No share/release authorization.**

### Continuation — all ten long-form dossiers added to browser CI; overflow resolved
- Added `managers/<slug>.html` for all ten current managers to real Chromium route QA in `scripts/test-browser-release.mjs` (`2633b6d`); total now **33 routes × two viewports (390px touch/mobile-emulated and 1280px desktop)**.
- Added `scripts/audit-dossier-preservation.mjs` (`b8b1edd`) and blocking workflow step (`694ff99`) to prevent premature loss of the unique long-form dossiers and ensure their canonical binding, shared history modules, and navigable profile links remain. Comparison found 26–31 headings in old dossiers vs 18 in new profiles. This documents **unmigrated editorial material**; do not delete dossiers yet.
- Initial expanded CI failed due to an overly broad test matcher; fixed in `c64e5e6`. Subsequent Chromium runs uncovered genuine **desktop horizontal overflow** in the old dossiers. Browser diagnostics identified `nav.nav` with an 18px overflow on five dossiers at 1280px, in addition to wide internal record tables.
- Reworked historical record module grid column containment and internal scroll handling in `4a2ae60`, `ee1381e`, `97084f4`. Ultimately corrected the shared sticky navigation margins in `assets/manager-historical-records.js` (`e715bb5`) while retaining strict page-level overflow checks.
- Verified **complete GitHub Actions SUCCESS**, including required Chromium browser step, for commit `e715bb5` in [run 40599206725](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40599206725): **33 routes at 390px and 1280px**, including 10 current manager profiles and 10 long-form dossiers. Successful browser CI is not equivalent to physical iPhone Safari, visual/editorial parity, or exhaustive manual testing.
- **Do not share yet**: historical dossier editorial parity, actual Safari/device validation and any remaining release reviews are outstanding.

### Continuation — entire rivalry matrix browser-tested
- Confirmed **canonical CI and Pages deployment both succeeded** at prior head `af501a4e` (run `40599446897` for canonical and `40599445951` for Pages).
- Commit `0a3af1f` expanded the Playwright/Chromium regression to add **all 45 distinct current-manager rivalry routes** from the same identity ordering as the static HTTP smoke test; the suite now covers **78 routes × 2 widths (390px touch/mobile-emulated and 1280px desktop)**. These pages are checked for successful HTTP navigation, runtime JavaScript errors, failed requests, blank pages, top-level horizontal overflow and known rivalry initialization failure strings.
- Verified [GitHub Actions run 40599712853](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40599712853), code commit `0a3af1f`: **full canonical workflow SUCCESS, Chromium browser step SUCCESS**. No checks were weakened or excluded to get this result.
- Pages deployment for this latest code commit needs independent result confirmation. The release restriction continues: physical Safari/iPhone interaction, editorial/source audits, dossier content-parity and final UX polish are not yet proven by Chromium emulation.

### Continuation — dossier editorial inventory and preserved navigation (verified green)
- Audited all ten older `managers/<slug>.html` encyclopedias against corresponding `managers/<slug>/index.html` profiles. All ten primary pages retain a prominent full-dossier link, all six core historical modules are referenced on both page types, and the old pages still have substantially greater editorial depth (roughly 23–28 legacy H2/H3 headings without exact matching headings on each modern profile). **Heading differences are discovery indicators, not proof each section's content is absent**: read and classify the underlying claims before retiring/redirecting anything.
- Commit `e2d7ee2` adds executable desktop/mobile Chromium checks for each of ten primary-profile deep links to its long-form dossier. Existing 78-route checks remain enabled.
- Confirmed [GitHub Actions run 40600547664](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40600547664) **SUCCESS**, including `Exercise desktop and mobile Chromium pages` **SUCCESS** on commit `e2d7ee2`. This is 78 routes × 390px touch/mobile-emulated and 1280px desktop with all 45 rivalries, ten modern profiles, ten historical dossiers, and archive interactions.
- Specific dossier parity review still required: biography/story voice, unique named player/acquisition sections, signature trades, old archive tables, franchise season timelines, evidence qualifications and rankings. Don't assume the old material is accurate or copy unsupported historical claims automatically.
- Next prioritize this editorial comparison and actual iPhone Safari manual/visual checks; CI Chromium emulation alone cannot certify them. Site **not ready to share**.

### Continuation — editorial dossier parity inventory
- Confirmed previous code checkpoint `e2d7ee2` CI Chromium and Pages both succeeded; prior handoff checkpoint `a39600e` Pages succeeded and canonical CI was still executing when last checked.
- Added `scripts/audit-dossier-editorial-inventory.mjs` in commit `3ffb227`. For each of 10 active managers it compares H2/H3 section headings between primary profile and long-form dossier, emits unmatched heading labels and specifically flagged story/player/trade/timeline editorial candidates. This produces a **review queue, not a finding of missing content or truth of the older claims**.
- Commit `cc8b13c` includes the inventory as a CI check and uploads `data-integrity/dossier-editorial-inventory.json` with audit artifacts. Keep original older dossiers accessible until human/source-based content parity and provenance are checked.
- Latest CI and deployment for these changes were pending when last checked. Other remaining gates: actual Safari on iPhone, visual accessibility/usability and qualified historical editorial provenance. **Do not release yet.**

### Continuation — fix editorial inventory artifact sequencing
- Inspected `.github/workflows/verify-canonical-history.yml` and found the `Upload link-audit report` step ran **before** the new `Inventory unmatched historical dossier editorial headings` step. That meant `data-integrity/dossier-editorial-inventory.json` could not be included in the artifact, despite being listed in the upload inputs.
- Commit `acda43b` moves the artifact-upload step directly after inventory generation and before dossier preservation, using the existing `if: always()` behavior. This is an actual CI output usability fix, not an editorial content certification.
- Most recent previous Pages build on `71752faa` succeeded. At the time of this handoff edit, CI on `acda43b` was queued/pending; confirm the full green run **and artifact contents** before closing this checkpoint.
- Release remains gated on source-qualified dossier reviews, physical Safari/device usability testing and overall editorial correctness, even after Chromium and canonical tests pass.

### Continuation — verified editorial audit artifact and 78-route green CI
- Run [40601380973](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40601380973) for code/handoff commit `ff3cfed` **completed SUCCESS**, including the real 78-route × 2 viewport Chromium browser step **SUCCESS**. Corresponding Pages deployment [40601381235](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40601381235) **SUCCESS**.
- Downloaded and independently inspected GitHub Actions artifact `internal-link-audit` (artifact ID `12778222618`): ZIP contains `internal-link-audit.json`, `site-dependency-inventory.json`, and `dossier-editorial-inventory.json`. This confirms the upload-after-generation correction is effective.
- Editorial inventory flags **128 unmatched-heading review candidates** across the ten managers: Stilly 13, Stew 15, Thommy/Tom 14, Stover 12, Birch 12, Tony 13, Mitch 12, Kuhl 12, JMid 12, Scott 13. These are a *review queue*, not 128 factual errors or verified missing sections; analogous material may already exist under new heading labels. Verify article content and historical sources before moving anything.
- **Outstanding before sharing**: actual content/provenance reconciliation of these candidate sections; physical iPhone Safari interaction/visual QA; full editorial and navigation quality review. Preserve the long-form dossiers for now.

### Continuation — topic-aware dossier parity inventory (verified)
- Added `scripts/audit-dossier-topic-overlap.mjs` (commit `d1fc828`) to group H2/H3 headings from ten historical dossiers and ten current profile pages into six editorial review families: career history, championships, franchise story and identity, players/rosters, trades/waivers, rivalries. It records both lists and flags missing *topic labels* without asserting verified content migration or factual accuracy.
- Added mandatory CI syntax execution and JSON artifact output to `.github/workflows/verify-canonical-history.yml` (commit `c7c41b8`). The new `data-integrity/dossier-topic-overlap.json` is included in the report artifact. This narrows the 128 broad heading-review candidates into a structured triage queue; no legacy dossiers deleted and no unsupported facts transplanted.
- Verified [Actions run 40602016828](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40602016828) on `c7c41b8`: **complete canonical workflow SUCCESS and real 78-route × two-viewport Chromium step SUCCESS**; topic-overlap audit step SUCCESS. Verify Pages deployment separately; all content editorial and real iPhone Safari release gates remain open.

### Continuation — direct editorial archive navigation
- Added a prominent `Historical players, waivers & trades` deep link to `#franchise-history-v915` on the preserved long-form dossier from each of the **ten** modern active manager profiles. Each target anchor was verified present in source on all ten legacy pages before editing. This makes the distinctive historical player/trade source material directly accessible without automatically copying or certifying its claims. Last profile edit: `e07c1c18`.
- Commit `daed4f8` extends the 78-route × two-viewport browser QA to assert that all ten deep links exist and target an actual section in the served dossier HTML. Keep these assertions enabled.
- CI/browser and Pages need verified final outcomes for `daed4f8`; do not represent a pending browser run as passed. Content provenance, manual editorial migration and iPhone Safari remain separate release gates.

### Continuation — end-to-end profile-to-dossier browser navigation
- Commit `91ec45d` strengthens Playwright Chromium browser QA for all ten current manager profiles: rather than only requesting the preserved dossier URL, the suite actually **clicks** the new `Historical players, waivers & trades` link, waits for the dossier's `#franchise-history-v915` destination, checks the section is visible, then navigates back. This runs for both 390px touch/mobile emulation and 1280px desktop as part of the existing 78-route suite.
- GitHub Pages deployment on `91ec45d` reported **SUCCESS**. Full canonical/Chromium CI run [40603092319](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40603092319) was still pending at this checkpoint due to concurrency/runner scheduling; **do not call it green until checked**.
- This check provides stronger navigational coverage, but not editorial source validation or physical Safari testing. Release still blocked.

### Continuation — real click-through navigation green
- Verified [GitHub Actions run 40603247108](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40603247108), commit `f83e21a`: **canonical validation SUCCESS and real Chromium browser step SUCCESS**, including new click-to-fragment / navigate-back assertions from ten current manager profiles to preserved legacy player/waiver/trade sections at both 390px mobile-emulated and 1280px desktop viewport.
- Original code change `91ec45d` was successfully deployed through Pages, but its CI was superseded by a newer documentation-only commit; green confirmation belongs to `f83e21a`.
- Remaining independent release gates: claim-level historical source review, real iPhone Safari, editorial/visual usability and final on-public-site smoke. No authorization to share.

### Continuation — trade-ranking claim qualifications across all dossiers
- Reviewed the published measured trade outcome cards for **all ten** long-form manager dossiers. The pages present realized *direct starter-point edges*, which should not be mistaken for position-adjusted WAR or a definitive judgment of decision quality, roster opportunity cost, replacement value, or long-run keeper value.
- Updated the ten `managers/<slug>.html` dossiers (last dossier commit `666882cb`) to display that interpretation and evidence-scope warning immediately beside their best-measured-trade card. **No numerical trade outcomes were changed** and this does not amount to verifying each underlying trade transaction.
- Commit `ac397305` extends the blocking `scripts/audit-dossier-preservation.mjs` check to fail if the methodological scope warning disappears from any dossier.
- As of this handoff update, latest code `ac397305` canonical/Chromium CI was queued; do **not** count it green without confirming the run. Independent source verification of trade transaction histories and position-scarcity-aware outcomes remains open. Physical iPhone Safari and final editorial/UX review are also not complete. **Do not share yet.**

### Continuation — trade and waiver card evidence reconciliation (verified green)
- Inspected actual `data/v9_trade_engine.json` (101 modeled trade-side records) and `data/waiver_award_candidates.json` (top five per active manager). First cross-comparison found all ten published waiver picks match each manager's highest-ranked award source entry and all ten published best-trade years match the highest modeled direct-edge year; underlying trade model source completeness and positional WAR remain independent review gates.
- Added `scripts/verify-dossier-award-sources.mjs` in `0642c9c`: for ten preserved dossier pages compare waiver pick player/year/week/type/starts/points/above-benchmark to the archived waiver candidate record; cross-check positive/negative trade card year, player assets and rounded direct-edge values against the ranked source-model trade side records. It handles Scott's explicitly qualified no-negative-outcome card. This validates *published card-to-source consistency*, not each underlying Sleeper transaction.
- Commit `16775a8` integrates this source-parity verification into mandatory CI and source-script syntax validation. Verified [GitHub Actions run 40604703087](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40604703087): **complete canonical job SUCCESS, award-source parity step SUCCESS, 78-route × two-size Chromium browser step SUCCESS**. GitHub Pages for the same code commit succeeded. Keep all checks enabled.
- Unresolved: validate original trade and waiver event provenance, incomplete 2020 transactions, scorer modeling/position scarcity, human editorial fact checks, real iPhone Safari, and final public site release acceptance. **Do not share yet.**

### Continuation — unresolved playerless and multi-party trade source gate
- Examined `data/v9_trade_engine.json` and `data/v9_1_trade_status.json`: three 2020 transactions (`614536176472264704`, `625902992721264640`, `625903284296683520`) contain no documented player assets; the FAAB-only/test explanation remains **possible and unconfirmed**, not established as fact. All are explicitly excluded from scored player-trade sides and rankings.
- The November 8, 2023 three-manager trade (`1028057686711058432`) has reconstructed player/pick asset directions, but the scoring/valuation is still pending and the trade remains excluded from rankings.
- New `scripts/verify-unresolved-trade-evidence.mjs` (commit `d921881`) enforces matching unresolved IDs, exclusion flags and uncertainty classifications across the model and status ledger, and prohibits ungraded events from appearing in scored trade sides. CI now executes the script as a required gate (commit `d9a1503`).
- This is **source classification reconciliation**, not recovery of absent trade assets or proof of FAAB-only activity. No scoring or championship conclusions were changed. At time of handoff update, CI on `d9a1503` was pending; confirm actual result before asserting success. The remaining editorial, position-adjusted trade valuation and physical Safari checks remain open. Site not ready for sharing.

### Continuation — 101 trade sides traced to source manifest
- Repo source inspection confirmed `data/v9_trade_engine.json` has **101 scored/partial trade-side rows** and `data/trade_source_manifest_101.csv` has **101 corresponding archived side rows**. Each source-model side maps 1:1 using season, transaction ID and manager.
- Added `scripts/verify-trade-source-manifest.mjs` (commit `fd0b42c`), checking exact one-to-one cardinality, duplicate keys, manager identity, trade ID, season, week and date; CI required gate installed in `.github/workflows/verify-canonical-history.yml` (commit `3ac0ffe`). This is independent of the dossier-award source-parity and unresolved trade exclusion gates.
- Original source audit confirms three 2020 player-empty events still have *possible unconfirmed* FAAB/test explanation; 2023 three-manager trade has recovered asset directions but ungraded valuation. Do not call unproven playerless events FAAB-only and do not incorporate ungraded trades into rankings.
- CI [run 40605791352](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40605791352) for `3ac0ffe` was queued when this update was authored; check final status and full browser result before calling it green.
- Open gates: historical transaction completeness; positional replacement-value model; full editorial/source reconciliation; real physical iPhone Safari, final UX and public-site release acceptance. Preserve **do-not-share**.

### Continuation — first successful Safari-engine responsive checkpoint
- Initial WebKit mobile regression failed on `analytics/records-archive.html`: a records table overflowed the 390px mobile viewport by **429px**, with `th`/`td` cells beyond the panel. The original Chromium suite passed, confirming this was browser-engine-specific behavior, not an ignorable screenshot warning.
- Commit `e1bb6c6` adds actual records-page containment and horizontal scroll within table panels, retaining all columns and no silencing of overflow assertions.
- Verified [GitHub Actions run 40606764134](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40606764134) on `e1bb6c6`: **complete canonical checks SUCCESS, Chromium 78 routes × 2 viewport sizes SUCCESS, WebKit Safari-engine 34 key routes at 390px SUCCESS**. The WebKit suite includes modern manager profiles, long-form dossiers and major archive interactions. This is a genuine additional browser-engine green signal but does not certify physical iPhone Safari.
- Corresponding Pages build/deployment should be confirmed independently if needed. Outstanding: actual device/iOS Safari usability, editorial/source completeness, position-adjusted historical trade ranking and final user-facing visual review. Do not consider the site ready for circulation.

### Continuation — expanded 78-route WebKit mobile coverage verified
- Commit `4645cfd` expands Playwright's Safari-engine WebKit 390px suite from 34 key routes to **all 78 release routes**, including all 45 unique rivalry pages and the ten modern/ten archival manager pages. The existing Chromium matrix remains **78 routes × 390px/1280px**. Together these run **234 page/viewport/engine combinations** with JavaScript, failed HTTP/resource and overflow checks plus selected interaction checks.
- Verified [canonical GitHub Actions run 40607477396](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40607477396): both `Exercise desktop and mobile Chromium pages` and `Exercise Safari-engine WebKit mobile pages` **SUCCESS**; Pages deployment for `4645cfd` **SUCCESS**. Run was finishing checkout cleanup at check time; check final top-level status independently if necessary.
- The expanded WebKit run found no further route-level issues after the `analytics/records-archive.html` horizontal table containment fix.
- Remaining substantive tasks are claim-level archival/editorial validation, true position-aware trade values, actual physical iOS Safari user testing, visual accessibility/legibility, and final release review. WebKit Linux emulation does NOT prove actual physical iPhone Safari.

### Continuation — founding-manager narrative records now use canonical career data
- Found five modern founding-era profile biographies (`stilly`, `stew`, `tom`/Thommy, `stover`, `birch`) repeating static career WLT **and** games-played counts in editorial paragraphs, despite using `data/career_core_generated.json` for headline stats. This created a future stale-source risk when fresh weekly games are added.
- Updated those five `managers/<slug>/index.html` franchise stories to bind WLT and games via canonical attributes, preserving readable fallback figures. Extended `assets/canonical-manager-record.js` to populate linked games-played elements from the **same manager model**, not another store. Added per-manager binding assertions to both browser engines in `scripts/test-browser-release.mjs`. Code commit `c2ad6a7`.
- Verified [Actions run 40608558286](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40608558286) on `c2ad6a7`: **canonical CI SUCCESS, Chromium 78 routes × 2 widths SUCCESS, WebKit 78 routes at mobile width SUCCESS** (including new narrative canonical binding assertions).
- No change to underlying standings data or manager prose judgments. Audit remaining page prose for other hardcoded snapshots and progressively remove stale factual duplication. Independent content research, real iPhone and editorial parity remain open.

### Continuation — Stilly integrated profile: sourced historical highlights
- Stilly's modern page now includes a visible three-chapter franchise encyclopedia, with working archive anchor navigation and two **source-model-grounded historical receipts** rather than only generic teaser prose. Waiver: Kirk Cousins, 2021 Week 7, seven subsequent credited starts, 125.20 starter points, +55.20 above positional starter benchmark (`data/waiver_award_candidates.json`). Trade: 2024 Week 3 Terry McLaurin/De'Von Achane/Tank Dell modeled side, 35 credited starts, 453.4 starter points, +198.0 direct starter-point edge (`data/v9_trade_engine.json`). Direct starter points are explicitly *not* position-adjusted WAR or decision-quality scoring. The original long dossier remains preserved.
- Found first browser-pilot failure in [run 40609850666](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40609850666): the existing historical-link assertion demanded exactly one match even after the pilot intentionally introduced a second valid link. It did **not** indicate a broken historical URL. Commit `ad25396` updates the browser assertion to require >=1 links and click the first match. Sourced pilot content committed in `129e167`.
- At note creation, the full [Actions run 40610539090](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40610539090) on `ad25396` was still running the browser matrix. Do not claim green until actual completed success. Pages deployment for `ad25396` reported success. Next: finish full Chromium/WebKit verification, then incorporate the template across nine more managers using manager-specific verified source records, while preserving historical dossiers and keeping existing editorial claims clearly qualified.

### Continuation — 10 franchise encyclopedias now have a single source-backed runtime
- Added `assets/manager-encyclopedia.js` in commit `5b8610f`. The shared browser module reads `data/waiver_award_candidates.json` and `data/v9_trade_engine.json` and renders each manager's top qualifying waiver candidate and highest positive modeled trade-side outcome with weeks, starts, starter points, and evidence-limited interpretation.
- All 10 modern `managers/<slug>/index.html` pages now mount this shared component, retain their previous static HTML as a safe documented fallback, and expose `data-encyclopedia-updated=yes` only after runtime source loading. Last profile commit `4a18cd6`.
- Commit `e7ff697` extends the Chromium and WebKit regression matrix to require the shared module to have successfully loaded for every manager. Existing assertions also check the rendered player and measured numbers against the corresponding source JSON. This removes another diverging hardcoded-data source from normal site rendering, though the fallbacks remain static and need future governance.
- CI [run 40612807038](https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40612807038) on `e7ff697` was queued when checked; verify final outcome rather than claiming success.
- Future work: replace remaining hardcoded awards/legacy draft results with durable generated records, improve encyclopedia depth and UX, then archival/editorial verification and physical-device usability.

### Continuation — source-failure safety for all manager encyclopedias
- Inspected the shared `assets/manager-encyclopedia.js` runtime, which loads award candidates and measured trade sides on all ten active manager profiles. Previously, an HTTP failure, malformed source, or unavailable manager row silently selected `data-encyclopedia-updated=fallback` and left baked-in numeric waiver/trade claims visible, potentially presenting an outdated snapshot as current.
- Commit `8f632bf` changes the error path to replace the two numeric highlight cards with explicit **Waiver evidence unavailable** and **Trade evidence unavailable** notices, preserving the deep links to archival dossiers. The root now reports `data-encyclopedia-updated=unavailable`; successful source renders still set `yes`.
- Commit `d296fe2` adds blocking static source-consumer assertions requiring both archived source files and fail-closed display labels/status. Existing Chromium and WebKit checks continue requiring successful source rendering for all ten profiles in healthy CI.
- **Not yet verified**: completed canonical/Chromium/WebKit CI and Pages deployment for these latest commits. Check Actions before calling the new HEAD green. In particular, compare expected source cards across ten profiles and verify error-state behavior in an actual browser if future failure-path injection testing is added.
- Still not approved for group sharing: manual claim-level source/editorial review, physical iPhone Safari experience, legacy front-office methodology and final live-site acceptance.

### Continuation — browser outage regression and future-proof archive assertion
- Commit `e160a64` updates `scripts/test-browser-release.mjs` to **intercept and fail** the waiver JSON fetch on Stilly's modern manager profile in both browser engines/viewport loops. The browser must show `data-encyclopedia-updated=unavailable`, both unavailable headings, and must not display previously hardcoded exemplar figures from Stilly's waiver/trade cards. This is an executable *negative-path* test rather than a static source check.
- The same commit replaces the browser suite's embedded Stilly `65–77` hardcoded archive assertion with a comparison against `data/career_core_generated.json`, so the check will remain valid after new matchups are ingested.
- CI and Pages results **not yet confirmed** for commit `e160a64`; inspect workflow jobs and logs before asserting green. Attempts to inspect public GitHub Actions and Pages URLs through external web fetch were unsuccessful, not evidence of a site outage. Release remains blocked pending source/editorial audit and physical mobile acceptance.

### Continuation — correct dossier topic audit artifact order
- Inspection of the latest canonical workflow found that `Classify dossier topical overlap` ran **after** `Upload link-audit report`, even though the upload listed `data-integrity/dossier-topic-overlap.json`. This would omit the freshly generated topic review report from the downloadable artifact unless the file happened to be present beforehand.
- Commit `1c8fc8c` moves the topic report generation step before the artifact upload. Both dossier inventory files are now generated before upload; the full artifact contents and CI outcome must be confirmed on a completed run.
- Existing Chromium/WebKit negative-path tests and the main release hold remain active. GitHub Actions run outcomes for latest head are not independently confirmed in this continuation.
