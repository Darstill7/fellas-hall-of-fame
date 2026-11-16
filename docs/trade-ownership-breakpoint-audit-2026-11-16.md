# Historical trade chain breakpoints — five-deal research correction

**Checkpoint:** November 16, 2026. **Research-only. No 0–100 trading scores or causal verdicts authorized.**

## Why this correction matters

Our previous five-trade experiment used **44 sampled manager-week retrospective lineup comparisons**, of which 29 had every surrendered asset present in the opposing roster snapshot. That is *not* sufficient to validate a no-trade season: a player may have been re-traded, waived or injured after the original deal, and reversing only the original transaction while preserving subsequent transactions can create logically impossible rosters.

A separate audit now matches the five target trades to every *recorded later trade* for their received player assets in the archived `data/trade_lineage_v2.json`. This identifies **12 manager-week samples that fall after a known same-season asset re-trade**. Two of those 12 previously had numerical hindsight comparisons. Their numbers remain in the raw sample file for audit, but **must not appear as supported unchanged-trade comparisons in editorial summaries**.

After both gates (all surrendered assets found; no later same-season asset trade observed), **25 of 44** sampled manager-week observations remain *eligible for exploratory hindsight sensitivity only*. **None of the 44** are certified causal trade benefit estimates.

| Original trade | First subsequent recorded transfer of an original asset | Consequence |
|---|---|---|
| **2021 W1 Tony–Thommy** (ID `737360507476066304`) | **2021-08-31:** Thommy traded **Josh Jacobs** to Birch (ID `738428315181928448`), one day after the original 2021-08-30 exchange | All 8 sampled manager-week comparisons (Weeks 2/6/10/14) occur after another trade. The original deal's return includes Jacobs' immediate re-trade leverage; the original one-trade-only rollback is logically incomplete. |
| **2025 W3 Stilly–Stew** (ID `1276026193660899328`) | **2025-11-12:** **Ja'Marr Chase** moved into the three-manager trade to JMid (ID `1294402688213057536`) | Weeks 12/16 (4 manager-week observations) fall after the re-trade and must be excluded from unchanged-trade comparisons. Weeks 4/8 remain illustrative only. |
| **2023 W6 Stew–Birch** (ID `1018289561511682048`) | No further trade identified among the original received assets in the *trade-only lineage index* | Three of eight snapshots had full opposing asset coverage. No later-trade event **does not** prove the player was continuously rostered; drops/waivers still need auditing. |
| **2024 W3 Stilly–Thommy** (ID `1144362000575840256`) | No further trade identified among the original received assets in the *trade-only lineage index* | Six of eight snapshots had full asset coverage. Future ownership, add/drop changes and pre-game roster decisions still not reconstructed. |
| **2025 W11 Stilly–JMid–Thommy** (ID `1294402688213057536`) | Next recorded asset re-trade: **2026-10-07**, JMid sent Chase to Stilly (ID `1413584172332654592`) | All 12 sampled 2025 manager-week comparisons occur before the next *recorded trade* of an original asset. Keeper and waived-player trajectories remain unmodeled. |

**Important technical distinction:** The 2021 Jacobs and 2025 Chase cases show *known* breakpoints; the other cases only lack recorded re-trade events, **not** proof of ownership continuity or legal no-trade outcomes. `trade_lineage_v2.json` itself specifically states that trade appearances do not prove continuous ownership.

## Safeguards required for 0–100 rating and Greatest/Worst Trade awards

1. Verify complete provider transaction sequences (trades and adds/drops) and player IDs—not name-only matching—through a fixed evaluation window.
2. Build a no-trade causal dependency graph. On a counterfactual branch, do not copy downstream trades that depend on assets the manager no longer possesses. Label manager decision choices **unknown** rather than silently assuming an alternate move.
3. Track each manager's acquisition, availability, post-trade starts, postseason contribution, keeper draft round and FAAB option value independently. Three-manager exchanges have three benefit records.
4. Anchor replacement calculations in contemporaneous pregame roster eligibility; perfect-hindsight optimal lineups are only a sensitivity ceiling.
5. Require evidence confidence tiers before assigning any rating; 50 must represent explicitly calibrated neutral impact, not a simple transformation of unadjusted receiving-side point gaps.
6. Preserve negative/positive two-sided benefit simultaneously, so win-win, lose-lose, asymmetric and approximately neutral are all possible once causal comparison is actually supported.

**Machine-readable audit:** [trade-ownership-breakpoint-audit-v1.json](../data-integrity/trade-ownership-breakpoint-audit-v1.json). Previous sampled input files remain unmodified, so historical reconstruction can be repeated independently.

**Publication gate:** Research only, draft PR #234. Its expanded starter-median source is independently under consideration in PR #233. No public ratings, titles, record book awards or front-end changes should be asserted without code/data/visual validation.
