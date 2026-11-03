# Fellas Keeper Decision Score — Research Methodology (2025)

**Status:** research-only. No official Keeper Decision grade, manager report-card rating, or career OVR is authorized by this methodology.

## Verified historical evidence

- Sleeper 2025 completed draft: 150 picks, including 20 keeper selections (two per team), matched to original provider player IDs.
- Sleeper 2024 final-week rosters: ten recovered rosters, 158 roster entries (157 distinct player IDs). All 20 eventual keepers appear on their original manager's Week 17 roster.
- One cross-team conflict: Kareem Hunt appears on both 2024 Week 17 team 6 and team 7 rosters. The snapshot is **not** a verified exclusive-ownership or keeper-deadline eligible pool.
- 2025 keeper starting production has been reconciled against archived regular-season and 2025 Weeks 15–17 starters. Recorded ownership changes do not transfer original-manager keeper credit to later owners.
- The **six-team championship bracket** was verified separately from user-supplied championship-bracket screenshots, in `data/verified_sleeper_playoff_brackets_2020_2025.json`.

## What the research index actually measures

The provisional 2025 index is out of 100 and currently combines:

- **55% observed regular-season production:** keeper starts relative to the same-week positional starter median, rescaled and clipped. This is not replacement value.
- **30% nominal draft capital:** the average of the two retained-round positions, rescaled and clipped. This is not the exact opportunity cost of a forfeited pick.
- **15% actual championship-bracket starting contribution:** only original keeper starter points in championship-bracket games. Points from consolation or nonchampionship games are excluded.

For 2025, the championship-bracket playing teams are:
- Week 15: Tony, Thommy, Stew, Birch (Mitch and Scott earned byes)
- Week 16: Mitch, Thommy, Scott, Birch
- Week 17: Thommy and Scott

A bye represents a verified playoff achievement, **not** a fictitious starting score. The model should eventually distinguish team achievement from a keeper's own scoring contribution without turning every matchup victory into keeper WAR.

The previous research-index version incorrectly treated *all* Weeks 15–17 starts as championship playoff contributions. Do not use older numbers as official Keeper Decision ratings.

## Keeper abandonment rules

Completed releases by Birch (Brian Robinson Jr., Week 3) and Kuhl (Jared Goff, Week 4) are verified by original provider transactions. An outright drop is not a trade, and subsequent managers' starts do not accrue to the original keeper manager.

The approved implementation **does not yet assign numeric abandonment penalties**. The website research now carries the source-backed transaction/replacement context so the next scoring pass can distinguish the two verified releases:

- **Birch / Brian Robinson Jr. (Week 3):** provider receipt `1276366260652736512` shows a $2 successful waiver adding Kareem Hunt and dropping Robinson. Hunt stayed on Birch's bench through the immediately archived follow-up weeks and first started in Week 9 for 12.0 points before Birch dropped him in Week 10. No later 2025 Robinson roster/start evidence was found in the archived Week 4–14 snapshots.
- **Kuhl / Jared Goff (Week 4):** provider receipt `1278720074449977344` shows a $5 successful waiver adding Arizona D/ST and dropping Goff. Arizona D/ST started Week 5 for 6.0 points, was benched Week 6, and was cut Week 7. Goff was added for $0 by another manager in Week 5, started immediately in Weeks 5–6, was reacquired in Week 8, and later continued to start / move as a trade asset.

This context strengthens the case for a capped asset-management penalty, especially where the replacement was short-lived, but later player success alone must not become the penalty. A future capped penalty must consider:

1. The early-release timing and draft-round asset forfeited.
2. Known contemporaneous player availability, injury, and legitimate roster needs.
3. Actual replacement asset and lineup usage, without assuming a same-position or causal substitution.
4. Any later contribution strictly as retrospective context.
5. Avoid double-counting the same shortfall already present in observed production, and limit the penalty to the Keeper Decision subgrade.

The published research scorer and sensitivity audit preserve `abandonmentPenalty: null`. Do not substitute a speculative zero or quietly apply an arbitrary 3–12 point decrement.

## Release gates

Before promoting any Keeper Decision grade or incorporating it into OVR:

- Reconstruct **actual keeper-deadline eligibility**, including each manager's legal protected-player options and penalty rules.
- Confirm the contemporary alternative pool and the actual round-slot consequences.
- Certify and document any proposed abandonment adjustment's evidence and de-duplication logic.
- Test rankings under varied weights; explain uncertainties, byes, consolation games, injuries, and trades.
- Require canonical CI and mobile browser tests to pass on the intended commit.

Relevant generation scripts:
- `scripts/reconstruct-2025-keeper-candidate-inventory.mjs`
- `scripts/verify-2025-keeper-starts.mjs`
- `scripts/verify-2025-keeper-postseason.mjs`
- `scripts/audit-2025-keeper-championship-bracket.mjs`
- `scripts/score-2025-keeper-decision-research.mjs`
- `scripts/audit-2025-keeper-score-sensitivity.mjs`
- `scripts/audit-2025-keeper-publication-readiness.mjs`

**Interpretation:** an accurate, intriguing retrospective performance index can be released *as research* without claiming the same level of confidence as a certified decision-quality grade.
