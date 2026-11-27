# 2020–2021 provider reconciliation — 2026-11-27

Research only. No authorization to change canonical stage, scores or published categories.

## Retrieval and scope
Fresh Sleeper historical data via Flaim Fantasy: league 561248176597610496 (2020), 668633299786244096 (2021). Compared get_standings and get_matchups (weeks 1–13) to data/2020_2021_static_season_page_parity_v1.json and data/season_weekly_matchups_2016_2026_v1.json on prior PR head ef4be6b2bc3c984db2002dd3d39a4de1e86c0838. This is a summary of the retrieval, not a raw original provider receipt. Historical roster IDs 1–10 map respectively to Stilly, Evans, Thommy, Stew, Koble, Mitch, Tony, Stover, Kuhl, Birch. Each season returned five paired matchups per week, all matching archived participants and scores to cents (65/65 games, 130/130 scores per season). All 20 official W/L and static season-page PF totals matched. Provider weekly scores and provider season totals are distinct evidence.

| Season | Manager | Official PF | Weekly sum | Weekly excess |
|---|---|---:|---:|---:|
|2020|Kuhl|1413.58|1415.58|2|
|2020|Evans|1547.54|1549.54|2|
|2020|Stover|1435.16|1439.16|4|
|2020|Stew|1359.42|1361.42|2|
|2020|Thommy|1473.82|1475.82|2|
|2021|Kuhl|1435.32|1436.32|1|

Cause unknown; do not invent stat corrections or adjust weekly points. Preserve official standings and weekly-derived aggregates as separately labeled measures. PA also requires reconciliation before migration.

## Stage and award policy
Consult data/week14_2020_2021_stage_classification_audit_v1.json and data/provider_week14_2020_2021_pairing_recovery_v1.json. Four championship opening games verified by existing bracket evidence. Four non-winners pairings remain inferred consolation or other postseason; exact bracket label not certified. Official 13-game W/L records corroborate exclusion of all eight games from regular-season statistics. Commissioner approved weekly scoring award eligibility for eight paired participants in each Week 14, excluding two bye managers in each season. Do not conflate eligibility with regular-season W/L/PF/PA or infer official bracket labels from numeric pairing IDs.

## Release blockers
Validate downstream career, all-play, streak, head-to-head, weekly awards, personal best and certified record watch projections before any canonical migration. Preserve all-game matchups and scores. Keep 660 stored archive matches distinct from certified regular-season count (eight known mislabels). No new record category publication. Raw bracket evidence and original 2026 Week 11 receipt remain outstanding.
