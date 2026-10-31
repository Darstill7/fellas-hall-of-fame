# Next phase: manager-season evidence coverage (prepared 2026-10-30)

## Why this exists
The Hall of Fame has sufficient verified core league results, but archived roster, acquisition, draft, and trade files do not in themselves certify drafting, trading, waiver, FAAB, or lineup *skill*. The public ratings must not change based on this exploratory inventory.

## Read-only inventory
From the repository root:
```bash
node scripts/build-manager-season-evidence-matrix.mjs > /tmp/fellas-manager-season-evidence.json
```
Or use the optional relative output path:
```bash
node scripts/build-manager-season-evidence-matrix.mjs data-integrity/generated/manager-season-evidence.json
```
Do not add generated files to the public website before reviewing for privacy and consistency. The generator reads the current canonical career records and checks whether supporting files exist. It does not change any canonical file, rating, roster, or matchup.

## Validation before publishing a coverage matrix
- Confirm active and alumni identities/season participation against the identity map, including Tom/Thommy and distinct Schermerhorn; avoid exposing real names.
- Validate per-manager attribution **inside** shared drafts, trades, acquisitions and roster snapshots. A present annual file does not imply complete individual evidence.
- Reconcile observed roster-week counts, rules, flex positions, injury reserve/taxi status and pre-kickoff availability.
- Verify actual historic FAAB bids from original receipts. Never substitute editorial lab amounts.
- Respect the 2026 partial-season boundary and differing latest-completed-week feeds.
- Keep regular-season/verified postseason success separate from provisional draft/trade estimates and ungraded decision skills.
- Maintain visible missing/partial labels; never convert absence into a zero or disadvantage.
- Retest canonical records, Chromium and WebKit separately before release.

## Known release blocker
Latest canonical CI for commit a4c9d10b completed in failure (Madden verification, Chromium, WebKit). GitHub Pages deployment succeeded, but is not a release signoff. Maintain no-share hold.

## Implementation handoff
1. Diagnose current test failures using completed job artifacts/logs, not guesses.
2. Execute the read-only inventory locally or in a separate non-blocking development workflow.
3. Cross-check shared file contents by manager and season; then produce a manually reviewed evidence-gap priority table.
4. Only after review, decide whether any advanced skill metric has enough ex-ante evidence to be graded.
