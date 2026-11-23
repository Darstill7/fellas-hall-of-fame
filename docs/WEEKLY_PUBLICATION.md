# The Fellas — Tuesday data collection and publication

**Goal:** automatic collection, one auditable canonical release, publication only after commissioner approval.

## Automatic Tuesday collection

The scheduled `.github/workflows/stage-sleeper-week.yml` checks Sleeper Tuesday 16:30 UTC (11:30 a.m. Eastern Standard Time), with a Wednesday retry. It requires a completed prior NFL week, ten unchanged manager identities and five paired results. It opens/updates a **staging PR** containing `data-integrity/sleeper-sync-candidates/2026-weekN.json`. This PR is **NOT** canonical history.

On a successful score stage, `scripts/stage-sleeper-trades.mjs` also gathers completed raw 2026 Sleeper trades into a separate `2026-trades-through-weekN.json` review candidate. These entries are **not** trade grades, verified player-name mappings, or proof of any keeper/FAAB effect.

After raw receipts are staged, `scripts/review-staged-trades.mjs` compares completed provider trade IDs with the 51 audited museum receipts. It writes `2026-trade-review-through-weekN.json`, listing **new source IDs requiring commissioner review** and explicit issues for FAAB, draft-pick fields, and unmatched asset movements. A new ID is *not* an approved trade. The staging PR includes both raw receipts and this review queue. The offline contract test `scripts/test-review-staged-trades.mjs` validates known/new ID matching, three-party flags, and duplicate refusal.

The read-only `audit-weekly-publication.yml` runs Tuesday/Wednesday and on relevant PRs. It reports canonical week, playoff-model week, the Trade Museum's latest documented 2026 trade and frozen starter-point methodology. It never publishes.

## A readable Tuesday approval report

The approved weekly release workflow now generates its PR body from actual data, not a reusable generic template. Before any canonical write, it captures the prior published ledger, standings/projections and three all-time record feeds in a temporary runner directory. After the import passes its freshness gates, `scripts/build-weekly-commissioner-review.mjs` checks that the five source scores exactly match the new canonical games and that every derived record feed reports the same approved week.

The GitHub PR summary includes the five score pairs, every manager's updated W–L and scoring delta, changes to all-time record values and holders, changed current-season scoring highlights, the exact staging-source commit, and a short publication checklist. It explicitly marks the Trade Museum as requiring a **separate trade certification**. This report is generated only inside a disposable CI runner and is **not** committed as a public data source. The synthetic weekly rehearsal tests that the report can be produced without any publication.

## Commissioner approval → complete reviewable release

1. Review the staging PR against Sleeper: exactly five final scores, ten unique owners, aliases, and any changed trades. Keep the trade receipt separately for manual asset verification.
2. In **Actions → Prepare approved weekly website release → Run workflow**, enter `completed_week=N`, `confirmation=APPROVE`, and `staging_commit=<reviewed 40-character SHA>`. The workflow compares the reviewed SHA with the current staging branch and refuses to proceed if it has advanced; re-review and re-approve the updated staging version. The action retrieves the fixed staging candidate; it will refuse noncontiguous weeks, invalid scores or mismatched owners.
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
      "sides": [
        {"roster_id": 1, "manager": "Stilly", "assets": ["VERIFIED_RECEIVED_PLAYER"]},
        {"roster_id": 2, "manager": "JMid", "assets": ["VERIFIED_RECEIVED_PLAYER"]}
      ]
    }
  ]
}
```

*This is a schema example, not a real trade or approved score.* Confirm every asset-direction and roster mapping against Sleeper. Current team roster IDs are versioned in the importer. Three-team transfers require all sides. Unknown or FAAB-only transfers stay in the research queue; unexpected draft-pick fields are blocked. Preserve historical trade statistics.

Then use **Actions → Prepare commissioner-approved Trade Museum release**, enter the certification week, `APPROVE_TRADES`, and `trade_staging_commit=<reviewed 40-character SHA>` (workflow input `staging_commit`). Both the trade certification and raw provider receipts are fetched from that reviewed SHA; an updated staging branch invalidates the approval. The workflow retrieves the staged source, checks participants and source IDs, runs a no-write dry-run, imports newly certified trades as **ungraded**, validates museum parity and opens a separate PR. **No automatic merge or publication.** Trade starter points only appear after an independent production audit; `null` is displayed as “Not audited,” not zero.

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

## Find the actual last update of each website section

**One-click dashboard:** `analytics/site-freshness.html` displays the canonical verified week and source-derived coverage for 11 major website features. Linked source histories are on GitHub. The dashboard reads current checked-in JSON files directly; it does not claim that the file's commit timestamp is the verified week.

**GitHub scheduled report:** Actions → **Scan website freshness registry** (Tuesday and Wednesday, or manually) runs `node scripts/scan-site-freshness.mjs --strict`, generates a summary table that includes each source's actual last Git committer timestamp and short commit hash, and attaches a `fellas-website-freshness-scan` JSON artifact for programmatic consumers. The workflow also inspects the separate Sleeper staging branch for a newer five-game review candidate; it reports **PENDING COMMISSIONER REVIEW** when, for example, Week 10 is staged but only Week 9 is published. A staged candidate is not treated as automatically verified or approved. Each JSON entry contains source path, consumer page, expected cadence, canonical week, source SHA256, last Git change, and either CURRENT / STALE / ERROR / REVIEW_REQUIRED / ARCHIVED / EVENT_AUDITED.

**For a quick scan in any branch:** `node scripts/scan-site-freshness.mjs --json` prints the data directly; `--markdown` prints the human report; `--strict` also fails on blocking weekly coverage discrepancies. The config file `data/site_freshness_config_v1.json` is the single searchable list of source files, destination pages and refresh expectations.

**After an approved weekly import:** the importer runs `--write`, generating `data/site_freshness_report_v1.json` with approved coverage and source digests, and then `--check` to enforce exact reproducibility. It is included in the reviewable release PR, but no pre-release report is claimed to exist on production yet.

**Publication gate:** Before creating a commissioner release PR, `node scripts/scan-site-freshness.mjs --release-gate --expected-week=N` must pass. It verifies the exact approved week, all eight critical weekly source feeds, the presence of each consumer page, and the SHA256 manifest of every registered source. Even if a manifest is recalculated to match stale data, the gate rejects it when Playoff Race, Standings, Schedule Luck or the record feeds lag behind the approved canonical week. It **does not silently certify the Trade Museum**: a latest trade date alone is never evidence of complete transaction coverage, so transaction review remains separately required. The full synthetic release rehearsal exercises the gate, and regression tests deliberately inject an old playoff week and corrupt source manifest to prove fail-closed behavior. The scheduled/PR freshness workflow also checks the committed manifest whenever one exists; if an approved weekly release branch lacks a manifest entirely, the check fails rather than silently accepting the release.

A newer Git file commit does not certify a newer fantasy week. An old Trade Museum event date means later transactions need *verification*, not that there were definitely no trades. The archival Record Book is marked ARCHIVED rather than misleadingly passing as a weekly-refresh source.

## Unified release-health report — the one place to check status

Open GitHub Actions → **Fellas unified release health** → latest completed run → **Job summary**. The same read-only report is available as the `fellas-release-health` artifact containing Markdown and JSON; it can be scanned by another GitHub process or reviewed in ChatGPT.

The report reads the **current `main` commit and Week N from the canonical ledger at that exact SHA**. It reads the development branch's data-freshness Week N **separately**, the latest final-shaped staging candidate on `automation/sleeper-weekly-stage`, the source approval PRs #268/#271/#272/#273, and their actual workflows for their **exact head SHAs**. It checks whether both Pages deployment and the parity verifier passed on the exact production `main` SHA. It flags missing **required** CI as NOT_REPORTED, not green; workflows that a specific PR does not use are explicitly NOT_APPLICABLE. The report includes the report's own PR #274 and never treats an unrelated check as release approval.

The report lists specific blockers: draft approval, pending/failing CI, staged week not yet published, branch data mismatch, Trade Museum receipt-review gaps, missing staging source and incomplete deployment verification. No GitHub checks are launched or modified by the report. The scheduled Tue/Wed scanner only makes a read-only snapshot; it **never approves, merges, changes source records or deploys**. This report is diagnostic rather than a substitute for the required branch protections.

**CLI contract test:** `node scripts/test-release-health-report.mjs` exercises missing workflow checks, mismatched deployment SHA, pending staged weeks, draft PRs, stale sources and the distinction between main and development coverage. As GitHub workflows can be delayed or skipped, an absent CI check remains visibly unverified.

## Safety

- No auto-merge, no publishing unreviewed scores, no invented trades, no inferred FAAB/keeper/draft assets.
- In a missed Tuesday finalization, the Wednesday run retries; no guessed partial matchup totals.
- The score staging candidate, trade review queue, release PR and historical research PRs must not be indiscriminately merged into each other.
- The current workflow is scoped to the 2026 regular season. Postseason and 2027 rollover require explicitly reviewed adapters.
