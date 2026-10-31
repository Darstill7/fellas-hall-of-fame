# FAAB evidence and rating gate — 2026-10-30

## Purpose
Continue the Fellas manager-report-card initiative without inventing acquisition skill from transaction volume, winning bids, or incomplete budget data. This is a research/implementation gate, **not** a certified manager ranking.

## Confirmed source and coverage
- Working aggregate: `data-integrity/faab-manager-spend-research-v1.json` (its internal schema is v2, filename retained for compatibility).
- As of the October 30 recovery, provider-observed Sleeper claim evidence spans **2020–2025 weeks 1–18**, with **2026 through week 7 only**. ESPN 2016–2019 acquisition prices are not established here.
- Completed claims, including successful zero-dollar claims, are separately counted from failed claims. Completed bid spend comes only from claims with status `complete`.
- The research's `completedNotInOldArchive` field flags completed claims absent from the previous archival extract. Do not discard these records when merging.
- Failed bid totals are *attempted* prices, not money spent. Failed claims may be invalid or rejected for reasons other than a better competing offer.
- Starting bankrolls, budget replenishment, resale/refund policies, full 2026 season, actual next-best alternatives, and acquisition contribution to wins have not all been established. Do not call a manager's dollar spend an efficiency score.

## Deterministic validation checks to implement
1. For each manager-season: `completedClaims === paidWins + zeroDollarWins`; `completedBidSpend >= 0`; all counts and bid totals nonnegative integers.
2. Unique `(season, provider transaction ID, manager identity, player ID)` keys for completed claim receipt rows; investigate exact duplicates before merging.
3. Recalculate each manager-season from **transaction receipts**, not by summing the legacy and new aggregates; fail the check on mismatches.
4. Recalculate career totals from manager-season rows, verifying manager aliases against the canonical identity map, and report any unmapped manager.
5. Explicitly expose partial seasons (`2026 through Week 7`) and unavailable pre-Sleeper values; never render absent data as a zero.
6. Preserve postseason receipt classification so regular-season-only and full-season views remain distinguishable.
7. Spot-check timestamp, player add/drop, transaction status, winning bid, and whether the claim existed in the earlier archive. Surface provenance per notable claim.
8. Protect against counting `failedAttemptedBidTotal` as `completedBidSpend` in every UI/data consumer.

## Report-card display rule
Show historical acquisition activity as descriptive evidence first:
- Successful paid claims, successful $0 claims, confirmed paid spend, observed unsuccessful attempts, season scope, and a coverage badge.
- Show `FAAB Skill — N/A (under review)` until the effectiveness model passes the tests below.
- Do **not** reward sheer spending, claim count, lack of activity, or a high winning-bid rate as if those demonstrate skill.

## Future performance-derived FAAB grade — proposed model (not yet in production)
Require comparable player-week scoring data, roster timestamps, transaction timestamps, and weekly starting lineup plus league scoring settings.
- **40%** realized acquisition contribution: points above an available replacement baseline *after the claim*, within a consistent evaluation horizon; avoid double-counting late-season playoff impact.
- **25%** price-adjusted surplus: realized incremental value compared with acquisition cost, normalized within league season and accounting for $0 claims; do not presume a fixed $100 budget historically.
- **20%** lineup leverage: incremental points actually used as starters versus a counterfactual eligible replacement, with injury/inactivity exclusions and pregame eligibility.
- **15%** sustained value: contributions over subsequent weeks, with temporal availability and roster ownership checks.
Only score cohorts with documented common baselines. Use coverage-based shrinkage or N/A for sparse samples; do not equate a missing period with poor performance.

## Integration and release gates
- Keep the site's existing title/playoff-first Madden overall methodology. FAAB belongs in the **Waiver / Free Agency** subcategory; never silently change the core success weights to accommodate it.
- One decimal display only after the underlying grade has been certified. Include source/coverage status and explanation near the grade.
- Add unit fixtures for $0 wins, failed transactions, postseason claims, transferred manager identity, duplicate receipts, and 2026 partial-season data.
- Test on all ten primary report cards and the manager profile drill-down; compare desktop/mobile and navigation, then obtain actual green canonical CI + Chromium + WebKit results on the corresponding commit.
- Leave the public share gate closed until data, mobile/browser, editorial, and deployment checks are independently verified.

## Immediate next engineering step
Locate and validate each raw receipt source referenced by the manager-spend research file. Implement the eight deterministic checks above as an executable repository test and wire it into canonical CI. After that, join acquisitions to canonical weekly scoring/lineup history, measure coverage, and only then consider a numeric FAAB skill rating.
