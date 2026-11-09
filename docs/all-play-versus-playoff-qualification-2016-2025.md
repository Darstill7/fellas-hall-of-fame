# All-Play Performance and Actual Playoff Qualification — Verification Research

**Staged November 9, 2026.** This is *not* a reconstructed fantasy playoff bracket. Source receipts: `data/all_play_vs_playoff_qualification_2016_2025_v1.json`, verified ESPN/Sleeper championship brackets, and normalized all-play scores in `data/all_play_schedule_variance_2016_2026w8_v1.json`.

## A striking 2018 case

**Evans ranked tied for third** among ten managers on normalized weekly all-play expected wins in 2018 (7.00 over 13 regular-season weeks) but **did not qualify** for the six-team championship bracket. Stew also had 7.00 expected wins and is tied for third, and *did* make the playoffs as seed No. 3. The tied rank is critical; do not call Evans unambiguously third.

Conversely, **Stover had the eighth-ranked all-play expected win total** (6.00) but qualified as the **No. 2 seed** in 2018. This is a descriptive difference between schedule matchup results and weekly all-play performance, not proof that seed No. 2 was undeserved or an alternate schedule would exclude Stover.

## Qualified and excluded across 2016–2025

Within the official championship-field size, **10 manager-seasons ranked high enough on all-play expected wins but missed** the playoffs. Exactly **10 qualified manager-seasons ranked below that field-size cutoff**. These are aggregate ranks across different rules, scoring and bracket sizes; the ranking is not a replacement for officially recorded standings.

### Outside the playoffs despite an all-play rank within the championship-field size

| Season | Manager | All-play rank | Expected wins | Comparable weeks | Playoff field size | Official seed |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 2016 | Stilly | 4 | 6.29 | 13 | 4 | Missed |
| 2017 | Stover | 4 | 6.72 | 12 | 4 | Missed |
| 2018 | Evans | 3 (tie) | 7.00 | 13 | 6 | Missed |
| 2018 | Mitch | 6 | 6.44 | 13 | 6 | Missed |
| 2020 | Thommy | 6 | 6.56 | 13 | 6 | Missed |
| 2021 | Kuhl | 6 | 6.11 | 13 | 6 | Missed |
| 2022 | Koble | 6 | 6.67 | 14 | 6 | Missed |
| 2022 | Tony | 5 | 6.78 | 14 | 6 | Missed |
| 2023 | Thommy | 6 | 7.22 | 14 | 6 | Missed |
| 2024 | Mitch | 5 | 6.78 | 14 | 6 | Missed |

### In the championship bracket despite an all-play rank below field-size cutoff

| Season | Manager | All-play rank | Expected wins | Comparable weeks | Playoff field size | Official seed |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 2016 | Thommy | 5 | 6.21 | 13 | 4 | 3 |
| 2017 | Evans | 6 | 6.17 | 12 | 4 | 4 |
| 2018 | Stover | 8 | 6.00 | 13 | 6 | 2 |
| 2018 | Kuhl | 7 | 6.28 | 13 | 6 | 5 |
| 2020 | Koble | 8 | 5.56 | 13 | 6 | 6 |
| 2021 | Evans | 8 | 5.67 | 13 | 6 | 5 |
| 2022 | Stilly | 8 | 6.11 | 14 | 6 | 5 |
| 2022 | Thommy | 7 | 6.22 | 14 | 6 | 6 |
| 2023 | Birch | 7 | 7.11 | 14 | 6 | 5 |
| 2024 | Birch | 7 | 6.22 | 14 | 6 | 5 |

## Important methodological limits

1. **2016 had eight teams and four playoff participants; 2017 had ten teams but four playoff participants.** From 2018 onward, the championship field contained six.
2. **2020 and 2021 source weeks are incomplete in Week 14**. The all-play ranks use 13 fully paired weeks, while actual seeds reflect the league's recorded qualification results. Their comparison is **partial-season vs full-season**, and must be visibly qualified when published. It is not an alternative final standing.
3. **Ties in expected wins receive a shared competition rank**, not an alphabetical or other fabricated tiebreaker. In 2018, Evans and Stew are tied for third.
4. **A field-size cutoff isn't an alternate playoff projection.** True alternate league scheduling must preserve schedules, opponents, records, tiebreak procedures, and actual playoff brackets.
5. **JMid did not compete in 2023**—Evans held that historical spot. Do not conflate the two managers' identities.
6. **Consolation is not qualification.** The comparison uses only the verified winners' championship field.
7. **2026 has no finished championship**, so it is not included here. Its Week 8 scoring may be used for a separate provisional regular-season snapshot only.
8. **Do not frame this as luck-adjusted championships, managerial grades or true alternate qualification percentages.** It is a case study illustrating how weekly scoring and the actual matchup schedule can differ.

**Editorial recommendation:** Use the Evans 2018 / Stover 2018 contrast as an especially interesting archival feature, with the explicit tied rank and verified seeds. A simple `Schedule Draw & All-Play` explanation is valuable; there is no need for a separate manager penalty or retroactive playoff bracket.
