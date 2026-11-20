# Phase 1 records — independent reproducibility and cross-ledger audit
**November 11, 2026 · Research only · Not certification of original ESPN/Sleeper receipts**

## Reconciliation of two canonical read models
Compared every regular-season matchup from `data/unified_record_book_2016_2026.json` against `data/season_weekly_matchups_2016_2026_v1.json` by season, week and unordered manager pair, then checked both managers' exact scores.

- **705 of 705 regular-season matchups reconcile; 0 missing games, 0 score differences, 0 duplicated key differences in this comparison.**
- Full recorded 2026 coverage is **45 matchups, Weeks 1–9**, ten managers per week.
- Weekly-ranking coverage: **142 scored-team-complete weeks**; **2020 Week 14 and 2021 Week 14 have only eight scored teams**, with the documented two-team byes; withheld from whole-league scoring-week titles until scored-team completeness is independently established.
- The first-season format is eight teams in 2016, not ten. All 13 regular weeks of 2016 include eight paired scores.
- **Critical qualifier:** both ledgers may derive from the same provider recovery pipeline, so agreement is cross-artifact consistency, **not independent upstream confirmation**. All 2026 Week 9 rows still say `sleeper_api_staged_week_9`. Do not call them upstream-finalized without another provider receipt.

## Recomputed career weekly-scoring leaderboards
Only full scored-team weeks, 2016–2026 Week 9; tied first/last share their titles.

| Weekly league highs | Count | Weekly league lows | Count |
|---|---:|---|---:|
| Mitch | 22 | Stilly | 20 |
| Birch | 16 | Stew | 17 |
| Stover | 15 | Stover | 16 |
| Tony | 15 | Thommy | 16 |
| Thommy | 14 | Birch | 13 |
| Evans | 11 | Tony | 13 |
| Stew | 10 | Kuhl | 13 |
| Stilly | 10 | Koble | 9 |

**2026 current crowns:** Mitch 4 (Weeks 1, 2, 5, 6); JMid 3 (Weeks 3, 8, 9); Thommy 1 (Week 7); Tony 1 (Week 4). JMid's consecutive Weeks 8–9 are real **within the canonical ledger**, but Evans 2016 Weeks 7–9 remains the three-week provisional record. The scoring-streak PR #170 is stale where it says 2026 Week 9 unfinished.

## Important single-season completeness correction
The first-pass report displayed five leaders and omitted several co-holders of the four-title mark. Recomputed **most weekly league-high scores in one completed season**:

| Manager | Season | Crowns | Weeks |
|---|---:|---:|---|
| Mitch | 2025 | **5** | 3, 5, 7, 10, 12 |
| Halderman | 2016 | 4 | 4, 5, 10, 12 |
| Evans | 2016 | 4 | 1, 7, 8, 9 |
| **Thommy** | **2017** | **4** | **4, 8, 9, 12** |
| Mitch | 2020 | 4 | 5, 7, 8, 11 |
| **Tony** | **2021** | **4** | **6, 7, 11, 12** |
| Stover | 2024 | 4 | 1, 4, 7, 9 |

All managers tied at four should appear in a full tied-holder view. A fixed top-five display should disclose it is truncated, or use competition ranking and include all tied holders.

**Most top-three weekly scores in a completed season:** 10, shared by Stover (2024) and Mitch (2025), Stew (2022) next with 9. 

**Most league-low weeks in a completed season:** Thommy 2019 six (Weeks 1, 2, 6, 10, 11, 13); Stilly 2018 and 2020 five each. **Longest consecutive low-score streak:** Stew 2023 Weeks 11–14, four. Keep these as shame marks, not positive trophy totals.

## Evidence-backed matchups and luck/heartbreak
- Highest combined regular-season matchup: **Stew–Mitch 2025 Week 10, 332.62**. Next Mitch–Stew 2026 Week 1, 319.78; Scott–Mitch 2025 Week 7, 316.92.
- Lowest combined recovered matchup: **Thommy–Tony 2017 Week 1, 119 points**. Historical rounded/integer scoring and scoring format changes must be flagged.
- Career top-three scoring losses: Stilly 8, Thommy 7, Stew 6.
- Career bottom-three scoring wins: Stover 8, Thommy 7, Stilly 6.
- Second-highest weekly score finishes: Tony 19, Birch 17, Stilly and Stover tied at 15.
- Most head-to-head meetings within **one point**: Stover–Tony, **three** of their 13 recorded regular-season meetings. Rivalry pair must be unordered and shown once.

## Six-meeting rivalry-win streaks
The following all tie for the provisional mark of **six consecutive head-to-head meetings** won, *not* consecutive league weeks: Birch over Stilly (2018 W12–2022 W9); Mitch over Stilly (2023 W1–2026 W7); Mitch over Stew (2018 W12–2021 W11); Stover over Thommy (2021 W5–2024 W8); Thommy over Kuhl (2023 W1–2026 W7); Tony over Kuhl (2023 W7–2026 W1). A loss or tie breaks the run. Do not confuse Thommy with former Schermerhorn.

## Points-against / schedule-luck caution
Highest completed-season raw **PA/game** in recovered paired matchups: Thommy 2021 **126.14** (1,766.00 in 14); **Stover 2019 124.43** (1,617.60 in 13); Koble 2019 123.32 (1,603.20 in 13); Thommy 2020 123.17 (1,724.40 in 14); Scott 2024 121.86 (1,705.98 in 14). The earlier *most total PA* list and the *PA/game* list are different and should not be presented as the same ranking. Most importantly, PA/game across changing PPR/scoring eras is descriptive rather than era-normalized.

## Required verification and implementation steps before production
1. Confirm upstream provider finality of 2026 Week 9. Freeze a source checksum and season coverage date; do not assume the word “staged” means final.
2. Verify weekly participation and byes from source, especially 2020/2021 Week 14. Recompute leaderboards including correctly documented scored byes if applicable.
3. Reproduce a sample of all record types from original ESPN 2016–2019 and Sleeper 2020–2026 matchup receipts, not only the two derived ledgers.
4. Add deterministic regression fixtures for tied first, tied second, tied last, 2016 eight-team, 2020/2021 byes, consecutive rivalry *meetings*, 2019 scoring format, manager identity, and 2026 Week 9.
5. Build a versioned registry with stable category IDs, scope, provenance, competition rank and complete shared-holder arrays. Separate manager-positive trophy cases from negative shame marks.
6. Update the live Record Book and **every** manager portfolio from the **same** registry after canonical + mobile Chromium/WebKit + visual gates succeed.
7. Never conflate 2016–2019 ESPN records, 2023 Evans roster ownership, current Thommy (source key Tom), and former Schermerhorn.
