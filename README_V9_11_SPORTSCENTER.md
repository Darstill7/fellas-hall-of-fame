# Fellas OS v9.11 — SportsCenter

Added `analytics/sportscenter.html`, homepage navigation and featured entry, and `data/sportscenter_v1.json`.

## Data scope
The shipped source `data/league.json` contains 2026 Weeks 1–6 only. The SportsCenter intentionally does not imply live scores, next-week schedules, projected wins or validated all-time records. Headlines are computed from the final archived Week 6 games.

## Power Index (editorial, not Legacy Score)
40% all-play win percentage; 30% points per game divided by 150, capped at 1; 20% win percentage; 10% last 3-week win percentage. This is a transparent descriptive heuristic; the index is not validated as a forecasting model.

## Future update
Refresh `data/league.json`, rerun `build_fellas_sportscenter.py`, then QA. Never fill unobserved games as zeros.
