# FAAB and lineup evidence findings — 2026-10-30

## Available archived lineup observations
The repository includes an existing runnable six-season hindsight research script, `scripts/analyze-six-season-lineups.mjs`, which reads 2020–2025 full-roster snapshots. It expects 830 team-week observations, with 2020 covering 13 weeks and 2021–2025 14 weeks apiece. Its optimization assumes QB, two RB, two WR, TE, two FLEX, DEF, with FLEX only RB/WR/TE. These constraints require historical rules verification before being called fully legal.

The newer 2025 source audit found all 140 team-week rosters carrying observed starter and bench arrays and 923 recorded bench-player entries. This **does not** overturn the narrower WAR pilot finding that only two weeks were individually certified under that pilot's source gate. Keep separate metrics: archived roster observations, hindsight research comparability, and certified pre-lock alternatives.

## Remaining evidence limitation
Roster file limitations include unclassified injured reserve and taxi players, missing pro-team identity, and no lock-time injury/projection records. A hypothetical post-game lineup is therefore not a verified manager start/sit decision score.

## FAAB provenance gap
The yearly `data/acquisitions_2020.json` through `data/acquisitions_2026.json` expose transaction IDs, dates, weeks, types, team IDs and acquired player IDs, but no FAAB amounts. The legacy `labs/faab.html` pages publish editorial bid amounts not traced to transaction receipts in those files. The review warnings must remain until each amount has independent documentary evidence.

## Next actionable engineering
1. Build and run a per-manager and per-season research coverage manifest from the six-season lineup script, keeping no-score rules.
2. Locate and reconcile original FAAB bid data by transaction identifier and event date; untraceable prices remain unverified.
3. Independently verify historical starting slots, FLEX and reserve/taxi eligibility before deriving decision-quality statistics.
4. Preserve canonical 2016–2026 results and existing Legacy/Season OVR; do not create new ratings from the incomplete historical evidence.
