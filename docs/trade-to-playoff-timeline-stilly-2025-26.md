# Trade-to-Playoff Timeline — Stilly's 2025–2026 Chase–Amon-Ra asset chain

**Research checkpoint:** November 16, 2026. **Publication:** Draft PR #234 only. This case study reports completed trade receipts, actual paired matchups, and 2026 keeper draft selections; it does not assert that a trade caused a win.

## Six documented milestones

| Order | Stage | Original evidence |
|---:|---|---|
| 1 | **2025 September 23:** Stilly acquires Ja'Marr Chase and Chase Brown from Stew, sending Jahmyr Gibbs and RJ Harvey | Sleeper trade `1276026193660899328` |
| 2 | **2025 November 12:** Stilly transfers Chase to JMid and A.J. Brown to Thommy in a three-manager exchange; Stilly receives Amon-Ra St. Brown, Jared Goff, Jordan Addison | Sleeper trade `1294402688213057536`, direction corroborated by prior roster snapshots |
| 3 | **2025 Week 15:** Stilly beats Kuhl **122.12–122.00**. Starting acquired players Amon-Ra (35.90) and Goff (25.52) combine for **61.42** | Final Sleeper matchup, Stilly Week15 starting roster |
| 4 | **2025 Week 16:** Stilly beats JMid **126.76–100.46**. Starting acquired players Amon-Ra (7.40) and Goff (26.46) combine for **33.86** | Final Sleeper matchup, Stilly Week16 starting roster |
| 5 | **2026 keeper draft:** Stilly keeps Amon-Ra in **Round 1, pick 8**; JMid keeps Chase in **Round 1, pick 4** | 2026 keeper research and draft receipts |
| 6 | **2026 October 7:** Stilly reacquires Chase and Devaughn Vele from JMid, sending Davante Adams, George Kittle and Breece Hall | Sleeper trade `1413584172332654592` |

**No double-counting:** The earlier Chase acquisition and its subsequent conversion to Amon-Ra are discrete decisions; starting points after the November transaction are attributed to actual team-week lineups, not fully credited as a profit from September. The Week 15 margin does not mean a hypothetical team without the trade would have lost. The team might have constructed a different lineup.

**Keeper economics:** Round 1 picks 4 and 8 are *2026 selections actually used*, not a 2027 price or a free keeper. A player changing hands in October 2026 does not retroactively change JMid's 2026 first-round selection cost.

**Playoff precision:** Weeks 15–16 are verified final paired matchups. Exact championship-bracket labels are intentionally not inferred from pairing data alone.

## Feature integration

- `data-integrity/trade-to-playoff-timeline-stilly-2025-26-v1.json`: six normalized milestones with matchup scores, starter points, keeper receipts and 3 transaction-ID anchors.
- `managers/trade-explorer.html`: responsive, linked timeline for all three related trade case files. Events with a transaction ID open the respective case file; keeper picks and final matchups are narrative steps.
- `managers/trade-portfolios.html`: an entry point in Stilly's featured story to open the three-manager transaction and the six-stage timeline.
- `scripts/test-browser-release.mjs`: real Chromium/WebKit checks for six steps, 2025 results, two keeper selection costs, the 2026 Chase-return link, and portfolio discovery.

**Validation:** Source-level semantic checks do not certify visual layout, live data fetching or release gates. Merge requires fresh successful canonical, Chromium and WebKit tests and screenshot inspection. The 2026 Week 10 season remains unfinished.
