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

## November 5 continuation — public identity and ten-profile structural parity

### Completed and committed
- The public `managers/tom/` page now shows **Thommy** in its main heading and source-backed championship text. The route and old data keys remain `tom` / `Tom` as needed for existing archival compatibility. Both the rivalry summary and rivalry analytics display Thommy instead of reverting to Tom.
- All ten raw manager-page heroes now have only two actions: **Explore profile** and **All managers**. `Explore profile` points to the existing `#franchise-story` before JavaScript runs, while the shared module upgrades its destination to the full `#profile-features` directory after mounting.
- Removed the old nine-page JavaScript transformation that split already-short career introductions into a preview and another redundant "Read the full story" disclosure. The complete long-form Career Biography remains one primary, discoverable feature.
- **Stover:** Replaced his bespoke, nonfunctional-without-JS "Pick what you want to see" tab header and four-item quick grid with the same static chapter-navigation skeleton used by the other nine profiles. The shared script now constructs Stover's navigational controls and full feature menu through the same branch as every other manager.
- **Stover:** Removed duplicated story-stat tiles, an overlapping long-form story disclosure, and the stale `142`-games fallback. Retained the founding YogurtSlingers → Gurt franchise context and documented 2022 title in his concise career overview; the full biography and historical sections remain.
- Updated `scripts/test-browser-release.mjs` to check all ten main headings, dynamic hero actions, navigation focus return, and a **single canonical record in the hero** instead of stale test assertions requiring duplicated record and game totals inside the story. It now rejects obsolete extra story cards or disclosures on every manager.
- Expanded `scripts/verify-core-consumers.mjs` to require canonical visible nicknames (including Thommy), exactly two useful source HTML hero actions, shared chapter navigation, concise stories without duplicate source stats, and substantial individual biographies.

### Verification performed
Re-read all ten primary profile HTML files and canonical career, championship and biography JSON after the changes. **10/10 passed** cross-file source checks for public name, current regular-season record, documented championship total/years, two working source-level header actions, chapter navigation, concise nonduplicative overview, and three-paragraph individual biography. This is source verification, not an executed Node or browser suite.

### Remaining release gates
1. Run `node scripts/verify-core-consumers.mjs` in GitHub Actions and inspect the actual result.
2. Confirm Chromium and WebKit end-to-end tests, especially Stover's conversion to the common route, Thommy's manager/slug aliasing, the career biography entry and keyboard focus after return.
3. Inspect the actual 390px and 1280px layouts to confirm biography spacing, feature focus, and readability without overflow.
4. Confirm Pages deployment on the last combined commit. The accessible GitHub connector returned **zero combined status entries**, and its commit-workflow-run lookup covers only pull-request runs; neither output proves push CI or Pages deployment succeeded.

## Historical identity disambiguation — Thommy vs. Schermerhorn

**Firm identity rule:** Current manager **Thommy** is the four-time champion associated with the legacy route `managers/tom/` and internal historic data key `Tom`. **Schermerhorn** is a separate former manager who appeared in the 2016 and 2017 ESPN records. Display the former manager **only as Schermerhorn** throughout all public stories, standings, record books, rivalries, and future imports. Never treat the two as aliases or transfer games, championship results, titles, transactions, or profile links between them.

Canonical source evidence:
- `data/career_core_generated.json`: Thommy 67–75–1 in 143 regular-season games (through 2026 Week 8); Schermerhorn 12–13 in 25 regular-season games across only 2016–2017.
- `data/unified_record_book_2016_2026.json`: three separate regular-season head-to-head games between the individuals, with Thommy 2–1; the 2017 postseason championship bracket includes another matchup.
- `data/manager_record_books_2016_2026.json`: manager entries `Thommy` and `Schermerhorn` coexist as distinct records; no ambiguous `Tom` manager entry.

Safeguards committed:
- Corrected the legacy `Tom`-keyed résumé's **display name** to `Thommy` without changing its compatibility key.
- Clarified the alias metadata in `data/league.json`: only the current manager is `Tom` internally; the former manager is always `Schermerhorn`.
- Added canonical-data assertions to `scripts/verify-core-consumers.mjs` guarding separate records, seasons, direct meetings, the current manager alias and the two independent record-book entries.
- Updated the historical record-book UI: `Schermerhorn` can still be selected and studied, but no longer receives a nonexistent current-manager profile link. `Thommy` continues to link to the established `managers/tom/` page.
- Expanded `scripts/test-browser-release.mjs` to select both names and verify their separate WLT records, distinct profile navigation, and absence of an ambiguous `Tom` option.

This is a source-level identity audit and code correction. Chromium/WebKit runtime checks and Pages publication remain separately unverified.

## November 5 — navigation release gate: direct Explore deep links

- Audited the actual shared profile landing initialization. Found that loading a current manager profile with `#profile-features` invoked the broad `overview` tab and unintentionally left the archived historical sections exposed, unlike opening the same page normally. This undermined the compact mobile-first navigation and could appear clunky for links from other site pages.
- Updated `assets/manager-profile-tabs.mjs` to explicitly recognize `#profile-features` as a **landing-page deep link**, retain that hash, hide the unrelated historical sections, and scroll into the feature directory after it mounts. The ordinary biography/section deep links still resolve via their intended historical category.
- Expanded `scripts/test-browser-release.mjs` to open `managers/stilly/#profile-features`, `managers/tom/#profile-features`, and `managers/stover/#profile-features` at the tested viewport widths. The assertion requires the compact landing state, no visible archive wall, and preservation of the feature-directory URL hash.
- Re-read the ten current HTML profiles and canonical generated records, then checked visible manager identity, career record, two functional static hero actions, shared chapter navigation, short editorial story, full biography paragraph count, and presence of the shared enhancement module. **10/10 source checks passed**. Both modified JavaScript assets passed static compilation.
- **Browser execution is still not confirmed.** The GitHub connector exposed zero combined status entries on the latest commit and does not list push-triggered Actions runs. The external GitHub Actions page and published Pages site were inaccessible to the available browser/search environment. There is no verified Chromium, WebKit, mobile screenshot, or successful Pages publish claim yet.
- Next release step: run and inspect the main-branch canonical workflow, Chromium and WebKit jobs, and Pages deployment; fix any real run failures. Avoid marking visual QA complete until the rendered 390px and 1280px layouts are inspected.

## November 5 continuation — simplify the manager navigation while CI processes

### Fixes published to main
1. **Corrected the historical Records link** in the expandable feature directory. It previously used the raw `manager` value, which was `Tom` on the Thommy profile, while the record-books selector requires the canonical public name `Thommy`. Both routes now use `name` (including Thommy), preventing a silent fallback to the wrong selected record.
2. **Removed redundant choices.** The three primary destinations are **Read [manager]'s career story**, **Records**, and **Report Card**. The expandable directory has **eleven distinct deeper features** in five groups instead of thirteen buttons duplicating two of those primary destinations.
3. Renamed the second group from **Ratings & Report Card** to **Ratings & Legacy**, accurately describing its Legacy OVR and Season OVR content without suggesting the separately featured Report Card is buried there.
4. **Career Story is now a focused reading experience.** Selecting the featured biography hides the dense résumé modules that follow its three paragraphs, but preserves loading/unavailable copy when the biography has not mounted. Returning to the directory removes this isolation state so the complete Legacy Résumé remains available elsewhere.
5. Extended the browser release script to assert: one correctly parameterized featured Records link for every manager, exactly eleven uniquely labeled deeper features, the five correct group labels, isolated biography prose with the full résumé restored on return, and visible title-season context in the career headline.
6. Expanded source verifier assertions to guard the three featured routes and ensure each deeper feature is present **exactly once** in the five menu groups.

### Additional accuracy checks
- Re-read all ten source HTML profiles and canonical career, legacy-title, and biography data. The names, regular-season records, championship counts/years, two source-HTML primary actions, and three-paragraph biographies matched **10/10**.
- Compared the biographical regular-season records and year references against `data/career_core_generated.json` annual entries for all ten managers, including Stover 2021/2022/2024, Thommy 2019/2024, Mitch 2025/2026, Kuhl 2020–2026, and Birch 2019–2021. The cited annual W–L claims were consistent with the ledger-derived season rows. This does not certify every qualitative player or transaction anecdote.
- Checked that all five deeper *dynamic class target families* are emitted by their respective JS modules (`manager-profile-madden.mjs`, `manager-draft-trade-career-page.mjs`, `manager-season-evidence.mjs`, `manager-profile-tabs.mjs`, and `manager-playoff-resume.mjs`). This is structural coverage, not a browser render guarantee.
- Static JavaScript compilation and direct inventory assertions passed. **Do not mark Chromium, WebKit, or Pages green** without actual workflow/browser evidence. The connector currently exposes no push-triggered workflow results or combined status entries.

### Release follow-up
Run canonical validation and Chromium/WebKit browser tests for the latest main revision, inspect focused biography visibility and all eleven feature destinations on 390px and 1280px viewports, and verify published GitHub Pages parity after the run.

## November 5 — original ESPN 2016–2019 brackets recovered

Eight original ESPN winners/consolation screenshots were supplied and cross-checked against `data/espn_history_2016_2019.json`, `data/unified_record_book_2016_2026.json`, and ESPN team `finalRank` fields. Structured provenance now lives in `data-integrity/ESPN_PLAYOFF_FORMAT_EVIDENCE_2016_2019.json`.

**Verified formats:** 2016 winners and consolation rounds were NFL Weeks 14–15 and 16–17 two-week aggregate matchups; 2017 both brackets were NFL Weeks 13–14 and 15–16 two-week aggregate matchups. Thommy's 2017 championship final total of 241 was 126 in NFL Week 15 plus 115 in NFL Week 16, **not one game week**. The 2018 winners bracket was single week each round; 2018 consolation advancement used unusual rules, but final ranks are available. The 2019 winners bracket was single-week; its bottom-four consolation ladder used Week 14–16 *cumulative running points*. Final 2019 ranking from original `finalRank`: Koble 7th (366.60), Thommy 8th (358.30), Stover 9th (328.56), Evans 10th (264.76).

**Identity contradiction requiring confirmation:** User initially labeled “I Love Tubing” as Stew. Original ESPN team ID and owner mapping identifies it as **Evans**; Stew was “Kickers SUCK” and the 2019 championship runner-up. Do not award 2019 last place to Stew without reconciling contrary source evidence.

**Newly recovered placements:** Using original ESPN team `finalRank` fields, upgraded **20 formerly “Finish not certified” current-manager seasons** across 2016–2019 in `data/manager_verified_season_endings_v1.json`; previously certified champion/runner-up entries were retained. This established 2018 Stilly 10th, 2017 Birch 10th, and the 2019 bottom-four placements; former manager ranks are preserved in the new historical evidence file.

**Cumulative scoring correction:** The canonical ledger and season-by-season matchup projection now mark all six 2019 bottom-four ladder entries as `cumulativeScoring` and attach their actual `weeksCovered`. Record-book maxima exclude the multiweek cumulative values from independent postseason matchup scoring records; four inflated career bests (Koble, Thommy, Stover, Evans) were corrected. The public record-book UI now labels 2016–2017 two-week aggregate matchup totals as combined NFL weeks.

**Regression coverage:** Added `scripts/verify-espn-playoff-formats.mjs` and installed it in the main-branch canonical workflow; the script protects original two-week score components, 2019 cumulative scope in both projections, official final ranks, owner separation, recovered season finishes and corrected postseason records. Updated `scripts/verify-specialty-records.mjs` for valid extrema and expanded browser QA for recovered placements and 2017 score labeling. Executed the playoff-format, specialty-record-book, and ledger projection audit scripts against current GitHub files in a JavaScript in-memory emulation of `fs.readFileSync`; **all three passed**. This is not an actual GitHub CI or Chromium/WebKit run.

**Unresolved for editorial awards:** whether “Shitter of the Year” always equals the original ESPN last-place `finalRank`, rather than lowest scoring among all final-round consolation participants. Those differ in some early seasons. Until the user confirms, report last-place finishes but do not blindly backfill the punishment award.

## November 5 — user-certified 2019 owner and Shitter of the Year rule

The user explicitly confirmed (1) **2019 I Love Tubing belonged to Evans**, while Stew managed **Kickers SUCK**, and (2) **Shitter of the Year was awarded to the lowest-scoring team in the final consolation round**. Applied this as the final **LOSERS_CONSOLATION_LADDER** round, excluding the distinct winners' consolation track. Do not equate the punishment award with the official finalRank when they differ.

| Year | Shitter of the Year | Deciding final-round score | Official ESPN rank | Distinction |
|---|---|---|---|---|
| 2016 | **Stilly** | 165 combined, NFL Weeks 16–17 | 6th of 8 | Official ESPN last place was Schermerhorn, not the punishment winner |
| 2017 | **Halderman** | 96 combined, NFL Weeks 15–16 | 6th of 10 | Official ESPN last place was Birch, not the punishment winner |
| 2018 | **Stilly** | 86.76 in NFL Week 16 | 10th of 10 | Last place and punishment winner coincide |
| 2019 | **Evans** (*I Love Tubing*) | 80.46 in NFL Week 16; separate 264.76 cumulative Weeks 14–16 total | 10th of 10 | Last place and punishment winner coincide; Stew was championship runner-up |

**Data & UI changes:**
- Created `data/espn_shitter_of_the_year_2016_2019.json` as a structured primary award projection with all final losers-ladder participants, ESPN team IDs, matchup identifiers, week scopes, owner mappings, user confirmation, and scores.
- Updated `data-integrity/ESPN_PLAYOFF_FORMAT_EVIDENCE_2016_2019.json` to close the owner and award questions; only the detailed 2018 ladder advancement/tiebreak mechanics remain unknown. Official final positions and the punishment award are still verified.
- Added `awards`/`awardNote` to Stilly's 2016 and 2018 season-endings rows; **did not change the official 6th-place and 10th-place finishing positions**.
- Updated `assets/manager-season-history.js` to show awarded Shitter seasons in the mobile accordion and desktop season archive separately from `ending`.
- Added a four-year sourced Shitter table to `seasons/espn-origins.html` (fetches the award JSON; explicitly identifies 2019 Evans and Stew).
- Extended `scripts/verify-espn-playoff-formats.mjs` (already in canonical GitHub Actions) to independently calculate the lowest final losers-consolation scorer from original ESPN games for each year and compare the new awards and current-manager badges. Extended browser checks for the ESPN Origins award table.

**Verification scope:** Re-read original ESPN final-round scores and owner IDs directly. New award calculations and the ESPN format validator passed an in-memory JavaScript execution using the saved GitHub source bytes. GitHub CI push-job statuses and Chromium/WebKit browser execution must still be independently inspected. This does **not** certify any later-year (Sleeper-era) Shitter awards.

## November 5 — original authenticated 2016–2018 ESPN draft and activity recovery

The user supplied three authenticated ESPN `leagueHistory/1313090` exports in order: **2018, 2017 and 2016**. Each contained draft picks, teams, regular-season W/L/T, transaction counters, historical roster settings and the ESPN matchups previously archived. The original exports were read directly and reconciled by ESPN numeric team ID against `data/espn_history_2016_2019.json`. Draft source identities `Thommy` and `Schermerhorn` are kept separate throughout.

| Year | Participants | Rounds | Draft picks | ESPN draft type | Keepers | FAAB enabled |
|---|---:|---:|---:|---|---:|---|
| 2016 | 8 | 16 | **128** | SNAKE | 0 | **No** |
| 2017 | 10 | 16 | **160** | OFFLINE | 0 | **No** |
| 2018 | 10 | 16 | **160** | OFFLINE | 0 | **No** |
| 2019 (previously recovered) | 10 | 15 | **150** | OFFLINE | 0 | **Yes** |
| **Total** | **38 manager-seasons** | | **598** | | | |

**Critical waiver distinction:** The first three exports carry a nominal configured `acquisitionBudget:100` but `isUsingAcquisitionBudget:false`, with actual `acquisitionBudgetSpent:0` for every manager. Thus 2016–2018 were **not FAAB seasons**; do not calculate FAAB efficiency or label $0 as a winning FAAB bid. 2019 was FAAB-enabled. The `auctionBudget:200` field in all years does not imply auction drafting: 2016 was explicitly SNAKE, 2017–2019 OFFLINE, with zero keepers throughout.

**Persisted data:** `data/espn_2016_2018_drafts_activity_verified.json` contains every historical drafted ESPN player ID in overall-pick order (128+160+160), per-year actual team order, all 28 team-season transaction counters, official finishing positions, no-keeper settings, original export hashes, and season score provenance. It omits member UUIDs and real names. `data/espn_2019_draft_activity_verified.json` remains the separate verified 2019 source. The 448 new player-ID sequences were cross-compared in full with the uploaded originals via FNV32 and matched exactly: 2016 `e5d13726`, 2017 `58a36b96`, 2018 `b43eecdc`. No invented player display names or performance-based draft grades were added.

**Website:** `seasons/espn-origins.html` now offers a compact **2016–2019 season selector**, displaying each manager's official finish, number of draft picks, trade participation count, acquisitions, drops, and contextually correct FAAB status (`Not used` in 2016–2018, dollar amounts only in 2019). The table uses nickname identities and keeps player-ID technical data in the structured archive. New browser assertions check all four selected seasons, team counts, the original `Thommy`/`Schermerhorn` distinction, and no-keeper/non-FAAB labeling.

**Regression:** Added `scripts/verify-espn-2016-2018-draft-activity.mjs` alongside existing 2019 verification. It validates all 448 player IDs with source hashes, ten-/eight-team mapping, source regular-season records, zero keepers, waiver rules, and no identity collisions. Both scripts are wired into the canonical GitHub Actions workflow. An in-memory JavaScript execution of **both validators passed** against the current GitHub repository bytes, and changed inline/browser JavaScript passed syntax checks. This does **not** establish live Pages deployment or green Chromium/WebKit CI.

**Opportunity:** These new counters fill previously unsupported ESPN-era drafting and trading *volume* gaps. To grade player-selection *value*, recover ESPN historical player identity catalog and season performance/lineup records first. Transaction counts alone do not establish whether moves improved a team's performance.

## November 5 — 598-player ESPN ID recovery completed and Gronkowski correction

The original 2016–2019 ESPN drafts contain **598 selected player entries** and **296 unique ESPN player IDs** (273 individual-athlete IDs and 23 D/ST franchise IDs). An independently retrieved DynastyProcess historical ESPN ID crosswalk matched 272 athlete identities exactly; ESPN D/ST franchise ID decoding recovered all 23 defenses. The single otherwise unmatched ID `2977698`, Tony's **2017 selection 28**, was explicitly identified by the user as **Glenn Gronkowski**, listed as a New England running back/fullback. The user confirmed Tony had intended to select **Rob Gronkowski** (TE), Glenn's brother, and the league **manually replaced Glenn with Rob after the draft**.

**Keep the two events separate.** Draft provenance: original ESPN selection #28 / Tony / Glenn Gronkowski / ID `2977698` / RB (FB). Post-draft league-admin correction: intended Rob Gronkowski / ESPN ID `13229` / TE. This is first-person commissioner/manager testimony, not an independently verified ESPN ID catalog match or an authenticated correction timestamp. Do not rewrite the original pick as Rob, insert Rob as a second draft pick, or automatically grade Tony's original selection as the productive Rob outcome. The crosswalk explicitly marks `independentEspnIdCrosswalkVerified:false` for Glenn. ESPN-draft names now cover **598/598 selections** with **0 unresolved** (272 independently crosswalked athletes, 23 D/ST identities and 1 user-confirmed Glenn identity).

**2018 order limitation confirmed again:** The user confirmed the 2018 draft was **offline**. The ESPN export is conspicuously grouped by position (all 10 QBs, then two rounds of RBs, then two rounds of WRs, then all TEs), making those source rows unsuitable for claiming a true chronological draft order. All 160 IDs and their owner assignments remain archived. The named draft-board projection sets their `overall`, `round`, and `roundPick` to null and preserves only `sourceRow`, with original-pick rankings disabled. Historical 2016, 2017 and 2019 ESPN source order remains separately preserved in its own dataset.

**Published:** `data/espn_draft_player_identity_2016_2019.json` stores all 296 identities and provenance; `data/espn_draft_boards_named_2016_2019.json` stores all 598 draft rows and distinct original/corrected Tony selections; `seasons/espn-draft-history.html` is the mobile-first searchable draft history, linked from `seasons/espn-origins.html`. Its 2017 Tony view now explicitly notes the Glenn-to-Rob correction rather than hiding it. Updated `scripts/verify-espn-player-identities.mjs` and `scripts/test-browser-release.mjs` protect the distinction and 2018 source-order caveat. The identity verification passed when executed against source bytes from the connected repository. Actual Chromium/WebKit runs and Pages deployment remain unverified.
