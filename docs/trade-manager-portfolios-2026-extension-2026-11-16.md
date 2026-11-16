# The Fellas — 2026 Trade Portfolio Extension and Signature Receipts

Research checkpoint: 2026-11-16, Monday of incomplete NFL/fantasy Week 10. Draft research PR #234; no public release.

## Completed current-season audit

- Original completed Sleeper transactions queried for every Week 1–10 in 2026 league 1340027406009761792: nine distinct complete player trades, 18 manager sides.
- Trade directions compared against historical Sleeper roster membership for every participant, including two September 30 trades: Watson passed Kuhl -> Stew -> JMid. Same-day timestamps establish ordering; no independent economic pricing implied.
- Archived current-season starter source data/player_starts_2026.json contains finalized Weeks 1–9 only as of this checkpoint.
- Strictly later credited starting points from acquired players are evaluated through Week 9. Same-week credited points are stored separately because a lineup could have locked before a transaction was completed.
- For completed Week 9 and Week 10 trades there is no eligible strictly later finalized week; mark starter points/starts NULL and status pending, **never 0**.
- For player assets with a real later completed window but no acquired-player starter appearances, the observed starter total is 0; this is not a negative valuation.

## Counts by 2026 manager

| Manager | Completed 2026 trades | Observed later-week starter points through Week 9 | Trades pending later-week sample |
|---|---:|---:|---:|
| Stew | 5 | 124.72 | 2 |
| Stilly | 2 | 82.10 | 0 |
| Thommy | 3 | 67.80 | 0 |
| Tony | 0 | 0.00 | 0 |
| Kuhl | 2 | 22.60 | 1 |
| Stover | 1 | 85.58 | 0 |
| Birch | 1 | 20.00 | 0 |
| Mitch | 1 | 0.00 | 1 |
| JMid | 2 | 148.50 | 0 |
| Scott | 1 | 48.30 | 0 |

These are raw received-player starter points, **not net trade gains**. Different trade dates, package sizes and starting opportunities prevent direct skill comparisons. The 2026 Week 5 Chase-Adams/Kittle/Hall deal is stored with strictly-later Weeks 6–9 scoring (Stilly 73.50, JMid 49.60), while the distinct earlier complete-week-inclusive Weeks 5–9 analysis reported 91.20 and 74.10. The difference is entirely a scoring-window definition change; do not mix or compare the metrics without labeling the window.

## Signature receipt cards

Created data-integrity/trade-manager-signature-receipts-v1.json, covering 12 historical manager portfolios and a separate 2026 highlight where eligible. Each signature is only the transaction with the highest recorded acquired-player starter points in that manager's **historical post-trade through Week 14 sample**. No equal-duration normalization or loss-side valuation, so this is not a Greatest Trade award or trading skill ranking.

## Website changes

managers/trade-portfolios.html now independently loads:

- data-integrity/trade-manager-portfolios-48-event-v1.json (2020–2025 historical)
- data-integrity/trade-manager-portfolios-2026-current-v1.json (2026, Week10 incomplete)
- data-integrity/trade-manager-signature-receipts-v1.json (evidence-labeled signature receipt)

2026 transactions are shown in a separate section in each active manager portfolio, with manager-specific incoming/outgoing asset lists and pending indicators. Historical alumni receive no fabricated 2026 profile. The existing 48 historical events remain unchanged and can be found through original manager franchise hero links or the directory.

## QA

- 12/12 internal data consistency checks passed for 48 historical events, 98 historical manager sides, nine 2026 events, 18 current sides, ten current managers, 12 signature records, absence of Week10 scoring, pending NULL samples and null 0–100 skill ratings.
- New page inline JavaScript parsed successfully through a JavaScript syntax checker.
- This is not a substitute for an actual Chromium/WebKit browser run, mobile screenshots, data fetching smoke test or GitHub Actions CI review.

## Next priorities

1. Run actual browser and mobile visual QA before merging PR #234 or claiming public availability.
2. Integrate a scheduled after-week-final import to refresh the 2026 trade scoring windows and presentation—only with a real supported automation and its permission.
3. Add verified outgoing asset IDs and keeper-round opportunity costs where historical data exists.
4. Build causal, uncertainty-calibrated manager Trade Ratings separately. Do not grade FAAB-only events as player swaps.
5. Recover 2016–2019 ESPN trade history before labeling the 2020–2026 dataset all-time.

