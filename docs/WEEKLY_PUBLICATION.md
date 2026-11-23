# The Fellas — Tuesday data collection and publication

**Goal:** automatic collection, one auditable canonical release, publication only after commissioner approval.

## Automatic Tuesday collection

The scheduled `.github/workflows/stage-sleeper-week.yml` checks Sleeper Tuesday 16:30 UTC (11:30 a.m. Eastern Standard Time), with a Wednesday retry. It requires a completed prior NFL week, ten unchanged manager identities and five paired results. It opens/updates a **staging PR** containing `data-integrity/sleeper-sync-candidates/2026-weekN.json`. This PR is **NOT** canonical history.

On a successful score stage, `scripts/stage-sleeper-trades.mjs` also gathers completed raw 2026 Sleeper trades into a separate `2026-trades-through-weekN.json` review candidate. These entries are **not** trade grades, verified player-name mappings, or proof of any keeper/FAAB effect.

After raw receipts are staged, `scripts/review-staged-trades.mjs` compares completed provider trade IDs with the 51 audited museum receipts. It writes `2026-trade-review-through-weekN.json`, listing **new source IDs requiring commissioner review** and explicit issues for FAAB, draft-pick fields, and unmatched asset movements. A new ID is *not* an approved trade. The staging comparison also reports `existing_ids_with_participant_conflicts` and `participant_conflicts` when a previously listed transaction ID has a manager-side roster mismatch. **Do not treat an already-listed ID as verified when it appears in this conflict queue; independently reconcile the owner mapping and original provider receipt.** The staging PR includes both raw receipts and this review queue. The offline contract test `scripts/test-review-staged-trades.mjs` validates known/new ID matching, three-party flags, and duplicate refusal.

The read-only `audit-weekly-publication.yml` runs Tuesday/Wednesday and on relevant PRs. It reports canonical week, playoff-model week, the Trade Museum's latest documented 2026 trade and frozen starter-point methodology. It never publishes.

## Commissioner approval → complete reviewable release

1. Review the staging PR against Sleeper: exactly five final scores, ten unique owners, aliases, and any changed trades. Keep the trade receipt separately for manual asset verification.
2. In **Actions → Prepare approved weekly website release → Run workflow**, enter `completed_week=N` and `confirmation=APPROVE`. The action retrieves the fixed staging candidate; it will refuse noncontiguous weeks, invalid scores or mismatched owners.
3. The action applies the approved week **on a release branch**, regenerating canonical ledger, standings, season guide, manager career data, all-play and luck, playoff odds, `data/current_2026_records_v1.json` and `data/alltime_game_records_live_v1.json`. It creates a release PR, **not an automatic merge**.
4. Review the resulting diff, Week N records, expected playoff percentages, source cutoff notices, green canonical/mobile checks, and the publication freshness audit. A stale Trade Museum is flagged, not silently rewritten.
5. **Merge the release PR only when approved.** Wait for the GitHub Pages deployment and verify that the live data and HTML correspond to the merged commit.

## Trade Museum: separate approval for newly discovered transactions

After the Tuesday staging PR, open `data-integrity/sleeper-sync-candidates/2026-trade-review-through-weekN.json`. It reports completed provider trade IDs that do not yet exist in the audited Trade Museum, with source-driven FAAB and draft-field cautions. **A new transaction is not automatically publishable.**

For verified multi-manager player trades, create and review `data-integrity/trade-certifications/2026-weekN.json` on the staging branch. Its shape is:

```json
{
  "schema": "fellas-trade-museum-certification-v1",
  "status": "COMMISSIONER_APPROVED",
  "year": 2026,
  "through_week": 10,
  "raw_candidate": "data-integrity/sleeper-sync-candidates/2026-trades-through-week10.json",
  "trades": [
    {
      "transaction_id": "VERIFIED_SLEEPER_TRANSACTION_ID",
      "week": 10,
      "date": "YYYY-MM-DD",
      "faab_reviewed": true,
      "faab_transfers": [{"sender": 2, "receiver": 1, "amount": 2}],
      "sides": [
        {"roster_id": 1, "manager": "Stilly", "assets": [{"player_id": "12345", "name": "REVIEWED_PLAYER_A"}]},
        {"roster_id": 2, "manager": "JMid", "assets": [{"player_id": "67890", "name": "REVIEWED_PLAYER_B"}]}
      ]
    }
  ]
}
```

*This is a schema example, not a real trade or approved score.* A certification **must use the new ID-bound `assets` objects**, each with the exact Sleeper `player_id` and the commissioner-reviewed player `name`. The importer now checks that **every** raw `adds` player is covered exactly once, assigned to the correct receiving roster, and has a distinct sending roster in raw `drops`. Sleeper defense IDs can be alphabetic (for example `MIN`) and are valid player IDs. Name-only legacy asset arrays are rejected. A player ID proves direction, **not** that the human-entered display name is correct; manually verify each name against the season-specific player ID map and source receipt. Confirm every asset-direction and roster mapping against Sleeper. Current 2026 roster-ID to manager mapping is defined in the importer and must be independently reviewed if ownership changes. Three-team transfers require all sides and **all received player IDs**. FAAB details must be manually verified. When `waiver_budget` is present, `faab_reviewed=true` **and** the full exact `faab_transfers` array (sender roster ID, receiver roster ID, amount) are required; the importer refuses missing, reversed or incorrect transfers. Certified FAAB appears as `N FAAB` on the receiving side. The sender and receiver example above is illustrative only; use actual raw values for each certification. Unknown or FAAB-only transfers stay in the research queue; unexpected draft-pick fields are blocked. Preserve historical trade statistics.

Then use **Actions → Prepare commissioner-approved Trade Museum release**, enter the certification week, `APPROVE_TRADES`, and `trade_staging_commit=<reviewed 40-character SHA>` (workflow input `staging_commit`). The workflow refuses if the staging branch has changed since the trade certificate and original provider receipts were reviewed; review the new head rather than approving a moving target. The workflow retrieves the staged source, checks participants and source IDs, runs a no-write dry-run, imports newly certified trades as **ungraded**, validates museum parity and opens a separate PR. **No automatic merge or publication.** Trade starter points only appear after an independent production audit; `null` is displayed as “Not audited,” not zero.

## One source, separate accuracy scopes

| Feature | Approved source | Weekly behavior |
| --- | --- | --- |
| Standings / matchup recaps | `data/unified_record_book_2016_2026.json` | Rebuilt by approved importer |
| Playoff odds / byes | `data/playoff_race_v1.json` derived from canonical games | Recomputed 25,000 seeded projections, explicitly modeled (not Sleeper odds) |
| All-play / schedule luck / manager career | Canonical games | Rebuilt on approval |
| Current-season records | `data/current_2026_records_v1.json` derived from canonical games | Week-by-week highest / lowest team scores, largest / closest / highest-total games, weekly scoring titles |
| All-time single-game records | `data/alltime_game_records_live_v1.json` from every approved regular-season matchup | Eight categories regenerate weekly, preserve tied holders and source-game receipts; linked in Record Book |
| Career scoring and counting records | `data/alltime_career_records_live_v1.json` from approved regular-season games | Eleven additional categories regenerate weekly, including career points, wins, scoring thresholds and 40-game-minimum PPG |
| Documented streak and completed-season milestones | `data/ledger_milestones_live_v1.json` derived from approved games | Three streaks count documented consecutive appearances; four finished-season records exclude ongoing 2026; audited against archived leaders | 
| Historical multi-season and narrative research | Separate 2016–2026 provenance-backed record registry | **Not yet fully regenerated**; season awards, rivalry thresholds and editorial exhibits remain archival |
| Trade Museum | `data/trade_museum_stage66.json` verified receipts and embedded HTML | **Not yet automatically rebuilt**. Updated raw Sleeper transactions are staged, never blindly published. Museum shows its actual cutoff. Starter points remain historical audit snapshots |

**Pending engineering:** verify raw player/roster IDs and transfer directions for each new trade; commissioner's review and source certification are required before museum import. Beyond the 26 rebuilt ledger-derived all-time records (8 single-game + 11 career + 3 documented streaks + 4 completed-season categories), other season records, rivalry awards, postseason records and narrative exhibits still require provenance-specific rebuilds. Verify deployed Pages commit parity. Make these release gates before calling the **entire** website current.

## Nonpublishing end-to-end rehearsal and deployed Pages verification

The CI workflow `.github/workflows/rehearse-weekly-release.yml` copies the repository into a disposable runner workspace, generates clearly marked **synthetic** scores for the next scheduled week, and proves the approval gate blocks unauthorized imports. With an explicit test-only flag, it then exercises the same canonical importer, standings, playoff simulation, luck, season guide, and all 26 matchup-derived historical records. It verifies all generated sources against the synthetic canonical week. **No synthetic game is ever committed, opened as a release PR, merged or deployed.** The production importer refuses any synthetic source outside the named rehearsal workflow.

After an actual reviewed weekly release PR is merged, the pre-existing `.github/workflows/pages-release-parity.yml` checks the successfully deployed GitHub Pages commit. Its SHA256 checks now include the underlying canonical ledger, season mirror, Playoff Race source, Trade Museum JSON/HTML and new record feeds—not just the homepage. A mismatch remains a release failure until CDN parity catches up or needs repair.

**Latest rehearsal result:** synthetic Week 10 release completed successfully as a disposable CI rehearsal. This does **not** establish that the real Week 10 scores or trades are approved or published.

## Week 10 transition / conflicting release branches (2026-11-20)

Draft #268 independently regenerates Week 10 canonical matchups, mirror, season guide, luck, playoffs, and manager page values. Draft #271 introduces the repeatable Tuesday publisher and new dynamically rebuilt record feeds, currently seeded through canonical Week 9. **Do not merge both Week 10 payloads independently**: they touch the same canonical files and could reintroduce obsolete projections depending on merge order.

Recommended reconciliation order: (1) complete all exact-head checks on #271 and review the new approval workflows; (2) independently review the five Week 10 Sleeper source receipts on the staging branch and #268, then choose ONE Week 10 canonical source release (not both); (3) once the Tuesday importer and 26 derived record generators are on `main`, execute the Week 10 approval workflow against the reviewed staging commit to make one complete Week 10 release PR; (4) verify all 2026 standings, playoffs, records and Pages byte parity after approval and merge; (5) retire or supersede the older Week 10 release candidate only after parity is proven. Do not publish unaudited trade awards with the score release.

Both Week 10 candidates (public Sleeper staging branch and connected league source) currently agree on all five final matchup score pairs. That agreement is valuable verification but is not itself a publication approval. The manual release workflow records the exact staging source commit in its GitHub Actions summary; the generated historical record feeds are checked before it creates any PR.

## Safety

- No auto-merge, no publishing unreviewed scores, no invented trades, no inferred FAAB/keeper/draft assets.
- In a missed Tuesday finalization, the Wednesday run retries; no guessed partial matchup totals.
- The score staging candidate, trade review queue, release PR and historical research PRs must not be indiscriminately merged into each other.
- The current workflow is scoped to the 2026 regular season. Postseason and 2027 rollover require explicitly reviewed adapters.
