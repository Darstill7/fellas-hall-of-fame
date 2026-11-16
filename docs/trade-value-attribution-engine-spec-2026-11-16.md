# The Fellas — Trade Value Attribution Engine v1: research specification

**Checkpoint:** November 16, 2026. **NOT a deployed rating engine.** This is a measurement contract with source-backed preliminary receipts and explicit unknowns.

## Exact question answered by each layer

1. **Completed trade evidence:** did a transaction happen, on what date, between which manager identities, and which assets were received on each side? Use original provider transaction ID and roster owner mapping, not an inferred outcome.
2. **Realized starting production:** how many fantasy points were actually credited to this player as a starter on the recipient roster during a specified window? Identify player ID, manager ID, week and slot. Store each team-player-week **once**.
3. **Above/below-league starter baseline:** observed received-starter position median surplus (descriptive) on the same weeks, not the lost points from assets sent out, not WAR.
4. **Incremental roster impact:** how many points would realistically have been gained relative to a pregame legal roster and available substitutes? **Unknown by default**. Hindsight maximized lineups are optional sensitivity checks, never official gain.
5. **Asset conversion:** the complete outgoing package in a downstream trade and the complete incoming package; link both transaction IDs, but **no automatic profit allocation** to one input asset. An asset converted into another package gets an option-value marker, not the full package's points added on top of the parent trade.
6. **Keeper realization:** preserve original right/cost, selected keeper, draft round, actual selected draft slot and opportunity cost. Keeper eligibility is not automatically a net benefit, and a first-round keeper uses a first-round selection.
7. **Playoff outcomes:** retain actual acquired-player playoff starter points and game result, plus a separate *causal counterfactual unknown* field. A 0.12-point win with a traded player is not proof of a 0.12-point net trade impact.

## Invariants that must be enforced

- Every real trade event is identified by one provider transaction ID. The 2020–2025 represented archive currently has **44** unique IDs; 2026 is a distinct ongoing extension.
- Do **not** add multi-transaction receipts to the same parent's profit twice. The same player's starting points are allocated to the real manager-week only.
- A package's incoming points are not assigned in full to any one of multiple outgoing assets.
- A three-manager transaction has **three independent recipient records**, not a forced binary winner.
- FAAB is an asset; the 2020 Kittle and 2021 Dillon trades cost **$5 FAAB** each. Do not treat them as player-for-nothing or replace dollars with fantasy points absent a league-calibrated exchange rate.
- A player re-trade or a drop/waiver move before a hypothetical week breaks simplistic unchanged-trade scenarios.
- 2026 Week 10 remains *in progress* at this checkpoint: exclude it from completed-week scoring totals. Source-backed completed Weeks 5–9 of the October 7 Chase trade: **Stilly 91.20**, **JMid 74.10**, a **+17.10 raw started-point difference**, **not** a net trade benefit.
- League identity correction: 2023 roster slot 2 belongs to **Evans**, not JMid. JMid joined after 2023. Stover is Gurt (not Tony). Distinguish Scott from account handle Sheffla, Mitch from Hupp, Thommy from Tom.
- Do not inflate before/after windows: the PR #233 strict historical method uses **weeks strictly after trade through Week 14**; the October 2026 completed-week observation includes same-week Week 5 starts. Playoffs and keepers require explicit separate time windows.

## Source-backed chain attribution observations

### 2021 Josh Jacobs

- Aug 30 Tony->Thommy: Hill/Jacobs/Javonte to Thommy; Corey Davis/A.J. Brown/Jonathan Taylor to Tony.
- Aug 31 Thommy->Birch: Lamar Jackson/Mark Andrews/Jacobs to Birch; Prescott/Fant/Antonio Gibson to Thommy.
- Strict Week 1–14 *recipient-started* values of original acquisition: Thommy Tyreek Hill **171.80** (12 starts), Javonte **111.50** (8 starts), Josh Jacobs **0.00** (0 starts). The zero says he was never started before his next-day re-trade; it does **not** mean zero economic value.
- Birch's strictly later acquired-player starter returns from second deal: Lamar **219.98** (11 starts), Mark Andrews **166.60** (12), Jacobs **115.10** (9). Jacobs' share of the 501.68 credited package is **115.10 points**, but that is **not** the contribution of Jacobs to the trade's negotiations or to Thommy's downstream receipts.
- No causal allocator can legitimately credit the complete Prescott/Fant/Gibson return to Jacobs alone; the second transaction also required Lamar and Andrews. Mark contribution fraction as **unknown**.

### 2025–2026 Ja'Marr Chase

- Sep 23, 2025 Stilly acquired Ja'Marr Chase and Chase Brown; later Nov 12 Stilly used Chase and A.J. Brown in the three-party exchange.
- Nov 12 three-party receipts: Stilly acquired Amon-Ra, Addison, Goff; JMid Chase; Thommy A.J. Brown.
- In 2026 JMid kept Chase with first-round pick 1.04; Stilly kept Amon-Ra with first-round pick 1.08.
- Oct 7, 2026, JMid transferred Chase and Vele to Stilly in exchange for Adams/Kittle/Hall. Source-backed weeks 5–9 started points:
  - Stilly: Chase **85.50**, Vele **5.70** => **91.20**
  - JMid: Adams **25.00**, Kittle **38.90**, Hall **10.20** => **74.10**
- October deal raw acquired-starter-point difference is **+17.10 toward Stilly** through completed Week 9, but **without** equal-position substitution, consideration valuation, and remaining season it **cannot** become a trade grade.
- Each JMid acquisition is supported as a *downstream return package*, not triple-counted as profit attributed to the original 2025 Chase acquisition.

## Proposed 0–100 calibration contract (do not calculate scores yet)

**50 = neutral *incremental trade benefit***, measured separately for each side. Derive a signed net per-trade uplift (u_{manager,trade}) (e.g. added expected wins over replacement / comparable opportunity cost), with jointly supported uncertainty; do not force the two sides to sum to zero.

Once a calibrated null distribution of comparable completed deals exists, standardize uplift by transaction season, roster need and opportunities remaining, apply a monotonic symmetric mapping centered on 50, and shrink career manager estimates toward 50 based on *independent* trade count and data quality. Do not use received-starter surplus as if it were the net uplift. Early-season and high-volume traders should not gain an automatic advantage from more receiving-side starts.

Minimum input fields required per rating: transaction and receipts, player IDs and relevant scoring rules, complete trade/add/drop chronology, pre-trade roster and substitutes, final posttrade real starts, playoff contribution, keeper eligibility and round cost when relevant, FAAB spent/earned, uncertainty and evidence provenance. Missing dimensions are *null*, not imputed zero.

A transaction with all participants above 50 is win-win (or win-win-win). If all are below 50, lose-lose; one above one below is asymmetric. **Do not label any particular trade as certified until calibrated causal benefit estimates exist.**

## Manager trading-title contract

Titles are grounded in observed *patterns*, not in leaderboard rank, and should never imply a verified skill rating without evidence.

- **Stew: “The Deal Machine” (proposed frequency title)** is supported by **19 recorded 2020–2025 involvements** in the represented archive, but not proof of trading advantage.
- **Thommy: “The Quick-Flip Artist” (proposed transaction-behavior title)** has the verified next-day 2021 Jacobs transfer; this title describes behavior, not outcome.
- **JMid: “The Asset Recycler” (proposed transaction-behavior title)** is supported by holding Chase as a first-round 2026 keeper before converting him into Adams/Kittle/Hall. This title does not imply that the resulting deal was net-positive.
- Titles for other managers and all official 0–100 scores remain unassigned.

## Additional league-wide trade-chain candidates

The historical all44 reconstructed recipient ledger contains **13 player–season combinations appearing in multiple trades**. See `data-integrity/trade-repeat-asset-index-v1.json`. These are *same-name recipient sequences*, not independently proven uninterrupted ownership paths; resolve provider player IDs, acquisition/drop events and timestamps before upgrading them.

## Evidence and release checkpoints

- Main case source: `data-integrity/trade-asset-chain-jacobs-chase-2026-11-16.json`.
- First scoring audit: `data-integrity/trade-value-attribution-evidence-v1.json`.
- Repeated asset source: `data-integrity/trade-repeat-asset-index-v1.json`.
- Historic 44 evidence ledger: `data-integrity/trade-benefit-evidence-ledger-2026-11-16.json`.
- The 2021 and 2025 transaction chains were additionally checked with original Sleeper completed transaction summaries and nearby weekly roster snapshots; 2026 keeper picks from confirmed draft board.
- Do not merge public frontend, print a “Top 10 Worst Trades” ranking, or fill manager rating numerals until all source/integration quality gates pass. Published editorial copy may describe verified transactions and observed weekly starter points with explicit time windows and without causal language.
