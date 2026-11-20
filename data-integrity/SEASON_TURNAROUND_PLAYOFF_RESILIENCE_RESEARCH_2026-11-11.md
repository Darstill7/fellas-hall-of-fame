# Season Turnarounds & Playoff Resilience — Deep Historical Research
**Prepared November 11, 2026. Research only, not yet a published historical record.**

## Scope, reconstruction, and confidence
Reconstructs the cumulative **W–L–T record after every completed regular-season matchup** in the recovered `data/season_weekly_matchups_2016_2026_v1.json`, and reconciles official champion, finalist and playoff-berth identity from `data/postseason_records_verified_v1.json` and completed-season manager membership from `data/fellas_final_placements_2016_2025_verified.json`.

- All **10 completed seasons, 2016–2025**, including **98 actual manager-season participations**. 2026 is deliberately excluded.
- 2016 has eight entrants. 2017 onward ten entrants. 2016/2018/2019 regular schedule 13 weeks, 2017 12; later calendar seasons 14 regular weeks.
- **2020 and 2021 have verified Week 14 first-round matchup byes**. A missing paired matchup is **not** a defeat, victory, tie or fantasy score. Some manager regular-season records have 13 games while league calendar has 14 weeks.
- `Tom` in playoff brackets resolves to **Thommy**, never retired Schermerhorn. 2023 results for Evans remain Evans's, not JMid's.
- Every leader below is an internally reproduced reconstruction from existing source artifacts, **not yet cross-verified against each original ESPN/Sleeper historical provider snapshot**. Data is not production-certified.

## 1. Most dramatic losing-record holes survived to reach the postseason

| Manager | Season | Worst cumulative record | Week | Final regular-season record | Official outcome |
|---|---:|---:|---:|---:|---|
| **Thommy** | 2021 | **1–6, five below .500** | 7 | 5–9 | Playoff berth |
| **Stew** | 2025 | **1–6, five below .500** | 7 | 6–8 | Playoff berth |
| Evans | 2021 | 0–4, four below .500 | 4 | 7–7 | Championship runner-up |
| **Stilly** | 2023 | **0–4, four below .500** | 4 | 8–6 | **Champion** |
| Birch | 2023 | 1–4, three below .500 | 5 | 7–7 | Playoff berth |

**Distinct records:** Deepest hole for a playoff qualifier is five below .500, shared **Thommy (2021)** and **Stew (2025)**. Deepest hole for a **championship finalist** is four below, shared **Evans (2021)** and **Stilly (2023)**. Deepest for a **champion** is Stilly's four, an **already recognized legendary-record theme**; do not duplicate it in the final category count.

### Editorial angle
Thommy 2021 and Stew 2025 didn't finish with strong winning records; they **survived** poor starts into the postseason. By contrast, Evans 2021 and Stilly 2023 turned 0–4 beginnings into title-game appearances, with Stilly completing the championship win.

## 2. A precise first-half versus second-half turnaround

Definition: Split by **league calendar midpoint**, not a manager's last recorded matchup. 2016, 2017, 2018 and 2019 use Week 6 as the last first-half week; 2020 onward Week 7. Calculate **(second-half wins minus losses) − (first-half wins minus losses)**.

| Manager | Season | First half | Second half | Improvement | Postseason |
|---|---:|---:|---:|---:|---|
| **Koble** | 2022 | 1–6 | 5–2 | **+8** | Missed playoffs |
| **Stilly** | 2023 | 2–5 | 6–1 | **+8** | **Champion** |
| **Stew** | 2025 | 1–6 | 5–2 | **+8** | Playoff berth |
| Mitch | 2020 | 3–4 | 6–0 (one bye) | +7 | Runner-up |
| Thommy | 2020 | 1–6 | 4–3 | +6 | Missed playoffs |
| Thommy | 2021 | 1–6 | 4–3 | +6 | Playoff berth |
| Birch | 2023 | 2–5 | 5–2 | +6 | Playoff berth |

This yields three **co-holders of the overall +8 season-half differential swing** (Koble 2022, Stilly 2023, Stew 2025), with **Stilly and Stew** co-holding best comeback by an eventual **playoff qualifier**. Stilly alone holds this metric among championship finalists and champions.

**Crucial correction to prevent mislabeling:** Six second-half wins are **not** automatically a +6 turnaround. Calculate two half-season *net* records first. An earlier exploratory calculation inadvertently labeled all second-half net victories as the swing; use the precise formula above and lock it in regression tests.

## 3. Streaks of resilience versus winning momentum

- **Longest losing streak still followed by a playoff berth:** **Stew 2025 — five straight regular-season losses.** Started 1–6 after Week 7, went 5–2 over the final seven games and qualified at 6–8.
- **Longest regular-season winning streak by an eventual finalist:** **Mitch 2020 — seven straight wins**, finishing 9–4 and reaching the championship game. The missing Week 14 pairing was a confirmed bye, **not** an additional win.
- **Perfect second half by a qualifier:** **Mitch 2025 — 7–0** after Week 7. Other notable unbeaten second halves: Mitch 2020 **6–0** (Week 14 bye); Birch 2021 **6–0** (Week 14 bye).
- **Most wins over the final four played regular-season games by an eventual champion:** **Birch 2019** and **Stilly 2023**, both **4–0**. These refer to the final four *played* games, not necessarily identical NFL weeks.
- **Most defeats in the final four regular-season games while still reaching the final:** **Thommy 2025 — four straight losses**, then advanced to the championship game and finished runner-up. This is a strong editorial **postseason resilience** category; the regular-season slide should not be described as a playoff losing streak.
- **Most wins after falling at least four games below .500 by an eventual champion:** **Stilly 2023**, winning eight of his remaining ten regular-season contests after opening 0–4. **This metric is intentionally distinct from the already published deepest-hole category.**

## 4. Proposed category registry (14 hypotheses)

| Proposed ID | Distinction | Release warning |
|---|---|---|
| `turnaround-largest-half-swing` | All teams, best half-to-half net-record change | New |
| `turnaround-largest-half-swing-playoff` | Same, official playoff qualifiers only | New |
| `turnaround-largest-half-swing-finalist` | Same, official championship finalists only | New |
| `turnaround-deepest-hole-playoff` | Biggest cumulative losses−wins deficit among playoff teams | **Overlaps existing Legendary record** |
| `turnaround-deepest-hole-finalist` | Biggest hole among eventual finalists | Adjacent to existing finalist-opening-losses category |
| `turnaround-deepest-hole-champion` | Biggest hole among champions | **Already exists; do not count as net-new** |
| `turnaround-loss-streak-playoff` | Most consecutive losses survived by a playoff qualifier | New |
| `turnaround-win-streak-finalist` | Longest regular-season winning streak by a finalist | New |
| `turnaround-most-late-half-wins-finalist` | Most wins after calendar midpoint among finalists | New |
| `turnaround-most-late-half-wins-playoff` | Same among qualifiers | New |
| `turnaround-perfect-second-half-playoff` | Max wins in an undefeated second half (with byes disclosed) | New |
| `turnaround-last-four-wins-champion` | Final four regular-season games by eventual champ | New |
| `turnaround-last-four-losses-finalist` | Final four regular-season losses by eventual finalist | New |
| `turnaround-wins-after-low-point-champion` | Wins after a ≥4-game hole on title path | New but highly specific; editorial over generic record |

These are 14 distinct *candidate definitions*, **not fourteen guaranteed new published categories**. Merge only nonduplicate, independently verified metrics with the shared Record Book; editorial quality and category clarity matter more than count.

## 5. Research implementation and release plan
Source-backed generator: `scripts/build-season-turnaround-records.mjs`.

Run:
```sh
node scripts/build-season-turnaround-records.mjs > /tmp/fellas-turnarounds.json
node scripts/verify-season-turnaround-records.mjs
```

The generator outputs competition ranks (with every co-holder), canonical manager keys, completed-season checks, matchup-by-week evidence, exact midpoint and official postseason classification. It does **not** modify the published Record Book, manager portfolios or championship stories.

Before release:
1. Pass exact-commit deterministic regression tests, then canonical and desktop/mobile visual gates.
2. Cross-check 2016–2019 ESPN weekly scores and 2020/2021 first-round bye receipts (the direct stored Sleeper archive has already been reconciled, but original-provider confirmation remains desirable).
3. Confirm the precise category definitions and flags with the commissioner, especially qualification despite losing record versus *winning record* recovery.
4. Reuse the current 44 categories and previously published 19 Legendary categories by ID; specifically remove the two deepest-hole duplicates.
5. Add the 2023 Stilly, 2025 Stew, 2020 Mitch and 2025 Thommy stories to manager profiles, with archived season/week link receipts.
6. Prefer showing calendar-half participation (`6–0 plus bye`) to treating a bye as a seventh victory.
