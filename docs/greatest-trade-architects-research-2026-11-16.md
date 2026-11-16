# The Fellas — Greatest Trade Architects
**Research checkpoint:** November 16, 2026. **Classification:** Research-only, not definitive league-history skill grades. Week 10 of 2026 is in progress.

## Findings
1. **Kuhl leads the historic qualified sample:** four favorable outcomes, zero unfavorable, and +243.62 net position-relative post-trade starter PAR in 2020–2025, but those are only four of his ten represented historical transactions. His 2026 receipts have turned sharply against him; do not erase his prior performance.
2. **Birch holds the largest single qualified result:** +131.79 PAR in 2021 trading for Lamar Jackson, Mark Andrews and Josh Jacobs. Only one Birch trade qualifies for the comparable dataset.
3. **Stilly has the largest qualified sample:** eight historical comparable transactions, four favorable and four unfavorable, with +18.21 net PAR. His 2023 Evans/Henry trade also has documented playoff significance.
4. **Stew is the most prolific represented trader:** nineteen recorded event involvements across 2020–2025, but only seven meet strict historical comparison requirements (2 favorable, 5 unfavorable, -53.55 PAR). In 2026 his five completed trade involvements have generated 167.32 acquired starter points, yet his direct raw point-gap sum is -38.22 because the Watson flip greatly favors JMid. This is not a position-adjusted 2026 grade.
5. **Championship impacts complicate regular-season verdicts:** in 2024 Thommy won the championship with 34.60 title-game points from traded-for Tee Higgins even though the regular-season PAR outcome of that deal favored Stilly by +102.92. In 2023 Stilly received 44.98 combined semifinal points from Evans and Henry against Tony after acquiring those players from Tony.
6. **Nine 2026 completed trades:** verified directly through Sleeper by querying each trade week 1–11; the older trade-engine snapshot contains only seven, so it cannot be used alone for current-season completeness.

## Expanded coverage: all 26 previously unqualified historical events
A source-by-source follow-up has now reconstructed all 26 of the 44 historical events absent from the original 18-deal PAR comparison. **23** have both receiving sides and actual regular-season *strictly post-trade* starting-point returns; **one** is a verified three-manager deal; **two** have the other team identified by original Sleeper provider receipts but the compensating asset leg is not recoverable yet. All **85** named player-asset occurrences have a source identity match via the annual starter ledger or an original transaction receipt, including Kenny Gainwell (Sleeper ID 7567), who did not record a 2023 start.

The extra 23 comparisons are **raw started-point observations, not model-consistent PAR**. The older engine differs from the strict week-after-trade starter ledger for **21 of 26** previously unqualified events; at least two bilateral deals actually reverse which receiving side leads in raw points, underlining why merging source windows would be unsafe. The deeper individual receipts and full 26-event tables are documented in [The Other 26 Historical Trades](trade-architects-other-26-audit-2026-11-16.md), with [machine-readable player-ID and week-level evidence](../data-integrity/trade-architects-unqualified-26-research-2026-11-16.json).

## Methods and exclusions
- Historical cohort: 18 fully matched **two-manager** trade events dated 2020–2025, selected from 44 represented events in the historical engine. Starter PAR is the recorded position-relative production from received players in **weeks strictly after** the trade and through regular-season Week 14. It excludes same-week starts, postseason and keeper value. For every qualifying deal, one side's edge equals the negative of the other side's edge.
- Current 2026 cohort: starting points actually credited to acquired players on the receiving manager's roster through a Week 10 in-progress Sleeper lineup snapshot. Same-week eligible starts are included when they occur. The point gap is not position-adjusted; not a legal lineup replacement counterfactual; not comparable to historical PAR.
- No claim that the historic qualified sample is random or comprehensive. No all-time 2016–2026 ranking is authorized until comparable 2016–2019 ESPN trades and incomplete Sleeper transactions are recovered.
- Owner identity: **Evans**, not JMid, managed the 2023 franchise slot. JMid joined in 2024, confirmed by commissioner. Never transfer 2023 accounts, records or trade attribution to JMid through a reused account handle.
- Three-manager trades are valid and must be displayed separately from bilateral comparisons. Keeper eligibility follows the player; FAAB transfers need separately verified amounts. Do not judge a trade poorly merely because draft-pick trading was subsequently banned or a pick transfer was voided.

## Historical qualified manager leaderboard
Ranked by sum of bilateral differences in observed post-trade starter PAR, not by ex-ante decision quality.

| Rank | Manager | Qualified trades | Favorable–unfavorable | Net PAR | Net PAR / qualified deal | Received starter points |
|---:|---|---:|---:|---:|---:|---:|
| 1 | Kuhl | 4 | 4–0 | +243.62 | +60.91 | 605.80 |
| 2 | Birch | 1 | 1–0 | +131.79 | +131.79 | 501.68 |
| 3 | Mitch | 2 | 2–0 | +116.44 | +58.22 | 270.20 |
| 4 | Stilly | 8 | 4–4 | +18.21 | +2.28 | 1,402.18 |
| 5 | JMid | 1 | 0–1 | −41.12 | −41.12 | 34.70 |
| 6 | Stew | 7 | 2–5 | −53.55 | −7.65 | 719.40 |
| 7 | Tony | 6 | 2–4 | −167.19 | −27.86 | 391.56 |
| 8 | Thommy | 7 | 3–4 | −248.20 | −35.46 | 1,032.90 |

Total represented *historical* trade involvements, regardless of qualification: Stew 19, Stilly 13, Thommy 13, Tony 10, Kuhl 10, Evans 6, Stover 5, Birch 4, Mitch 3, JMid 3, Koble 1. The historical engine contains 44 distinct events: 2020 five, 2021 ten, 2022 six, 2023 seven, 2024 eight, 2025 eight. Scott has no 2020–2025 qualifying comparable deal in the strict selection. Do not assign a zero or last-place grade to excluded managers.

## All 18 qualifying historical deal margins
Net PAR gap below is for the named higher-PAR manager; both sides were fully matched. Week and full player sets are retrievable by trade ID in the source registry.

| Season | Transaction ID | Higher-PAR manager | Lower-PAR manager | Gap |
|---:|---|---|---|---:|
| 2020 | 622492390107738112 | Stilly | Tony | +12.17 |
| 2021 | 738428315181928448 | Birch | Thommy | +131.79 |
| 2021 | 754017147822415872 | Tony | Stilly | +50.60 |
| 2021 | 754024908207583232 | Thommy | Stew | +0.85 |
| 2021 | 759191673220775936 | Kuhl | Tony | +65.54 |
| 2022 | 875965138744864768 | Mitch | Stilly | +97.23 |
| 2022 | 881580705233195008 | Thommy | Tony | +38.45 |
| 2022 | 886267215865982976 | Thommy | Stilly | +21.58 |
| 2023 | 1012571602774532096 | Kuhl | Stew | +76.08 |
| 2023 | 1023059879336013824 | Stilly | Tony | +104.99 |
| 2023 | 1031121022772555776 | Mitch | Stew | +19.21 |
| 2023 | 1031251467312775168 | Tony | Stew | +3.36 |
| 2024 | 1139340571111256064 | Kuhl | Thommy | +39.68 |
| 2024 | 1144362000575840256 | Stilly | Thommy | +102.92 |
| 2024 | 1146947320588861440 | Stilly | Thommy | +34.69 |
| 2025 | 1273856224776962053 | Kuhl | Stew | +62.32 |
| 2025 | 1274473433362604032 | Stew | JMid | +41.12 |
| 2025 | 1276026193660899328 | Stew | Stilly | +67.15 |

## Kuhl's four historical favorable receipts
- **2021 versus Tony:** Jarvis Landry + George Kittle versus Kyle Pitts Sr., +65.54 PAR.
- **2023 versus Stew:** James Conner + De'Von Achane + Puka Nacua versus CeeDee Lamb + Travis Etienne Jr., +76.08 PAR.
- **2024 versus Thommy:** J.K. Dobbins versus Tank Dell, +39.68 PAR.
- **2025 versus Stew:** Nico Collins versus Derrick Henry, +62.32 PAR.
These four transactions explain his qualified-sample lead, not comprehensive career superiority.

## 2026 trade-by-trade check-in
**Started points credited to acquired assets through Monday of Week 10.** Figures in this section are *not* PAR and should not appear on the historical PAR leaderboard.

| Week | Manager A (assets and starting points) | Manager B (assets and starting points) | Raw advantage |
|---:|---|---|---|
| 1 | Stilly, MarShawn Lloyd: 12.30 | Thommy, Jonathon Brooks: 0.00 | Stilly +12.30 |
| 1 | Scott, Emeka Egbuka: 57.10 | Stew, Ladd McConkey: 30.30 | Scott +26.80 |
| 2 | Stover, Trevor Lawrence: 118.52 | Thommy, Quinshon Judkins: 82.40 | Stover +36.12 |
| 4 | Stew, Drake Maye + Watson: 106.62 | Kuhl, Jalen Hurts + McConkey: 35.12 | Stew +71.50 |
| 4 | JMid, Watson + J.K. Dobbins: 110.30 | Stew, Jeremiyah Love: 10.50 | JMid +99.80 |
| 5 | Stilly, Ja'Marr Chase + Devaughn Vele: 120.80 | JMid, Adams + Kittle + Hall: 97.30 | Stilly +23.50 |
| 5 | Birch, Vikings DST: 32.00 | Thommy, Deebo Samuel: 25.40 | Birch +6.60 |
| 9 | Stew, Adonai Mitchell: 0.00 | Hupp, Vikings DST: 0.00 | Tied |
| 10 | Stew, Nico Collins: 19.90 | Kuhl, Drake Maye: 3.02 | Stew +16.88 |

2026 raw net advantage by manager (sum of bilateral differences; **not a normalized skill score**): JMid +76.30 (2 deals); Stover +36.12 (1); Stilly +35.80 (2); Scott +26.80 (1); Birch +6.60 (1); Hupp 0.00 (1); Stew −38.22 (5); Thommy −55.02 (3); Kuhl −88.38 (2). Tony has zero 2026 completed trade involvements in this time window.

**Stew's Maye/Watson chain:** 106.62 Maye starter points during his tenure, then Watson flips to JMid and contributes 100.70 started points there; Love produces 10.50 for Stew. Maye returns to Kuhl, contributes 3.02 starter points in an injury-shortened first game, while Nico Collins contributes 19.90 to Stew. The second trade has only a partial week of realized evidence and retained keeper value is unresolved.

## Most frequent bilateral trade rivalry: Stew vs Kuhl
The historical trade engine records **four** completed Stew–Kuhl trade events from 2020–2025: September 22, 2021 (Kenyan Drake + Saquon Barkley for Nyheim Hines + Clyde Edwards-Helaire + Ty'Son Williams), September 27, 2023 (CeeDee Lamb + Travis Etienne Jr. for James Conner + De'Von Achane + Puka Nacua), September 17, 2025 (Derrick Henry for Nico Collins), and November 13, 2025 (Jake Ferguson + Jaylen Warren for Zach Ertz + Derrick Henry). Two further completed 2026 events are documented: September 30 (Drake Maye + Watson for Hurts + McConkey) and November 15 (Nico Collins for Drake Maye). **Six recorded trades as a pair**. Do not treat a mixture of historical raw started-point deltas, strict PAR and 2026 partial results as one lifetime head-to-head win/loss record. Note that Nico Collins and Drake Maye both made round-trip journeys between the two managers across these deals.

## Three-team and championship cases (not ranked bilaterally)
- **November 12, 2025 (Stilly / JMid / Thommy):** documented received-side totals of 199.72 started points for Stilly (Amon-Ra St. Brown + Jordan Addison + Jared Goff), 78.30 for JMid (Ja'Marr Chase), and 98.60 for Thommy (A.J. Brown). This must never be reduced to one binary trade margin. The Amon-Ra 2026 keeper consequences require their own sourced valuation.
- **2023 Stilly / Tony:** Mike Evans + Derrick Henry vs Cooper Kupp, +104.99 observed regular-season PAR for Stilly. Evans and Henry combined for 44.98 semifinal points against Tony; they were part of Stilly's championship season. No causal proof that the title required the deal.
- **2024 Stilly / Thommy:** McLaurin + Achane + Tank Dell vs CMC + Diontae Johnson + Tee Higgins, +102.92 regular-season PAR for Stilly, but Higgins scored 34.60 for championship-winning Thommy. Strong warning against a single-score verdict.

## Recommended website features and data contracts
1. **Architects leaderboard** on `analytics/trades.html`, with explicit filters: *Qualified historical PAR*, *2026 started points*, and *Trade activity volume*. Never blend unlike metrics in one leaderboard.
2. **Manager Trade Passport** on every manager profile: historical represented event count versus qualified deals; net PAR only where eligible; current-year received starters and raw edge; confidence indicator; notable trades and receipts.
3. **Deal detail view**: transaction ID, timestamp, sides, IDs, player assets, FAAB if verified, inherited keeper conditions, weekly starting points and positional PAR, later transfer graph, and separate postseason panel. Flag unverified assets or ambiguous same-week ownership.
4. **Trade family trees** for Maye, Watson, McConkey, Nico Collins and Chase; transfer arrows only when player IDs, sides and timestamps establish direction.
5. **Replacement-aware counterfactual**: use actual contemporaneous legal roster and lineup constraints, rather than simply subtracting received player's total from wins.
6. **Keeper-value second pass**: original draft round, eligibility, next season's inherited cost, injury and opportunity cost. A potential keeper option is not a realized keeper outcome.
7. **Championship trade investigations** linked to the recovered playoff bracket, not copied from regular-season PAR.
8. **Evidence gates:** `scripts/verify-2023-evans-ownership.mjs`, `scripts/verify-greatest-worst-trades.mjs`, completed start ledger parity, ownership and keeper checks, and both Chromium/WebKit browser checks before exposing research grades on the public site.

## Sources
- [Historical trade-side engine](../data/v9_trade_engine.json) (44 distinct 2020–2025 represented events; older 2026 snapshot incomplete)
- [Trade PAR preview](../data/trade_par_preview.json) (18 fully matched bilateral 2020–2025 deals; experimental model)
- [Historical verified trade outcomes](../data/trade_winners_losers_research_2020_2025_v1.json)
- [Greatest/worst trade caveats](../data/greatest_worst_trades_research_v1.json)
- [Three-manager keeper case](../data/multiteam_keeper_trade_case_studies_v1.json)
- [Commissioner ownership/trade rules](../data-integrity/COMMISSIONER_OWNERSHIP_AND_TRADE_RULES_2026-11-06.md)
- 2026 Week 1–11 connected Sleeper completed-trade transactions; 2026 Weeks 1–10 connected Sleeper team starting lineups (Week 10 still in progress).
