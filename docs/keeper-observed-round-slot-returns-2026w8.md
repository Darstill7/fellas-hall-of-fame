# 2026 Keeper Round-Slot Returns — Observed, Not Decision Grades

**Snapshot:** Verified 2026 Week 8 only. **Source:** `data/draft_intelligence_research_2025_2026w8_v1.json` (`keeperResearch.season2026`). There are 20 retained players across 10 current managers. This file makes descriptive **after-the-fact** round-slot research easier to audit. It does **not** establish who should have been kept at the keeper deadline.

## How to read this evidence

- **Credited starter points** include only the keeper's original manager's verified starts through Week 8. Benched points and points after any trade to a different manager are excluded.
- **Observed same-round return** = those credited points minus the median credited starter points from *ordinary, nonkeeper selections made in the same draft round by other managers*. A positive result does not demonstrate good keeper decision quality. Each keeper has at least three valid comparison picks.
- The opportunity cost of keeper choice **cannot be computed** without the true eligible alternatives, keeper escalation rules, rosters at lock, and draft-pick ownership. That missing value remains unavailable, never zero.
- These are cumulative Week 8 receipts; a keeper injured or used fewer weeks will have a lower score regardless of the reasoning at the deadline. Do not turn this table into a manager skill ranking.

## Ranked observed 2026 round-slot outcomes

| # | Manager | Keeper | Keeper round | Original-manager starts | Starter pts W1–8 | Other ordinary picks in round | Peer median starter pts | Observed round-slot return | Keeper decision grade |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | Mitch | Jaxon Smith-Njigba | 7 | 8 | 190.96 | 8 | 19.90 | +171.06 | **Unavailable** |
| 2 | Tony | Javonte Williams | 10 | 8 | 125.20 | 8 | 0.95 | +124.25 | **Unavailable** |
| 3 | Tony | Brock Bowers | 7 | 6 | 103.20 | 8 | 19.90 | +83.30 | **Unavailable** |
| 4 | Stilly | Jayden Daniels | 12 | 4 | 81.98 | 9 | 6.40 | +75.58 | **Unavailable** |
| 5 | Stew | Jahmyr Gibbs | 1 | 7 | 178.80 | 5 | 106.60 | +72.20 | **Unavailable** |
| 6 | Thommy | Tee Higgins | 5 | 7 | 120.10 | 7 | 61.90 | +58.20 | **Unavailable** |
| 7 | Mitch | Tyler Warren | 8 | 6 | 58.70 | 8 | 7.30 | +51.40 | **Unavailable** |
| 8 | Birch | Cam Skattebo | 10 | 6 | 43.30 | 8 | 0.95 | +42.35 | **Unavailable** |
| 9 | Stover | Matthew Stafford | 9 | 3 | 37.48 | 9 | 0.00 | +37.48 | **Unavailable** |
| 10 | Scott | Bijan Robinson | 1 | 8 | 139.80 | 5 | 106.60 | +33.20 | **Unavailable** |
| 11 | Kuhl | Drake Maye | 14 | 3 | 20.60 | 9 | 11.00 | +9.60 | **Unavailable** |
| 12 | Stilly | Amon-Ra St. Brown | 1 | 7 | 113.50 | 5 | 106.60 | +6.90 | **Unavailable** |
| 13 | Thommy | Puka Nacua | 1 | 6 | 112.60 | 5 | 106.60 | +6.00 | **Unavailable** |
| 14 | Scott | Ladd McConkey | 8 | 0 | 0.00 | 8 | 7.30 | -7.30 | **Unavailable** |
| 15 | Birch | Rashee Rice | 5 | 5 | 46.30 | 7 | 61.90 | -15.60 | **Unavailable** |
| 16 | Stover | DeVonta Smith | 5 | 3 | 39.00 | 7 | 61.90 | -22.90 | **Unavailable** |
| 17 | Kuhl | Nico Collins | 3 | 5 | 66.10 | 9 | 92.20 | -26.10 | **Unavailable** |
| 18 | JMid | Ja'Marr Chase | 1 | 4 | 49.70 | 5 | 106.60 | -56.90 | **Unavailable** |
| 19 | JMid | Rome Odunze | 6 | 1 | 7.20 | 8 | 66.45 | -59.25 | **Unavailable** |
| 20 | Stew | Emeka Egbuka | 6 | 0 | 0.00 | 8 | 66.45 | -66.45 | **Unavailable** |

## Research priorities before grading any keeper decision

1. Recover the exact keeper lock date, league settings and round-cost escalation/penalty rules for the chosen season.
2. Reconstruct the full roster and keeper-eligible options at lock for each of the ten managers, excluding players not yet acquired or no longer eligible.
3. Reconcile traded draft-pick ownership and any round conflicts between candidate pairs.
4. Capture pre-deadline player forecasts for **ex ante** decision value; keep 2026 actual performance as an independent **ex post** column.
5. Compare each valid **pair** of available keeper options, not just an isolated player's score; explicitly mark unverified alternative choices as unknown.
6. Verify every inferred player ownership and acquisition against historical Sleeper transactions, particularly the Evans-to-JMid 2023/2024 league tenure transition.

## Data-integrity gates for the next keeper feature

- Exactly 10 managers, two selections each, 20 keeper rows in 2026.
- No keeper decision grade or true opportunity cost unless all supporting evidence is present.
- Never substitute a same-round median for a specifically eligible alternative player.
- No cumulative 2026 values portrayed as full-season awards.
- Provenance must survive source refresh, trades and drop/waiver exclusions.

**Publication recommendation:** Can display as a qualified `Observed Keeper Round-Slot Return` board with explicit Week 8 scope. Do **not** label it `Best Keeper Decisions`, `Keeper Decision Score`, or award winner/loser grades yet.
