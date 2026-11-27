# Historical source-of-truth certification — P0

Opened 2026-11-27 at commissioner request. Accuracy takes precedence over new features and editorial expansion. No claim of whole-site certification until independent provider evidence and downstream parity are demonstrated.

## Current evidence
- Fresh official 2020–21 Sleeper standings receipt: `provider-standings-receipts-2020-2021-20261127.json`. All 20 rows have 13 games; 2020 champion Koble, 2021 champion Tony. Provider final ranks absent for some teams; never infer from standings rank.
- Prior independent matchup reconciliation: `2020_2021_PROVIDER_RECONCILIATION_5_3_1.md`; fresh per-week retrieval and preservation still required for this certification.
- Eight legacy Week 14 regular-labeled matchups are postseason, four confirmed winners-bracket opening games; remaining four exact consolation roles not established. Preserve all scores, matchups, roster identities and commissioner-approved weekly scoring award eligibility (paired participants only; no byes).
- Official provider PF/PA are distinct from sum of weekly matchups; reconcile and retain both where they differ. Never alter a weekly score to force standings parity.
- Production still contains conflicting legacy season guide and career annual records. No canonical migration performed yet.

## Definition and evidence hierarchy
1. Original provider season settings/standings and league-year roster ownership establish regular-season scope and official record, not current franchise slot names.
2. Original finalized provider matchup receipts establish opponents, weekly scores and results; classify phase using verified schedule/bracket evidence, never numeric matchup ID alone.
3. Original brackets, official outcomes and documented commissioner adjudications establish postseason placements; ties, multi-week rounds and incomplete evidence remain explicit.
4. Derive regular-season career totals, H2H, streaks, all-play, records and ownership from certified eligible games; use separately labeled official standings PF/PA where appropriate. Historical award scope is a separate dimension from game stage.
5. Editorial opinion is not a factual award. Preserve all original evidence, historical exceptions and coverage gaps.

## Release checkpoints
- [ ] Discover every season 2016–2026 and validate league IDs/ownership.
- [ ] Retrieve original settings, standings, weekly matchups and playoff/placement receipts for every available season; record missing sources without guessing. ESPN may require user-supplied archived evidence.
- [ ] Reconcile every paired result, official win/loss/tie, score sum, seed and final placement. Keep a discrepancy ledger; distinguish official PF/PA from weekly derived values.
- [ ] Inventory all downstream data producers and public consumers; do not rely on consistency with one legacy aggregate.
- [ ] Create shadow normalized event/phase ledger and generate corrected projections; compare identity, scores and complete game counts before changing any canonical file.
- [ ] Independently recompute all affected career, rivalry, streak, all-play, weekly-award, record holder, record watch, power rating and historical editorial consumers. Document every changed statistic and reason.
- [ ] Add fail-closed provider-evidence parity tests, mutation tests, and checks for source scope/identity and exact week boundaries.
- [ ] Review public pages and articles; verify rendered mobile and desktop, search and share links. Existing weekly editions remain protected except commissioner-approved factual corrections.
- [ ] Require commissioner approval before merging certified migration; rerun complete CI and verify deployed production parity.

## Separate workstreams
PR 326 (usability) and PR 327 (editorial) are not proof of historical certification. Hold new feature releases pending this P0 investigation. Keep this branch independent until migration and qualification are ready. Do not erase or rewrite older source artifacts simply to force a pass.
