# Fellas historical trades — provider census correction and recovered 2023 nine-player three-team deal

**Research checkpoint:** November 16, 2026. **Release status:** DRAFT. Prior 44-event comparisons are a *research subset*, not an exhaustive 2020–2025 census. Do not publish corrected all-time totals or individual 0–100 manager skills until full recalculation.

## Full 2020–2025 completed-event census

Rechecked **every Sleeper matchup week 1–17** in each of the six historical seasons (102 season-week requests, all successful). Compared distinct provider `type=trade, status=complete` transaction IDs against the prior 44-event ledger.

| Season | Completed Sleeper trade events | Previously modeled | Missing |
|---|---:|---:|---:|
| 2020 | 8 | 5 | 3 |
| 2021 | 10 | 10 | 0 |
| 2022 | 6 | 6 | 0 |
| 2023 | 8 | 7 | 1 |
| 2024 | 8 | 8 | 0 |
| 2025 | 8 | 8 | 0 |
| **Total** | **48** | **44** | **4** |

**Crucial nuance:** The three absent 2020 events (`614536176472264704`, `625903284296683520`, `625902992721264640`) report completed trade status and team participants but **zero player or draft pick assets in the available provider transaction summaries**. The connector's `faab_bid` is null, which is NOT evidence that no FAAB changed hands; trade-side waiver-budget transfers may not be exposed by this field. These records cannot yet be described as “free trades”, valid swaps of specific players, or proven no-consideration transactions. Recover original accepted Sleeper receipts or underlying raw `waiver_budget` metadata if permitted. Counts of completed provider *events* include all three; count of confirmed *player-bearing* exchanges is **45**.

The only newly recovered player-bearing trade is the 2023 Week 10 three-manager transaction below. This changes the research's historical exchange structure from 41 two-party player swaps + two $5 FAAB swaps + one three-manager event = **44 represented**, to **41 two-party player swaps + two $5 FAAB swaps + two three-manager events = 45 confirmed player-bearing exchanges**, plus three unresolved 2020 completed events. The two 2020 $5 FAAB acquisitions remain independently supported by participant screenshots.

## November 8, 2023 — overlooked three-party blockbuster

**Sleeper transaction:** `1028057686711058432`; **completed**; rosters 1 Stilly, 3 Thommy and 4 Stew; nine distinct players. Recovered player direction from matched Week 9 and Week 10 roster ownership snapshots.

| Manager | Sent | Received |
|---|---|---|
| **Stilly** | Josh Jacobs; DeAndre Hopkins; Gus Edwards | David Montgomery; Courtland Sutton; Jaylen Waddle |
| **Thommy** | Jaylen Waddle; Amari Cooper; David Montgomery | Tony Pollard; Davante Adams; Gus Edwards |
| **Stew** | Tony Pollard; Davante Adams; Courtland Sutton | Josh Jacobs; Amari Cooper; DeAndre Hopkins |

**Other same-day trade** `1028065885325508608` (2023 W10, rosters 2 and 4) involved Joe Mixon/Jordan Addison and is already in the old 44 ledger; it does not invalidate the new three-manager transaction.

### Recovered starting production

Credited starter points on the new recipients, strictly subsequent regular-season Weeks **11–14**, plus separate observed Weeks **15–17**; same-week Week 10 starts excluded so no lock-time assumption is required:

| Manager | W11–14 starting points | W15–17 starting points | Total W11–17 |
|---|---:|---:|---:|
| Stilly | 95.40 (8 starts) | 67.50 | **162.90** |
| Thommy | 106.20 (9 starts) | 106.70 | **212.90** |
| Stew | 60.60 (4 starts) | 16.80 | **77.40** |

These are **raw received-player starter points**, not improvement compared to the sent assets, equal-position replacement baselines, or proof that anyone won the trade. In particular, Stew re-traded Josh Jacobs and Amari Cooper shortly afterward; original acquired asset value includes transaction proceeds, not only the points started.

### Why it materially changes the earlier Birch–Stew Lamb audit

- **October 12, 2023**, Week 6, Stew receives **Tony Pollard and Jaxon Smith-Njigba**, sending CeeDee Lamb and Kenny Gainwell to Birch.
- **November 5, 2023**, Week 9, Birch **drops Kenny Gainwell** in a completed add/drop (`1026923055127437312`) to acquire Keaontay Ingram.
- **November 8, 2023**, Week 10, Stew transfers **Tony Pollard** to Thommy in the newly recovered three-party trade (`1028057686711058432`).
- Therefore the prior Week 9+ no-trade rollback involving Kenny Gainwell and Week 10+ comparisons involving Pollard must **not** be treated as coherent no-trade lineup reconstructions. We now know these disappearances are due to observed intervening transactions; substituting zeros for them would have been incorrect.
- The seven-week Lamb vs Birch's actual WR bench sensitivity remains correct as a **hindsight single-slot exercise**, but must not be mislabelled a complete trade-caused uplift.

### What “trade chain” should now mean

At minimum 2023 shows **Stew acquired Lamb -> traded Lamb for Pollard/JSN -> traded Pollard again within four weeks**. Any credit for the original Lamb acquisition must distinguish Lamb's intermediate lineup use, the conversion to Pollard/JSN, Pollard's next conversion in a nine-player package, and any changes in later start decisions. The original acquisition did not *automatically* cause every future deal or return package.

## Mandatory research correction gates

1. Label old `trade-benefit-evidence-ledger-2026-11-16.json` and all 44-derived frequency tables as **44-event subset**, not a complete historical census. Recompute manager-involvement count only after incorporating three-party event and deciding how to record three asset-unknown 2020 events.
2. Verify the 2020 empty-asset events against underlying transaction metadata or participant screenshots; do not fabricate a receipt.
3. Add the missing 2023 three-manager transaction into a **new versioned canonical trade ledger** with all three recipient sides, stable provider player IDs, accurate time window, and separate source.
4. Recompute position/week baselines and 0-start treatment as required; past 41 two-party and 13 repeated-player chain findings are still descriptive of the old subset, not automatically invalid, but cross-season totals/rankings may shift.
5. Rebuild each manager's downstream trade-dependency graph before rating or claiming win-win/lose-lose. A new three-party event affects Stilly, Thommy and Stew even if original 2023 Lamb/Stew data was otherwise internally consistent.
6. No public league awards, 0–100 manager scores or website deployments until canonical integrity and browser release checks are green.

## Sources

- [Full 2020–2025 provider trade census](../data-integrity/trade-provider-census-2020-2025-v1.json)
- [Newly discovered 2023 three-party receipt](../data-integrity/trade-discovered-2023-w10-three-way-v1.json)
- [Three-party acquired starter points through Week 17](../data-integrity/trade-2023-missing-three-way-starter-returns-v1.json)
- [Recovered missing Gainwell/Pollard downstream history](../data-integrity/trade-birch-lamb-2023-bench-only-weeks8-14-v1.json)

**Research integrity principle:** discovering an incomplete denominator is a positive quality-control finding, not a reason to hide the inconsistency. The prior 44-event modeling remains preserved for reproducibility, but it must not be promoted to all-time truth.
