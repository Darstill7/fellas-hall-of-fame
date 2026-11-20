# The Fellas — Tuesday data collection and publication

**Goal:** automatic collection, one auditable canonical release, publication only after commissioner approval.

## Automatic Tuesday collection

The scheduled `.github/workflows/stage-sleeper-week.yml` checks Sleeper Tuesday 16:30 UTC (11:30 a.m. Eastern Standard Time), with a Wednesday retry. It requires a completed prior NFL week, ten unchanged manager identities and five paired results. It opens/updates a **staging PR** containing `data-integrity/sleeper-sync-candidates/2026-weekN.json`. This PR is **NOT** canonical history.

On a successful score stage, `scripts/stage-sleeper-trades.mjs` also gathers completed raw 2026 Sleeper trades into a separate `2026-trades-through-weekN.json` review candidate. These entries are **not** trade grades, verified player-name mappings, or proof of any keeper/FAAB effect.

The read-only `audit-weekly-publication.yml` runs Tuesday/Wednesday and on relevant PRs. It reports canonical week, playoff-model week, the Trade Museum's latest documented 2026 trade and frozen starter-point methodology. It never publishes.

## Commissioner approval → complete reviewable release

1. Review the staging PR against Sleeper: exactly five final scores, ten unique owners, aliases, and any changed trades. Keep the trade receipt separately for manual asset verification.
2. In **Actions → Prepare approved weekly website release → Run workflow**, enter `completed_week=N` and `confirmation=APPROVE`. The action retrieves the fixed staging candidate; it will refuse noncontiguous weeks, invalid scores or mismatched owners.
3. The action applies the approved week **on a release branch**, regenerating canonical ledger, standings, season guide, manager career data, all-play and luck, playoff odds and `data/current_2026_records_v1.json`. It creates a release PR, **not an automatic merge**.
4. Review the resulting diff, Week N records, expected playoff percentages, source cutoff notices, green canonical/mobile checks, and the publication freshness audit. A stale Trade Museum is flagged, not silently rewritten.
5. **Merge the release PR only when approved.** Wait for the GitHub Pages deployment and verify that the live data and HTML correspond to the merged commit.

## One source, separate accuracy scopes

| Feature | Approved source | Weekly behavior |
| --- | --- | --- |
| Standings / matchup recaps | `data/unified_record_book_2016_2026.json` | Rebuilt by approved importer |
| Playoff odds / byes | `data/playoff_race_v1.json` derived from canonical games | Recomputed 25,000 seeded projections, explicitly modeled (not Sleeper odds) |
| All-play / schedule luck / manager career | Canonical games | Rebuilt on approval |
| Current-season records | `data/current_2026_records_v1.json` derived from canonical games | Week-by-week highest / lowest team scores, largest / closest / highest-total games, weekly scoring titles |
| Historical all-time record research | Separate 2016–2026 provenance-backed record registry | **Not yet fully regenerated** by core weekly importer; do not label archival exhibits current |
| Trade Museum | `data/trade_museum_stage66.json` verified receipts and embedded HTML | **Not yet automatically rebuilt**. Updated raw Sleeper transactions are staged, never blindly published. Museum shows its actual cutoff. Starter points remain historical audit snapshots |

**Pending engineering:** validate raw player/roster IDs and transfer directions; build an auditable Trade Museum renderer from certified receipts; refresh all-time record indices from verified new games; verify deployed Pages commit parity. Make these release gates before calling the **entire** website current.

## Safety

- No auto-merge, no publishing unreviewed scores, no invented trades, no inferred FAAB/keeper/draft assets.
- In a missed Tuesday finalization, the Wednesday run retries; no guessed partial matchup totals.
- The score staging candidate, release PR and historical research PRs must not be indiscriminately merged into each other.
- The current workflow is scoped to the 2026 regular season. Postseason and 2027 rollover require explicitly reviewed adapters.
