# Historical lineup evidence audit — 2020–2025

**Research scope:** Six completed Sleeper regular seasons. Audited 2026-11-04. Not a Start/Sit decision-quality rating.

## Evidence coverage

- **83 archived regular-season weeks**: 13 in 2020, 14 in each season 2021–2025.
- **830 team-week observations**, all ten owners present in each source week.
- **822 research-comparable**, **8 excluded** from hindsight percentages.
- Source of truth: `data-integrity/LINEUP_HISTORY_RECEIPT_AUDIT_2020_2025.json`; compact website input `data/lineup_hindsight_coverage_2020_2025.json`.
- Algorithm: maximize nine filled roster slots from recorded starters and bench after games have finished — QB, 2 RB, 2 WR, TE, 2 RB/WR/TE FLEX, DEF. For comparable weeks, hindsight accuracy = recorded starter points / ex-post optimal recorded-roster points × 100.
- Exclusion criteria: vacant starting slots, missing/nonfinite player or team scores, impossible starter slot configuration, repeated player IDs, unsupported positions or starter-point mismatches. An excluded week is **not** zero skill or zero accuracy.
- **League owner clarification (2026-11-04):** Managers have intentionally benched a remaining player while holding a narrow lead to avoid the risk of negative fantasy points. A vacant or incomplete lineup can therefore be a rational score-protection decision, not necessarily negligence. The five observed vacant-slot weeks and three incompatible/incomplete configurations stay excluded without penalty; do not label specific historical weeks intentional without matchup-score, player, lock-time and remaining-opponent evidence. Any future decision-skill model must permit strategic benching as a valid alternative where league rules allow it.

| Season | Team-weeks | Comparable | Excluded |
|---|---:|---:|---:|
| 2020 | 130 | 130 | 0 |
| 2021 | 140 | 139 | 1 |
| 2022 | 140 | 138 | 2 |
| 2023 | 140 | 139 | 1 |
| 2024 | 140 | 138 | 2 |
| 2025 | 140 | 138 | 2 |
| **Total** | **830** | **822** | **8** |

## Explicit exclusions

| Season | Week | Manager | Source reason |
|---|---:|---|---|
| 2021 | 13 | Tony | Illegal or incomplete actual starter slots |
| 2022 | 3 | Thommy | Vacant starting slot |
| 2022 | 13 | Evans | Vacant starting slot |
| 2023 | 9 | Thommy | Vacant starting slot |
| 2024 | 3 | Tony | Vacant starting slot |
| 2024 | 11 | Stover | Vacant starting slot |
| 2025 | 1 | JMid | Illegal or incomplete actual starter slots |
| 2025 | 2 | JMid | Illegal or incomplete actual starter slots |

## Every-manager observational history

These are **not** skill rankings; sample sizes and team availability vary. Average hindsight percentages measure retrospective roster usage, not what the manager could reasonably know at kickoff.

| Manager | Seasons | Comparable / observed | Hindsight average | Average points below recorded-roster optimum |
|---|---:|---:|---:|---:|
| Birch | 6 | 83 / 83 | 88.18% | 15.30 |
| Evans | 3 | 40 / 41 | 87.64% | 16.29 |
| JMid | 3 | 40 / 42 | 89.46% | 13.73 |
| Koble | 4 | 55 / 55 | 89.70% | 12.24 |
| Kuhl | 6 | 83 / 83 | 86.94% | 16.75 |
| Mitch | 6 | 83 / 83 | 90.74% | 12.27 |
| Scott | 2 | 28 / 28 | 88.59% | 14.55 |
| Stew | 6 | 83 / 83 | 87.07% | 16.23 |
| Stilly | 6 | 83 / 83 | 87.40% | 16.01 |
| Stover | 6 | 82 / 83 | 87.84% | 15.22 |
| Thommy | 6 | 81 / 83 | 89.27% | 13.59 |
| Tony | 6 | 81 / 83 | 88.05% | 15.80 |

## Data-integrity guardrails

1. Each `year/week/manager` combination must occur once, with ten managers per week and 60 distinct manager-seasons.
2. The compact public summary must reconcile with all 830 detailed records; counts and absent-week reasons are validated by `assets/lineup-history-coverage.mjs`.
3. **No historical Start/Sit skill grade** may be derived from the above. Historical lineup configuration, IR and taxi eligibility, player lock-time injury status and feasible options remain unverified for a full decision-grade model.
4. Historical 2016–2019 ESPN results are not part of these Sleeper roster observations.
5. **2026 is ongoing**; its Week 8 snapshot is a separately verified period, not part of the 822/830 completed-season statistic.
6. Week 1 and Week 7 of 2025 are sourced from the preserved WAR-roster reconstructions; no points-above-replacement or certified WAR is claimed.
7. Existing Report Card outcomes, Legacy OVR, draft/trade ratings, and FAAB grades remain unchanged.

## Website behavior

- Every active Manager Report Card shows that manager's observed/comparable historical lineup sample, mean hindsight percentage and excluded weeks inside the existing evidence disclosure, with expandable season rows and an explicit **Not rated** skill category.
- Start/Sit Accuracy research displays a quick historical evidence disclosure with annual coverage counts while retaining its existing optional weekly drilldown.
- Mobile visual validation checks the detailed history is available and the season table has six rows.
