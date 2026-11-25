# The Fellas roadmap

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current revisions, validation
results, and blockers. Keep this roadmap and the status in GitHub with the
development change. Record lasting workflow rules in [AGENTS.md](AGENTS.md).

| Phase | State | Work |
| --- | --- | --- |
| 5.2–5.5 record research | Implemented in development | Canonical weekly and career stats, placements and brackets, starter positions, front office, lineup and schedule-luck research are generated with scoped receipts. |
| 5.6 player archive | Research and preview implemented | Validate mobile directory and individual deep links, resolve coverage boundaries, and review production integration. Preserve unresolved draft selections and ambiguous trade attribution. |
| 5.7.1–5.7.2 registry and legacy reconciliation | Implemented in development | 426 candidates across separate owner types. Twenty legacy definitions map to existing records, with 24 recomputed from authoritative data. Scope and alias decisions are executable checks. |
| 5.7.3–5.7.4 ownership and leaderboard | Implemented for the established collection | Publish the same 23-category totals and sole/shared ownership in development profiles, personal record books, and the leaderboard. Keep the other research and exhibits scoped. |
| 5.7.5 Record Book navigation | Implemented in development | One keyword search covers both established records and the expanded archive, with distinct results and evidence links. Archive families, personal portfolios, and source cutoffs remain accessible. |
| 5.8 approved weekly refresh | Partially implemented | Ownership changes, new marks, ties, and extensions flow to Record Watch and editorial research after the approved import. Career-win proximity alerts and a full synthetic Tuesday recalculation passed on the 5.8 follow-up branch. Review the alert and reconcile actual later trade, draft, waiver, and player evidence before the next publication. |
| 5.9 release validation | 5.7 approval pending | All 33 jobs and the independent source and browser audit passed on `1dd8fbcf`. See the [release readiness report](docs/version-5-7-release-readiness.md). Recheck the exact head and base at approval, then verify served Pages after an authorized deployment. |

Keep the Version 5.7 work on [PR #318](https://github.com/Darstill7/fellas-hall-of-fame/pull/318).
The next Version 5.7 gate is owner review of the exact proposed release source.
Freeze statistical expansion while the established navigation and ownership
changes are being validated. Technical detail and the review methodology
live in [Record Book unification](docs/record-unification-v52.md).
