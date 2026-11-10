# Who drew the hottest opponents? Weekly-normalized opponent scoring

**Staged research, November 9, 2026.** Source and weekly receipts in `data/opponent_points_exposure_2016_2026w8_v1.json`.

## Definition

For every **fully paired regular-season week**, compare the actual scheduled opponent's score to the **average score of all the other teams that week** (excluding the manager's own total). Then average the difference over eligible weeks in the manager's season.

A **positive** difference means the manager faced opponents scoring above the average available opponent that week. A **negative** difference indicates below-average opponent scoring. This is a descriptive measure of *opponent points faced*, not a mathematically complete schedule-luck probability or a skill grade.

## Toughest completed-season average opponent scoring relative to weekly context

| Rank | Manager | Season | Comparable weeks | Actual opponent avg | Avg alternative opponent | Excess per week |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Stover | 2019 | 13 | 124.43 | 111.04 | **+13.39** |
| 2 | Koble | 2019 | 13 | 123.32 | 110.50 | **+12.82** |
| 3 | Thommy | 2020 | 13 | 122.99 | 112.24 | **+10.74** |
| 4 | Thommy | 2021 | 13 | 124.71 | 113.99 | **+10.71** |
| 5 | Scott | 2024 | 14 | 121.86 | 112.10 | **+9.75** |
| 6 | Kuhl | 2023 | 14 | 120.61 | 111.35 | **+9.26** |
| 7 | Tony | 2025 | 14 | 119.56 | 111.17 | **+8.39** |
| 8 | Stilly | 2019 | 13 | 118.30 | 110.10 | **+8.20** |
| 9 | Stilly | 2018 | 13 | 114.01 | 107.51 | **+6.50** |
| 10 | Kuhl | 2019 | 13 | 115.41 | 109.64 | **+5.78** |

**Stover's 2019 opponents averaged 124.43 points**, compared with a league-week adjusted alternative-opponent average of **111.04**—an excess of **13.39 points per week**.

## Lightest completed-season average opponent scoring relative to weekly context

| Rank | Manager | Season | Comparable weeks | Actual opponent avg | Avg alternative opponent | Excess per week |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Thommy | 2024 | 14 | 97.76 | 111.10 | **-13.35** |
| 2 | Birch | 2021 | 13 | 102.51 | 113.51 | **-11.00** |
| 3 | Birch | 2019 | 13 | 98.42 | 108.74 | **-10.32** |
| 4 | Evans | 2019 | 13 | 102.53 | 112.46 | **-9.93** |
| 5 | Stover | 2021 | 13 | 103.14 | 112.55 | **-9.41** |
| 6 | Tony | 2018 | 13 | 96.43 | 105.77 | **-9.34** |
| 7 | Stover | 2025 | 14 | 103.26 | 112.51 | **-9.26** |
| 8 | Stilly | 2023 | 14 | 102.57 | 110.24 | **-7.67** |
| 9 | Kuhl | 2018 | 13 | 99.12 | 106.68 | **-7.56** |
| 10 | Halderman | 2017 | 12 | 84.25 | 91.76 | **-7.51** |

**Thommy's 2024 opponents averaged 97.76 points**, compared with a weekly adjusted alternative-opponent average of **111.10**: **13.35 fewer points per week**.

## How this corroborates (but does not prove) the all-play record

- **Birch 2021:** 11 actual wins vs 7.44 normalized all-play expected wins across 13 complete weeks. Opponents averaged **102.51** vs **113.51** for the average eligible alternative opponent—**11.00 fewer points per week**. These are consistent descriptions of a favorable observed slate, not a definitive luck-grade or simulated alternate schedule.
- **Thommy 2020:** 4 actual wins vs 6.56 all-play expected across 13 weeks. Opponents averaged **122.99** vs **112.24**, **10.75 extra points per week**.
- These independent descriptive metrics share the same game source and are **correlated**; do not present them as two independent proofs of causation.

## Guardrails

- 2016 was an eight-team league; use seven alternative opponents, not nine.
- Missing paired Week 14 results in 2020/21 exclude those weeks for everyone, not only for the teams with missing scores.
- A week's comparative opponent benchmark is computed **without that manager's score**, so it doesn't accidentally reward a high scorer through self-inclusion.
- The 2026 season is represented only through Week 8, never included in 2016–2025 complete-season rankings.
- The measure does not automatically establish a postseason seed, playoff bye, or hypothetical champion if teams swapped schedules.
- Prefer this as an accessible explainer in the future Schedule Draw exhibit, not an independent homepage navigation category.
