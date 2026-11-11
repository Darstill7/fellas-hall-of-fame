# The Fellas Draft DNA — Eleven-Season Historical Research Program

**Source coverage audit | November 11, 2026 | Research only, not graded/publication-ready**

## Research thesis

Reconstruct every available original Fellas draft selection from 2016–2026, link picks to actual *original manager* lineup contributions, quantify draft-round and positional relative value, identify the genuine steals/misses, and determine whether successful drafts persist across managers and years. Connect verified picks to keeper rights and post-draft trades, without treating a player's later success for an acquiring franchise as points delivered to his original drafting manager. Grade **observed realized draft returns**, not manager skill or what a manager *should* keep in 2027.

## Existing source inventory — facts verified against the checked-in files

| Era | Available draft selections | Reliability | Main gap |
|---|---:|---|---|
| ESPN 2016–2019 | **598 named picks** | Names identified for all 598 | Only 438 selections have reliable exact overall sequence; all 160 rows in 2018 originated from position-sorted import and must **not** be treated as an exact draft board |
| Sleeper 2020–2024 | **750 picks** (150 each) | Existing draft engine and year-level observed-return research | Ensure per-pick weekly ownership/starts, keeper treatment and original franchise attribution before multi-year official grades |
| Sleeper 2025 | **150 picks**, of which **130 nonkeeper pilot picks** | Completed season; original-manager starter contributions available in pilot | Cross-check every pick, including 20 keeper positions excluded from nonkeeper ranking |
| Sleeper 2026 | **150 picks**, of which **130 nonkeeper pilot picks** | Completed original draft board, ongoing season | Research pilot stops at **Week 8**; refresh through verified **Week 9** before current-season comparisons. No final full-season grade |

**Total original selection inventory potentially in scope: 1,648 across eleven drafts.** This is a selection-count inventory, **not a claim that 1,648 weekly contributions have been independently certified**. The ten *completed* draft years 2016–2025 cover **1,498 picks**.

Known source paths:
- `data/espn_draft_boards_named_2016_2019.json` (598 named selections, 438 order-confirmed)
- `data/draft_intelligence_research_2025_2026w8_v1.json` (2020–2024 750 selections; detailed 2025–2026 pilot summaries)
- `data/draft_keeper_value_pilot_2025_2026w8_v1.json` (130 nonkeeper picks per year, original-drafter starts)
- `data/fellas_2026_sleeper_draft_board_verified_v1.json` (150 verified 2026 selections and keeper flags)
- `data/player_starts_2020.json` through `data/player_starts_2026.json`
- `data/keeper_rules_commissioner_confirmed_2026_v1.json`
- `data/lineup_hindsight_coverage_2020_2025.json`

## Mandatory accuracy gates

1. **Draft identity and actual order:** ESPN 2018 named picks are verified but 2018's offline file is position-sorted, so overall selection positions are **unknown**, not 1–160. All 2016–2019 ESPN player names must preserve source reconciliation provenance.
2. **Scoring eras:** 2016–2018 standard and integer-rounded scoring cannot be compared at face value with half-PPR 2019 onward. Use within-season/position relative metrics when broadening comparisons.
3. **Keepers:** Respect the contemporaneous annual keeper rules. A keeper slot is not a fresh drafting discovery. Rights follow the traded player when applicable, and a first-round player can be kept in the first round under the confirmed rules. Do not rewrite the keeper history retroactively.
4. **Trade/FAAB boundaries:** Attribute a starter's actual fantasy points to the manager who used him *that week*. For **draft-return** credit, count only actual starts for the original drafting manager. Track later trade outcomes separately with transfer dates and independent receipt status.
5. **Roster slot/started-point proof:** Use real archived lineups, player IDs and scored starter positions, not NFL total fantasy points or bench production. Respect six years of roster source coverage and disclose excluded/incomplete team-weeks.
6. **2026 not final:** Refresh original-drafter production from source-complete Week 9. Never mix partial 2026 totals into final all-time yearly grades.
7. **Selection-versus-ownership distinction:** The draft board's selection manager is not proof of who owned the player on Week 1 or after a trade.
8. **Manager tenures:** 2023 Evans is not JMid. Current Thommy alias is distinct from old Schermerhorn. Avoid false cross-owner multiyear grades.

## Work packages and measured deliverables

**A. Complete draft board vault:** 2016–2026 original picks, display name, stable IDs, pick round/order confidence, owner, keeper flag, and where unknown a proper `not_verified` state. Target 1,648 source rows without inventing 2018 overall pick sequence.

**B. Per-pick production ledger:** For the six completed Sleeper seasons, original drafted player `year/week/playerId/draftingManager/startingManager/slot/points` receipts; value only when player was started by original drafter. Fully explain bench weeks, dropped, traded, out/inactive and byes when the underlying data supports those states.

**C. Draft steals and busts:** Compare original-manager starter points to same-year, similar-position/round alternatives. Show position and draft-cost context, keeper exclusions, and player transfer effects. Publish transparent examples rather than unsupported rankings of decisions.

**D. Draft grades and manager résumés:** Within-season normalized observed returns, sample-size uncertainty, total original-drafter starter points, and consistently comparable year-to-year coverage. Publish league-level decade leaderboards only for years with equivalent verified methodology.

**E. Championship impact:** Distinguish drafted players that produced actual starts for finalists/champions, playoff starter production and trade acquisitions. Do not credit the 2023 title exclusively to draft performance without evidence.

**F. Editorial museum:** Best picks by round, biggest misses, dynasty construction, manager draft DNA cards, season-by-season draft classes, rookie selections, and original draft boards. All claims link back to player/season/week evidence.

## Initial high-value research anomalies

- The existing 2025 pilot's top observed nonkeeper round/position peer surplus belongs to **Birch** (+648.71), followed by **Tony** (+359.55); these are **descriptive 2025 within-method returns only**.
- The 2026 original draft shows **Woody Marks in Round 13** for Stilly, a good candidate for late-round value analysis once Week 9 roster and starter production are verified.
- Keeper and drafted-player 2025–2026 pilot rows are partial, *not* a complete all-era keeper intelligence certification.
- The 2020–2024 archive's draft surplus uses a distinct benchmark from the 2025/2026 peer-median pilot, so their raw surplus numbers are not directly comparable. The comparison model must be harmonized before decade rankings.

## Sequencing with GitHub CI

The latest `main` commit `abb80986` has a Pages `startup_failure` and pending canonical/visual workflows; PRs #208 and #209 have queued exact-head checks. **Do not merge this research into main or trigger additional overlapping test workflows before those release gates are resolved.**

This branch records the source-backed roadmap and measured inventory. A later implementation should add independent integrity tests before advancing publication. Start with 2020–2025 source completeness and 2026 Week 9 refresh, then ESPN-era reconciliation.
