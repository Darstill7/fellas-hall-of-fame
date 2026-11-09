# Consistency beyond streaks: season scoring floors and reliable output

**Research scope:** Completed Fellas seasons **2016–2025**, regular-season team fantasy scores only. A scoring floor is the **lowest** weekly score a manager had in a completed season, not an adjusted fantasy ability grade. The source is `data/season_weekly_matchups_2016_2026_v1.json` and the reproducible derived rows are in `data/scoring_floor_research_2016_2025_v1.json`.

## Most reliable completed scoring season in the recovered archive

**Mitch's 2025 team never scored below 96.20 points in any of its 14 recorded regular-season games.** This is the **highest season minimum** among the **94 fully paired manager-seasons** in the completed 2016–2025 score archive. The low came in Week 13. It also scored **over 100 in 13/14 weeks**, and **at least 105 in 13/14**, making it an especially compelling season-level consistency story even though scoring and settings can differ across eras.

| Rank | Manager | Season | Lowest week score | Week | Above 100 weeks | At least 105 weeks |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Mitch | 2025 | 96.20 | 13 | 13/14 | 13/14 |
| 2 | Mitch | 2021 | 92.96 | 9 | 12/14 | 12/14 |
| 3 | JMid | 2024 | 92.96 | 1 | 13/14 | 12/14 |
| 4 | Mitch | 2022 | 92.06 | 14 | 11/14 | 11/14 |
| 5 | Stilly | 2023 | 90.40 | 7 | 11/14 | 8/14 |
| 6 | Koble | 2023 | 89.94 | 14 | 11/14 | 10/14 |
| 7 | Koble | 2019 | 89.50 | 8 | 10/13 | 8/13 |
| 8 | Kuhl | 2024 | 89.24 | 5 | 10/14 | 6/14 |
| 9 | Kuhl | 2019 | 88.64 | 12 | 10/13 | 9/13 |
| 10 | Stew | 2018 | 88.60 | 3 | 9/13 | 9/13 |
| 11 | Stew | 2019 | 87.90 | 13 | 11/13 | 11/13 |
| 12 | Stover | 2022 | 87.70 | 12 | 12/14 | 10/14 |

## Season-total week-count records

**Most completed-season weeks strictly above 100:** a three-way tie at **13 of 14** by Mitch (2025), Stover (2021), JMid (2024). Their consecutive-run patterns are different, so these are separate records.

**Most completed-season weeks at or above 105:** **Mitch (2025), 13 of 14**. This is not the same metric as Mitch's 12 consecutive games at that threshold; his 13 qualifying weeks need not be consecutive.

## Source and comparability cautions

- **94 fully paired completed-season manager rows** qualified. **Four excluded incomplete rows:** Birch 2020 (13/14 paired weeks); Mitch 2020 (13/14 paired weeks); Tony 2021 (13/14 paired weeks); Birch 2021 (13/14 paired weeks). Do not assign a zero or claim they failed to score a given minimum in missing Week 14.
- ESPN scoring formats, league rules and starter slots may have changed between 2016 and 2025. Describe this as a *recorded raw fantasy-point floor* rather than the definitive 'most reliable fantasy team ever' across identical conditions.
- A season floor differs from the league's longest consecutive-over-100 record and the highest number of 100+ weeks. All three can be shown without calling any of them a manager's skill grade.
- **2026 intentionally excluded** as unfinished; Stew's eight-game 105+ start remains a separate provisional Week 8 snapshot.

**Editorial suggestion:** If space permits, place a small 'Never a bad week' footnote beside the Scoring Consistency exhibit. Do not make it a separate top-level navigation category.
