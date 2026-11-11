# Phase 2: 23 proposed historical Record Book categories

**Research prepared November 11, 2026. Status: provisional, unpublished, and not an automatic addition to the 44 published categories.**

The generator `scripts/build-record-book-phase2.mjs` derives 23 categories directly from 705 canonical 2016–2026 Week 9 regular-season matchups, retaining the opponent, season, week, score, and applicable ranking context. The verifier `scripts/verify-record-book-phase2.mjs` checks source coverage, competition-ranking ties, known holders, and incomplete-season exclusions, with a small independent CI workflow that does not require browser installations.

## Category inventory — 23 distinct research definitions

| Group | Candidate keys / metric definitions |
|---|---|
| Weekly scoring awards (9) | `weekly-highs`, `weekly-lows`, `weekly-runnerups`, `weekly-top-three`, `weekly-bottom-three`, `top-three-losses`, `bottom-three-wins`, `runnerup-losses`, `second-lowest-wins` |
| Completed-season performance (4) | `season-top-three`, `season-bottom-three`, `season-weekly-highs`, `season-weekly-lows` |
| Threshold scoring (4) | `career-150-plus`, `career-sub-80`, `season-150-plus`, `season-sub-80` |
| Streaks (2) | `high-streak`, `low-streak` |
| Single-game combined score (2) | `combined-high`, `combined-low` |
| Rivalry records (2) | `rival-win-run`, `rival-one-point` |

**Overlap warning:** Many of these candidate definitions appear in the existing proposed shared registry PR #202. They are intentionally a separate reproducibility and expanded-evidence exercise, not 23 additions *on top of* PR #202. Before publication, reconcile IDs, formulas, eligibility and deduplicate the consolidated category registry. The existing 44 published categories remain authoritative until an explicit reviewed replacement.

## Notable known results to test
- Mitch: **22** league-high weekly scores; Stilly: **20** weekly league-low scores.
- Tony: **19** second-highest weekly scores, where first is a unique highest place.
- Stilly: **8** top-three scoring losses; Stover: **8** bottom-three scoring wins.
- Mitch 2025: **5** weekly scoring crowns, most in a completed season.
- Thommy 2019: **6** league-low scoring weeks, most in a completed season.
- Evans 2016: **3 consecutive** scoring crowns (Weeks 7–9).
- Stew 2023: **4 consecutive** league-low scoring weeks (Weeks 11–14).
- Stew–Mitch 2025 W10: **332.62** combined points, provisional highest.
- Thommy–Tony 2017 W1: **119** combined points, provisional lowest.
- Six distinct manager/rival pair runs tie at **six** consecutive head-to-head meetings won. These are *meetings*, not six calendar weeks.

These results are internal cross-ledger findings that require original-era confirmation before being labeled league-certified history.

## Definitions and anti-corruption rules
- Weekly rank calculations use **142 complete scored-team weeks**. In 2016, a complete week contains eight managers; ordinarily from 2017 onward it contains ten.
- The 2020 and 2021 Week 14 exports recorded four legitimate head-to-head games and two team byes. These weeks are **excluded from entire-league weekly ranking** until an eligibility policy is approved, but their actual scores and matchups remain eligible in raw scoring and rivalry records.
- Ties at a weekly scoring cutoff share competition rank; an exact weekly high or low can be shared. If two teams tie for weekly highest, no second-place mark is awarded.
- Top three / bottom three use competition-rank score thresholds and can have more than three qualifiers in a tie.
- Raw score comparisons across ESPN and Sleeper eras are descriptive. 2016–2018 integer scoring and 2019 scoring changes must be disclosed; no season-normalized claim is inferred.
- Each completed-season threshold excludes 2026. Career counts can include the nine completed 2026 weeks.
- Every proposed category must carry a `status: provisional-not-published` flag. Positive and negative records should be separated editorially (Hall of Fame versus Hall of Shame); low raw combined points uses **ascending positive values**, never artificial negative totals.
- Historical owner Schermerhorn is not the current Thommy. Evans owns his 2023 records, not JMid.

## Integration plan, without disturbing validation
1. Let this branch's fast deterministic CI run; investigate real assertions if it fails.
2. Resolve shared-category overlap between PR #202 and this 23-category research and agree on definitive canonical IDs.
3. Obtain the commissioner ruling on bye-week ranking eligibility, then independently sample ESPN-era original matchups and old Sleeper receipts.
4. Upgrade the common generator with all certified nonduplicate categories and a complete individual manager best-mark index.
5. Render the same records on the league Record Book and individual manager portfolios, preserving proper evidence, ties, readable mobile tables and click-through histories.
6. Run all canonical, Chromium, WebKit, visual and Pages checks before any public production merge.

**Do not use this research artifact for live record claims until validation and provenance are complete.**
