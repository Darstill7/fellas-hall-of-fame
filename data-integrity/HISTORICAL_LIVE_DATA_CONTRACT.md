# Historical and live data contract

Commissioner requirement confirmed 2026-11-23: completed historical seasons are frozen inputs, but career records must update weekly.

## Source layers
- Completed seasons: versioned, evidence-backed immutable fixtures, draft selections, transactions and player receipts. The 2020–2025 regular-season fixture ledger is verified; ESPN-era and other frozen datasets require their own certification.
- Current season: refresh completed weeks every Tuesday, using provider-confirmed completion; never include incomplete weeks in finalized career records. Record source timestamps, season and completed-week watermark. Revisions to already completed current-season weeks trigger full regeneration.
- Career outputs: recompute from the union of certified historical inputs and current-season completed-week inputs. Never freeze career outputs or increment previously aggregated career totals. Include season/week provenance and coverage; do not silently omit ESPN history or unsupported data.

## Required consumers
Career W/L/T, PF/PA, scoring records, manager profiles, rivalries, all-play, schedule luck, streaks, trade and draft returns, acquisition rankings and player encyclopedia must refresh after weekly input validation. Championships update only after final results are verified. Historical-only views remain explicitly scoped.

## Integrity gates
Reject overlapping season/week/fixture keys, unknown manager mappings, partial weeks and historical fingerprint changes. Verify historical totals remain invariant across live refreshes. Replaying identical inputs must generate identical statistics. Adding a completed live week must change applicable career outputs exactly once, without altering frozen seasons. Corrections to history require new version, documented evidence and regenerated downstream outputs. Do not publish incomplete refreshes; retain last successful verified snapshot and expose freshness.

## Season rollover
Certify final source data, freeze the completed season in a versioned ledger, remove that season from the live input layer atomically, and verify career outputs remain identical before and after rollover. Never double count the transferred season.

## Release status
Research branch only. The contract is not evidence that all consumers or weekly jobs have already been migrated.
