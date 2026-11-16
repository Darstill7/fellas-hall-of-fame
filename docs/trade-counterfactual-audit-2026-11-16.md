# Five historic trades — first matched-roster counterfactual audit

**Research checkpoint:** November 16, 2026. **Classification:** exploratory hindsight sensitivity, **not** a causal win/loss, accepted no-trade lineup, official Trade Rating, complete five-deal grade, or website release.

## What was actually completed

Historical Sleeper weekly starter + bench roster snapshots were obtained for **44 manager-week observations** covering **five** selected transactions (four two-manager cases and one three-manager case), in four selected weeks per transaction. The first-pass procedure could produce a **complete observed-player coverage snapshot for 29 manager-weeks**. **15 manager-weeks** were explicitly withheld because at least one originally surrendered asset could not be found on the original recipient's matching-week roster (typically because of later trades, drops or roster changes).

The status `illustrative_complete_snapshot` means **all originally surrendered players were found in the sampled receiving-side weekly roster and a legal nine-player slot assignment could be filled**. It **does not** establish that those same players would have been rostered in the imagined no-trade world or that alternative waiver/draft/keeper decisions would have been the same.

## Precise method

For each sampled manager-week:

1. Extract actual Sleeper historical weekly starter, bench and supplied reserve players with their **actual points scored that week**. This improves on the previous starter-only comparison, but historical roster availability is not a transaction-by-transaction player-ownership proof.
2. Find the **retrospective highest-scoring lineup** allowed by nine roster slots: QB, RB, RB, WR, WR, TE, FLEX, FLEX, DEF. FLEX can be RB, WR or TE.
3. Construct a **stylized trade reversal**, removing originally received players still held from the observed roster, adding surrendered players with their points taken from contemporaneous recipient-team roster snapshots if found, and then optimizing the same nine slots.
4. Compute **actual-roster best lineup minus hypothetical-roster best lineup** only if every originally surrendered player was found. Missing player scores are **never entered as zero**.

**Critical limitations:** hindsight ceilings can overstate foresight; the alternative doesn't re-run waivers or later trades, injuries, roster cut rules, keeper choices, available draft slots, or the entire season of decisions. A negative or positive weekly difference is **not** a trade's causal impact, and weekly ceiling differences must not be casually added as official points gained. The 2025 three-way transaction is evaluated with independent three-party reversals, not forced into a bilateral exchange. Weeks sampled are not random, and the sample cannot justify all-time league rankings.

## Complete-snapshot counts by transaction

| Transaction | Sampled manager-week observations | All required surrendered players present | Withheld incomplete |
|---|---:|---:|---:|
| 2025 Stilly–Stew (Chase/Brown ↔ Gibbs/Harvey) | 8 | 6 | 2 |
| 2024 Stilly–Thommy (McLaurin/Achane/Dell ↔ CMC/Diontae/Higgins) | 8 | 6 | 2 |
| 2023 Stew–Birch (Pollard/JSN ↔ Lamb/Gainwell) | 8 | 4 | 4 |
| 2021 Tony–Thommy (three players per side) | 8 | 2 | 6 |
| 2025 Stilly–JMid–Thommy three-way | 12 | 12 | 0 |
| **Total** | **44** | **30** | **14** |

**Reconciliation note:** counts above must be checked against the three machine-readable sampledRows sources before presenting as official. Use the auto-recomputed totals from source, not manually entered summary rows, if a mismatch exists.

## Highlighted measured cases (hindsight ceilings, points)

### 2025 Stilly vs Stew: September 23 trade
Stilly received Chase + Chase Brown; Stew received Gibbs + RJ Harvey. Sampled **actual-best minus rollback-best**:

- Week 4: Stilly **−11.90**, Stew **+19.10**.
- Week 8: Stilly **+11.30**, Stew **−9.00**.
- Week 12: Stilly **−38.90**; Stew withheld because Chase was no longer found on Stilly's contemporaneous roster after a subsequent transfer.
- Week 16: Stilly **+2.00**; Stew withheld for the same asset-coverage issue.

**Do not conclude** the deal is win-win or that the Week 12 delta would have happened in a no-trade universe: Chase's subsequent November three-team trade changes ownership chains.

### 2023 Stew vs Birch: October 12 CeeDee Lamb exchange
Week 7: Stew **+6.70**, Birch **+0.90**. Week 9: Birch **+9.30**, Stew withheld because Gainwell not observed on Birch's same-week roster. Weeks 11 and 14 have additional missing counterpart assets. Under a conservative rule, **four of eight manager-week observations were withheld**. The strong starter-only Lamb positional surplus is a lead, **not** a completed counterfactual verdict.

### 2024 Stilly vs Thommy: September 24 trade
Week 4: Stilly **−2.90**, Thommy **+3.10**. Week 8: Stilly **+18.40**, Thommy **−22.30**. Week 12: Stilly withheld missing Diontae; Thommy **−27.10**. Week 16: Stilly withheld missing CMC and Diontae; Thommy **−25.60**. Thommy's **actual 2024 title** and previously documented Higgins championship-game production must remain a separate realized playoff storyline; a hindsight lineup ceiling is not the championship counterfactual.

### 2021 Thommy vs Tony: early-season six-player trade
Week 2: Thommy **+1.60**, Tony withheld (Josh Jacobs missing from sampled recipient roster). Week 6: Thommy **−15.50**, Tony withheld (same missing player). Weeks 10 and 14: both managers withheld due to missing original receiving-side assets. **Only two of eight** sampled manager-week comparisons can be modeled with full documented counterpart assets.

### 2025 Stilly/JMid/Thommy three-way
Week 15 specifically: Stilly's observed-roster hindsight optimal lineup **138.62** versus stylized reversed roster **97.90** (difference **+40.72**); JMid **152.00 vs 169.70 (−17.70)**; Thommy **167.96 vs 179.02 (−11.06)**. This **does not** imply a guaranteed Week 15 win/loss difference: actual Stilly–Kuhl playoff score was **122.12–122.00**, and decision-making used actual managers' selected lineups rather than perfect-hindsight alternatives.

For the three-way sample, full week 12/14/15/16 values and independent per-manager scores are in `data-integrity/trade-counterfactual-three-way-snapshot-v1.json`. JMid's later Chase keeper and October 2026 asset trade need independent valuation.

## Required next scientific step

1. Build **transaction-time pre-trade roster snapshots** and deterministic owner IDs for every original asset (including zero starters and bench-only outcomes); account for same-week lock timing.
2. Track **later acquisition lineage** and rerun every post-trade season step to avoid impossible hypothetical possession of the same player across multiple branches.
3. Compare actual started-lineup results and legally available **pre-game** roster choices, not perfect-hindsight optimal lineups alone. Use the hindsight model solely as a sensitivity bound.
4. Add verified FAAB account budgets, receipt/spend downstream opportunities, keeper round/availability, and actual postseason advancement. The two $5 FAAB-for-player trades require an exchange-specific model.
5. Once the provider and provenance coverage passes, build independent manager benefit estimates with uncertainty, allowing all-win or all-loss outcomes; only then propose 0–100 manager grades with 50 as calibrated neutral.

**Evidence files:**
- [2023 and 2025 two-party samples](../data-integrity/trade-counterfactual-two-case-snapshot-v1.json)
- [2021 and 2024 two-party samples](../data-integrity/trade-counterfactual-second-two-case-snapshot-v1.json)
- [2025 three-manager sample](../data-integrity/trade-counterfactual-three-way-snapshot-v1.json)
- [44 historical trade receipts and FAAB correction](../data-integrity/trade-benefit-evidence-ledger-2026-11-16.json)

The full 44-trade ledger is a transaction **inventory**; this matched-roster research is intentionally a much narrower analytical subset. Do not claim that all 44 trades have no-trade values.
