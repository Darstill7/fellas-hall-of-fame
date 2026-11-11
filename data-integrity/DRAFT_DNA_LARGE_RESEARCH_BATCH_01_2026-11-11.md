# Draft DNA — Large Research Batch 01: Provenance, Era Reconciliation, Week 9
**November 11, 2026 · Source-derived research · NOT a live public leaderboard**

This report documents the executable, source-controlled results of three new generators and their independent assertions. Research is saved in the branch rather than triggering a new release/CI queue while current production workflows are stuck awaiting runners.

## Files created

| Generator | Versioned data output | Coverage |
|---|---|---|
| `scripts/build-draft-dna-selection-vault.mjs` | `data/research_draft_dna_selection_vault_2016_2026_v1.json` | All **1,648** recovered original selections, stable owner identity, original overall-order confidence, keeper markers |
| `scripts/build-draft-dna-2020-2024-legacy-audit.mjs` | `data/research_draft_dna_2020_2024_legacy_reconciliation_v1.json` | **750 picks**, **50 manager-seasons**, exact return and start parity with archived research; preserved legacy model |
| `scripts/build-draft-dna-2026-week9.mjs` | `data/research_draft_dna_2026_week9_original_manager_starts_v1.json` | **150** verified selections, all **90** recorded scored team-weeks through W9, original-manager player-ID matching, 603 actual starting assignments |
| `scripts/verify-draft-dna-research-batch.mjs` | Executable assertions (no published data) | Completeness, identities, 2018 unknown order, keeper separation, pilot disagreements, season parity |

The outputs are regenerated using only checked-in source files; no data is fetched from third-party APIs at build time. Run from repo root:
```bash
node scripts/build-draft-dna-selection-vault.mjs > /tmp/draft-selection-vault.json
node scripts/build-draft-dna-2020-2024-legacy-audit.mjs > /tmp/draft-legacy-audit.json
node scripts/build-draft-dna-2026-week9.mjs > /tmp/draft-week9-receipts.json
node scripts/verify-draft-dna-research-batch.mjs
```

## I. Decade-plus original draft vault

| Season(s) | Selection count | Original pick order | Grading status |
|---|---:|---|---|
| 2016 ESPN | 128 | Exact observed order | No comparable certified individual weekly original-drafter starter value |
| 2017 ESPN | 160 | Exact observed order | Same limitation |
| **2018 ESPN** | **160** | **Unknown: position-sorted source** | **DO NOT assign fake rounds/overall ranks** |
| 2019 ESPN | 150 | Exact observed order | No comparable certified original-drafter weekly value |
| 2020–2024 Sleeper | 750 | Recovered overall order | Historical original-drafter realized value available in legacy benchmark |
| 2025 Sleeper | 150 | Recovered order, 20 keeper slots | Completed nonkeeper value pilot, 130 picks |
| 2026 Sleeper | 150 | Verified original order, 20 keeper slots | Current partial season through W9; not final |

**Total: 1,648 selections.** Every source row has an identified player name. Exactly **1,488** have reliable pick-order positions; the **160 unknown-order selections are entirely in 2018**.

2018 help requested from commissioner/member: original draft results as ESPN screenshot, export, activity feed, emails with *overall* and *round* pick numbers. A list of names grouped by position or manager **is not sufficient** to reconstruct snake-draft sequence safely.

## II. 2020–2024 Sleeper archival audit: exact summary parity

Each annual source contains 150 selections, ten managers. Recomputed all 50 manager-year totals from the recovered selection ledger and matched the checked-in year-level archive exactly for:
- 50 of 50 started-point totals
- 50 of 50 original-manager starting-appearance totals
- 50 of 50 source-specific legacy-surplus totals

Annual leaders by **raw points produced while starting for original manager** (not normalized draft skill):

| Year | Top by actual original-drafter starter points | Points | Second | Points |
|---|---|---:|---|---:|
| 2020 | Birch | 1,295.88 | Mitch | 1,245.58 |
| 2021 | Mitch | 1,421.34 | Stover | 1,163.18 |
| 2022 | Stover | 1,621.46 | Kuhl | 1,470.82 |
| 2023 | **Evans** | 1,377.14 | Tony | 1,356.64 |
| 2024 | Stover | 1,430.28 | Birch | 1,396.20 |

**2023 belongs to Evans, not JMid.** Original draft managers `Tom` and `EvansBrandon` resolve to Thommy and Evans for display; historical Schermerhorn is not Thommy.

### Highest contributing late-round originals (2020–2024)
Scope: rounds 10+, nonkeeper, at least five recorded starts for the original manager, sorted by realized started points.

| Year | Manager | Player | Round | Starts | Starter points |
|---|---|---|---:|---:|---:|
| 2023 | Birch | Dak Prescott | 12 | 13 | 271.70 |
| 2024 | Stilly | Jayden Daniels | 14 | 12 | 233.60 |
| 2023 | Tony | Raheem Mostert | 14 | 13 | 225.40 |
| 2020 | Kuhl | Ben Roethlisberger | 14 | 10 | 176.56 |
| 2023 | Stover | Tua Tagovailoa | 13 | 10 | 163.00 |
| 2023 | Koble | Dallas Cowboys D/ST | 11 | 9 | 150.00 |
| 2022 | Birch | Brandon Aiyuk | 10 | 12 | 139.50 |

**No cross-model claim:** 2020–2024 archive surplus uses a different benchmark from the 2025 and 2026 same-year round/position peer pilot. Never add the scores into a universal all-era points-above-baseline leaderboard without recalculation.

## III. 2026 Week 9: 150 drafted players reconciled to actual starters

The 2026 original Sleeper draft includes 150 picks: exactly **130 nonkeepers + 20 keepers**. All 150 original slot/player/manager tuples match the historical draft-engine row. Scored lineups contain 90 team-weeks × nine starters = **810** scored starter slots. By stable Sleeper player ID and *the original drafting team's roster ID*, 603 recorded starting assignments match original draft selections.

The unmatched **207** starters can include acquisitions, transfers, and other provenance not established from the draft board alone; they are not automatically called data errors. Every matched 2026 starter has a week, source roster, player ID, position, original manager and scored points.

**2026 through Week 9, nonkeeper original-manager starting points** (not final grades):

| Manager | Nonkeeper draft starter points | Keeper-slot starter points | All 2026 original-pick starter points |
|---|---:|---:|---:|
| Mitch | 843.48 | 264.66 | 1,108.14 |
| Birch | 802.02 | 97.00 | 899.02 |
| Stover | 708.10 | 76.48 | 784.58 |
| JMid | 666.30 | 56.90 | 723.20 |
| Tony | 664.80 | 267.60 | 932.40 |
| Stew | 541.90 | 192.20 | 734.10 |
| Scott | 516.62 | 162.50 | 679.12 |
| Stilly | 492.40 | 222.64 | 715.04 |
| Kuhl | 427.40 | 100.20 | 527.60 |
| Thommy | 309.80 | 278.40 | 588.20 |

This describes usage and output; a manager who traded away a pick or played valuable waiver additions will appear differently even if those actions improved their team. Do not use this as an unqualified manager talent grade.

**Woody Marks case:** Stilly selected Woody Marks **No. 128 overall / Round 13**. He contributed **33.80 actual starter points in four recovered starts** through Week 9, including **7.90** in Week 9. A full pick-value or keeper judgment requires eligible alternatives, cost, and further weeks.

### Six cross-source discrepancies to resolve before publishing 2026 draft grades

The independent scored starter ledger disagrees with the previously published Week 8 research pilot for these six *nonkeeper* picks:

| Player | Original drafting manager | Week 8 pilot started points | Scored lineup re-sum through Week 8 | Delta |
|---|---|---:|---:|---:|
| James Cook | Birch | 106.60 | 123.70 | +17.10 |
| Kenneth Walker | JMid | 133.00 | 151.10 | +18.10 |
| Luther Burden | Scott | 32.10 | 69.90 | +37.80 |
| Harold Fannin | JMid | 44.10 | 62.50 | +18.40 |
| Chris Godwin | Birch | 0.00 | 4.70 | +4.70 |
| Aaron Jones | Birch | 27.70 | 34.80 | +7.10 |

These are **source conflicts, not declared pilot errors**. The pilot may use a narrower ownership or lineup-eligibility rule; the raw starting lineups alone do not establish all transaction-date restrictions. Do **not** overwrite pilot values or finalize 2026 return grades until their original rule and week-level scoring source are reconciled.

## IV. Next deep-research questions

1. Resolve those six Week 8 pilot-versus-lineup conflicts by player ID, week, roster owner, scoring system and pre/post trade timeline.
2. Reconstruct every 2020–2025 *per-pick, per-week* started-point receipt using original roster player identity and historical owner account; verify source-level outcomes and keeper-year rules independently.
3. Recalculate all comparable Sleeper season draft grades using **one shared same-year position/round baseline**, controlling for league format and 2025 keeper slots. Compare ranks, not incompatible raw surplus values.
4. Identify pick-to-trade trajectories: which historically valuable drafted players later contributed to another manager's title or playoff push.
5. Add ESPN-era 2016–2019 source-status columns; publish the named draft boards, but postpone order-based 2018 values until source evidence arrives.
6. Link confirmed 2023 Evans and 2024 JMid records to their correct historic owner profiles.
7. Publish an editorial **Draft DNA** museum: round-by-round best picks, worst returns, 2025 completed grades, 2026 in-progress tracker and standout late-round finds. Every published item needs the appropriate original lineup receipt.

No additional workflow is triggered in this branch while the current production and Record Book tests remain queued or failed at workflow startup.
