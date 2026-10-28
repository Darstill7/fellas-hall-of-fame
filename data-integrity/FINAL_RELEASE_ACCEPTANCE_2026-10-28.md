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
