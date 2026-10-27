# Fellas Hall of Fame — Full-League Historical Data Audit

**Audit date:** October 27, 2026. **League span:** 2016–2026 (2026 through Week 7). **Canonical principle:** One league across ESPN (2016–2019) and Sleeper (2020 onward).

## Verified and corrected

- ESPN 2016–2019: 242 regular-season games recovered; team owners identified for all seasons.
- Sleeper 2020–2025 regular-season files: 418 games recovered (69 + 69 + 70 + 70 + 70 + 70).
- Current 2026 Weeks 1–7: 35 games recovered.
- **695** regular-season games available for cross-era rivalry and record calculations.
- Rebuilt all rivalry series from actual weekly scorecards; **80 historical pairwise series** across **14 distinct managers**. Former managers have their own identities.
- Replaced legacy current-manager rivalry matrix in `data/league.json` and underlying historical series in `data/all_rivalry_matchups_v3.json`.
- 2016/2017 ESPN playoff series can be two-week aggregate games, never individual week records.
- Original continuing managers: Stilly = Darren Stillson; Stew = Drew Sylvester; Thommy = Zach Prescott (legacy code calls him Tom); Stover = Landon Stover. **Tom Schermerhorn is a separate former owner.**
- Alex Birch and Tony Steglich first appear 2017; Mitch Huppert first appears 2018; Schermerhorn last appears 2017.

## Current-manager archived regular-season records

These use recovered weekly games rather than alternative legacy summaries. ESPN and Sleeper score totals are not normalized; 2026 is ongoing.

| Manager | Wins | Losses | Ties | Games | First observed |
|---|---:|---:|---:|---:|---:|
| Stilly | 65 | 77 | 0 | 142 | 2016 |
| Stew | 66 | 76 | 0 | 142 | 2016 |
| Thommy | 67 | 74 | 1 | 142 | 2016 |
| Stover | 75 | 67 | 0 | 142 | 2016 |
| Birch | 72 | 55 | 0 | 127 | 2017 |
| Tony | 72 | 56 | 0 | 128 | 2017 |
| Mitch | 70 | 46 | 0 | 116 | 2018 |
| Kuhl | 51 | 66 | 0 | 117 | 2018 |
| JMid | 24 | 25 | 0 | 49 | 2023 |
| Scott | 16 | 19 | 0 | 35 | 2024 |

## Known unresolved issues

1. **2020 Week 14 — Birch and Mitch had playoff byes**, confirmed by league manager. No head-to-head matchup or missing score.
2. **2021 Week 14 — Birch and Tony had playoff byes**, confirmed by league manager. No head-to-head matchup or missing score.
3. Some existing overview/legacy/season/WAR datasets were developed using Sleeper-only records. **The full historical rivalry engine is corrected, but all derived ratings, narratives, trophies, and graphics are not yet individually recertified.** Do not treat remaining historical texts or isolated Sleeper-only statistics as complete career totals.
4. **Postseason:** Sleeper playoff archive cannot consistently distinguish championship-bracket and consolation games. Those must be treated as postseason matches of uncertain bracket category, while championship years rely on the existing separate champion ledger. Verified ESPN finals: Zach Prescott 2016–2018 and Alex Birch 2019.
5. **Cross-era scoring:** Original ESPN rules and Sleeper scoring may differ. A raw 2016 score should not be called equivalent to a 2026 score without scoring-format context.
6. The 2026 season is a Week 7 snapshot, not a final completed season.

## Audit conventions and future work

- Official regular-season games form the authoritative head-to-head schedule, with ties retained.
- Postseason records are separate and include byes only when an opponent is actually present.
- Each former owner's score remains with that owner, even if a replacement assumed a league slot.
- Recalculate derived season luck and what-if matrices from **all 695 recovered regular-season games**, and document incompleteness for the two legitimate playoff-bye weeks.
- Audit each static narrative/profile bio against this updated dataset; do not mechanically replace text claims without evidence.

## Committed canonical sources

- `data/espn_history_2016_2019.json`
- `data/unified_record_book_2016_2026.json`
- `data/all_rivalry_matchups_v3.json` (now version v4 unified)
- `data/league.json` (updated current-manager matrix)
- `data/manager_record_books_2016_2026.json`
- `data/manager_identity_map_v1.json`

## Audit correction: playoff byes confirmed

The manager confirmed 2020 Week 14 byes for Birch and Mitch, and 2021 Week 14 byes for Birch and Tony. The 69-matchup counts in those seasons reflect **byes, not missing regular-season games**. Do not create fictitious matchups or change career W–L records. This supersedes earlier missing-game language.
