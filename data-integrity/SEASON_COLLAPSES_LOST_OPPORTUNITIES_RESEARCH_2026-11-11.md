# Fellas Season Collapses & Lost Opportunities — Phase 5 research
**November 11, 2026 · research-only, unpublished, pending exact-head test and original-provider certification**

## Why this belongs in the Record Book
Complements the 14 comeback/resilience candidates by measuring the **reverse trajectory**: teams that started strong and stumbled, lost their cumulative W–L cushion, missed the playoffs, or fell short of championship-game appearances. These categories cannot be inferred from final standings alone.

The engine `scripts/build-historic-collapse-records.mjs` reconstructs **98 manager-season histories across all ten completed years (2016–2025)**. It uses recovered scored weekly regular-season pairings, official winners-bracket entrants, finalists, champions and season membership. Each output holder retains every played week's opposing manager, exact score, W–L record and playoff status.

## First-pass findings with exact receipt relationships

| Metric | Leading manager-season(s) | Source-backed result |
|---|---|---|
| Worst half-to-half net-record slide, all teams | **Stover 2017; Koble 2021; Tony 2023** | **−8** W–L swing each |
| Worst half-to-half slide while missing playoffs | **Stover 2017; Koble 2021** | −8 |
| Worst slide by a team that *did* qualify | **Tony 2023** | −8 |
| Largest erosion of an established positive W–L cushion | **Koble 2021** | From **+2** after Week 2 to **−6** at season end: eight wins of W–L cushion lost |
| Most second-half losses | **Koble 2021; Stew 2023; Thommy 2019** | **Seven** second-half losses |
| Most losses in a winless second half | **Same three seasons** | **0–7** second halves |
| Most first-half wins despite missing playoffs | **Stover 2017** | **5–1 first half**, finishing 6–6 without a playoff berth |
| Best undefeated first-half start without winning the title | **Tony 2023; Stover 2021** | Both opened **7–0**; neither won the championship |
| Most losses in final four regular-season games by a playoff qualifier | **Evans 2020; Thommy 2025** | **Four consecutive losses** entering playoffs |
| Longest losing streak in a non-playoff season | **Stew 2023** | **Nine consecutive losses** |
| Most regular-season wins by a playoff qualifier who missed the title game | **Mitch 2025** | **13–1**, ultimately third place |

These are **provisional recovered-ledger claims**. In particular, do not claim the 2023 Tony, 2021 Stover or 2025 Mitch outcomes are specific playoff upsets without independently reviewing the official bracket, seeds, matchup scores and timing.

### Detailed season narratives

**Stover 2017 — The 5–1 Disappearance.** Finished the opening half at 5–1, went 1–5 after the midpoint and ended 6–6 outside the four-team championship bracket. Important: 2017 had a different playoff format from the modern six-team system.

**Koble 2021 — The Seven-Week Freefall.** Opened 4–3, had **zero wins** in the second half, fell to 4–10, and missed the playoffs. His cumulative record peaked at 2–0 after Week 2; by season end his wins-minus-losses balance was −6.

**Tony 2023 — From Perfect to the Sidelines.** Began **7–0**, then went 3–4 in Weeks 8–14; still earned a playoff berth with a 10–4 record, but failed to reach the championship game. Compare separately from Koble or Stover, because the postseason outcome is fundamentally different. Tony's earlier first-half dominance remains real and should not be described as a season-long losing record.

**Stover 2021 — The Undefeated Season That Didn't Produce a Title.** Recorded a 7–0 first half and reached 11–3, but did not win the championship. This is not the same category as a *playoff miss*.

**Mitch 2025 — The 13–1 Non-Finalist.** Lost once in fourteen regular-season games, then finished third. The regular-season record and official placement justify a strong disappointment exhibit; the exact defeat that prevented the championship-game appearance deserves a separate story with bracket and point receipts.

**Stew 2023 — The Nine-Loss Fall.** Lost the final nine regular-season matchups, finishing 3–11. This warrants a scoring-independent Hall of Shame season record, distinct from weekly low-scoring totals or voided draft-pick trades.

**Thommy 2025 — Late Slide, Championship Final.** Lost the last four regular-season matchups, yet reached the championship game. Pair the *collapse* metric with the existing Phase 4 *playoff resilience* finding instead of double-counting identical four-loss categories.

## Calculation and integrity policy
- Use the **league calendar midpoint** (2016/2017/2018/2019 Week 6; 2020–2025 Week 7), not the number of recorded games played; a bye is not a loss.
- Define slide as **first-half (wins−losses) minus second-half (wins−losses)**; a 7–0 then 3–4 season has a slide of 8. Define cumulative lead erosion separately as historical maximum (wins−losses) minus final (wins−losses).
- The 2016 eight-team season and older ESPN scoring format do not affect the raw W–L arithmetic but do affect interpretation of playoff access and cross-era difficulty.
- The postseason source must be the verified championship bracket; consolation and Shitter brackets never count as qualifying for the title playoffs.
- Map `Tom` to current **Thommy** but retain **Schermerhorn** separately. Evans's 2023 results do not belong to JMid.
- Retain all tied first-place holders, year and every source receipt. 2026 is an in-progress season and excluded.
- Before release, deduplicate against existing published `legendary_records_2016_2025_v1.json` and Phase 4 comeback PR #204. In particular, the 2025 Thommy four-loss record exists under an adjacent resilience framing.
- A team finishing third after 13 wins isn't inherently a playoff *upset* until seeding and playoff scoring receipts establish the opponents/results.

## Research implementation
```bash
node scripts/build-historic-collapse-records.mjs > /tmp/fellas-historical-collapses.json
node scripts/verify-historic-collapse-records.mjs
```

These scripts perform **no production writes**. They generate 11 proposed categories, with scored receipts and named historical ownership, and check known leaders, source coverage and tied rank logic.

## Proposed next work
1. Exact-commit data-only fast CI; investigate any expectation errors honestly.
2. Reconstruct top-seed playoff elimination receipts and the all-time greatest semifinal upsets directly from official winners bracket IDs and game scores, excluding multi-week ESPN aggregate scoring from single-week point records.
3. Integrate validated categories into the common record registry (PR #202), after deduplicating the current 44 published categories, Phase 2, Phase 3, and Phase 4 research.
4. Write tightly sourced editorials for Stover 2017, Koble 2021, Tony 2023, Mitch 2025, Stew 2023 and Thommy 2025.
5. Only release after source verification, canonical records and Chromium/WebKit plus visual quality gates pass.
