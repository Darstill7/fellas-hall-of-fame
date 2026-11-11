# Phase 1 research — second-pass audit and corrections
**Prepared November 11, 2026. Research branch only; not yet independently certified.**

## Source and coverage
- Canonical `data/unified_record_book_2016_2026.json`, updated 2026-11-10, contains **705** regular-season paired games (**1,410** team-game entries), 2016–2026 Week 9.
- Full ten-/eight-team paired scoring weeks: **142**. 2020 Week 14 and 2021 Week 14 each contain eight recorded paired team scores; two byes in each year do **not** indicate a missing regular-season opponent. They require a complete *scored team* audit for weekly scoring rankings, rather than treating 8 recorded opponents as the full 10-team league.
- The existing 44-category `expanded_records_verified_v1.json` is an older Week 8 snapshot, not up to date with Week 9.
- Historical ESPN seasons differ in league size, scoring precision, and number of games; avoid unfair raw scoring-era comparisons.

## Correction 1: Consecutive rivalry meetings, not adjacent calendar weeks
The first Phase 1 report counted only wins in *adjacent calendar weeks*; this was not a correct rivalry streak definition. Re-sort each ordered manager/opponent series by season/week and count consecutive meeting results; a tie or a loss breaks the winning streak. Minimum five historical meetings in a rivalry.

| Manager | Opponent | Maximum consecutive wins | Span of first-to-last winning meeting |
|---|---|---:|---|
| Birch | Stilly | 6 | 2018 W12–2022 W9 |
| Mitch | Stilly | 6 | 2023 W1–2026 W7 |
| Mitch | Stew | 6 | 2018 W12–2021 W11 |
| Stover | Thommy | 6 | 2021 W5–2024 W8 |
| Thommy | Kuhl | 6 | 2023 W1–2026 W7 |
| Tony | Kuhl | 6 | 2023 W7–2026 W1 |

This record is **shared**, not owned by a single manager. Verify each six-meeting sequence against original matchup receipts before promoting it to the production records registry.

## Correction 2: Season points allowed eligibility and interpretation
Current paired matchup points-against findings:

| Rank | Manager and season | Paired games | PA total | PA/game |
|---:|---|---:|---:|---:|
| 1 | Thommy, 2021 | 14 | 1,766.00 | 126.14 |
| 2 | Thommy, 2020 | 14 | 1,724.40 | 123.17 |
| 3 | Scott, 2024 | 14 | 1,705.98 | 121.86 |
| 4 | Kuhl, 2023 | 14 | 1,688.56 | 120.61 |
| 5 | Koble, 2021 | 14 | 1,676.58 | 119.76 |

A raw 'fewest points allowed in a season' category disadvantages 12-game seasons relative to 14-game seasons and rewards earlier lower-scoring formats, so **do not publish it as a cross-era Hall of Fame title.** Replace with PA/game by format-era, or relative to each season's scoring average. A weighted/relative metric must be explicitly defined and independently validated.

## Correction 3: Weekly-streak eligibility
- **Three consecutive high-scoring weeks**: Evans, 2016 Weeks 7–9 (provisional first place).
- **Four consecutive league-low scoring weeks**: Stew, 2023 Weeks 11–14 (provisional first place).
- For weekly-scoring consecutive streaks, require consecutive calendar weeks in the same regular season. Missing or ineligible weeks break streaks. Consecutive *rivalry meetings* have a different definition (above).
- All managers tied for weekly highest/lowest score share that week's mark; distinguish first (tie) from single winner. Verify whether an unpaired scored manager changed rank in 2020–2021 Week 14.

## Correction 4: Week 9, 2026 scoring title
Week 9 archived 2026 paired scores in descending order:
1. JMid 148.74
2. Stilly 116.66
3. Tony 116.30
4. Scott 109.94
5. Stover 102.58
6. Mitch 97.76
7. Stew 87.36
8. Birch 87.06
9. Thommy 86.60
10. Kuhl 77.54

This is source evidence for JMid being Week 9's high scorer, **not** proof of a new consecutive-title record. Confirm Week 8 independently.

## De-duplication against the existing 44 categories
Distinct additions suitable for focused source validation:
1. Highest combined regular-season matchup total
2. Lowest combined regular-season matchup total (label scoring era)
3. Most weekly first-place scoring finishes (career)
4. Most weekly last-place scoring finishes (career, shame)
5. Most weekly second-place scoring finishes (career)
6. Most top-three-scoring losses (career)
7. Most bottom-three-scoring wins (career)
8. Most weekly scoring crowns in a completed season
9. Most weekly top-three scoring finishes in a completed season
10. Most weekly last-place finishes in a completed season (shame)
11. Most points allowed in a completed season (era flag)
12. Most PA/game in a completed season (era flag)
13. Longest consecutive weekly high-score streak within one season
14. Longest consecutive weekly low-score streak within one season (shame)
15. Most completed regular-season scoring crowns by season
16. Longest consecutive wins against one rivalry opponent (meetings)
17. Most games within one point between the same two managers
18. Most combined regular-season scoring in one rivalry series (distinct from cumulative margin)

Proposed **removed from release batch**: 'Fewest season PA' unless normalized for scoring era and number of games. No count should be labeled '44 + 18 verified' before original receipts, numerical reproducibility checks, manager identity tests, and CI pass.

## Additional validation risks
- Historic 2016 first-season roster was eight teams; all other qualifying scored weeks have ten team results when paired.
- ESPN early seasons used integer scoring and changed to half-PPR in 2019; raw points are historical marks, not an equal-era quality comparison.
- 2026 Week 9 games include `sleeper_api_staged_week_9` entries. Reverify upstream provider finalization.
- `Thommy` is Zach Prescott, not former manager Schermerhorn.
- Exclude playoff/bracket/consolation game rows from regular-season records.
- Tie-aware top five lists need dense/competition ranks, shared winners, exact opponent/date receipts, and a distinct manager's next challenger.
- A Hall of Shame holding is **not** a positive record in a manager's trophy case.
- 'Most combined points in one rivalry' should be one **unordered** pair, never mirrored twice.

## Recommended next technical change
Implement a versioned deterministic `record-registry-phase1` builder that consumes canonical matchups and separately verified complete scored team-weeks, writes stable IDs and provenance, and provides the same registry to the Record Book and each manager portfolio. Add independent test fixtures for 2016 league-size changes, 2020/2021 byes, rivalry meeting streaks, fractional scores, ties, and Week 9 updates. Keep draft-only until all canonical, Chromium, WebKit, and visual gates pass.
