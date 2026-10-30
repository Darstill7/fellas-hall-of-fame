# Fellas historical source-of-truth audit

This document describes the evidence hierarchy for manager analytics. It is not evidence that a live external API was scraped during CI.

## Sources retained
- **Sleeper 2020–2025:** `data/sleeper_roster_snapshots_<year>_week<week>.json` is the recovered player-level source for all but 2025 Weeks 1 and 7. Those two are kept in `data/war_rosters_2025_week1.json` and `data/war_rosters_2025_week7.json`. Original manager IDs, started players, bench players and score values must be preserved.
- **Weekly results:** `data/sleeper_matchups_2020.json` through `data/sleeper_matchups_2025.json` and the unified `data/season_weekly_matchups_2016_2026_v1.json`. They are not full player box scores.
- **Historical transactions:** `data/v9_trade_engine.json`, `data/acquisitions_2020.json` through `data/acquisitions_2026.json`, `data/trade_lineage_v2.json`, and transaction receipt/certification files. These are not full pre-lock waiver availability snapshots.
- **Drafts and starts:** `data/v9_draft_engine.json` and `data/player_starts_2020.json` through `data/player_starts_2026.json`.
- **ESPN legacy:** `data/espn_history_2016_2019.json`, year-specific draft and roster snapshots, historical ID reconciliation and verified ESPN playoff brackets. Weekly roster detail is not assumed equal to the Sleeper archive.
- **Verified postseason:** `data/verified_sleeper_playoff_brackets_2020_2025.json` and `data/verified_espn_playoff_brackets_2016_2019.json`.

## Output rules
1. Run all canonical source reconciliation scripts before using derived data. Do not silently substitute derived pages or archived pilots for authoritative historical inputs.
2. Run `node scripts/audit-evidence-coverage.mjs`; its generated `data-integrity/recovered-source-coverage-2020-2025.json` is the current **file-backed coverage audit**, not a scraped external response.
3. Preserve `data/war_2025_coverage_gates.json` as an **old research snapshot**. Its statement that 2025 has just two bench-covered weeks is superseded for roster coverage only; its warning that replacement pools are unverified remains true.
4. The six-season hindsight lineup model may calculate actual vs optimal scores only for eligible source records. Never treat observed hindsight point gaps as pregame lineup judgment, true WAR, or causal trade improvement.
5. 2026 is still ongoing. Do not count projected future results or incomplete postseason outcomes.
6. Reconcile identities against the historical manager mapping. Never collapse departed or nonparticipating managers into current franchises.
7. Prior to any grade based on waivers or trades, document denominators, cost data, roster alternatives and what is missing.

## Remaining acquisition gaps
Historical pregame projection feeds; verified lock-time player status and position eligibility (especially DB/FLEX); complete free-agent pools and missed waiver bids; historical ESPN weekly box scores; comprehensive keeper cost and trade-time roster counterfactuals.

## Validation
The workflow runs season-specific roster/score reconciliation for 2020–2025 and a cross-era source inventory. The observed 2021 Week 14 matchup pairing gap is flagged rather than fabricated.
