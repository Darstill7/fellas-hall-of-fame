# The Fellas OS v4

## Project handoff and current launch blockers

Continue development from [the 2026-10-27 workflow handoff](data-integrity/WORKFLOW_HANDOFF_2026-10-27.md). It records the canonical sources, completed changes, manager identities, release gates and outstanding work. **Do not consider the site release-ready until GitHub Actions, desktop/mobile browser checks, and data/content audits have actually passed.**

This package turns the historical museum into a multi-page league operating system.

## What is live in this build
- 2026 dashboard through Week 7
- 10 manager franchise pages
- current roster snapshots
- full current-manager Sleeper rivalry matrix
- weekly archive for Weeks 1–7
- Trade ROI lab
- Draft Value lab
- schedule-adjusted advanced metrics
- awards / Hall of Fame layer
- preserved Definitive Analytics museum

## Data rules
1. Sleeper matchups/transactions/drafts override old summaries when they conflict.
2. Explicit manager corrections override provider roster-seat artifacts.
3. JMid and Scott begin their current-manager series in 2024.
4. ESPN legacy years are preserved where weekly detail is incomplete.
5. Exact counterfactuals are only shown when a lineup swap mathematically flips a known result.
6. Schedule fortune = actual wins - (all-play wins / 9).

## Next refresh
Update the `data/league.json` snapshot and regenerate the pages after each completed fantasy week.
