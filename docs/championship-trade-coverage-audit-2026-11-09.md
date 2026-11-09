# Championship transaction coverage — source-backed audit
**Research date:** November 9, 2026  
**Source:** `data/v9_trade_engine.json` transaction sides, checked against `data/championship_season_stories_2016_2025_v1.json` and `data/season_guide.json`.

This is an **inventory of archived transaction receipts**, not a verdict that any trade caused a championship. Archive completeness is not independently established. The champion's trade side lists **assets received**, not assets sent. Do not invert the direction.

## Champion-trade coverage (2020–2025)
| Season | Champion | Distinct archived trades involving champion | Already linked in championship story | Unlinked |
| --- | --- | ---: | ---: | ---: |
| 2020 | Koble | 0 | 0 | 0 |
| 2021 | Tony | 4 | 4 | 0 |
| 2022 | Stover | 0 | 0 | 0 |
| 2023 | Stilly | 1 | 1 | 0 |
| 2024 | Thommy (archived as Tom) | 5 | 2 | 3 |
| 2025 | Scott | 0 | 0 | 0 |

**Important:** No transactions in an archived model does *not* prove there were no actual trades. The 2016–2019 ESPN-era transactions are not represented by this Sleeper trade dataset.

## 2024 Thommy — three additional verified transactions to investigate

| Date | Trade ID | Thommy received | Archive confidence | Currently linked? |
| --- | --- | --- | --- | --- |
| 2024-09-10 | `1139340571111256064` | Tank Dell | verified | No |
| 2024-10-01 | `1146946436173623296` | Mark Andrews; Rico Dowdle | verified | No |
| 2024-10-17 | `1152708228883660800` | Travis Kelce; Brandon Aiyuk | verified-recordbook | No |

The 2024 championship story already links transaction `1144362000575840256` (received Christian McCaffrey, Diontae Johnson and Tee Higgins on September 24) and `1146947320588861440` (received Jordan Love on October 2). Those links match the archived transaction model.

**Editorial next step:** Reconcile each additional asset to the original receiver's verified weekly starting lineup, postseason roster and scoring, then decide whether the trade materially belongs in a turning-point paragraph, a supporting receipt list, or neither. Do **not** call a player the title MVP without documented postseason attribution. The archive identifies Thommy as `Tom`; never interpret him as a different manager.

## Other championship-season provenance checks

- **Tony 2021:** Four archived champion-side trades, and all four IDs are linked from the existing article. The assets received were Corey Davis/A.J. Brown/Jonathan Taylor (Aug 30), Joe Mixon (Oct 5), CeeDee Lamb (Oct 13), Kyle Pitts Sr. (Oct 27). Verify any claimed post-trade playoff impact against actual starting-lineup records.
- **Stilly 2023:** One archived champion-side transaction, dated October 26, ID `1023059879336013824`. Stilly **received Mike Evans and Derrick Henry**; Tony received Cooper Kupp. Any keeper history and later Ja'Marr Chase transaction belong to their actual later years. The 2023 Evans manager seat belongs to Evans, not JMid.
- **Koble 2020, Stover 2022, Scott 2025:** No champion-side trade transaction appears in this model. Their articles should not imply zero trades occurred across all possible sources, and their championship journeys should be researched from verified lineups and bracket scores.
- **2016–2019:** Do not invent transaction IDs or player-specific playoff MVPs from unavailable ESPN source details.

## Publication gate for any new championship claim
1. Reconcile exact trade ID, date, both sides and historical owner.
2. Confirm credited starts and scores after the deal, excluding bench/post-trade attribution errors.
3. Validate playoff opponent, margin and final score from independent bracket sources.
4. Phrase causality as analysis supported by facts rather than pretending that the trade alone won the title.
5. Re-run story, transaction, canonical and Chromium/WebKit tests before merge.

**Status:** Evidence documented; no championship prose has been modified by this audit.

## Postseason player-lineup corroboration for 2024

The archived `data/championship_player_boxscores_2020_2025_v1.json` gives two verified Thommy playoff lineups:

- **Travis Kelce**, acquired in the October 17 trade, **started both playoff games**: 5.50 points in the 123.38–121.08 semifinal and **18.40** in the 205.30–114.88 championship. This transaction is a defensible *additional title-game contribution* to mention alongside Higgins and Love.
- **Tee Higgins**, acquired September 24, scored **15.80 semifinal** and **34.60 final** points.
- **Jordan Love**, acquired October 2, scored **11.48 semifinal** and **14.00 final** points.
- **Tank Dell**, **Mark Andrews**, **Rico Dowdle** and **Brandon Aiyuk** do not appear in the verified Thommy semifinal or championship **starting lineups**. This is not proof they never contributed during the regular season, and they should not be presented as title-game starters.

The above is sourced playoff impact only, not an adjusted trade ROI or counterfactual claim that the championship would have been lost without a particular transaction.
