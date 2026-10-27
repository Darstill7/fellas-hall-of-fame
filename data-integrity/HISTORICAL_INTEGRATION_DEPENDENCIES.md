# Historical integration: one league, 2016–2026

Updated October 27, 2026. 2026 results cover Weeks 1–7 only.

## Completed and canonical
- Original ESPN 2016–2019 source: `data/espn_history_2016_2019.json`.
- 2020–2026 Sleeper regular-season scores: `data/unified_record_book_2016_2026.json`.
- Historical matchup and pairwise rivalry source: `data/all_rivalry_matchups_v3.json` (unified version v4), 695 regular-season games.
- Canonical per-manager records: `data/manager_record_books_2016_2026.json`.
- Main `data/league.json` now uses full-league manager records and head-to-head totals; earlier Sleeper records preserved as `sleeperEraRecordPriorSnapshot`. All-time points-for remains a separate future reconciliation.
- 10 manager HTML headline records now show full-league W–L (not the Sleeper-only total).
- `assets/manager-season-history.js` now loads the 2016–2026 verified ending timeline.
- ESPN titles / finalists: `data/manager_profile_career_summary_v2.json`.
- ESPN+Sleeper season endings: `data/manager_verified_season_endings_v1.json`.
- All-time luck: `data/all_time_luck_ratings_v1.json` recomputed from in-week comparisons.
- 2020 Week 14 Birch/Mitch and 2021 Week 14 Birch/Tony were playoff byes, not missing games.

## Remaining source-to-display migration
1. **All-time schedule matrix:** `data/all_time_schedule_matrix_v1.json` (~2 MB). It must be recomputed, not simply relabeled, using canonical 2016–2026 weekly scores. Validate 2016 eight-team / 2017 onward ten-team rules and valid opponent pairings.
2. **Rivalry derived analytics:** `data/manager_rivalry_analytics_v1.json`, `data/manager_rivalry_resumes_v1.json`, `data/rivalry_war_room_v2.json`. Recompute longest streak, toughest rival, rivalry narratives, and rankings using original ESPN matchups plus Sleeper.
3. **WAR/legacy:** `data/fellas_war_leaderboard_compact.json`, `data/fellas_war_multiseason_pilot.json`, `data/fellas_war_manager_summary_v1.json`. Player-level WAR needs historical ESPN lineups/rosters, not just matchup scores; until verified show explicit coverage start and avoid calling a Sleeper-only WAR full-career WAR.
4. **Awards and league superlatives:** `data/all_time_league_superlatives_v1.json`, `data/fellas_awards_by_season.json`, `data/awards_show_v1.json`, and `data/record_book_v2.json`. Rebuild suitable team/week/margin records from 2016 onward; draft, trade, waiver categories require historical transaction records.
5. **Season hubs and stories:** `data/season_guide.json`, `data/season_stories.json`. Include 2016–2019 seasons and official championship opponents, and distinguish season-long aggregates vs two-week playoff rounds.
6. **Manager bios and franchise narrative:** `data/manager_biographies_awards.json`, static manager dossier paragraphs, any static rivalries or Sleeper-only career claims embedded in HTML. Each claim should cite an actual source or be labeled editorial / era-limited.
7. **Historic points-for / points-against:** Migrate `league.managers.*.pf` and supporting career scoring summaries from ESPN+Sleeper totals, preserve scoring-era footnotes. The current field is explicitly marked earlier Sleeper era.
8. **Identity audit:** Tom = Zach Prescott/Thommy; Schermerhorn former owner distinct; Birch/Tony 2017 starts; Mitch and Kuhl observed in 2018; Stover 2016 founder. JMid 2023 attribution remains to verify against owner histories.

## Validation gates
- For each season, count actual played matches and account for playoff byes explicitly.
- For each pair, wins/losses/ties must match opponent mirror exactly and never count byes.
- For each manager, annual matchups must sum to their all-time record, including ties.
- Use separate regular season, championship, consolation, and ambiguous postseason categories.
- Do not say an award, transaction, WAR, or season placement is all-time until its historical source coverage is demonstrated.
