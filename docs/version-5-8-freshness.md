# Version 5.8 weekly evidence and freshness

Version 5.7 remains on PR #318. The latest proposed merge head is
`4ded58f77a9e060ae7227a826caa4f3e0df1abcf`, based on
`1a47de0685b3257a34e9543781b9c5d1ca0c0971`. GitHub reported 33 successful
jobs in 21 workflow groups, including both canonical browser jobs and the
release certification job. Its test merge
`e3cbc987989250410022b7ba133051840d015387` has the identical tree. The delta
from certified revision `1dd8fbcf7fb466f9c37797b6dc9bd88afc8d0ee8` consists of
the release report, project status and roadmap. This follow-up branch is
outside that release. Production merge and deployment require owner approval.

## Approved Week 11

| Collection | Treatment |
| --- | --- |
| Live matchups, standings, manager books and Record Watch | Verified through Week 11. |
| Expanded Record Book | Recomputed leader marks for the same 44 definitions through Week 11. Original ranked evidence, personal marks and archive context remain Week 9. |
| Trade Museum | Rebuilt the 13 already-reviewed current-season rows from Week 11 transaction, starter and timing evidence. The regeneration produced the same committed Museum and embedded page bytes. New trade identities still require the separate certified receipt import. |
| Draft | The completed 2026 board has 150 confirmed selections. The historical draft and keeper research remains scoped. The draft starter-production projection lacks certified weekly lineage. |
| Acquisitions and FAAB | Archive and certified bid receipts remain through Week 9. The approved matchup cutoff cannot establish later waiver bids. A direct Sleeper transaction request returned HTTP 403 in this environment. |
| Player history | Regenerated the scoped preview from reconciled starts, exact 2026 draft IDs and recovered transaction windows. Starter source coverage ends Week 9 and raw transaction windows end Week 8. Traded-player-only evidence cannot certify full starter lineups. No unresolved identities or trade receiving sides are inferred. |
| Attainable marks | Existing career-win and single-season streak records now support evidence-bounded chase alerts, including a reachable tie on the final remaining game. |

## Running and reviewing the source gate

`node scripts/audit-site-freshness-v58.mjs --check` verifies the checked-in
report and fails when a required current surface trails or conflicts with
approved data. Pass `--require=museum,faab` to require those additional
weekly claims, or `--full` to require all audited weekly evidence. The full
inventory covers the data directory JSON and CSV files, directly referenced
audit JSON and embedded JSON payloads. Declared scope and unclassified
collections require review before they support a freshness claim.

The approved Tuesday workflow uses the same shell entry point as the
disposable rehearsal. It rebuilds the matchup projections, marks, scoped
research, source report and editorial packet. Matchup-only publication
retains source limitations. The all-collections setting stops before
creating a release PR when weekly evidence is missing. Both modes still
require verified matchup approval, and neither merges or deploys.

`node scripts/test-approved-weekly-refresh-v58.mjs` runs the same shell step
in a disposable checkout. It verifies that denied approval changes nothing,
approved synthetic results produce fresh matchup and editorial data, stale
specialties block full publication, and a corrected score invalidates the
compact source report. Historical game rows and scoped source files remain
unchanged.
