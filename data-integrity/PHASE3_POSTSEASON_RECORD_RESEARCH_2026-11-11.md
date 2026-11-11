# Phase 3 — eight additional postseason Record Book candidates

**November 11, 2026 | Research-only, not publicly certified | No production page edits**

## Source-based development
A new deterministic script `scripts/build-postseason-phase3-candidates.mjs` reconstructs eight independent postseason categories from the *verified bracket classification* in `data/postseason_records_verified_v1.json` and season participation from `data/fellas_final_placements_2016_2025_verified.json`.

This is a **different source family** from the Phase 2 regular-season scoring candidates. It excludes all consolation and unclassified playoff-score entries and does not mistake two-week ESPN score aggregates for single-week games.

Run offline with Node 22:
```sh
node scripts/build-postseason-phase3-candidates.mjs > /tmp/fellas-postseason-phase3.json
node scripts/verify-postseason-phase3-candidates.mjs
```

The generator emits scored source receipts, distinct category IDs, competition ranks, every number-one co-holder, and the first five competition-ranked places. It never overwrites the existing 44-category published Record Book or manager pages.

## Candidate leaderboards requiring final certification

| Category | Preliminary record holder(s) | Mark | Source logic |
|---|---|---:|---|
| Consecutive championship final appearances | **Thommy** | **3 seasons**, 2016–2018 | Consecutive verified official finalists |
| Consecutive winners-bracket semifinal appearances | **Birch** | **4 seasons**, 2018–2021 | Consecutive verified semifinalists |
| Consecutive first-round byes | **Birch** | **3 seasons**, 2019–2021 | Official first-round byes; 2018 onward |
| Most semifinal appearances without reaching final | **Birch, Evans, Mitch, Stover, Tony** | **3** each | Verified semifinalists excluding same-season finalists |
| First-round byes without reaching final | **Birch, Stover, Tony** | **2** each | Byes excluding same-season finalists; 2018 onward |
| Championship finals reached without first-round bye | **Stilly, Thommy** | **2** each | Finalists with no bye during 2018–2025 |
| Championship-final conversion per playoff berth | **Thommy** | **5/7 = 71.429%** | At least five postseason berths |
| Championship-title conversion per playoff berth | **Thommy** | **4/7 = 57.143%** | At least five postseason berths |

**Important technical distinction:** The first five metrics are counting actual recovered bracket events. The latter two ratios are descriptive outcomes, **not future performance predictions**. Restrict ratios to at least five completed postseason berths to avoid one-year champions with misleading 100% rates.

## Championship-format and identity rules
- The ESPN 2016–2017 championship bracket was a four-team, two-week-round format with **no reported first-round byes**. Never credit those participants with six-team-format byes or interpret those absent byes as failures. Metrics explicitly dependent on receiving a bye begin in **2018**.
- Official `Tom` in bracket payload maps to active site manager **Thommy**; former **Schermerhorn** remains separate. 2023 Evans participation must not be credited to JMid.
- Missing manager participation is not a failed season. Only `finishes` entries establish franchise presence.
- All ties at best mark share rank 1; every tied holder belongs in the public leaderboard and manager trophy case.
- Bracket finalists/semifinalists must be within reported playoff participants; source consistency is asserted before calculating records.

## Publishing plan
1. Keep Phase 2 PR #203 and shared registry PR #202 stable while their exact-commit checks finish; this Phase 3 work is isolated on `research/postseason-records-phase3-20261111` so it does not cancel those runs.
2. Execute the fast new postseason Node verifier and review any failing assumptions; a dedicated PR is appropriate once the currently queued gates are cleared.
3. Cross-check at least one original provider bracket in every playoff format and review commissioner overrides before promoting any of the eight categories.
4. Merge only genuinely nonduplicate categories with the shared registry; do not double count the existing playoff-berths, finals, top seeds, or championship-count records.
5. Use one canonical source object for both league Record Book and manager-profile trophy cases, adding branded provenance/era labels and clickable season receipts.
