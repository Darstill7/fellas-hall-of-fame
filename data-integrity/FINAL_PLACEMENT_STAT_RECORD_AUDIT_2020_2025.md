# The Fellas — Final Placement Statistics and Record Audit

**Audit date:** November 4, 2026  
**Verified scope:** Six completed Sleeper seasons (2020–2025). This is a postseason **final finishing-place** audit, not regular-season standings and not a certified 2016–2025 all-era finishing table.

## Sources and audit gates

- `data/fellas_final_placements_2020_2025.json`: canonical rank and participant assignments.
- `data/sleeper_postseason_placement_receipts_2020_2025.json`: user-supplied championship, placement and Toilet Bowl screenshots verified against the Sleeper matchup archive.
- `data/playoff_matchups_2020_2025.json`: paired team-score receipts.
- `assets/placement-statistics.mjs`: cross-source recomputation, eligibility, duplicate-rank and title checks.
- `scripts/test-manager-profile-launch-copy.mjs`: regression checks for coverage, records and caveats.
- Exactly **60 final positions**, **10 unique managers/finishes per season**, **12 distinct participating managers**, **6 championships**, **6 runners-up**, **18 podium finishes**, **30 top-five finishes**, **18 bottom-three finishes**, and **6 last-place/Toilet Bowl losses**.
- The newly uploaded 2022 evidence establishes 3rd Kuhl, 4th Mitch, 5th Thommy and 6th Stilly; no unknown 2022 rank remains.
- All six championship-bracket seed lists agree exactly with final positions 1–6. This was checked for each season, preventing consolation participants from being counted as playoff qualifiers.

## Complete 2020–2025 finishing statistics

| Manager | Seasons | Avg finish | Median | Top 3 | Top 5 | Bottom 3 | Runner-up | Shitter |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Mitch | 6 | 4.17 | 3.5 | 3 | 5 | 1 | 2 | 0 |
| Thommy | 6 | 4.83 | 5.5 | 2 | 3 | 1 | 1 | 0 |
| Stover | 6 | 5.00 | 4.0 | 2 | 4 | 2 | 0 | 1 |
| Birch | 6 | 5.17 | 4.5 | 2 | 4 | 1 | 0 | 1 |
| Stilly | 6 | 5.50 | 6.5 | 2 | 2 | 1 | 1 | 1 |
| Tony | 6 | 5.67 | 5.0 | 1 | 4 | 2 | 0 | 1 |
| Kuhl | 6 | 7.17 | 8.0 | 1 | 2 | 3 | 0 | 1 |
| Stew | 6 | 7.17 | 8.0 | 1 | 1 | 4 | 1 | 1 |
| Koble | 4 | 5.25 | 5.5 | 2 | 2 | 2 | 0 | 0 |
| Evans | 3 | 5.00 | 6.0 | 1 | 1 | 0 | 1 | 0 |
| JMid | 3 | 6.00 | 6.0 | 0 | 1 | 1 | 0 | 0 |
| Scott | 2 | 4.00 | 4.0 | 1 | 1 | 0 | 0 | 0 |

Average finish = mean of postseason final ranks (1 is best). Median = middle final rank (or mean of the two middle ranks). Top-three = final ranks 1–3; top-five = 1–5; bottom-three = 8–10. Shitter is the loser of the *final* Toilet Bowl, not the loser of the eighth-place game. The 2020–2025 sample excludes 2026 (unfinished).

## Certified records and publication decision

| Achievement | Holder | Result | Eligibility and treatment |
|---|---|---:|---|
| Best average finish across all six Sleeper seasons | **Mitch** | **4.17** | Only the eight managers present in each 2020–2025 season |
| Most top-three final finishes | **Mitch** | **3** | All twelve participating managers; accumulation, not a rate |
| Most top-five final finishes | **Mitch** | **5** | All twelve participating managers; accumulation, not a rate |
| Most championship runner-up finishes | **Mitch** | **2** | Audited career stat; not counted as a separate new positive record |
| Most bottom-three final finishes | **Stew** | **4** | Negative context, not a positive owned achievement |
| Most Shitter of the Year finishes | **Six-way tie** | **1 each** | Tony (2020), Stilly (2021), Birch (2022), Stew (2023), Kuhl (2024), Stover (2025) |

**Do not award Scott the all-six-season career average record** on the strength of a two-season 4.00 average. His actual 4.00 average is available in a separate shorter-tenure comparison. The three new published positive categories raise the public category count **11 → 14**. Last-place and bottom-three results never contribute to the positive owned-record count.

## Open reconciliation finding

**2020 third-place game:** Birch over Stover. The uploaded screenshot appears to show Birch at **110.14**, whereas the archived paired matchup records **110.24**. The final placements (Birch third, Stover fourth) are confirmed; the precise Birch score remains **unverified**. Both associated position rows carry `scoreVerified: false`, because the game-score receipt is not fully reconciled. Do not silently substitute one value into public season-score superlatives.

## Limits and next audit stages

1. The 2016–2019 ESPN years do not yet have the same complete, verified 1–10 finishing receipts. Avoid describing these as *all-time* finish averages across the entire league history.
2. Legacy OVR and playoff-qualification metrics may include earlier years; do not silently replace those methodologies with this 2020–2025 comparison.
3. Final placement is a postseason outcome. Regular-season standings, regular-season W–L records and playoff wins require different source fields.
4. Former managers (Koble and Evans) remain in the historical comparison; manager aliases must be normalized.
5. For future updates, recompute via `auditPlacementStatistics` and keep all ten ranks per completed season; do not fill pending season 2026.
6. For true all-era rank achievements, recover the 2016–2019 ESPN consolation/final standings and resolve the 2020 third-place source discrepancy.

## Website additions

The Record Holders page includes an expandable, accessible comparison separating full six-season participants from shorter tenures. Three placement-based achievements are included in the existing Record Holders and manager-profile ownership calculations, without introducing new top-level menu clutter or publishing negative records as positive trophies.
