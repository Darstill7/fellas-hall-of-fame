# The Fellas — 2021 Birch–Thommy and 2023 Birch–Stew trade value: playoff and package audit

**Checkpoint:** November 16, 2026. **Research only:** actual scoring and pairings, not causal net trade improvement, manager ratings, or championship attribution.

## 2023 Birch–Stew: Lamb/Gainwell for Pollard/Smith-Njigba

**Trade completed:** October 12, 2023, Week 6, transaction `1018289561511682048`.

- Birch acquired **CeeDee Lamb and Kenny Gainwell**; Stew received **Tony Pollard and Jaxon Smith-Njigba**.
- Strictly subsequent Week 7–14 *credited starter* points from the entire acquired package: Birch **163.10** (all from Lamb; Gainwell contributed zero credited starts), Stew **47.90**.
- **Weeks 15–17 additional started points:** Birch **73.00** (Lamb 15.10 in W15, 23.20 in W16, 34.70 in W17); Stew **29.60** (all Smith-Njigba: 12.80, 9.10, 7.70).
- Observed credited starter production from the exchange across Weeks 7–17: Birch **236.10**, Stew **77.50**. Raw production margin is **+158.60** toward Birch. This is **not** trade-added points or an estimate of head-to-head advantage; two-player packages and different positional baselines are not interchangeable.
- **Actual 2023 Week 15 matchup:** Birch roster 10 **lost 105.06–146.36 to Stilly roster 1**; Stew roster 4 **lost 72.14–128.42 to Thommy roster 3**. Thus Birch's Week 16 and 17 Lamb starts **must not be characterized as championship-winning or continued winners-bracket performance**. They are scored postseason-week matches, some after elimination.
- **Actual Week 16 matchup:** Birch roster 10 recorded a **136.52–69.34** victory over roster 2; 2023 roster 2 ownership mapping is a separate commissioner correction and should be verified before displaying the counterparty name. Stew roster 4 lost **125.30–148.16** to roster 9.

### Upstream CeeDee ownership chain

**2023 Week 3:** Stew acquired CeeDee Lamb + Travis Etienne Jr. in a three-for-two exchange with Kuhl, who acquired James Conner, De'Von Achane and Puka Nacua. Stew started Lamb for **19.70** across the strictly interior Weeks 4–5, then transferred Lamb to Birch in Week 6. Etienne remained with Stew for longer, credited **116.90** started points in strictly interior Weeks 4–10 (six starts) before the Week 11 transaction transferring Etienne to Tony. Neither upstream package nor Birch's receipts can be treated as a separate independent profit without accounting for the entire trade chain.

**Interpretation:** Birch received compelling observed fantasy production, but the actual Week 15 result and the incomplete 2023 alternative lineup reconstruction block any claim that Lamb caused a championship or supplied +158.60 *net* team points.

## 2021 Birch–Thommy: Lamar/Andrews/Jacobs for Prescott/Fant/Gibson

**Trade completed:** August 31, 2021, Week 1, transaction `738428315181928448`.

- Birch acquired **Lamar Jackson, Mark Andrews and Josh Jacobs**.
- Thommy acquired **Dak Prescott, Noah Fant and Antonio Gibson**.
- Post-trade **Weeks 2–14 credited starts**: Birch **501.68** points versus Thommy **323.72**; observed Birch edge **+177.96**. This is not a net causal win/loss.
- Additional **Weeks 15–17 actual starters**: Birch **103.80** (Andrews 66.00, Jacobs 37.80, Lamar 0.00 credited starting points), Thommy **61.92** (Dak Prescott in starting lineup; Fant on bench, Gibson not started).
- Across strictly-later **Weeks 2–17**, acquired-package starter credits: Birch **605.48**, Thommy **385.64**; raw observed margin **+219.84**, **not** proof of trade profit.
- **Actual Week 15 matchups:** Birch **lost 96.28–109.02** to roster 2; Thommy **lost 84.68–107.70** to Mitch roster 6. Birch played subsequent Weeks 16/17 but that is not by itself winners-bracket advancement.
- Josh Jacobs was acquired by Thommy **the previous day** via Tony's August 30 deal, then sent out to Birch before any credited Thommy starts. He was one of three outgoing pieces with Lamar and Andrews; Thommy's new Prescott/Fant/Gibson package cannot be assigned solely to Jacobs.

### Intervening moves

The 2021 August 30 Tony–Thommy trade is a **dependent upstream asset acquisition** for the August 31 Birch transaction. A hypothetical reversal of either cannot legally preserve the other without explicit new counterpart assumptions. **Do not add the entire benefits of both transactions to Thommy's record as two independent asset gains.**

## Audit and reproducibility

- Transaction packages and player IDs cross-checked against completed Sleeper Week 1 2021 and Week 6 2023 trade receipts. Verified IDs: 2021 Jacobs `5850`, Lamar Jackson `4881`, Mark Andrews `5012`, Dak Prescott `3294`, Noah Fant `5857`, Antonio Gibson `6945`; 2023 CeeDee Lamb `6786`, Kenny Gainwell `7567`, Tony Pollard `5967`, Jaxon Smith-Njigba `9488`.
- Regular-season acquired starter points sourced from archived audit's **weeks strictly after trade through Week 14**. Historical per-player starting-score extracts corroborated in `data/player_starts_2021.json` and `data/player_starts_2023.json`.
- 2021 and 2023 Weeks 15–17 lineup points obtained from historical Sleeper roster reads, and 2021/2023 Week 15/16 matchups obtained from provider matchup records.
- The source **[two major trades postseason scoring extension](../data-integrity/trade-2021-2023-playoff-extension-v1.json)** records the event-specific actual starter production.

## Publication readiness

- **Verified & editorial-safe:** exact trade receipts, player IDs, regular season started points, Weeks 15–17 started points, Week 15 documented losses, 2023 Lamb pre-Birch trading history.
- **Restricted to research:** no-trade lineup differences, financial/FAAB marginal value, incremental wins, win-win classification, manager 0–100 scores, best/worst all-time rank or championship impact.
- **Next analytical requirement:** reconstruct contemporaneous roster replacement options and all dependent trades *at the decision timestamp*, instead of maximizing posthoc lineups and preserving moves that would have been impossible after undoing an upstream transaction.
