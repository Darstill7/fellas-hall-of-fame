# The Fellas — Fantasy Football League Archive

Historical league records, manager franchise pages, rivalry history, record books, editorial features and trade research. The project is **mobile-first**, with data accuracy and cited historical provenance prioritized over automatic publishing.

- Repository: https://github.com/Darstill7/fellas-hall-of-fame
- GitHub Pages URL: https://darstill7.github.io/fellas-hall-of-fame/
- Historical workflow handoff: [October 27 reference](data-integrity/WORKFLOW_HANDOFF_2026-10-27.md) (historical reference, **not** the current release-status source)
- Release-cutover coordination: [Issue #275](https://github.com/Darstill7/fellas-hall-of-fame/issues/275)

## Verified development snapshot — November 23, 2026

This section documents **Git main and source coverage**, not an independently certified GitHub Pages deployment. Check current CI/commit SHA and public Pages bytes before declaring a feature live.

| Area | Source-backed / reviewed state | Publication caveat |
| --- | --- | --- |
| 2026 historical matchup ledger | `data/unified_record_book_2016_2026.json` has 45 regular-season games in 2026, covering **Weeks 1–9**; source metadata `updated: 2026-11-10` | This is the approved ledger cutoff, not a current NFL-week projection. |
| 2026 Week 10 | Staged and independently reconciled in ongoing release work | **Not yet promoted to canonical main**. Do not double-publish competing Week 10 candidates. |
| Rivalries 2.0 | [PR #277](https://github.com/Darstill7/fellas-hall-of-fame/pull/277) merged into main Nov 23; canonical, site-consumer, rivalry and Chromium/WebKit visual gates passed on PR head | **Public Pages deployment/parity still needs independent verification.** Recent meetings and streaks use regular-season ledger; postseason uses separately verified 2016–2025 winners brackets. |
| Trade Museum 2.0 | [PR #276](https://github.com/Darstill7/fellas-hall-of-fame/pull/276) remains draft | Current Museum receipts are audit snapshots, **not live trade activity**. Trade PAR research samples are incomplete/experimental and not proof of trade-negotiation skill. |
| Tuesday collection and release gates | [PR #271](https://github.com/Darstill7/fellas-hall-of-fame/pull/271) foundation; stacked drafts [#272](https://github.com/Darstill7/fellas-hall-of-fame/pull/272), [#273](https://github.com/Darstill7/fellas-hall-of-fame/pull/273), [#274](https://github.com/Darstill7/fellas-hall-of-fame/pull/274) | These are **unmerged**. Scheduled checking/reconciliation is not the same as an approved production publish. |

### Weekly release contract

1. Collect Sleeper results and transaction receipts after games finalize. Keep raw/staged imports distinct from approved canonical data.
2. Reconcile manager IDs, trade assets, winners, records, playoff boundaries and all affected downstream views. Reject incomplete or ambiguous source claims.
3. Require commissioner-approved promotion through **one** Week 10/release path (see [#268](https://github.com/Darstill7/fellas-hall-of-fame/pull/268) and [#275](https://github.com/Darstill7/fellas-hall-of-fame/issues/275)).
4. Rebase the release stack, test the exact merged head (canonical, mobile Chromium/WebKit, visual, fault-injection, source-freshness checks), and verify published GitHub Pages SHA/bytes.
5. Show **approved through week**, **staged through week**, **source retrieval time**, **verified publication time** and **archive/trade coverage** separately. Unknown means **unverified**, not zero or current.

The proposed weekly pipeline is still under review. **Do not instruct maintainers to manually update `data/league.json` as a substitute for this source-controlled canonical approval flow.**

## Editorial and scoring rules

- Sleeper is authoritative for its available league data; ESPN-era archives require separate source review.
- Keeper rights follow the acquired player, while draft/FAAB and three-team trade evidence require explicit receipts.
- Never infer a trade winner solely from raw received starter points, incomplete PAR, or missing receipt sides.
- Two-week ESPN playoff aggregate results must not be mixed with one-week regular-season matchups.
- Historical manager identities and franchise histories must follow reconciled ownership, not seat artifacts.
- The original archive remains a valuable research source, but old README/preview data cutoffs are not automatically current.

**Merge/deployment rule:** do not describe a feature as published solely because a pull request is merged or a PR-head CI check is green. Verify the publicly served version independently.
