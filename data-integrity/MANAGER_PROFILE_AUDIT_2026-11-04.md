# Manager-by-manager profile editorial and data audit — 2026-11-04

## Scope and source of truth
Inspected the primary `managers/<slug>/index.html` file for all ten current managers, the current `data/career_core_generated.json` through 2026 Week 8, `data/manager_legacy_resumes.json`, `data/manager_biographies_awards.json`, and the shared `assets/legacy-resume.js` biography renderer. This is a **repository-source first pass**, not a completed rendered-site, mobile-device, or comprehensive historical transaction verification. The audit remains open until browser QA and final evidence parity are run.

**Priority:** championships, verified regular-season WLT, championship years, peak seasons, major rivals and defining historical moments lead the profile. Start/sit, waiver ROI and transaction scoring should be secondary drilldowns. Preserve separate provenance for historical championships, trades, roster and award assertions. Do not infer championship or playoff finishes from regular-season WLT.

## Individual verified career headlines (through Week 8 of 2026)

| Profile route | Display name | Regular season W–L–T | Games | Documented titles | Audit focus |
| --- | --- | ---: | ---: | ---: | --- |
| `managers/tom/` | Thommy (route alias Tom) | 67–75–1 | 143 | 4 (2016, 2017, 2018, 2024) | Four titles and 2016–18 three-peat must lead; reconcile Tom/Thommy everywhere; story includes stale 142 games |
| `managers/mitch/` | Mitch | 71–46 | 117 | 0 | Best long-run current-manager win rate; 2025 13–1, 2026 8–0; no claim of a title |
| `managers/stover/` | Stover | 75–68 | 143 | 1 (2022) | Preserve original YogurtSlingers and later Gurt identity; page has distinct intro/navigation structure, needs cross-profile parity |
| `managers/birch/` | Birch | 72–56 | 128 | 1 (2019) | 2018 runner-up, 2019 and 2021 11–2 years; story contains stale 127 games |
| `managers/tony/` | Tony | 72–57 | 129 | 1 (2021) | 2021 10–3 championship, 2023 10–4 follow-up; verify claims about trade assets against direct trade ledger |
| `managers/stew/` | Stew | 67–76 | 143 | 0 | 2022 11–3 peak; 2021 and 2023 3–11 lows; story includes stale 142 games |
| `managers/stilly/` | Stilly | 66–77 | 143 | 1 (2023) | 2023 8–6 title, 2024 runner-up; story includes stale 142 games |
| `managers/kuhl/` | Kuhl | 51–67 | 118 | 0 | 2020 9–5, 2022 8–6; 2026 0–8; avoid claiming unverified acquisition methods |
| `managers/jmid/` | JMid | 25–25 | 50 | 0 | 2023 9–5 debut, 2024 8–6 with league-high 1,730.22 PF; keep transaction claims qualified |
| `managers/scott/` | Scott | 17–19 | 36 | 1 (2025) | 2024 5–9, 2025 8–6 championship; shortest recorded current tenure, do not invent earlier seasons |

## Shared findings and corrective plan

1. **Confirmed static-text drift:** Some top-of-page story paragraphs have game totals copied from Week 7 (142 for Stilly, Stew, Tom; 127 for Birch). The live canonical record bindings show current WLT/games, but the adjacent static numbers can disagree. Remove hard-coded game counts from prose, or bind them to the same canonical loader with a test.
2. **Profile lead hierarchy:** Championships, regular-season WLT, career win percentage, best year, and postseason history should precede ratings, start/sit, trade or waiver specialties. Provide a compact clear navigation row to deeper material.
3. **Redundant prose surfaces:** `#franchise-story` and the legacy résumé's “biography” panel can retell the same story. Convert top intro into a genuinely short career summary and keep long-form biography in one authoritative section.
4. **Biography quality:** Replaced all ten `data/manager_biographies_awards.json` manager biographies with individual career narratives grounded in ledger seasons and separately documented title years; changed shared renderer heading from “AI-Written Biography” to “Career Biography.” The new copy is committed, but browser rendering and final copyediting still require confirmation.
5. **Identity:** Primary route `managers/tom/` represents **Thommy**, not the other historical Tom; current header may say “Tom” while other page elements say “Thommy.” Choose visible nickname Thommy consistently while maintaining old URLs.
6. **Stover exception:** Stover's top section, CTA structure and page length differ from the shared nine-profile template. Review content parity and harmonize design without discarding uniquely verified historical material.
7. **Unverified interpretation:** Editorial labels such as “The Math Problem,” “The Converter,” and “The Quiet Poker Player” are interpretations, not documented self-descriptions. Do not imply they are league-awarded names or intentions.
8. **Data coverage:** Do not use partial Sleeper player/trade stats as if comprehensive across ESPN 2016–19. Keep 2026 labeled through Week 8, not a finished season.
9. **Navigation/visibility:** Source review confirms many scripts and deep-dive links on each page. Run actual touch/mobile and desktop browser tests to verify headings, spacing, tabs, overflow, anchors, rendering and links before approval.
10. **Validation:** Add a regression that verifies each displayed profile's year, canonical record, games, titles, identity, and the two canonical prose surfaces. Re-run canonical CI, Chromium, WebKit, and Pages deployment on latest head before release approval.

## Editorial focus for each manager
- **Thommy:** A four-title dynasty, interrupted, then reborn six years after title three.
- **Mitch:** Quantifiable regular-season dominance contrasted with the missing title.
- **Stover:** Founding franchise continuity under changing names, most current-manager wins and a championship.
- **Birch:** Early title-game arrival and extraordinary 2019–21 peak.
- **Tony:** A durable winning record and the 2021 championship response to 2020.
- **Stew:** High-volatility franchise; the brilliant 2022 roster remains untitled.
- **Stilly:** A founding manager's long path to 2023 breakthrough and 2024 return.
- **Kuhl:** Productive seasons and useful assets without sustained conversions or title.
- **JMid:** A fast early rise followed by volatility; 2024 scoring lead vs 8–6 standings.
- **Scott:** Newcomer-to-champion jump from 2024 to 2025 and short total career sample.

## Next unresolved release gates
- Replace static Week 7 prose with Week 8 canonical source in primary page intros.
- Harmonize Stover layout and Tom/Thommy name.
- Remove duplication between the short story and full biography.
- Prove image/typography/navigation quality in actual Chromium + WebKit at mobile and desktop widths.
- Verify current GitHub Actions and GitHub Pages outcomes; no green status is claimed in this audit.

## Continuation — profile correction and biography presentation batch

- Updated **all ten** modern `managers/<slug>/index.html` pages with manager-specific short opening stories (roughly 200–270 characters), replacing duplicated long biographies and removing hard-coded Week 7 game totals in introductory prose.
- Replaced ten generic top-of-page taglines with distinctive, career-relevant headlines identifying titles, milestones, records, or current challenges. Removed the prominent Start/Sit CTA from nine standard profile heroes; advanced lineup research remains elsewhere. Stover did not have that CTA in its separate hero layout.
- Preserved the existing canonical `data-canonical-manager-record` bindings and championship hero statistics, and preserved full historical dossier links and all other sections.
- The ten complete `data/manager_biographies_awards.json` biographies now have three editorial paragraphs each. Shared `assets/legacy-resume.js` renders those paragraphs in the career biography; `assets/manager-profile-readability.css` constrains reading width and improves line-height at mobile viewports.
- Added a **blocking manager-level editorial invariant** to `scripts/verify-core-consumers.mjs`: each profile must retain its source-backed regular-season WLT, correct canonical identity (including Tom → Thommy), documented championship count and title years, one readable short story, a biography at least 650 characters, and a working biography résumé mount. The gate rejects identical biographies across the ten managers.
- Re-read all ten live GitHub source HTML files after the first intro batch and compared the hero record/count, titles, short-story length and biography presence to the current canonical/legacy source. **All ten matched** in that source-level verification. This is **not** a claim that CI has executed or that a device browser has rendered the site successfully.

### Remaining work / open release gates

1. Obtain a **successful canonical GitHub Actions** run for the resulting main-branch head; inspect any failures. Rapid commits can cause job cancellations, so let the last combined head finish rather than interpreting cancellations as test failures.
2. Check the biographies and chapter/navigation interactions in real Chromium and WebKit at 390px and 1280px; confirm paragraphs, headings, visibility, keyboard access, overflow and tap targets. No live browser pass is claimed here.
3. Review other deeper dossier prose and dated player transaction assertions against direct evidence; do not take historical roster/story claims as all equally verified.
4. Consider reconciling Tom/Thommy visible naming in a dedicated coordinated identity patch: simply renaming the hero's `h1` could change profile-js manager lookups.
5. Harmonize the remaining Stover-specific layout intentionally, without losing historical highlights.
6. Confirm GitHub Pages deployment at the final audited commit before suggesting the site is release-ready.

## Continuation — career-first profile hierarchy

- Reversed the previous shared JavaScript placement that moved the "Explore topics" CTA above verified career statistics. All ten modern routes now place **manager identity and short career headline → verified championships and WLT → title-season context → navigation controls → feature directory**, without duplicating or inventing the canonical values.
- Kept the headline stat presentation to two compact, prominent facts: championship total and regular-season record. Added a readable championship-season line using each original page's source-backed title-year stat. Managers without a title are identified as pursuing their first championship, not given a fabricated date.
- Added a prominent direct **Read [manager]'s career story** button to the shared "Start here" feature directory. It uses the established focused-section handler with `#legacy-resume`, so readers can reveal the full career biography while other research sections stay collapsed. The existing Records and Report Card destinations remain intact.
- Added Chromium/WebKit browser-source regression assertions to `scripts/test-browser-release.mjs`: DOM order must put `h1` before `[data-profile-career-snapshot]` before hero action buttons; the dedicated biography entry must exist. The browser script and shared module were syntax-checked in isolation using a JS parser-equivalent compilation step, **not** executed in browsers in this task.
- Scope applies through shared `assets/manager-profile-tabs.mjs` and `assets/manager-profile-readability.css` to all ten manager pages, including Stover's independently styled source HTML. No championship/WLT facts changed, and historic dossier chapters remain accessible.
- **Release gate remains closed** until main-branch canonical validation, actual Chromium & WebKit page interaction/viewport checks and Pages publication are confirmed after these commits.

## Continuation — November 5, 2026 morning: focused section navigation

- Inspected `assets/manager-profile-tabs.mjs` and confirmed that the shared ten-manager layout already preserves canonical records and keeps full research in a five-topic directory. The problem was that the focused view left the large directory visible and placed its only Back control far above the selected section.
- Updated `focusFeature()` to **move the existing single Back control directly before the selected section or module**. In a focused view the oversized directory is hidden; the feature's own content remains visible. Returning to the directory reattaches the same control to its original menu location and restores the landing mode. This avoids adding a second redundant control or changing the underlying data.
- Updated `scripts/test-browser-release.mjs` to assert focused rivalry views hide the large menu and place contextual navigation next to the selected section, and that the Back button restores the directory. Also added ten-manager biography interaction checks: open the direct career-story CTA, verify three rendered paragraphs and visible contextual return, then return to the landing.
- Static source compilation check on GitHub's latest `assets/manager-profile-tabs.mjs`, `assets/legacy-resume.js`, and `scripts/test-browser-release.mjs` passed. All ten biography JSON entries still contain three narrative paragraphs. These checks do **not** constitute a Chromium/WebKit run.
- No historical statistics, awards, name mappings, or manager-specific facts were modified in this batch.
- Browser/CI/Pages validation is still **unverified**, as public GitHub Actions run inspection was not available through current accessible tooling. Keep release gate closed until confirmed.

### Additional reliability improvement — missing optional panels

- Fixed a misleading interaction: previously, selecting a not-yet-mounted optional research panel permanently applied `aria-disabled=true` to that feature button and showed only a hover tooltip. It could look like nothing happened, even if the deferred component mounted later.
- The feature directory now places visible, screen-reader-announced feedback immediately beneath the selected button: the research has not loaded yet and the visitor may retry. It **does not disable the control**, and removes the notice when the destination becomes available.
- `scripts/verify-core-consumers.mjs` now guards the contextual Back control, hidden focused menu, and retryable research state against source-level regression.
- Syntax-checked the modified scripts and re-read their source-level invariants. Full browser execution / GitHub Actions / Pages success remains unverified.

### Collapsible research navigation safety

- Follow-up review found a real edge case in the contextual Back-control placement: some career/transaction modules reside inside `details.profile-research-shelf`. Moving Back inside that panel would make it disappear when the panel closes.
- Updated the shared feature navigation to anchor Back **before** the enclosing research shelf instead. Thus the section can be collapsed without trapping readers in the focused view.
- Added a Chromium/WebKit regression assertion: collapsing the research shelf after focusing its career résumé must leave the return toolbar visible.
- Source-level JavaScript compilation checks passed for `assets/manager-profile-tabs.mjs`, `scripts/test-browser-release.mjs`, and `scripts/verify-core-consumers.mjs`. These are syntax checks, not actual browser executions.
