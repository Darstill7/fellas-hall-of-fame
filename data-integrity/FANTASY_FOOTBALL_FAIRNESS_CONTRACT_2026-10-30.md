# Fellas Fantasy Football — Rating and statistical fairness contract
Updated: 2026-10-30. Research policy, not certification of existing scores.

## Core league context
- Sleeper-era league: 10 teams, half-PPR, two FLEX positions, six playoff teams, two byes for top two seeds, FAAB; keeper rules have evolved (two keepers in 2026).
- Validate exact season-by-season starters, defense/kicker/superflex eligibility, playoff weeks, budgets, scoring settings, and transactions rather than extending present rules backwards.
- The ESPN era (2016–2019) must not be assigned made-up player-level waiver or lineup evidence.

## Outcome hierarchy
Championships > meaningful playoff advancement > playoff qualification > sustained regular-season and all-play strength. The existing implemented report-card weights assign postseason results 40%; do not silently replace them with a historical Legacy Score formula, which is a distinct product.
A win is a result, not unambiguous evidence of start/sit or transaction skill. Use all-play and opponent luck to contextualize schedules, not to erase actual wins.

## Drafting
- Compare actual picks against the choices available at that pick, under that season's draft and keeper rules.
- Do not grade keepers as ordinary picks or penalize managers for forfeited/keeper-locked selections.
- Avoid using full-season hindsight as a substitute for the decision quality available at draft time.
- Account for different season lengths and lineup requirements before comparing raw fantasy-point totals.

## Trading
- Verify both sides, dates, player eligibility, keeper rights, roster context, and whether assets were available to each team.
- Avoid counting future production while owned by a subsequent manager as the original trader's direct contribution.
- Distinguish fair ex-ante decisions from ex-post realized return; score both separately if enough evidence exists.

## FAAB and free agency
- Only successful transactions spend confirmed winning bid dollars. Failed bids are attempts, not charges.
- Successful zero-dollar claims can be highly valuable and must remain eligible for acquisition impact metrics.
- Join the exact player, manager, date and roster before measuring subsequent production.
- Avoid counting points before claim completion, after a drop or trade, or without recorded ownership.
- Distinguish pregame roster availability from after-game hindsight; opposing-team bench players do NOT constitute the unowned free-agent pool.
- Estimate replacement value from transaction-time available alternatives only after availability, scoring, position, schedule, and eligibility can be reconstructed.
- Normalize cost using verified season-specific starting budgets and any replenishment rules, not an assumed common annual budget.
- Separate ability to choose a player from ability to use that player as a starter. Do not give the acquisition score credit twice for the same lineup contribution.
- Compare fair windows of post-claim opportunities, accounting for late regular-season/postseason acquisitions and censoring.
- Report sample size, verified coverage, ungraded claims and observation limits for every manager-season; never call raw per-dollar ratios skill.
- Never punish an inactive manager solely for a low transaction count; an already strong roster may need fewer moves.

## Start/sit
- Reconstruct exact eligible slots and lock times for that week. In particular, account for two FLEX positions in current formats and any historical changes.
- Do not use a perfect-hindsight optimal lineup as an unqualified skill measure. It is a descriptive ceiling, not what was reasonably predictable.
- Exclude injured/out/bye/ineligible players from feasible pre-kickoff alternatives, only if the information was knowable before lock.
- Keep games delayed or subsequently stat-corrected clearly labeled.

## Evidence and publishing
- Source each claim to a provider receipt, season configuration, roster snapshot, matchup/weekly player score, or verified specialty record.
- Treat missing games or players as missing, not zero. Do not merge Schermerhorn into Thommy or invent former-manager identities.
- Retain the active 2026 season as partial until verified complete.
- Report-card waiver and lineup values remain null/N/A until decision-level evidence, comparability, model calibration, and executable tests pass.
- Test ranking monotonicity, missing data, duplicate source IDs, free-agent availability boundaries, position rules, keeper rules, playoff boundaries, and historical identity changes.
- Obtain confirmed canonical CI, Chromium, WebKit, site navigation and deployed parity evidence before release. A committed test is not a passed test.

## Important conceptual distinction
The Fellas report-card OVR (category weighted, currently provisional), all-time Legacy Score (historical success composite), and weekly living power rating are separate models with separate purposes and should not share weights or identities by implication.
