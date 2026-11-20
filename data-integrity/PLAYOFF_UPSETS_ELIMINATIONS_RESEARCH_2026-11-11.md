# Playoff Upsets & Eliminations — 2016–2025 Deep Research
**November 11, 2026 · provisional research · no production edit**

## Evidence and method

Matched **41 recovered championship winners-bracket matchups** to **all ten seasons' original verified playoff seeding dictionaries** using:
- `data/verified_espn_playoff_brackets_2016_2019.json`
- `data/verified_sleeper_playoff_brackets_2020_2025.json`
- `data/postseason_winners_bracket_record_receipts_2016_2025_v1.json`

All **41 games** have matched winner/loser seed assignments; no pair requires inferred seeding. A *seed upset* is defined as a win by the franchise with the *larger numeric seed number* (e.g., No. 6 over No. 1). **15 seeded upsets** are recovered. It is not a claim about moneylines, implied probabilities, projections or a player's roster strength.

The 2016 and 2017 ESPN playoff rounds used **two-week aggregate score periods**. Their seed/upset outcomes are valid bracket results, but their aggregate margins must never be ranked among **single-week** wins, close eliminations or point records. Consolation/unclassified postseason contests and bye advances are excluded.

## Provisional new and revised Record Book insights

| Record candidate | Recovered leader | Supporting matchup |
|---|---|---|
| Biggest postseason seed upset | **Koble 2020** | No. 6 beat No. 1 Mitch **by 18.06** in the championship |
| Largest semifinal seed upset | **Birch 2018, Koble 2020, Evans 2021, Mitch 2023** | Each defeated a No. 2 or No. 1 from four seed places lower |
| Largest opening-round seed upset | **Birch 2018, Mitch 2023, Birch 2025** | No. 6 defeated No. 3; three-seed gap |
| Most career postseason seed upsets | **Thommy** | **4** qualifying seeded wins |
| Most upsets of a top-two seed | **Thommy** | **4** playoff defeats inflicted on No. 1/2 seeds from a lower seed |
| Most No. 1 seeds personally eliminated | **Thommy** | **3** (2016 Halderman, 2018 Tony, 2025 Mitch) |
| Most No. 1 seed seasons eliminated | **Mitch, Tony** | **2 each** (Mitch 2020/2025; Tony 2018/2023) |
| Closest single-week championship-bracket elimination | **Tony 2025** | Lost to Birch by **0.72** points in opening round |
| Largest single-week championship-bracket elimination margin | **Stilly 2024** | Lost final to Thommy by **90.42** |
| Closest No. 1 seed single-week elimination | **Mitch 2025** | No. 1 Mitch fell to No. 4 Thommy by **7.98** in the semifinal |

**Potential overlaps:** Existing legendary records already reference **biggest championship-final seed upset**, **closest opening playoff loss**, **closest semifinal loss**, **closest championship**, and **largest championship margin**. Promote only categories adding new rules, and keep existing more specific records where appropriate.

## 2025 Mitch: a true postseason case study

The verified 2025 standings and bracket report **Mitch went 13–1**, earned the **No. 1 seed** and the first-round bye, then was eliminated in the semifinal by **No. 4 Thommy**, **7.98** points short. This is a factual seeded-upset and elimination record candidate with actual winner-bracket matchup evidence, not simply an inferred disappointing third-place finish.

The relevant exact matchup source appears in the verified winners-bracket receipts (`year=2025, round=semifinal, winner=Thommy, loser=Mitch`). This can support a linked editorial story; any claims about injuries, projections, roster decisions or player-specific turning points require new original-game evidence.

## 2020 Koble's path — championship seed shock

Koble's No. 6 title finish is the widest seed gap in a recovered championship-bracket game: defeated No. 2 Birch by **47.60** in the semifinal, and No. 1 Mitch by **18.06** in the final. The overall biggest final seed upset is **already covered** in Legendary Records. The newly proposed separate playoff-upset table should show the full bracket path without duplicating that existing record as a new category.

## Integrity / rollout safeguards
1. Use `seedByManager` from original verified ESPN and commissioner-confirmed Sleeper brackets; never infer seeds from regular-season rank alone.
2. Normalize current Thommy but **never merge former Schermerhorn**; keep 2023 Evans history separate from JMid.
3. One bracket game counts once. A No. 1 seed's bye is not a victory, defeat or scored playoff game.
4. For margin records, exclude `twoWeekAggregate=true`; for seed-gap upset records include genuine two-week aggregate results.
5. Reconcile overlapping categories before counting net-new additions to the live 44-category Record Book.
6. Show a link/receipt for year, round, both seeds, opponent, exact scores, and match result; never label upset by betting odds.
7. Standalone `node scripts/build-playoff-upsets-records.mjs` emits provisional JSON, and `node scripts/verify-playoff-upsets-records.mjs` checks source consistency and expected leaders. No live website files are written.

### Next editorial research
- Highest regular-season W–L winning percentage eliminated in first playoff game (requires format-adjusted season records and seed receipts)
- Largest season-to-postseason scoring collapse, with original starting lineups and weekly points
- Most No. 1 seeds knocked out by the same rival (check opponent pairings and tied holders)
- Repeat playoff rematches and revenge victories, after confirming bracket participants and week chronology
