# Fellas OS v9.16 — Franchise Encyclopedia Expansion

## Completed
- Added `data/manager_franchise_enrichment_v1.json`.
- Added a new franchise-history section to all 10 current manager profiles.
- Each manager profile now shows:
  - Mount Rushmore players with attributed Fellas seasons.
  - Top credited player histories with seasons, starts and regular-season starter points.
  - Best verified waiver/add candidate.
  - Best measured trade outcome candidate.
  - Worst measured trade outcome candidate when evidence is sufficient.
- Trade labels intentionally describe measured realized starter-point outcomes rather than universal process grades.
- Stover carries a prominent coverage warning because current-manager player attribution is much narrower than the franchise/championship history.

## Verified waiver/add leaders currently surfaced
- Stilly — Kirk Cousins (2021)
- JMid — Rico Dowdle (2025)
- Tom — Elijah Mitchell (2021)
- Stew — Jamaal Williams (2022)
- Scott — Jauan Jennings (2024)
- Mitch — Tyler Lockett (2022)
- Tony — James Robinson (2020)
- Stover — Carolina Panthers D/ST (2026, limited current-owner sample)
- Kuhl — Kyren Williams (2023)
- Birch — Aaron Rodgers (2020)

## New league-wide explorer
- Added `analytics/franchise-encyclopedia.html`.
- Manager selector shows:
  - Mount Rushmore
  - Top player histories
  - Best waiver/add candidate
  - Best/worst measured trade candidates
- Linked from Player Hall, root landing page and living dashboard.
- Added to global search index.

## Data-source synchronization
- Updated `data/manager_biographies_awards.json` so waiver candidates are no longer incorrectly labeled unranked.
- Updated search index with Franchise Encyclopedia and manager-specific enrichment terms.
- Player-level and waiver data remain explicitly capped at 2026 Week 6; team-level season results are through Week 7.

## Seasons hub
- Refreshed selectable `seasons/index.html` through 2026 Week 7.
- Week 7 standings now show Mitch 7–0.
- Added Week 7 Tony–Stover 0.92 closest-win receipt.
- Added discovery links to Awards and Franchise Encyclopedia.

## Next priorities
1. Refresh more static historical landing/audit surfaces that still embed Week 6 wording.
2. Deepen player-level history once Week 7 lineup/starter data is available.
3. Continue WAR data acquisition toward full bench/replacement-pool coverage.
4. Expand franchise transaction pages into full transaction trees / provenance views.
