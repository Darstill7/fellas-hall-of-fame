# Original stored Sleeper matchup receipts — 2020–2021 audit
**Research dated November 11, 2026.** Local historical exports, not a new live Sleeper API fetch.

## Reconciliation results
Rechecked every pairing in `data/sleeper_matchups_2020.json` and `data/sleeper_matchups_2021.json` against `data/unified_record_book_2016_2026.json`, using explicit historical provider-handle-to-manager mappings. All 28 regular-season weeks and **138 paired matchups** match the stored raw export by matchup participants and both exact scores. No divergence was found.

| Season | Weeks | Paired matchups | Week 14 matchups | Scored managers in W14 | Recorded byes |
|---|---:|---:|---:|---:|---|
| 2020 | 14 | 69 | 4 | 8 | Birch, Mitch |
| 2021 | 14 | 69 | 4 | 8 | Birch, Tony |

The export's Week 14 lists **four real contests**, not a malformed five-contest week. The two recorded bye managers are absent from the scores, and their absence exactly agrees with the canonical `confirmedByes` table. There are no other incomplete scored weeks in these two raw-export seasons.

## Week 14 scoring-title implications
| Season/week | Highest scored team among 8 recorded participants | Lowest scored team among 8 recorded participants |
|---|---|---|
| 2020 W14 | Thommy, **151.32** | Stew, **97.64** |
| 2021 W14 | Evans, **162.04** | Koble, **73.32** |

These eight-person marks are verifiable from the stored weekly matchup receipts, **but should not automatically be called league-wide records with all ten franchises in scope**. An explicit eligibility ruling is necessary: either allow a weekly scoring crown over active scored teams with bye weeks excluded (and update *all* historical weekly rankings using that rule), or require a full 10-team scored field and disclose the excluded weeks. Do not fabricate scores for the bye managers.

## Prior rankings affected
The earlier preliminary career weekly-high leaderboard (Mitch 22, Birch 16, etc.) omitted both Week 14 crowns. If the league adopts the eligible-scored-participants rule, **Thommy adds one 2020 weekly title; Evans adds one 2021 title**. The earlier low-scoring leaderboard would also add **Stew 2020 W14** and **Koble 2021 W14**. Derived season records and streaks should then be recomputed. These are conditional changes only: **no official titles have been awarded or production values modified**.

The source-basis test was committed as `scripts/verify-2020-2021-sleeper-receipts.mjs`. It checks all 138 matches, explicit byes, manager identities, exact scores, and high/low scores directly from the raw copies. This is an independent *data-layer* comparison to a different repository file; the two may still share original provider ancestry, so it is **not provider-side finality certification**.

## Recommend for formal record definition
Adopt **“weekly high score among scored participants”** with a displayed participant count (8 or 10) and an automatic **BYE-WEEK FIELD** annotation on 2020/2021 Week 14. This aligns scoring records with actual matchups without manufacturing results, but requires commissioner approval to become the historical record-book rule.

Retain a distinct **“complete ten-team scoring week”** scope for the cleanest cross-week all-play comparison where there is no scoring outcome for the two byes. Never count a bye as a fantasy-score zero, an all-play loss, or an ordinary paired game. All-play expected wins and weekly scoring titles therefore can have intentionally different eligibility rules, clearly labeled.

## Remaining risks
2016–2019 ESPN provenance and 2026 Week 9 original upstream finalization have not been newly verified in this audit. The historical score format changed; compare raw numbers descriptively, not as era-normalized scoring quality.
