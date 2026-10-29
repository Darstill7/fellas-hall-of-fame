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
