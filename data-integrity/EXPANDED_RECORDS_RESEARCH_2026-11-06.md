# The Fellas — Expanded Records Research and Release Audit

As of **2026-11-06**; source snapshot through **2026 Week 8**.

## Discovery results

- **700** distinct provider-recovered regular-season matchups, **1400** two-sided manager game records.
- **44** new verified statistical categories in five families: Single-game, Career, Season, Rivalries, Final standings.
- **Ten of ten** active managers have three or more source-supported signature highlights; historic owners stay on all-time leaderboards.
- **No quota / artificial title:** Leaders are ordered by measured value. Personal bests are labeled separately from league-wide top-three rankings. One person can hold as many record-category placements as the sources show.
- The separate verified postseason research covers 2016–2025 championship brackets and one-week postseason matchup data, with consolation explicitly separate.

## Signature research inventory

| Manager | Categories with measurable evidence | League top-three category marks | Selected verified highlights |
|:--|--:|--:|:--|
| Stilly | 44 | 9 | Highest average score against one rival (132.07 ppg, League top-three); Most completed seasons (10 seasons, League top-three); Most wins against one rival (11 wins, League top-three) |
| Stew | 44 | 6 | Most completed seasons (10 seasons, League top-three); Most meetings against one rival (20 games, League top-three); Most recorded regular-season games (143 games, League top-three) |
| Tom | 44 | 7 | Most top-three finishes (5 finishes, League top-three); Best average normalized finish (66.67 score / 100, League top-three); Wins while scoring below 100 (14 wins, League top-three) |
| Stover | 44 | 13 | Career regular-season wins (75 wins, League top-three); Most regular-season points scored (15318.4 pts, League top-three); Most points in a season (1770.9 pts, League top-three) |
| Birch | 44 | 20 | Most top-half finishes (6 finishes, League top-three); Best season point differential (345.12 pts, League top-three); Most 140-point games in one season (5 games, League top-three) |
| Tony | 44 | 15 | Biggest year-over-year finish rebound (100 points, League top-three); Highest rivalry win rate (83.33 %, League top-three); Largest cumulative margin versus one rival (270.78 pts, League top-three) |
| Mitch | 44 | 25 | Most wins against one rival (11 wins, League top-three); Most points in a season (1894.88 pts, League top-three); Highest season scoring average (135.35 ppg, League top-three) |
| Kuhl | 44 | 2 | Wins by 3 points or fewer (5 wins, League top-three); Longest consecutive 120-point run (4 games, League top-three); Most completed seasons (8 seasons, Personal best) |
| JMid | 41 | 2 | Longest consecutive 100-point run (13 games, League top-three); Most points in a season (1730.22 pts, League top-three); Most completed seasons (3 seasons, Personal best) |
| Scott | 40 | 1 | Largest regular-season victory (101.38 pts, League top-three); Most completed seasons (2 seasons, Personal best); Most top-three finishes (1 finishes, Personal best) |

Counts labeled **league top-three** use a category’s individual best league rank (a single category, not each repeated individual game appearance). The interactive explorer may show multiple top-three **entries** within the same category if a manager owns several independent events.

## Methodology and caveats

1. Record inputs are `data/unified_record_book_2016_2026.json` and `data/fellas_final_placements_2016_2025_verified.json`. The published immutable data artifact is `data/expanded_records_verified_v1.json`.
2. The results distinguish **league record** from **personal best**. An absence from the league's top list does **not** mean the manager has no recorded history.
3. Season-ranking categories require a completed 2016–2025 season and **at least 12 recovered regular-season games**. 2026 is partial and never used for completed-season awards.
4. Lifetime counting categories include all recovered 2016–2026 Week 8 games. Career winning percentages and points-per-game require **at least 60 games**.
5. Head-to-head rate and scoring categories require **5–6 verified meetings** to suppress extremely small sample “records.”
6. “Consecutive” streaks are consecutive **recovered regular-season appearances**; they do not prove uninterrupted calendar weeks where an archive has gaps.
7. Fantasy scoring format, PPR and rounding changed in early ESPN years. Cross-era point totals are presented as historical scores rather than normalized era-quality ratings.
8. Postseason results never appear in the regular-season record categories. Official final placement metrics use verified completed-season rankings and normalize average placing for the eight-team 2016 field.
9. Counts and record entries are source-backed. No play-level information, comeback probability, starter/bench WAR, hypothetical schedules or “luck” claims were invented.

## Release audit

- `scripts/verify-expanded-records.mjs` checks source-count reconciliation, category IDs, ranked values, ten-manager inclusion, records versus personal-best labels, source identities and live route hooks.
- `scripts/test-browser-release.mjs` verifies record-family switching, a certified 0.16-point regular-season win, Tom and Scott’s manager portfolios, and all ten compact profile disclosures in both browser engines.
- `scripts/visual-quality-gate.mjs` screenshots the new page at 320px, 390px, 768px, 1280px Chromium and 390px WebKit in addition to the existing flagship pages.
- The release remains on a draft pull request until **both** canonical and visual GitHub checks pass; production is not changed during research.

## Follow-up discovery opportunities

Future record families requiring more source work before ranking include player-level keeper contributions, trade-value-added, FAAB auction efficiency, fully reconciled start/sit opportunity, and percentage-of-playoff-win probability. These are intentionally **not** published as verified records today.
