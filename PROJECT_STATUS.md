# The Fellas project status

**Last updated:** 2026-11-25 11:34 EST (America/New_York)

**Current phase:** Version 5.8 source freshness and approved weekly refresh.
Version 5.7 is ready for owner merge approval at the exact PR head below.
See the [release readiness report](docs/version-5-7-release-readiness.md).

## Active pull requests and branches

- This follow-up is `development/v5-8-attainable-milestones`, based on
  the 5.7 report commit `4ded58f7`. It is separate from the proposed 5.7
  release source.

- Primary development branch
  [development/v5-2-record-unification](https://github.com/Darstill7/fellas-hall-of-fame/tree/development/v5-2-record-unification)
  and draft [PR #318](https://github.com/Darstill7/fellas-hall-of-fame/pull/318).
  The exact head for final merge approval is
  [`4ded58f77a9e060ae7227a826caa4f3e0df1abcf`](https://github.com/Darstill7/fellas-hall-of-fame/commit/4ded58f77a9e060ae7227a826caa4f3e0df1abcf).
  Its GitHub test merge `e3cbc987989250410022b7ba133051840d015387` has the
  same tree. The delta from certified application revision `1dd8fbcf`
  consists of the readiness report, status and roadmap. 5.8 changes are on
  the follow-up branch.
- Production branch `main` was `1a47de06` at the check. Its approved 2026
  ledger covers Weeks 1–11 (55 matchups). The served Pages revision remains
  unverified.
- Related open drafts include [#310](https://github.com/Darstill7/fellas-hall-of-fame/pull/310)
  for publication evidence, [#292](https://github.com/Darstill7/fellas-hall-of-fame/pull/292)
  for historical Record Book compatibility, [#300](https://github.com/Darstill7/fellas-hall-of-fame/pull/300)
  for editorial research, and [#307](https://github.com/Darstill7/fellas-hall-of-fame/pull/307)
  for a draft issue. See the [open PR list](https://github.com/Darstill7/fellas-hall-of-fame/pulls)
  for the separate manager and trade work.

## Latest completed changes and files modified

| Change | Files modified | Commit reference |
| --- | --- | --- |
| Added the centralized freshness audit, Week 11 Expanded leader marks, evidence-gated specialty refreshes, tie-only chase alerts and editorial verification. | Workflow gates, Expanded and Source Status views, generated leader and freshness JSON, refresh and editorial scripts, and regression tests. The commit lists all paths. | [`80eb692fcd6165d4ae45c027e4625279077e835c`](https://github.com/Darstill7/fellas-hall-of-fame/commit/80eb692fcd6165d4ae45c027e4625279077e835c) |
| Added attainable career-win milestones to the League view and the approved dashboard refresh, with current-score freshness checks. | `assets/conditional-record-watch-v51.mjs`, `assets/home-app-v3.mjs`, `assets/weekly-record-watch.mjs`, `data/conditional-record-watch-v51.json`, `scripts/build-home-current-season.mjs`, `scripts/test-conditional-record-watch-v51.mjs`, `scripts/test-production-homepage-browser.mjs`, `PROJECT_STATUS.md`, `ROADMAP.md` | `Add attainable career-win milestones to Record Watch` |
| Completed exact-head release validation, independent ownership reconciliation, data freshness review and a disposable approved weekly refresh rehearsal. | `docs/version-5-7-release-readiness.md`, `PROJECT_STATUS.md`, `ROADMAP.md` | `Record Version 5.7 release evidence and approval gate` |
| Made the shared GitHub handoff a standing requirement and recorded the completed feature checks. | `AGENTS.md`, `ROADMAP.md`, `PROJECT_STATUS.md`, `README.md` | `Establish permanent GitHub project handoff`, the commit containing this update. |
| Unified keyword search for established and archived records. Results keep their own counts and link to the exact evidence. | `analytics/record-holders.html`, `assets/record-holders-page.mjs`, `scripts/test-record-holder-search.mjs`, `scripts/test-record-holder-search-browser.mjs`, `ROADMAP.md`, `PROJECT_STATUS.md` | [`a2ec81ec`](https://github.com/Darstill7/fellas-hall-of-fame/commit/a2ec81ec) |

## Completed in development

| Work | Result |
| --- | --- |
| Registry and legacy review | 426 candidates, 360 manager-owned and 66 player-owned. All 44 legacy definitions reviewed. Of the later 65 publication candidates, seven verified standings and bracket records entered the established collection and 58 retain their own scopes. |
| Manager ownership | 23 established categories. All 14 manager portfolios match the independent audit for total, sole and shared counts. Each established card links to qualifications and source receipts. |
| Mobile Record Book | One keyword search finds established records and expanded archive results. Results use separate counts and evidence links. Archive family filters and the Week 9 archive cutoff stay visible. |
| Weekly ownership changes | The approved import compares adjacent weeks. Home, My Team and Record Holders show Week 11 verified changes and link to evidence. The editorial research packet consumes the same report. Synthetic Week 12 passed in a disposable copy. |
| Player archive | Research and preview cover 470 players and team defenses, 8,253 reconciled starter performances, 935 linked draft selections and 3,187 transaction links. The 115 unresolved draft selections retain their uncertainty. Production integration is pending. |

## 5.8 source status

The [freshness report](docs/version-5-8-freshness.md) records 21 audited
surfaces and a 273-entry collection inventory. Approved matchup surfaces and
the rebuilt first-place marks for the 44 existing Expanded definitions
reconcile through Week 11. The original ranked archive stays at Week 9.

Week 11 trade scoring regenerated byte-for-byte. The draft board remains a
verified completed event of 150 picks. Draft starter-production coverage is
unverified. Acquisition and FAAB receipts and player starter sources end at
Week 9. Raw player transaction windows end at Week 8. The Sleeper transaction
request returned HTTP 403. The existing Week 11 traded-player starter
receipts do not contain complete lineups.

## Validation and browser results

- All 33 jobs in 21 GitHub workflow groups passed on exact PR #318 head
  `4ded58f7`. No 5.8 changes entered that PR.
- On `80eb692f`, Node 22 passed the shared Tuesday step in a disposable
  synthetic Week 12, registry and canonical checks, the 87-route smoke,
  stale-score rejection, and full-publication blocking. The editorial
  packet included the approved cutoff, matched ownership, and attainable
  alerts. Chromium and WebKit at 390 px verified the separate current
  leader and historical archive and the on-page source cutoffs. The
  production homepage rehearsal passed in both engines at 320, 390 and
  1280 px.
- Independent checks matched all 23 established marks and 37 ownership
  credits. Chromium and WebKit agreed on all category holders, leaderboard
  totals and 14 manager books at 390 px. Search, evidence and the production
  homepage rehearsal passed in both engines. Canonical validation, source
  freshness and the 87-route HTTP smoke also passed.
- The full synthetic Week 12 recalculation and editorial handoff passed in a
  disposable copy. The publication audit correctly warned that Trade Museum
  scoring remained at Week 11.
- On the 5.8 follow-up, Chromium and WebKit production homepage rehearsal
  passed at 320, 390 and 1280 px. Tests covered attainable, impossible and
  tie-only scenarios and fingerprint parity with the synthetic Week 12
  ownership report. The synthetic refresh still flags Week 11 Trade Museum
  scoring as stale for Week 12 publication.
- Home and My Team passed local Chromium and WebKit rehearsal at 320, 390,
  and 1280 px on `88f350f5`. The data test confirmed that a same-week score
  correction hides stale Record Watch updates.
- This documentation update was checked for local Markdown links and Git
  whitespace. Application and browser results above refer to the feature
  revisions listed.

## Decisions

- ChatGPT and Codex use GitHub's active branch as the project handoff. A
  documentation-only check names the feature revision for its application
  evidence, and later Actions results get a status follow-up when relevant.
- Ownership uses the 23 established categories. Expanded search results keep
  their own Week 9 cutoff and separate counts. Shared record credit goes to
  every eligible tied owner.
- Record Watch uses adjacent, approved weekly snapshots. The editorial packet
  reuses the verified changes as research.

## Outstanding issues and blockers

- PR #318 remains a draft. The owner must explicitly approve any production
  merge or deployment. Check the exact proposed release head and verify the
  served Pages revision after an authorized deployment.
- Full 5.8 weekly publication remains blocked by uncertified draft
  production and the missing later acquisition, FAAB and full player
  starts and transaction evidence. A matchup-only refresh keeps these
  scopes visible. The next real import still requires the approved staging
  SHA.

## Recommended next development tasks

1. Review the 5.7 release report with the owner. Confirm the exact PR head
   and base are still valid when approval is granted.
2. Collect and reconcile the missing later provider evidence for the actual
   next approved refresh. Re-run full publication validation when the
   evidence is available. Review the 5.8 alerts and source status separately.
3. Finish browser and data-publication review for the 5.6 player archive.
   Track the sequence in [ROADMAP.md](ROADMAP.md).
