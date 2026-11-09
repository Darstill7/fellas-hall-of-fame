# Fellas Schedule Draw vs. All-Play — Evidence-First Research

**Staged research, November 9, 2026. Not a published manager skill ranking.** Source: `data/season_weekly_matchups_2016_2026_v1.json`. Computed record and per-week score receipts: `data/all_play_schedule_variance_2016_2026w8_v1.json`.

## What this measures

In a given week, count the other teams whose fantasy scores a manager exceeded (and award half a credit for any exact tie). Divide by the **number of other teams** to obtain the week's probability of winning against one uniformly selected opponent. Adding those weekly rates gives an **all-play expected win total**.

Then compare it with the wins earned against the actual scheduled opponent, giving **schedule-draw surplus = actual win credit minus all-play expected wins**.

**This is descriptive only**: it does not simulate valid alternate round-robin schedules, predict playoff seeds, establish skill, prove a game was 'stolen,' or assign credit/blame to roster decisions. Opponent selection is not independent when a true league schedule is constructed.

## Source coverage

- The archive contains 700 paired regular-season games. **692 games belong to fully paired league weeks** and can be used for these all-play comparisons.
- **2016:** Eight-team format, 13 weeks; each week's expected-win denominator is **7** (other teams), not 9.
- **2017:** Ten-team format, 12 regular-season weeks.
- **2018–2019:** Ten teams, 13 weeks.
- **2020–2021:** The recovered Week 14 has only **8 of 10 teams paired**. Exclude **the entire Week 14** in those seasons rather than compare incomplete all-play ranks. The remaining 13 fully paired weeks are legitimate *partial-season* samples, not a complete 14-game account.
- **2022–2025:** Ten teams, 14 fully paired weeks.
- **2026:** Ten teams, 8 fully paired weeks only. All statements are provisional through Week 8; no Week 9 outcome is inferred.
- If any 2016 score is tied, treat an actual tie as **0.5 actual-win credit** and an all-play tie as half an opponent.

## Largest recorded completed-season opponent-draw advantages

| Rank | Manager | Season | Included weeks | Actual wins | All-play expected wins | Actual minus expected |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Birch | 2021 | 13 | 11 | 7.44 | +3.56 |
| 2 | Thommy | 2024 | 14 | 9 | 6.50 | +2.50 |
| 3 | Koble | 2023 | 14 | 10 | 7.56 | +2.44 |
| 4 | Birch | 2019 | 13 | 11 | 8.67 | +2.33 |
| 5 | Kuhl | 2020 | 13 | 9 | 6.67 | +2.33 |
| 6 | Mitch | 2025 | 14 | 13 | 10.78 | +2.22 |
| 7 | Stover | 2018 | 13 | 8 | 6.00 | +2.00 |
| 8 | Evans | 2019 | 13 | 5 | 3.33 | +1.67 |
| 9 | Stover | 2023 | 14 | 6 | 4.44 | +1.56 |
| 10 | Thommy | 2016 | 13 | 7 (+1 tie) | 6.21 | +1.29 |

**Lead example: Birch, 2021.** In the **13 fully paired weeks available**, Birch went **11–2**, against an average **7.44 expected wins** under weekly random-opponent comparison—**+3.56** scheduled wins relative to this baseline. It is inaccurate to say he 'should have finished 7–7' because the omitted Week 14 is not accounted for and the model is not a valid full schedule counterfactual.

## Largest recorded completed-season opponent-draw disadvantages

| Rank | Manager | Season | Included weeks | Actual wins | All-play expected wins | Actual minus expected |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Thommy | 2020 | 13 | 4 | 6.56 | -2.56 |
| 2 | Koble | 2019 | 13 | 4 | 6.33 | -2.33 |
| 3 | Kuhl | 2021 | 13 | 4 | 6.11 | -2.11 |
| 4 | Tony | 2020 | 13 | 4 | 6.00 | -2.00 |
| 5 | Stew | 2021 | 13 | 2 | 3.78 | -1.78 |
| 6 | Evans | 2022 | 14 | 4 | 5.78 | -1.78 |
| 7 | Stew | 2025 | 14 | 6 | 7.72 | -1.72 |
| 8 | Stover | 2019 | 13 | 4 | 5.67 | -1.67 |
| 9 | Mitch | 2023 | 14 | 6 | 7.67 | -1.67 |
| 10 | Mitch | 2018 | 13 | 5 | 6.44 | -1.44 |

**Lead example: Thommy, 2020.** Over its **13 fully paired weeks**, Thommy won **4** matchups despite a weekly random-opponent expectation of about **6.56** wins—**−2.56** relative to that baseline. The missing Week 14 should not be assumed to have been a loss or win.

## 2026 (through Week 8) — a separate provisional snapshot

| Manager | Wins through W8 | All-play expected | Difference |
| --- | ---: | ---: | ---: |
| JMid | 3 | 4.33 | -1.33 |
| Kuhl | 0 | 1.33 | -1.33 |
| Thommy | 3 | 3.78 | -0.78 |
| Stover | 3 | 3.67 | -0.67 |
| Stilly | 4 | 4.56 | -0.56 |
| Stew | 5 | 5.22 | -0.22 |
| Birch | 5 | 4.44 | +0.56 |
| Scott | 4 | 2.89 | +1.11 |
| Tony | 5 | 3.78 | +1.22 |
| Mitch | 8 | 6.00 | +2.00 |

Mitch's **8–0** start differs from an approximately **6.00-win** all-play expectation. This does *not* imply his undefeated record is solely schedule fortune; it means all eight recorded opponents were defeated even though other possible weekly opponents outscored him in some weeks.

## Editorial use and quality gates

1. Keep **performance (all-play outcomes)** separate from **schedule draw (actual vs all-play)**, and do not assign a moral 'luck' grade to managers.
2. Use **normalized all-play expected wins**, not raw all-play total wins, because 2016 had only eight teams.
3. Label the 2020–2021 omissions and incomplete seasons explicitly, and ensure every manager in a given year is measured over the **same** eligible weeks.
4. Do not use these values as a playoff seeding counterfactual; doing so requires correctly simulating other schedules, head-to-head tiebreakers and postseason brackets.
5. Do not merge Evans's 2023 franchise with JMid's career; participant IDs remain the original historical managers.
6. Avoid a new homepage card. Candidate destination is a **single 'Schedule Draw' subsection** within the existing `analytics/schedule-matrix.html` or Record Book, when its source and layout tests are complete.
7. Keep this research on a staging branch until the existing Scoring Consistency release is green; do not create another CI-heavy PR before that release clears.

**Preferred next research:** test verified weekly 'best score but lost?' (impossible in a ten-team head-to-head week) and high-scoring losses against league rank, without inferring lineup intent. Then consider head-to-head schedule permutation **only if** a truly balanced alternate schedule model is constructed and independently validated.
