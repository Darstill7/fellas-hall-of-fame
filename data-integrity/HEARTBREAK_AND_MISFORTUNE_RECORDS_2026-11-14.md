# Heartbreak & Misfortune: the historical record expansion

**Research cut:** 2026 Week 9, data archive last updated 2026-11-10. **Research prepared:** 2026-11-14. **Publication:** not approved or deployed.

## Reproducible source and constraints

`node scripts/build-heartbreak-records.mjs`

All values are derived directly from `data/unified_record_book_2016_2026.json`. The denominator is **705 regular-season paired matchups**, 1,410 team performances, across **14 historical managers**. Scores are raw ESPN/Sleeper values, without cross-era normalization. ESPN early seasons used different scoring and 2016 had only eight teams, so a counting record is not a tenure-adjusted luck statistic. **No completed Week 10 of 2026 was available in this source**. Exclude playoffs, consolation and ties from loss counts.

- **Over 110** means **strictly greater than 110**, not ≥110.
- **Within five** means an actual loss by a margin of **0.01 to 5.00 points**, inclusive at 5.00; ties excluded. Compare integer score cents.
- All-time ranks are **competition ranks**, including ties; all former managers are ranked.
- Completed-season categories explicitly end in **2025**.

## 1. Career heartbreak leaderboard — candidate trophies of misfortune

| Candidate | Archived holder(s) | Record |
| --- | --- | ---: |
| Regular-season losses scoring over 100 | Stilly | 34 |
| Losses scoring over 110 | Tony | 19 |
| Losses scoring over 125 | Mitch, Stilly, Thommy, Tony | 5 each |
| Losses scoring over 130 | Stew, Stilly | 4 each |
| Losses scoring over 140 | Stew | 3 |
| Losses scoring over 150 | Stew | 2 |
| Defeats by one point or less | Stover | 4 |
| Defeats by three points or less | Mitch | 7 |
| Defeats by five points or less | Mitch, Stew | 10 each |
| Defeats by ten points or less | Thommy | 21 |

**Extreme double distinction:** Stew has the only two losing 150+ performances in the recovered regular-season archive:
- 2025 Week 10, Stew 164.80 vs Mitch 167.82.
- 2026 Week 1, Stew 158.52 vs Mitch 161.26.

Stew's third 140+ loss was **2018 Week 7: 142.76 vs Thommy 142.92**. Thus all three of his 140+ defeats were by 5 points or less.

## 2. Hybrid close / high-scoring loss records

| Criterion | Holder | Count |
| --- | --- | ---: |
| Score over 100 and lose by ≤5 | Stew | 7 |
| Score over 110 and lose by ≤5 | Stew | 6 |
| Score over 125 and lose by ≤5 | Stew | 4 |
| Score over 130 and lose by ≤5 | Stew | 4 |
| Score over 140 and lose by ≤5 | Stew | 3 |

The **over-125 and loss by five or less** record is a particularly clean, distinctive editorial category: *Stew 4; Mitch 3; next Kuhl 2*. The 140-point hybrid has three underlying game receipts. These are not five different degrees of achievement to award blindly; use one or two curated cards and put other thresholds in a drill-down.

## 3. Worst single seasons

- Five tied season leaders for the most losses while scoring **over 110**: Thommy (2020), Tony (2020), Stilly (2022), Tony (2022), and Thommy (2023), each **4**.
- **Stilly 2022** holds the completed-season high for defeats while scoring **over 125**: **3**.

All single-season records exclude 2026 because it remains active.

## 4. Repeat offenders: directed rivalry heartbreak

| Criterion / one opponent | Losing manager | Nemesis | Losses |
| --- | --- | --- | ---: |
| Score over 100 | Stilly | Stover | 8 |
| Score over 110 | Stilly | Stover | 5 |
| Score over 125 | Stew | Mitch | 3 |
| Score over 125 | Tony | Mitch | 3 |
| Score over 140 | Stew | Mitch | 2 |
| Score over 150 | Stew | Mitch | 2 |

The **Stew–Mitch** record has three over-125 receipts: 2021 Week 2 (138.74–141.16), 2025 Week 10 (164.80–167.82), and 2026 Week 1 (158.52–161.26). **Tony also lost to Mitch three times scoring over 125**, so that category is shared.

The 2025 and 2026 Stew–Mitch games together make a compelling *Nemesis of the Year* editorial story, but this is a historical retrospective, **not a new official trophy**.

## 5. Publication and taxonomy policy

`data/expanded_records_verified_v1.json` already includes:
- `highest-score-loss`: the **single highest losing score**, which Stew already leads at 164.80.
- `high-score-losses`: **120+ point losses** (inclusive ≥120), led by Stilly and Tom/Thommy at 10. This remains a **distinct definition** from the new over-110 / over-125 threshold categories.
- `nailbiters`: **wins** by ≤3; not the proposed **losses** by ≤3.
- `one-score-drama`: all games, win or loss, decided by ≤3; not the proposed loss-only record.

The 15 career/hybrid, 2 single-season and 5 directed-rivalry leaderboards are **provisional research categories**. They include many deliberately overlapping thresholds and must **not** be added as 22 independent historical trophies or count as confirmed newly published record types. The final editorial page should show a few **distinctive** awards, separate existing source records, link exact game receipts, and allow further thresholds through an advanced data view. Suggested first featured records: losing 140+, losing 150+, ≤1 loss, ≤5 loss, 125+ & ≤5 hybrid, 125+ season, and 125+ nemesis.

All game-level evidence and complete manager rankings are generated by `scripts/build-heartbreak-records.mjs` and tested in the dedicated `Heartbreak & Misfortune Record Research` GitHub workflow. Before publication, complete historical provider spot checks and mainline CI / visual checks. No current public record or profile data is changed by this research.
