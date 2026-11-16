# The Fellas — Manager Trade Portfolios v1

Research checkpoint: November 16, 2026. Draft PR #234 research branch only, not deployed.

## Implemented

- 12 profiles: ten current managers (Stilly, Stew, Thommy, Tony, Kuhl, Stover, Birch, Mitch, JMid, Scott) plus Evans and Koble as historical-only.
- 48 completed provider transactions for 2020–2025: 41 player-player, 2 player-for-$5 FAAB, 2 three-manager, 3 $1 FAAB-only.
- 98 manager-event involvements (a multi-manager transaction counts once for every participant).
- Searchable, mobile-responsive managers/trade-portfolios.html with current/historical filter, each manager's partners, yearly activity, evidence-linked trade log, and repeat-asset notes.
- Manager-directory link and 10 verified direct franchise hero links to the manager-specific portfolio hash.
- No ratings, ranked best/worst trades or causally attributed victories.

## Manager activity totals

| Manager | Events | Player-receiving events | FAAB-only events | Observed regular-season received-player starter points |
|---|---:|---:|---:|---:|
| Stew | 23 | 20 | 2 | 1,655.66 |
| Stilly | 17 | 14 | 3 | 1,868.00 |
| Thommy | 14 | 14 | 0 | 1,840.30 |
| Tony | 11 | 10 | 1 | 1,219.86 |
| Kuhl | 10 | 10 | 0 | 989.38 |
| Evans | 6 | 6 | 0 | 806.30 |
| Stover | 5 | 5 | 0 | 317.10 |
| Birch | 4 | 4 | 0 | 697.88 |
| Mitch | 4 | 3 | 0 | 270.20 |
| JMid | 3 | 3 | 0 | 238.60 |
| Koble | 1 | 1 | 0 | 120.30 |
| Scott | 0 | 0 | 0 | 0.00 |

Raw received-player starter production is NOT trade benefit. Different numbers of received players and opportunities to start them make comparisons unequal. Scores are strictly after the trade through Week 14; the recovered 2023 three-way uses Weeks 11–14. FAAB-only has no player points. Scott's zero means no documented trade event in this 2020–2025 scope, not poor trading skill.

## Data sources and limitations

- data-integrity/trade-manager-portfolios-48-event-v1.json is sourced from data-integrity/trade-receipts-2020-2025-48-events-v2.json and the independently audited recovered 2023 three-manager Week10 starter scoring.
- In many legacy transaction records, a manager's sent package is not specified as an explicit per-side list. Keep it null instead of inferring from other transactions or snapshots.
- October 25, 2020: two opposite-direction $1 FAAB-only events are confirmed from user Sleeper screenshots, but exact event-ID direction is unresolved.
- All historical causal skill and win-loss benefits are unestimated. Career trade ratings, awards, best/worst transactions remain null.
- 2016–2019 ESPN and ongoing 2026 are outside this historical dataset.

## QA

14/14 source and link readback consistency checks passed for unique 48 IDs, 98 manager sides, all 12 portfolio timelines, yearly sums, valid data path, 10 franchise buttons, manager directory link, unrated records and safe DOM rendering. The inline browser JS was syntax-checked successfully.

This does not constitute Chromium/WebKit UI tests, canonical CI verification or deployment. Do not merge or publicly claim all-green until those gates pass.

## Next

Add full outgoing asset player IDs across legacy trades, 2026 current-season portfolio extension, independent keeper/FAAB valuation, manager record cross-links, and tested evidence-labeled editorial highlights. Complete 2016–2019 ESPN archive before calling activity totals all-time.
