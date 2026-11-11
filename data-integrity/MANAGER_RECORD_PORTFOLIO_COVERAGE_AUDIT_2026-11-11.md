# Manager record portfolios — source completeness audit
**2026-11-11 · research-only · not yet a complete personalized record registry**

## Why this matters
The existing 44-category source contains a **full candidate count per record**, but the persisted global leaderboard is frequently capped at 20 records. The separate manager `signatures` object contains **eight curated highlights per manager**, not all of that manager's ranked records. Displaying only a merger of these two sources under the title **“Every Record You Hold”** would silently omit personal category bests and could mislead managers.

The standalone executable `scripts/audit-manager-portfolio-coverage.mjs` outputs a per-category and per-manager JSON audit. It is deliberately read-only and can run without internet or browser dependencies:

```bash
node scripts/audit-manager-portfolio-coverage.mjs > /tmp/fellas-portfolio-coverage.json
```

## Audit criteria
- For all 44 records, compare `entries` (source-wide rankable count) with `leaders.length` (persisted leaderboard cap). Report `sourceCapped` and coverage fraction.
- For each of ten active managers, count unique categories where the manager is present in retained league leaders or in their eight curated signature highlights.
- List all missing *source-recoverable* category IDs for each manager. These are **coverage gaps, not proof of zero performance or poor performance**.
- Preserve `Tom -> Thommy` on current display, but never merge historic Schermerhorn; the 2023 Evans identity stays distinct from 2024+ JMid.
- Keep proposed Phase 2 scoring awards in a separate unpublished partition of the unified results registry.

## Engineering solution
1. Recompute **all rankable entries**, not merely top 20, for every published category from canonical weekly matchups, complete season standings, verified final finishes, and complete rivalry meeting data.
2. Store a shared full-ranking structure under each category ID, with a standard deduplicated manager best-mark reducer. Add explicit `eligible` and `notApplicable` flags when there is no qualifying result.
3. Provide the Record Book’s top-ten or top-twenty presentation from this full structure, while manager pages read their **own best rank for all applicable categories** from the same source.
4. Validate each of the ten current managers has the correct source-eligible category count. Do not require 44 for managers such as JMid and Scott who lack ten seasons of history or for categories with legitimate minimum-game qualifiers.
5. Enrich manager portfolio records with linked week, opposing owner, score, category definition and the source confidence badge.
6. Preserve the exact existing 44 published record keys to avoid broken links; consolidate only certified new candidate IDs.
7. Do not switch the live website to this registry until source completeness and mobile/browser routing checks pass.

This branch intentionally does not create a PR immediately: current main Pages, canonical and visual workflows and PR #208 are queued. The audit can be reviewed and prepared without restarting the pending validation gates.
