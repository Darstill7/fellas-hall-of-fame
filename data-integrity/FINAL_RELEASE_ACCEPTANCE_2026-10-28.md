# Final release acceptance — October 28, 2026

## Privacy audit
- Prior canonical CI run #449 was verified green for public HTML and data JSON's 12 known manager full-name strings.
- Expanded `scripts/verify-core-consumers.mjs` additionally scans served JS, CSS and CSV. Initial run #451 identified obsolete names embedded in `assets/manager-h2h-explorer.js`; commit `94db7ba` removed that mapping. Validation run #453: https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40728784195.
- This is a fixed known-name pattern audit, **not a universal PII audit**. README/docs/scripts, Git commit history, users' real names not in the pattern list, or externally hosted content remain out of scope. Git history cannot be retroactively made private by replacing files in main.

## Editorial review
- Inspected the franchise-story opening copy of all 10 active manager profiles. The fact-oriented claims include championship years, records, owner continuity, seasonal points and transaction highlights. Those are **not** automatically substantiated by the heading-overlap audit.
- Existing CI verifies canonical score projections, archived waiver/trade award numeric parity and their limits, and preservation of historical dossier coverage. It does not independently prove every subjective phrase (e.g. manager reputation, nickname origin, motives, strategic approach, best/worst decision) or each biography claim.
- Approval requires claim-by-claim provenance for all 10 stories: title/year, regular-season record, playoff status, points, trade assets and dates, historical alias continuity, and quoted nicknames. Mark unsupported interpretations as editorial opinion; do not imply verified fact.
- Historical Schermerhorn and Thommy must remain two separate managers. Public display must use league aliases only.

## Mobile release acceptance
- Headless Chromium mobile and WebKit Safari-engine tests exercise 79 routes, 158 + 79 viewport/page visits when CI is green. They do **not** constitute physical iPhone Safari testing.
- A human with a real iPhone must visit the public homepage and representative manager, season, trade, rivalry and archive pages; rotate portrait/landscape; verify no horizontal overflow, legible charts, reachable controls, working selector/filter/touch navigation, browser back, current records, no name leaks, and recovery on poor cellular connection. Test both Safari normal and private browsing if possible.
- No physical iPhone result has been provided or obtained. **Do not mark the release ready** until the device checklist is signed off.

## Release decision
NOT APPROVED FOR SHARING pending actual device QA, claim-level editorial provenance, and verification of the latest intended deployed version.

## Verified after report creation
- GitHub Actions run **#453**, run ID `40728784195`, PR #14 head `892628ae63d3fd862bc1b50aeae96d2d03e19f25`: **completed / success**, canonical-history job completed / success. The release matrix includes 158 Chromium and 79 WebKit page visits, with final independent report gate. Source-code privacy guard now covers known manager names in HTML, all `data/` JSON, and served JS/CSS/CSV. The only code difference between draft PR and main is the workflow comment. https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40728784195
- This does **not** change the physical-device signoff, biography claim-level provenance, public Git history exposure, or latest deployment confirmation statuses.

## Biography qualification pass — October 28
- Reviewed all ten active manager-page franchise story introductions and committed one substantive editorial qualification per manager. Specifically distinguished editorial labels, nickname origins, interpretations of roster construction, process quality, and inferred motives from verifiable archived results.
- No record totals, matchup identities, title years, or measured trade/waiver figures were changed. The original evidence gap for all biographies still requires claim-by-claim source signoff, particularly claims about specific historical acquisitions and seasonal performance.
- Validation-only draft PR #15: https://github.com/Darstill7/fellas-hall-of-fame/pull/15; CI run #466 https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40731584224. At the last observed state it was installing the browser test runtime; do not claim green until GitHub reports completed/success. The PR has only a workflow-comment difference from the profile code on main; do not merge.
- Actual iPhone Safari signoff remains unperformed and launch hold remains in force.

## Canonical biography claim gate — October 28
- Added `scripts/verify-biography-season-claims.mjs` and wired it into the canonical CI workflow. It compares documented Birch 2019, JMid 2024 and Mitch 2025 record/points claims with `data/season_guide.json`, including JMid's 2024 points-leader status, plus 8 title-year claims across Thommy, Stilly, Stover, Tony and Scott. Scope is intentionally narrow: this is not an audit of every trade, nickname or player claim.
- Draft validation PR #16 https://github.com/Darstill7/fellas-hall-of-fame/pull/16; Actions run #470 https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40732123640. The biography source-claim verification step **passed**; latest full Chromium/WebKit job was still running at observation. No physical iPhone test is claimed, release hold remains.

## Transaction-level editorial provenance — October 29
- GitHub Actions run #470 for previous biography factual checks was confirmed completed / success (run ID 40732123640).
- Reviewed direct trade-side evidence in `data/v9_trade_engine.json` against player acquisition statements in current manager profiles. Verified Stilly Mike Evans and Derrick Henry (2023); Stew Justin Jefferson and Ja'Marr Chase (2022); Tony Joe Mixon (2021) and James Robinson (2022); Kuhl J.K. Dobbins (2024); and JMid Kyren Williams and Calvin Ridley (2024). Puka Nacua, Zack Moss, Kyren Williams (Kuhl), and James Cook (JMid) do not have corresponding verified trade-side matches in that model, which does not rule out other transaction origins.
- Updated those four profile introductions to distinguish verified trade assets from other player references. Added `scripts/verify-biography-trade-claims.mjs` to validate six manager/year trade groupings and wired it into canonical CI. Draft PR #17 https://github.com/Darstill7/fellas-hall-of-fame/pull/17 is for validation only, not merge; Actions #478 https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40878826948 confirmed new biography trade check **success**, with Chromium/WebKit full run still underway at last observation.
- Scope limits: partial trade-side model only, not a complete owner transaction ledger, historical trade process grade or proof of every player’s acquisition method. Physical iPhone Safari acceptance remains outstanding; do not share yet.

## CI environment recovery — October 29
- Previous biography trade verification PR #17 run #478 (40878826948) failed **browser installation**, not source audits: GitHub `ubuntu-latest` resolved to Ubuntu 26.04, incompatible with pinned Playwright 1.56.1; browser download failed before test execution. The new trade claim step itself passed.
- Pinned `.github/workflows/verify-canonical-history.yml` from `ubuntu-latest` to `ubuntu-24.04` (commit `62d75f8`) to restore supported Playwright dependencies.
- Draft verification PR #18 https://github.com/Darstill7/fellas-hall-of-fame/pull/18; run #481 https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40920062387. Biography trade claim step passed; browser installation was still running at last observation. Do not report new full green run until verified completed success.
- Physical iPhone acceptance and unverified editorial acquisition modes remain open; release hold continues.

## Biography copy single-source parity — October 29
- Run #481 / 40920062387 completed SUCCESS after pinning Playwright CI to ubuntu-24.04. This clears previous browser-environment failure.
- Found that `data/manager_biographies_awards.json` retained old narrative text even after the current 10 manager profile introductions had been editorially corrected. Updated all ten `biography` strings to mirror the exact published franchise-story introductory copy (excluding dynamic record/game summary); trade and waiver award fields unchanged. Commit `fe1baf4`.
- Added `scripts/verify-biography-editorial-parity.mjs`, wired as a blocking CI step (commits `b7f7ff7` and `0f5f721`). Draft test PR #19 https://github.com/Darstill7/fellas-hall-of-fame/pull/19, Actions #486 https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40929842700. Confirmed editorial parity, factual season/title checks and trade-asset source checks all passed. At last observation, browser installation/expanded Chromium + WebKit still pending; do not infer full green result until completed.
- No device-side physical iPhone acceptance has occurred. Documented history and source parity do not prove every discretionary narrative claim; sharing remains withheld.

## Live-site deployment parity — October 29
- Added a blocking canonical CI step comparing live GitHub Pages byte-for-byte with the tested checkout for seven representative files: homepage, Stilly, Thommy, Stover profiles, generated career core, biography source JSON, and manager encyclopedia JavaScript. Commit `9d5f7cc`.
- Draft validation PR #20 https://github.com/Darstill7/fellas-hall-of-fame/pull/20, Actions #489 https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40930271683: **Verify deployed GitHub Pages files match tested checkout** completed SUCCESS. At latest observation, browser installation was in progress, thus full #489 conclusion unverified. This confirms live parity for listed seven files only, not every published path.
- PR #20 changes only a workflow comment relative to its main baseline; leave unmerged. Device signoff and full editorial provenance are still separate release gates.

## New living Fellas Power Ratings — October 29
- Added `analytics/power-ratings.html` and navigation from the homepage and Hall of Fame, using `assets/fellas-rating-model.mjs` and external `assets/fellas-rating-page.mjs`; 10 active franchise ratings, one decimal, full seven-component breakdown, live canonical guide/career/all-play/verified-season-endings feeds. Historical former managers excluded from current active rankings without deleting their records.
- Formula weights add to 100: championship success 30, verified runner-up 5, regular W/L 20, within-week all-play 15, recent form 15, best completed season 10, tenure 5. Ring equivalent = `0.25 + 0.75 * 0.5^((latest completed season - championship year) / 3.5)`; diminishing-returns championship points = `30 * (1-exp(-sum(equivalents)/1.7))`. Ring age retains some lifetime credit but shifts the current power rating with new seasons. Current 2026 results are provisional and enter recent form with half-season weight.
- Initial source-backed calculation from current data (2026 Week 7), ranked: Thommy 58.7, Tony 47.7, Stover 47.0, Birch 47.0, Stilly 46.6, Scott 44.2, Mitch 44.0, Stew 37.8, JMid 33.6, Kuhl 32.3. Absolute achievement score out of 100, not percentile/forced top-100 scale. Close ranks can tie at one decimal; ties are currently broken alphabetically in sorted display.
- Added `scripts/verify-fellas-rating.mjs` formula/identity invariants and dynamic browser route test for 10 cards; 80 routes now require 160 Chromium +80 WebKit page visits. Browser fixture server now serves .mjs as JavaScript; the page loads ES module as external script to satisfy inline-JS audit. The rating's latest completed season reference is derived from guide rather than frozen at 2025, allowing future season roll-forward.
- Draft validation PR #24: https://github.com/Darstill7/fellas-hall-of-fame/pull/24, Actions run #507: https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40991005554. Formula audit step **passed** at latest observation, browser install still in progress; do **not** claim entire CI green until completed.
- This is a new analytical leaderboard, not the deprecated `data/legacy_score_v1.json`, which remains stale and should be labeled legacy until retired. 2026 is incomplete; league-sharing hold unchanged pending physical iPhone and editorial acceptance.

## All-manager all-time power index expansion — October 29
- Following initial active-manager v1 implementation, expanded `assets/fellas-rating-model.mjs` to **all 14 historical managers**, including former owners Koble, Evans, Halderman and Schermerhorn, preserving separate identities. Their inactivity ages only the recent-form component; lifetime titles and records remain. All current ratings are unchanged. Rating page links active owners to their profile pages and former owners to ESPN Origins (no invented profile pages).
- Added seven-finished-season title count to each rating card, documenting the exact concern: **Thommy has four lifetime rings but only one in 2019–2025**. The formula check asserts `sevenYearTitles===1` for Thommy, with championship aging dynamically moving when a completed season is added to the canonical guide.
- Initial all-14 scores through 2026 Week 7: Thommy 58.7; Tony 47.7; Birch 47.0; Stover 47.0; Stilly 46.6; Scott 44.2; Mitch 44.0; Koble 38.9; Stew 37.8; JMid 33.6; Kuhl 32.3; Evans 29.0; Schermerhorn 26.0; Halderman 25.5. Absolute 100-point scale, not curved.
- New blocking browser assertions expect 14 rendered cards at both widths/engines. Formula/unit audit passed in run #518 / https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40991873158; Chromium was in progress at last observation, so **overall success not yet verified**.
- PR #26 is the current draft verification PR (workflow comment only). Closed superseded draft PRs #21–25 without merging. Preserve existing release hold, editorial scrutiny and physical iPhone Safari signoff.
