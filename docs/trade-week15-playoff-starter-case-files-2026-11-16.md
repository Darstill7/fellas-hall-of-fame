# Trade Museum: Week 15 Starter Receipts and Verified Matchup Results

**Checkpoint:** November 16, 2026 · **Release:** research-only, draft PR #234

## What the source supports

Four source-verified historical Week 15 case files connect a completed trade, received players in a recipient manager's *actual starting lineup*, and a *final paired team matchup* returned by Sleeper.

| Source trade | Season | Recipient | Verified final pairing | Result | Acquired starter points |
|---|---:|---|---|---|---:|
| Nov 12 2025 three-manager deal | 2025 | Stilly | Stilly 122.12, Kuhl 122.00 | Won by 0.12 | 61.42 (Amon-Ra St. Brown 35.90, Jared Goff 25.52) |
| Aug 31 2021 Birch–Thommy | 2021 | Birch | Birch 96.28, roster 2 109.02 | Lost by 12.74 | 42.50 (Mark Andrews 31.60, Josh Jacobs 10.90) |
| Oct 12 2023 Birch–Stew | 2023 | Birch | Birch 105.06, Stilly 146.36 | Lost by 41.30 | 15.10 (CeeDee Lamb) |
| Nov 8 2023 Stilly–Thommy–Stew | 2023 | Thommy | Thommy 128.42, Stew 72.14 | Won by 56.28 | 40.20 (Davante Adams 20.10, Gus Edwards 13.40, Tony Pollard 6.70) |

**Important:** Week 15 is a postseason-calendar week, but the presence of a final pairing alone does not establish its exact playoff bracket status, rounds, or championship implications. Some Sleeper years contain unpaired roster records; absent opponents are never inferred.

**Not a causal test:** A received player contributing 61.42 points to a 0.12-point victory is an important *observed* participation, but not proof the trade caused the victory. In the no-trade alternative, the recipient might have had other players, roster changes and a different starting lineup. Do not rank a manager based on counting these as wins gained.

## Implementation

- `data-integrity/trade-postseason-starter-impact-four-cases-v1.json`: each verified paired Week 15 outcome, source manager, starter breakdown, scored margin and caveats.
- `managers/trade-explorer.html`: source-backed “What happened in Week 15” section appears for matching trades, with final score, recipient starter contributions, source context, and non-causality warning.
- `scripts/test-browser-release.mjs`: added Chromium/WebKit checks for the 2025 122.12–122.00 result, the 61.42 acquired-player starts, and Birch's 2023 105.06–146.36 loss with Lamb contributing 15.10.

## What is not complete

- No independent alternative-roster model or win probability is validated; no “would have lost without trade” claim.
- No full leaguewide 2020–2025 postseason comparison has been reconstructed.
- Not all Week 15 pairings necessarily reflect championship-bracket games; further bracket evidence is required for stronger language.
- 2026 Week 10 is ongoing at this checkpoint, and no current-week results are certified.
- Browser checks must complete on the latest draft head; source consistency alone is insufficient for public release.
