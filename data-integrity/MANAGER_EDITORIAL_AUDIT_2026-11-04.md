# The Fellas — Manager-by-manager editorial accuracy audit
**Audit date:** November 4, 2026  
**Scope:** 10 current league managers, published profile introductions, title ledgers, all-time regular-season records, selected trade and waiver receipts, and final 2026 Week 8 matchups.

## Findings
- **10/10 profile biographies** match their editorial source copy after fixing JMid's incomplete scoring sentence and expanding Stover's short biography with verified franchise details.
- **10/10 championship histories** match the season guide and career-summary trophy ledgers. Historical former managers are not merged into current managers.
- **10/10 published career records** reconcile with the archived unified game ledger **through 2026 Week 7**. These are accurate for their labeled scope, but not the latest completed week.
- **5/5 Week 8 matchups** are final from the connected 2026 Sleeper league and cover all ten managers. The standalone Week 8 evidence is preserved in `data-integrity/manager-week8-2026-source.json`.
- **19/19 listed trade candidates** have matching verified or verified-recordbook trade sides with matching assets, trade IDs and direct observed edges. These are *selected retrospective outcome candidates*, not proof of decision skill; Scott's biography lists no worst-trade candidate, which must remain unassigned instead of invented.
- **10/10 selected waiver highlights** match a recorded add/waiver transaction, acquisition week, subsequent starts and earned starter points in `data/waiver_award_candidates.json`.

## Current profiles and recovered Week 8 results
| Manager | Verified titles | Career W–L–T through W7 | Final Week 8 | Career if W8 is integrated |
| --- | --- | --- | --- | --- |
| Stilly | 2023 | 65–77 | W vs Birch, 113.58–96.90 | 66–77 |
| Stew | None | 66–76 | W vs Stover, 134.16–79.10 | 67–76 |
| Thommy | 2016, 2017, 2018, 2024 | 67–74–1 | L vs Scott, 106.34–112.56 | 67–75–1 |
| Stover | 2022 | 75–67 | L vs Stew, 79.10–134.16 | 75–68 |
| Birch | 2019 | 72–55 | L vs Stilly, 96.90–113.58 | 72–56 |
| Tony | 2021 | 72–56 | L vs Mitch, 99.30–123.16 | 72–57 |
| Mitch | None | 70–46 | W vs Tony, 123.16–99.30 | 71–46 |
| Kuhl | None | 51–66 | L vs JMid, 82.38–141.68 | 51–67 |
| JMid | None | 24–25 | W vs Kuhl, 141.68–82.38 | 25–25 |
| Scott | 2025 | 16–19 | W vs Thommy, 112.56–106.34 | 17–19 |

**Critical:** The final column is a deterministic reconciliation candidate, **not a newly published canonical statistic**. Do not update profile labels alone. Canonical recomputation must keep the unified record book, season guide, weekly matchup mirror, career summaries, rating consumers and source checks consistent. Week 9 has not started as of this audit.

## Manager-specific editorial notes
- **Stilly:** 2023 champion; recorded 2023 Mike Evans and Derrick Henry trade references have source checks. Keep roster-building interpretations clearly editorial.
- **Stew:** 2022 high-scoring 11–3 season and verified trade archive; do not imply Puka Nacua was a verified trade acquisition solely from the available trade-side data.
- **Thommy (Tom):** 2016, 2017, 2018 and 2024 titles; the former manager Schermerhorn is a different person and must never be merged into this career.
- **Stover:** Original 2016 franchise, 2022 title, 2024 record of 10–4. Biography now has substance comparable to other profiles; the Gurt and YogurtSlingers team names refer to the same franchise.
- **Birch:** 2019 champion after an 11–2 regular season; documented 2018 championship-game appearance. Judgments about drafting and trading are interpretations.
- **Tony:** 2021 champion. Joe Mixon in 2021 and James Robinson in 2022 are supported as trade assets; Zack Moss acquisition type remains unconfirmed in that trade-side source.
- **Mitch:** Verified 2025 regular-season record of 13–1 and 1,894.88 points; no documented title. High-scoring regular seasons alone do not prove a particular managerial method.
- **Kuhl:** No documented championship. The 2024 J.K. Dobbins trade reference is supported, while the 2023 Kyren Williams acquisition route cannot be inferred from trade-side evidence alone.
- **JMid:** 2024 record of 8–6 and 1,730.22 points scored; biography sentence corrected. Recorded Kyren Williams and Calvin Ridley trade references have source support, but James Cook's trade-side status needs separate evidence.
- **Scott:** 2025 champion. Selected retrospective trade/waiver evidence exists; no verified worst-trade candidate should be manufactured.

## Outstanding coverage gaps — do not fill these with zeros
1. **Week 8 is not in the canonical combined career record:** five final matchups are recovered and checked. Regenerate every downstream record and rating consumer together before showing the new career totals as authoritative.
2. **2020 and 2021 regular-season matchup coverage:** the unified record book currently contains 69 games for each year, versus 70 in each of 2022–2025. Investigate these as possible missing games or legitimate schedule irregularities; do not assume a winner or backfill without provider evidence.
3. **ESPN-era player and transaction history (2016–2019):** season records and championships are better verified than historical pickups, trade values, and lineup alternatives. Where no usable ESPN transaction or roster evidence exists, clearly mark a coverage limit rather than a zero score.
4. **Full FAAB decision-quality grades:** the archived award dataset contains selected notable pickups, not every available player or missed opportunity. Individual bid costs require receipt-level provenance and free acquisitions must include both $0 waiver claims and post-waiver free-agent additions.
5. **Start/Sit decision grades:** retrospective roster efficiency is not evidence of pre-kickoff projections, injury eligibility, roster legality and true alternatives. Preserve descriptive percentages; do not assign unsupported skill grades.
6. **Non-final playoff placements and subjective stories:** when no documented bracket finish, historic nickname attribution or transaction type is verified, use explicit qualifying language. Avoid implying missing evidence means a manager missed the playoffs or made a bad move.

## Release criteria
- No missing title, documented career year, or identity mapping for any of the ten managers.
- Reconcile and regenerate Week 8 consistently before changing career records or weekly Legacy OVR.
- Inventory every unknown source field with an explicit **unavailable** or **pending verification** state; never substitute fabricated player values or unsupported outcomes.
- Confirm public nickname-only privacy checks and responsive Chromium/WebKit tests remain green after changes.
- Obtain a real-device mobile review and final editorial approval before broad league sharing.

**Primary source files:** `data/season_guide.json`, `data/manager_record_books_2016_2026.json`, `data/manager_profile_career_summary_v2.json`, `data/manager_biographies_awards.json`, `data/v9_trade_engine.json`, `data/waiver_award_candidates.json`, and `data-integrity/manager-week8-2026-source.json`.

**Automated verification:** `node scripts/audit-manager-editorial-accuracy.mjs`.
