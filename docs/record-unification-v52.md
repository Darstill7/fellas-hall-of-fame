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

## Phase 5.7 legacy reconciliation

The research workflow regenerates the unified registry at
`data-integrity/unified-record-registry-v57.json`. The `legacyReview` section
maps every Expanded Records definition to a single stable ID. Sixteen map to
regular-season core records, four to official-placement records, and 24 are
recomputed from the paired ledger or verified final ranks. The generator checks
the 24 recomputations against the archive at its original cutoff, then reruns
them through the latest paired game. The weekly season projection and manager
archive are checked against the ledger.

The 60-game, tie-adjusted career win rate is the registry definition. The
established 50-game display is a scoped variant and contributes no second
registry credit. Rival wins and meetings now both require five meetings, and
rivalry win rate uses at least six. Completed-season highs require 12 recorded
games from an officially completed season. That minimum admits some partial
historical samples, so the output describes recovered scores and leaves raw
scores unadjusted across scoring eras. Career streaks follow recorded
appearances across seasons and gaps. Within-season weekly streaks have separate
eligibility. Role-specific records such as winning margin and losing margin
credit the different sides of a matchup.

Registry portfolios give each manager credit once per held category and keep
every supporting instance. All tied managers receive credit. The registry
includes a scoped portfolio for the 44 reviewed legacy definitions, and the
larger candidate portfolios keep manager and player ownership separate. The
full research intake still needs cross-family review and publication approval
before its totals can be displayed as unique league records.

Public profile previews, the personal record book and the ownership
leaderboard use the established 16-category collection. The manager finder
shows archived and specialty leads separately. The homepage links to the
personal record book and does not display an ownership total.

## Comparing the research families

The registry's `ownershipReview` accounts for each candidate. Build validation
compares the mark and full holder set of each exact alias against the established
public calculation. A different published scope, such as the 50-game win-rate
board, retains its published qualification and supplies no extra ownership
credit. The review also records comparisons between families where a shared
receipt could otherwise look like a shared category. For example, the
two-sided Trade Museum sample and the provider-wide completed-trade count have
different eligibility. A starter performance can support a manager record and a
player record in their respective collections.

At the current cutoff, the 426 entries include 12 exact public equivalents,
four variants of published scopes, 345 scoped research candidates, and 65
additional recovered-game or official-placement candidates awaiting publication
review. These counts describe the inventory. The 16 established categories
determine the public ownership totals. Their record links now open the
corresponding card with the credited managers, qualification and source links.

## Proposed standings and playoff additions

`ownershipReview.publicationReview` records a disposition for each of the 65
remaining candidates. The preview proposes seven additions: most completed
seasons, most top-half finishes, greatest consecutive-season placement
improvement, most semifinal appearances, most byes, most top seeds, and
longest consecutive playoff berth streak. The generator calculates their
marks and ties directly from the official finishing order and verified
brackets, then checks the corresponding registry entries. Per-manager preview
totals preserve the 16 established categories and show the effect of adding
the seven proposals. CI also publishes a standalone copy at
`data-integrity/record-publication-preview-v57.json` with the supporting season
receipts.

The other 58 records retain their specific scope. That includes recovered game
and streak samples, partial-season comparisons, format-dependent postseason
exhibits, and opposing roles in the same matchup. Public counts remain based
on the established collection pending a publication decision.
