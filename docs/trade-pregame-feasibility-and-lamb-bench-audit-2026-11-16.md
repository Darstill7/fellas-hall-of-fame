# The Fellas — Pregame Availability Gate and Birch's 2023 CeeDee Lamb Bench Sensitivity

**Research checkpoint:** November 16, 2026. **NOT a league standing revision or a certified trade-value estimate.**

## Question

How much additional scoring did Birch's **actual WR starter CeeDee Lamb** provide compared with the **best available WR already on Birch's own weekly bench**, and would substituting that player—*without changing any other lineup selection*—alter a recorded matchup?

This is a deliberately narrower question than “what if the 2023 Week 6 trade never happened?” It does not add back Tony Pollard or Jaxon Smith-Njigba, change the rest of the roster, or predict what a manager would select before kickoff.

## Source and pregame limitation

Direct Sleeper historical team roster snapshots expose `starters[]`, `bench[]`, player IDs/positions and each player's **actual fantasy points**. They do **not** expose a contemporaneous archived **pregame player projection** in the inspected response. Therefore this is a *retrospective points comparison*, not an ex ante decision-quality score. There are no estimated forecasts or made-up player-projection inputs.

The recorded starter ordering used here assigns Birch's Lamb to a required WR position, so bench substitutes must be WRs. Every other starting slot and the actual opponent score are held fixed. Bench players' postgame scores are used to choose the highest-scoring eligible observed substitute. This favors hindsight relative to an actual pregame pick.

## Seven weeks of observed WR-bench alternative evidence

| Week | Lamb's actual starter points | Highest eligible observed bench WR | Slot surplus | Actual Birch matchup | Single-slot hypothetical |
|---|---:|---|---:|---|---|
| **8** | 35.00 | Diontae Johnson 12.50 | **+22.50** | Won **138.16–119.32** over roster 6 (Mitch) | **115.66–119.32**, hypothetical **loss** |
| **9** | 22.60 | Diontae Johnson 18.50 | **+4.10** | Lost **95.66–108.08** vs roster 2 | **91.56–108.08**, hypothetical loss |
| **10** | 34.00 | Diontae Johnson 2.20 | **+31.80** | Won **170.26–138.36** vs roster 5 | **138.46–138.36**, hypothetical **win by 0.10** |
| **11** | 13.50 | Elijah Moore 9.00 | **+4.50** | Lost **96.66–135.24** vs roster 3 | **92.16–135.24**, hypothetical loss |
| **12** | 15.30 | Diontae Johnson 7.00 | **+8.30** | Won **136.74–102.90** vs roster 9 | **128.44–102.90**, hypothetical win |
| **13** | 26.60 | Diontae Johnson or Elijah Moore 11.30 (tie) | **+15.30** | Won **122.66–95.88** vs roster 7 | **107.36–95.88**, hypothetical win |
| **14** | 16.10 | Diontae Johnson 13.20 | **+2.90** | Won **105.44–71.54** vs Stew roster 4 | **102.54–71.54**, hypothetical win |

The seven illustrative WR-slot advantages sum to **+89.40**, but this aggregate must **NOT** be called additional trade-produced points, wins above replacement, player WAR, or a counterfactual season total. A mathematical sum of hindsight bench deltas is descriptive only.

**One of seven** matchup outcomes flips under the restricted comparison (2023 Week 8). In 2023 Week 10 Birch's conditional win shrinks to **0.10**; it does not flip. Week 7 is excluded because Lamb did not start (he was on Birch's recorded bench with 0 points).

## The more difficult genuine no-trade question

The Week 6 trade moved **CeeDee Lamb + Kenny Gainwell** to Birch and **Tony Pollard + Jaxon Smith-Njigba** to Stew. If it had not occurred:

- Birch would have had some combination of Pollard, Smith-Njigba and other assets, not precisely his actual post-trade bench; roster limits/waivers could differ.
- Stew would have retained Lamb and Gainwell, with their original use and other roster choices subject to lineup and waiver decisions.
- Subsequent released/waived assets and potential bye/injury substitutions must be reconstructed at each event. Intervening transfer records are strong for selected player IDs, but not an exhaustive no-trade decision graph.
- A legal pregame prediction requires a documented **as-of timestamp** with available candidates and projection/expected-value data. Neither the archived Sleeper starter+bench points nor the sampled GitHub snapshots supply such pregame forecasts. **Keep the causal benefit null.**

This means the Week 8 hypothetical flip is evidence that Lamb made an *important observed* contribution under a restricted scenario, not proof that Birch gained one actual win from the 2023 trade.

## 2021 Birch–Thommy related caveat

The Aug 31 2021 trade sent **Lamar Jackson, Mark Andrews, Josh Jacobs** to Birch and **Dak Prescott, Noah Fant, Antonio Gibson** to Thommy. Thommy had acquired Jacobs in a separate transaction with Tony **one day earlier**. Antonio Gibson was later traded again in **2021 Week 6**. A consistent no-trade season cannot preserve those subsequent moves while independently undoing the original transaction. Earlier 2021 W2/W5 fixed-core comparison is a legitimate *hindsight scenario* but does not validate all the manager's future choices; W6 onward is additionally dependent on the Gibson transfer.

## Data and next action

- [2023 seven-week bench sensitivity](../data-integrity/trade-birch-lamb-2023-bench-only-weeks8-14-v1.json)
- [Two original fixed-core trade comparisons](../data-integrity/trade-fixed-core-lineup-replacements-v1.json)
- [Conditional historical matchup variations](../data-integrity/trade-fixed-core-conditional-matchups-v1.json)
- [Provider repeat asset audit](../data-integrity/trade-repeat-chain-provider-gaps-v1.json)

**Research priorities:** (1) timestamped full ownership state and waiver decision dependencies; (2) historical pregame forecasts or documented expectations, which may not be recoverable; (3) an evidence-bounded range of plausible legal decisions without invented expectation data; (4) uncertainty-centered independent benefit scores only when comparators exist.

**DO NOT** add +89.40 or the hypothetical win/loss flips to official trade ratings or record books. This research is on draft PR #234, not deployed.
