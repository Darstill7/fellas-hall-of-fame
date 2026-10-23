# Fellas WAR — v0.1 research framework

**Status:** Methodology specification; no WAR player or manager scores are certified yet.

## Objective
Fellas Wins Above Replacement estimates how much fantasy lineup value a player or acquisition contributed compared with a realistic replacement at the *same roster/lineup opportunity*. It is **not raw starter points**.

## Source
Use Sleeper starter-level scoring for regular season 2020–2026 (2026 through Week 6 in archived build). Historical manager ownership must follow actual owner IDs, not roster slots; some Sleeper rosters changed owners over time. Exclude or flag unassigned owners. The source dataset is data/player_starts_YYYY.json. For trade timing, use transaction effective week and ownership evidence, not just trade date.

## Proposed calculation, pending league-wide player/roster replacement baselines
1. For each season and scoring week, compute replacement points for QB/RB/WR/TE based on available substitute production using the actual lineup rules and starter slot capacity; flex positions compare to the best available *eligible* replacement, not a universal baseline.
2. Player weekly value = actual lineup points minus same-week slot-eligible replacement expectation, adjusted for missing games / byes and zero-start eligibility. Record weeks with roster/lineup anomalies.
3. Sum only credited starts during a manager's tenure. Report per-start WAR and accumulated WAR; cap/explain incomplete current-season exposure.
4. Convert points above replacement to wins using league-season matchup sensitivity: empirical marginal points-to-win conversion from the distribution of verified matchup margins (or matchup-specific counterfactual wins), separately for regular season and playoffs. No arbitrary 10/20-point conversion.
5. Surface *data coverage and sample size* beside scores. Show an uncertainty band when baseline/ownership is incomplete. Maintain season-specific scoring rules and league format.

## Trade-value scoring v1 — after WAR calibration
For a trade side, aggregate **post-trade WAR credited to acquired assets** across the documented evaluation window, not total season points. Display: raw starter production snapshot; refreshed points-through-week; WAR; opportunity/starts; historical source confidence. Separate non-player assets (FAAB, keeper and draft picks) until independently valued. A two-sided winner score requires both evaluated on comparable dates and owner records. Show 'ungraded' if not comparable.

## Never infer
- A high-scoring QB automatically outranks an RB in trade value.
- A transaction-date trade score is current production.
- A player's pre-trade performance belongs to the acquiring team.
- Historical owner ID equals today's manager when roster ownership changed.
- Reconstructed 2020–2025 regular-season matches imply complete pre-2020/2026 or playoff coverage.

## Delivery order
1. Validate manager owner mapping by season.
2. Collect full eligible weekly scoring/bench and roster replacement pools.
3. Produce per-position weekly replacement baselines.
4. Evaluate counterfactual weekly outcome margin sensitivity.
5. Pilot on one season and audit edge cases.
6. Publish verified WAR leaderboards and tie into Trade Labs and manager profiles.
