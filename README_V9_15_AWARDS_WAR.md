# Fellas OS v9.15 — Awards + WAR Research Expansion

## Annual Awards v2
- Added runner-ups where the source supports them.
- Championship runner-ups are shown only for verified title-game losers.
- Added reconstructed Regular-Season King / current leader honors for 2020–2026.
- Added runner-ups for Starter Value MVP and Waiver Wire Gem.
- Added evidence links from each award card back into season, week, WAR or waiver research pages.
- Added a manager Career Honors counter across currently modeled award categories.
- 2026 team-level awards use Week 7 data.
- 2026 player-value and waiver research remain explicitly capped at Week 6.

## WAR Research
- Added `data/fellas_war_manager_summary_v1.json`.
- Added manager-level experimental starter-value totals and per-start rates.
- Added season filters for clean same-season comparisons.
- Added an explicit certification scoreboard:
  - 14/14 2025 regular-season weeks have verified starters.
  - 2/14 weeks have complete bench snapshots.
  - 0/14 weeks have independently certified replacement pools.
  - True Fellas WAR remains NOT CERTIFIED.
- All-time totals are labeled tenure-sensitive. Stover's current-manager player archive is especially narrow and should not be compared by raw total alone.

## Research findings
- Mitch leads the current-manager archive in raw starter value above benchmark: +6,612.98 across 810 credited starts.
- JMid's tenure-normalized rate is +7.429 per credited start versus Mitch +8.164 and Tony +7.473.
- 2025 starter-value team ranking: Mitch, Scott, Tony, Stew, Tom.
- 2026 starter-value dataset remains through Week 6: Mitch leads, followed by Stew and Birch.

## Next steps toward certified True WAR
1. Recover full weekly bench rosters for historical seasons, prioritizing 2025 Weeks 2–6 and 8–14.
2. Reconstruct lineup-lock free-agent pools rather than inferring availability from completed transactions.
3. Verify FLEX/DB eligibility and scoring settings by season.
4. Build a legal-lineup replacement optimizer after replacement pools are validated.
5. Only then convert research-stage value into a certified wins-above-replacement metric.
