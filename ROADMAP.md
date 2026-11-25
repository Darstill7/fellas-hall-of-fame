# The Fellas roadmap

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for current revisions, validation
results, and blockers. Update this file and the status after significant work.

| Phase | State | Work |
| --- | --- | --- |
| 5.2–5.5 record research | Implemented in development | Canonical weekly and career stats, placements and brackets, starter positions, front office, lineup and schedule-luck research are generated with scoped receipts. |
| 5.6 player archive | Research and preview implemented | Validate mobile directory and individual deep links, resolve coverage boundaries, and review production integration. Preserve unresolved draft selections and ambiguous trade attribution. |
| 5.7.1–5.7.2 registry and legacy reconciliation | Implemented in development | 426 candidates across separate owner types. Twenty legacy definitions map to existing records, with 24 recomputed from authoritative data. Scope and alias decisions are executable checks. |
| 5.7.3–5.7.4 ownership and leaderboard | Implemented for the established collection | Publish the same 23-category totals and sole/shared ownership in development profiles, personal record books, and the leaderboard. Keep the other research and exhibits scoped. |
| 5.7.5 Record Book navigation | In progress | Search, filters, personal portfolios, evidence links, and archive cutoffs are available. Make the established collection discoverable through the same search entry, with clear scope and no inflated ownership totals. |
| 5.8 approved weekly refresh | Partially implemented | Ownership changes, new marks, ties, and extensions flow to Record Watch and editorial research after the approved import. Expand attainable milestone coverage, rehearse the full Tuesday pipeline, and reconcile the later trade, draft, waiver, and player projections. |
| 5.9 release validation | Pending | Check exact-head canonical and mobile browser gates, visual and performance tests, weekly approval and freshness paths, then prepare a merge decision for the owner. Verify the served Pages revision after any authorized deployment. |

Keep the Version 5.7 work on [PR #318](https://github.com/Darstill7/fellas-hall-of-fame/pull/318).
Freeze statistical expansion while the established navigation, ownership and
release work is being validated. Technical detail and the review methodology
live in [Record Book unification](docs/record-unification-v52.md).
