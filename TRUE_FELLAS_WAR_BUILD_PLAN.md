# True Fellas WAR — build specification and acceptance criteria

## Status
Research phase. The public WAR Lab remains a starter-benchmark proxy, **not true WAR**. Do not present provisional rankings as finalized.

## Scoring definition
For each actual weekly lineup:
- Assign replacement-level expected points to QB, RB, WR, TE, FLEX, and DEF using **players realistically accessible as replacements that week**, with roster format, league depth and scoring settings respected.
- For FLEX, optimize eligible RB/WR/TE replacement choices across all occupied slots; do not evaluate each player in isolation using a simple same-position reference alone.
- Player points above replacement = observed lineup contribution minus an eligible replacement for the same weekly lineup decision.
- Wins above replacement = the difference between actual head-to-head matchup result and optimized counterfactual matchup result using replacement lineup, with ties assigned 0.5. Report as *individual marginal wins*, not additive team wins; aggregate manager WAR requires a separate allocation method (e.g. permutation/Shapley approximation).
- Attribute starts to historical owner identity, **not today's roster-slot ownership**.
- Treat playoffs separately from regular season and preserve incomplete seasons.

## Data acquisition requirements
- Verified week-by-week starters and final scores (2020–2025 regular season, 2026 through W6 currently archived).
- Full bench rosters and scores for each team/week.
- Free-agent availability at the lineup-lock time (transaction history and waiver processing), or reconstruct a defensible waiver-availability proxy and document uncertainty.
- Weekly roster settings including FLEX eligible positions and scoring format changes.
- Historical 2020–2025 postseason starter assignments.
- Prior seasons 2016–2019 where a verified source exists.
- Cross-check source owner IDs against transferred roster ownership (especially former roster 8).

## Checks required before publishing
1. Sum starter points reproduces 100% of archived matchup totals within 0.05.
2. 100% of certified weeks have corresponding eligible replacement pools; otherwise mark missing.
3. Replacement score cannot exceed a demonstrably available feasible replacement lineup without explanation.
4. Bench options and roster constraints are handled before credits are assigned.
5. Per-player counterfactual comparison can be reconstructed for any weekly observation.
6. Playoff and regular-season rankings separately explained, not secretly merged.
7. All public award cards label their methodology and data vintage.

## Rollout
A. 2025 complete weekly eligible pools and replacement lineup optimizer, QA.
B. 2025 player marginal wins and manager attribution, comparison against existing proxy.
C. Extend seasons 2020–2024 + 2026, conditional on coverage.
D. Recompute Trade Value Lab on post-trade counterfactual lineup improvement, grade only complete transactions, independently price picks/keeper assets.
E. Update manager Legacy Résumé and Mount Rushmore from certified WAR; keep prior rankings preserved as snapshots.
F. Annual awards show moves experimental MVP to certified Fellas WAR MVP only after all criteria pass.

## Existing research datasets
- data/player_starts_YYYY.json
- data/sleeper_matchups_YYYY.json
- data/fellas_war_leaderboard_compact.json
- data/fellas_war_multiseason_pilot.json
- data/trade_par_preview.json
