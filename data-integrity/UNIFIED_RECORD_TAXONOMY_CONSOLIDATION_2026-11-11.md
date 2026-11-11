# Unified Fellas Record Book taxonomy — consolidation pass
**2026-11-11 · Research-only · no public Record Book replacement**

## Why this is necessary
The main site already has **44 expanded record IDs** in `data/expanded_records_verified_v1.json` and a separate set of **19 legendary categories** in `data/legendary_records_2016_2025_v1.json`. Subsequent research produced **77 proposal appearances** across PRs #202, #203, #204, #205, #206 and the unpublished Phase 3 postseason research branch. **77 is not a count of net-new records.** Many candidate IDs are aliases for the same measurement or overlap earlier historically established categories.

This PR introduces a **single, deterministic crosswalk** for category *identity and review state*, not a scoring generator or a website change. Run:

```sh
node scripts/build-record-taxonomy-crosswalk.mjs > /tmp/fellas-record-taxonomy.json
node scripts/verify-record-taxonomy-crosswalk.mjs
```

## Three levels of relationship, never confused

**Exact same measurement:** Use `aliasRules` so two data engines point to one canonical category. Examples:
- PR #203 `weekly-highs` ↦ PR #202 `weekly-highs-career`
- PR #203 `season-weekly-highs` ↦ `weekly-highs-season`
- PR #203 `rival-win-run` ↦ `rivalry-consecutive-meeting-wins`
- PR #204 `turnaround-deepest-hole-champion` ↦ existing Legendary `deepest-champion-hole`
- PR #204 `turnaround-deepest-hole-playoff` ↦ existing Legendary `deepest-playoff-qualifier-hole`

**Related, but *not* the same measurement:** Mark `relatedReview` and keep distinct IDs until reviewers reconcile their full rules. Examples:
- Biggest upset in *any* playoff round versus biggest upset in the *championship final*.
- Narrowest playoff elimination in *any* round versus narrowest *opening-round* elimination.
- Most regular-season wins by a team that missed the **final** versus best season without the **title**.
- Consecutive losses entering the playoffs versus losses in the last four games by any eventual finalist.

**Independent new candidate:** Keep an unpublished category ID with a named source branch/PR, source-family, and `candidate-awaiting-certification` status. No category is automatically published.

## Critical historical safeguards
1. Preserve old 44 published IDs and 19 Legendary IDs; do not replace user-facing record text based on a new script's outputs without source-based comparison.
2. Treat 2016–2018 scoring and 2019 onward under their appropriate scoring rules. Raw points from different scoring eras are not normalized.
3. Honor the 2016 eight-manager league size, 2016–2017 bracket aggregate rounds, and 2020/2021 regular-season Week 14 byes.
4. One category object must feed both the full Record Book and each manager's personal record portfolio; no independently edited manager rankings.
5. All co-holders of a record share rank 1, and every manager gets their personal best rank even outside a global leaderboard top ten.
6. The current player formerly labeled `Tom` is Thommy, **not** Schermerhorn. In 2023, the former account was owned by Evans, **not** JMid.
7. The 2026 season is current through Week 9; completed-season, championship and postseason categories stop at the last finished season, 2025.
8. Source status is critical: `research-only-no-production-writes` means these proposed categories are not publicly certified.

## Release plan and necessary extra work
- Validate this conservative taxonomy with its standalone CI gate. Review all `relatedReview` items by exact rule and qualifying period; don't force near-duplicates into one record without matching semantics.
- Re-run the source category engines from their **original research branches**, compare certified leaders and scores, and establish source manifest hashes with canonical ledger cutoffs.
- For candidate categories, verify complete ranking eligibility and source receipt link/owner identity; preserve shared first-place ranks.
- Produce `managerIndex` from the **same finalized category objects**. Expose one-click manager portfolios above the expanded Records Lab as requested.
- Run canonical validation, independent Chromium/WebKit visual tests, mobile anchor navigation and GitHub Pages checks before publishing anything.

This first consolidation pass is intentionally about **stable identity and deduplication**. It does not yet create one combined dataset of scores or promote new records.
