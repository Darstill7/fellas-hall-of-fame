# Historical Trade and Draft Source Audit — 2023–2025

**Status: research only. No trade winners, official draft grades or website publication authorized.**

## Source and coverage

| Season | Original Sleeper league ID | Museum trades | Provider-complete trades | Fully reconciled published receiving sides | Source-matched 150 original draft picks |
| --- | --- | ---: | ---: | ---: | ---: |
| 2025 | 1181421235163095040 | 8 | 8 | 17/17 | 150/150 |
| 2024 | 1134248931308802048 | 8 | 8 | 16/16 | 150/150 |
| 2023 | 946275261279055872 | 7 | 8 | 14/14 | 150/150 |

Trade values refer to **post-trade starting lineup PF on the receiving roster**, not total NFL player production or a replacement-adjusted trade winner. Both regular-season Weeks 1–14 and postseason Weeks 15–17 are measured, but **reported separately**.

All 2023–2025 archived receiving-side point totals match Sleeper after postseason attribution. The user-facing Museum should label regular-season and playoff components; its historical combined totals should not be replaced with regular-season-only sums.

## 2023 missing three-team trade (not publishable yet)

Original complete Sleeper transaction `1028057686711058432`, Week 10, 2023-11-08, involves **Stilly (roster 1), Tom (3), Stew (4)**. It is absent from the 2023 Museum's seven published records but documented in `data/v9_1_trade_status.json`.

- **Stilly:** Courtland Sutton, David Montgomery, Jaylen Waddle. Week 11–14 starter PF **95.40**, Weeks 15–17 **67.50**, combined **162.90** across 13 starts.
- **Tom:** Davante Adams, Gus Edwards, Tony Pollard, plus **49 FAAB from Stew** and **Stew's original 2024 fifth-round pick**. Starter PF **106.20** regular + **106.70** postseason = **212.90** across 18 starts.
- **Stew:** DeAndre Hopkins, Amari Cooper, Josh Jacobs and **Tom's original 2024 third-round pick**. Starter PF **60.60** regular + **16.80** postseason = **77.40** across 7 starts.

Original provider raw assets: **9 received player IDs, 9 sent player IDs, 49 FAAB Stew → Tom, two 2024 draft-pick records**. Raw directions, manager mapping and all lineup totals were verified in `scripts/verify-2023-original-three-team-trade.mjs` under draft PR #291. The earlier case study independently matches all nine receiving assets and 2024 pick sides. The current no-draft-pick-trading rule cannot be applied retrospectively to the 2023 trade.

**Missing release work:** commissioner confirmation of all historical conditions and keeper implications; verification of the actual 2024 pick conversion/beneficiary; stable source-reviewed release candidate; conservative comparison method for a 3-party trade that contains future pick and FAAB assets. Do not assign a three-way "winner" by simply comparing PF.

## Draft-performance research

The 2023, 2024 and 2025 original draft IDs matched **all 150 recorded picks per season** and the original drafting manager's regular-season starter PF/starts exactly; zero scoring discrepancies. This is an important validation of the draft engine's actual PF inputs.

Existing pick-grade research is not a permanent career judgment. A separate experimental model compares **realized full-season starter PF from each drafted player anywhere in the league** to medians of nearby-round same-position selections (at least four other picks). This is separated from original-manager captured starter PF: a traded player's later production should not be treated as either a missing pick or a direct trade win.

Draft caveats that still matter:
- In **2025**, 20 selections were flagged as keepers and excluded from the nonkeeper peer benchmark, leaving 130 nonkeeper picks and 13 per manager.
- In **2024** and **2023**, the draft engine flags zero keeper selections, and the historical Sleeper draft feed does not independently establish keeper status. Benchmark these years **provisionally** until keeper-rule/flag provenance is established; do not assume no keeper cost existed merely because the archive flag is false.
- All rankings are *within-season observational return tiers*, never ex ante draft skill or an official all-time GM grade.
- Draft picks traded during the season require trade-receipt cross-links and keeper-continuity tracking before judging manager roster-building performance.
- Historical years must preserve the actual manager: **2023 roster 2 was EvansBrandon, not JMid; 2023 roster 5 was Koble, not Scott.**

## Next source work

1. Audit **2022, 2021 and 2020** transaction ID/recipient ID, post-trade regular/playoff credited starter PF, roster identity and any partial/multi-team trades.
2. Reconcile historic keeper-right and draft-pick ownership as of each season and verify complete original draft selection IDs.
3. Publish two distinct tables only after review: **draft selection return** (performance against original pick/position opportunity cost) and **trade/roster realization** (value captured, plus verified FAAB/picks/keeper implications).
4. Build all-time manager report cards from season-comparable evidence, excluding non-comparable ESPN 2016–2019 missing lineup coverage unless independently verified.
5. Only after each reviewed source is approved, update the Museum using a separate narrow release PR with full canonical/browser checks and Pages parity.
