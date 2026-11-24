# Record Book 5.2 — unification contract

## Publication requirements
- Do not add 44 + 19 + 11 + 16 and call the sum unique. The 16 personal computations overlap other sources and have different qualification thresholds.
- Current regular-season records must be recomputed against the approved canonical cutoff (currently Week 11); Week 8/9 archives remain evidence, not live ownership.
- Completed-season records are eligible for review separately; reconcile against verified placements and bracket receipts.
- Keep all former managers in league-wide comparisons unless the record explicitly defines current managers only.
- Distinguish single-week postseason including consolation from verified championship-bracket-only records.
- Preserve ties across managers, count each category once per manager, and retain both participants for joint matchup records.
- Preserve threshold semantics: strictly >100 is not >=100; career consecutive appearances are not within-season consecutive weeks.
- Do not merge career win percentages with different minimum sample sizes without a documented canonical rule.
- Achievement cohorts (e.g. champions starting 6–0) are not necessarily extremum records; classify separately before counting.
- No ownership totals until source coverage, holder reconciliation, canonical cutoff, and duplicate mapping tests pass.

## Next implementation
Run scripts/build-record-inventory-v52.mjs to produce the source inventory. Add explicit stable canonical category IDs and verified holder receipts, then regenerate all active-season values and integrate the manager view and Tuesday sync. This is an initial inventory, not an exhaustive or unique count.
