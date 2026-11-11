# Draft DNA — Large Research Batch 02: All Six Completed Sleeper Seasons
**2026-11-11 · Research validated from source files · Not a released manager skill grade**

## Major result: 900 of 900 original pick totals reconstructed from individual weekly lineups

The new `scripts/build-draft-dna-2020-2025-starter-receipts.mjs` reconstructs the complete six-year (2020–2025) original-drafter lineup contribution ledger, source-by-source. Every archived player draft row matches *exactly* the sum of actual recorded original-drafter lineup starters:

- **900 original draft slots** (150 per year)
- **900/900 exact original-manager starter count and cents-rounded score reconciliations**
- **4,904 original-drafter starting appearances**
- **820 recorded regular-season team-weeks**
- **Three explicitly verified historical player-name aliases** — no fuzzy joins
- 2020–2021 **Weeks 1–13 only**. Archived season-total draft contributions intentionally exclude Week 14. 2022–2025 use **Weeks 1–14**.
- 2023 original selection/roster identity must remain **Evans**, even when a subsequently refreshed Sleeper lineup username says `JMidd`.

| Year | Regular-season cutoff | Original picks | Original-drafter starts | Scored starter points |
|---|---:|---:|---:|---:|
| 2020 | Week 13 | 150 | 775 | 10,308.64 |
| 2021 | Week 13 | 150 | 704 | 9,252.10 |
| 2022 | Week 14 | 150 | 857 | 11,082.48 |
| 2023 | Week 14 | 150 | 867 | 11,182.22 |
| 2024 | Week 14 | 150 | 842 | 11,044.98 |
| 2025 | Week 14 | 150 | 859 | 11,050.82 |

Three nontrivial lineup identity fixes were established by matching historical draft-manager roster, scored player ID and aggregate original-drafter score/starts:
- **2020 Birch — Will Fuller V** in draft / **William Fuller**, Sleeper player ID **3157**, on lineups
- **2021 Koble — Robby Anderson** in draft / **Robbie Chosen**, Sleeper player ID **3423**, on lineups
- **2021 Evans — Washington Football Team** in draft / **Washington Commanders**, defense ID **WAS**, on lineups

This independent audit confirms the previous v9 2020–2024 archival manager totals, but goes considerably deeper: each of the **900 picks now has linked actual week, roster, stable scored player ID when observed, and starter points**. Picks never observed in starting lineups correctly retain `playerId:null`; no missing identity is fabricated.

Source artifacts:
- `scripts/build-draft-dna-2020-2025-starter-receipts.mjs`
- `data/research_draft_dna_2020_2025_starter_receipts_v1.json`

## Consistent historical draft-value comparison for 2020–2025

The new `scripts/build-draft-dna-comparable-2020-2025.mjs` analyzes **880 nonkeeper selections** from the 900 completed-season picks. The 20 2025 keeper slots are not classified as new draft discoveries.

For each selection:
- Record actual points from starts made **for its original drafting manager**; bench and post-trade other-roster points are excluded.
- Compare against the median observed started points of **other nonkeeper picks in the same year and same position** within ±2 rounds. Expand to ±3, ±5, then all same-position picks when at least four eligible peers aren't available.
- Summarize the resulting peer-surplus within each manager-year. Annual grades A/B/C/D/F are observed-return *tiers* derived from within-year standings only, **not talent judgments**.
- Present year-to-year histories by season-normalized ordinal rank, not by incompatible raw point totals across 13/14-week seasons.

**Methodology check:** The new same-method model reproduces *all ten* 2025 manager peer-surplus totals from the independently stored completed-season research pilot, exactly. It is therefore anchored to an already-existing method but now extends its application back through 2020.

### Highest peer-surplus original draft returns by year

| Season | Best observed manager-year | Same-model peer surplus | Second | Same-model peer surplus |
|---|---|---:|---|---:|
| 2020 | Birch | +485.34 | Kuhl | +376.57 |
| 2021 | Mitch | +929.00 | Stover | +434.04 |
| 2022 | Stover | +818.44 | Kuhl | +528.05 |
| 2023 | Birch | +430.65 | Evans | +331.47 |
| 2024 | Stover | +483.11 | Birch | +385.23 |
| 2025 | Birch | +648.71 | Tony | +359.55 |

These totals should only be compared as **realized year-specific draft returns using the same defined peer process**. They do not control for injuries, lineup choices, keeper rights outside the 2025 slot exclusions, or acquired replacements. No result demonstrates that a manager is a universally better drafter or proves causality.

### Best late-round peer-surplus finds (nonkeepers, rounds 10+, at least five original-drafter starts)

| Pick | Original manager | Round | Actual starter points | Above same-year position/round peers |
|---|---|---:|---:|---:|
| Dak Prescott, 2023 | Birch | 12 | 271.70 | +271.70 |
| Raheem Mostert, 2023 | Tony | 14 | 225.40 | +225.40 |
| Jayden Daniels, 2024 | Stilly | 14 | 233.60 | +186.79 |
| Javonte Williams, 2025 | Tony | 11 | 177.00 | +175.40 |
| Ben Roethlisberger, 2020 | Kuhl | 14 | 176.56 | +164.97 |
| Tua Tagovailoa, 2023 | Stover | 13 | 163.00 | +163.00 |

**Draft DNA manager-season normalized return résumé**, six-year participants only (descriptive average league rank percentile):

| Manager | Years included | Avg. season rank percentile | Annual return ranks (2020→2025) |
|---|---:|---:|---|
| Birch | 6 | 79.63 | 1, 8, 4, 1, 2, 1 |
| Mitch | 6 | 74.08 | 3, 1, 3, 4, 5, 4 |
| Stover | 6 | 74.08 | 5, 2, 1, 6, 1, 5 |
| Kuhl | 6 | 62.96 | 2, 3, 2, 8, 3, 8 |
| Tony | 6 | 48.15 | 9, 7, 5, 3, 8, 2 |
| Thommy | 6 | 25.92 | 6, 10, 8, 9, 7, 6 |
| Stew | 6 | 22.22 | 7, 6, 6, 10, 10, 9 |
| Stilly | 6 | 18.52 | 10, 5, 9, 7, 9, 10 |

Shorter-tenure managers Evans, Koble, Scott, and JMid retain their actual separate seasons in the generated artifact. Do **not** present fewer-season averages as a statistically equivalent six-year résumé.

## What remains before official public rankings

**2026**: The separate Week 9 ledger contains 150 selections, 130 newly drafted nonkeepers, 20 keeper slots and **603 original-manager starter receipts through Week 9**. Six source differences between the Week 8 pilot and actual scored lineup totals remain explicitly flagged and need independent transaction/ownership adjudication. No 2026 final grades.

**2018**: All 160 names and drafting managers are recovered, but the 2018 ESPN import was position-sorted, **not an original draft order**. Await user-supplied original order (overall sequence, rounds, or original ESPN draft activity). Any fabricated round would corrupt historical steal/bust rankings.

**2016–2019**: ESPN draft name/order sources are recoverable where documented, but equivalent starter-level original drafter scoring receipts are not independently certified. Keep out of the six-season comparisons until the scored starter attribution is sufficiently recovered.

**Post-draft transfers**: Original-manager starter credit is independently checked; the full trade-timeline contributions of the same player on other manager rosters are a *separate* research model. An outstanding scorer who was traded away is not automatically an excellent return for the drafting manager.

## Reproduction (source-controlled and self-contained)
```bash
node scripts/build-draft-dna-selection-vault.mjs > /tmp/draft-selection-vault.json
node scripts/build-draft-dna-2020-2024-legacy-audit.mjs > /tmp/draft-legacy-reconciliation.json
node scripts/build-draft-dna-2020-2025-starter-receipts.mjs > /tmp/draft-starter-receipts.json
node scripts/build-draft-dna-comparable-2020-2025.mjs > /tmp/draft-comparable-results.json
node scripts/build-draft-dna-2026-week9.mjs > /tmp/draft-2026-week9.json
node scripts/verify-draft-dna-research-batch.mjs
```

The generated `data/research_*.json` artifacts are committed separately so analytics and editorial work can use them without pulling every original raw source. **This research branch does not switch any public site code or trigger another competing GitHub Actions queue.**
