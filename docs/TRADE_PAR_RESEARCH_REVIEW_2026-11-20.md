# The Fellas Trade +/- — research and release audit
**Research checkpoint:** November 20, 2026  
**Pull request:** #276 (draft; unmerged)  
**Interpretation:** Observed post-trade starter production relative to a proposed replacement baseline. NOT trade decision quality or all-time franchise value.

## Research-only source-gated replacement assignment prototype

`scripts/trade-prelock-replacement-engine.mjs` provides a standalone future-input adapter for **prelock** projected points. It verifies a named, versioned projection feed, each substitute's owner and active-at-decision state, ISO as-of prediction time no later than the decision, roster verification time no later than the decision, each bench player's separate game lock, and the vacated starter's exact positional/FLEX slot. A maximum-cardinality, then maximum-projected-points bipartite assignment prevents bench player reuse. Uncovered starter slots remain explicitly **uncovered**, never silently replaced with 0 projection points.

`scripts/test-trade-prelock-replacement-engine.mjs` exercises this protocol with **synthetic inputs only** and intentional rejection of future-dated projections, late roster evidence, missing forecasts, inactive players, locked games and duplicate player IDs. None of the simulated projections or scored outcomes is assigned to historical Fellas athletes or transactions.

**Status:** algorithmic source-contract research, NOT an available 2020–2025 data feed, published WAR, or validated historical trading-skill score. The actual 254 historical observations still lack independently verified decision-time forecasts and roster/health availability.

---

## Decision-time source audit — November 23

The 13 original postseason-clean trade samples provide **254** acquired-player starter observations in preserved historical scoring/roster records. The existing files include stable player IDs, positions, postgame fantasy points and bench assignments. They **do not include independently timestamped pregame projections, game-lock times, historical injury/active-at-lock status, or an as-of snapshot of league ownership and waiver availability** for these 254 player-start observations.

This is a **dataset limitation, not proof such information never existed**. A reliable pregame replacement-level model requires an external archived forecast or decision-time source. The new CI step `scripts/audit-trade-decision-time-provenance.mjs` independently inspects the actual source schema for each observation, confirms the absence of known pregame fields, and blocks any accidental assumption that final bench points were predictive information. The Trade +/- page now explicitly warns that decision-time replacement value is not validated.

A defensible next input would contain source/version, player ID, eligible lineup slot, season/week, prediction issuance timestamp before the relevant player's lock time, historical injury status, lineup eligibility, roster ownership and waiver availability as-of timestamp. Multiple simultaneous substitutions must obey the bipartite distinct-bench assignment constraint already audited. Until these are sourced, do not equate historical highest-scoring bench substitutions with manager skill or a certified PAR/WAR grade.

---

## New research phase: slot-eligible bench-source feasibility

The latest model-development step deliberately **does not** assign fresh PAR/WAR scores. It tests the exact recorded lineup position of each of the **254** post-trade starter observations in the 13 previously validated regular-season-only transactions against the actual season’s nine-slot structure (QB/RB/RB/WR/WR/TE/FLEX/FLEX/DEF), the receiving owner’s historical weekly roster, and the list of recorded bench assets. Both FLEX slots are eligible for RB/WR/TE, not QB/DEF.

The reproducible audit is `scripts/audit-trade-par-slot-feasibility.mjs` and publishes a source-coverage breakdown by season, fixed position versus FLEX, availability of a position-eligible bench candidate, and the number of roster reconstructions. Its first verified run examined **254** credited starts: **246** had at least one same-roster bench player position-eligible for that precise starting slot; **eight** had no such recorded bench option. Exactly **54** of the acquired-player starts occupied a FLEX slot, and **four** observations relied on a separately documented reconstructed weekly roster. The CI report now enumerates all eight no-option starter weeks individually. Each player start is required to have a unique player ID and an original manager owner. It does not allow the same starter to be credited twice.

**Simultaneous bench-reuse correction (November 21):** The 254 credited starts span **133 distinct receiving manager-weeks**, of which **74 weeks include multiple acquired-player starts** (195 starts). A bipartite, position-eligible matching audit finds that the previously reported **246 individually coverable starts** reduce to a maximum of **238 simultaneously coverable** when the same bench player is forbidden from replacing two different acquired starters in one manager-week. **Eight manager-weeks** contain direct competition: Stilly (2022 Weeks 7/14; 2024 Weeks 5/9) and Stew (2025 Weeks 9/10/12/13). These eight additional conflicting options are separate from the eight starts with no recorded position-eligible bench alternative at all. The reconstructed source file `data/trade_par_slot_feasibility_2020_2025_v1.json` and the Trade +/- website display both coverage categories with source receipt links. The matching algorithm has synthetic tests for a one-bench-player/two-RB collision, distinct RB+WR filling RB+FLEX, two FLEX spots with separate WR+TE choices, and a QB/WR mismatch.

**Importantly, 238 is only the maximum number of acquired-player starter slots that the observed recorded bench pool could cover at once**, not a realistic projection or validated replacement-baseline value; inactive/late-lock players, available waivers, team-wide reoptimization and keeper incentives remain unmodeled.

**Interpretation restriction:** Observing a same-week bench alternative with a known final score does **not** prove that player was active, available at lineup lock, optimal in advance, or the appropriate replacement under a validated WAR/PAR model. The exercise does not count waiver/free agents, does not permit the same reserve to fill two simultaneous holes, and does not infer the acquisition’s keeper or playoff value. An empty eligible bench list is a source-coverage fact, **not zero replacement value**.

Next source requirement: make explicit whether proposed counterfactuals are retrospective same-roster swaps versus ex-ante projected replacement availability. Reconstruct legal lineup assignments without bench reuse, preserve each historical player/slot ID, and validate exact week/owner/scoring provenance before any value estimates are surfaced as a comparison.

---

## Source-backed alternative: actual starter-point production (distinct from PAR)

Using the six season-level original `data/player_starts_YYYY.json` ledgers, we have independently rebuilt the **raw fantasy points scored in acquired players’ receiving-manager starting lineups**. This requires **no replacement-level estimate**.

Unlike the aggregate experimental PAR, a raw starter-point total can be precisely adjusted for the playoff boundary: all **14** player-start observations from 2020–2021 Week 14 within the five previously mixed-period fully matched trades are removed. That produces a season-correct **18-trade raw-starter-point source sample**, plus an expressly research-only **24-trade preview** when six zero-post-trade-start source-backed candidates are added.

These raw point totals answer “what scoring actually appeared in that manager’s lineup from the received assets” and provide a defensible zero-sum historical accounting. They **do not** answer “who took advantage,” because quarterbacks and receivers have different scoring opportunities, roster slots/FLEX, unstarted assets, injuries, keeper value, playoff performance and counterfactual replacement are not normalized.

| Manager | Source-corrected 18-trade net received starter pts | 24-trade research preview |
|---|---:|---:|
| Kuhl | +306.60 | +336.90 |
| Mitch | +170.90 | +131.10 |
| Birch | +155.22 | +90.72 |
| Stilly | −3.52 | −3.52 |
| JMid | −63.30 | −22.50 |
| Stew | −74.70 | −24.30 |
| Tony | −159.90 | −59.80 |
| Tom | −331.30 | −448.60 |

Reproducibility: `data/trade_raw_starter_accounting_2020_2025_v1.json` is generated from the original source ledgers by `scripts/build-trade-raw-starter-ledger.mjs` and checked byte-for-byte in CI. The raw production accounting is shown separately in the +/- view, with independent **18/24** sample sizes; inherited experimental PAR is still **13/19**. Never mix or substitute these two different metrics.

### Verified league format, 2020–2025

Historical Sleeper league-info confirms 0.5 PPR, starting QB/RB/RB/WR/WR/TE/FLEX/FLEX/DEF, six bench slots, and conventional RB/WR/TE FLEX eligibility in each of six seasons. Season-specific winners-bracket first weeks remain 2020–2021 Week 14 and 2022–2025 Week 15. The versioned source is `data/trade_par_era_lineup_settings_2020_2025_v1.json` and `scripts/verify-trade-par-era-settings.mjs` verifies agreement with the recovered playoff fixtures. These facts constrain future replacement models, but do not themselves establish a legal replacement player or a causal trade grade.

---

## Critical correction: 2020–2021 Week 14 was postseason

Verified historical winners-bracket fixtures establish the first playoff round in **Week 14 of both 2020 and 2021**; 2022–2025 first playoff rounds began Week 15. The inherited `trade_par_preview.json` applied a universal Week 14 "regular-season" cutoff and therefore included **25 postseason starter-asset observations** across 12 historical trades. **Five of the 18 fully matched two-manager comparisons are affected**, including the previously prominent 2021 Birch–Tom trade.

Those five can NOT be repaired by subtracting Week 14 raw fantasy points: their replacement-level deduction for Week 14 was also included, and the weekly PAR source values are not available. The published trade +/- research page now excludes those five entirely from regular-season views. The conservative inherited set is **13 postseason-clean trades**; six source-backed zero-start candidates create an optional **19-trade research comparison**. This remains experimental PAR because the weekly baseline formula is not independently reproduced.

Audit: `scripts/audit-trade-par-playoff-boundary.mjs` derives first-round weeks from `data/playoff_explorer_verified_2016_2025_v1.json`, reports affected IDs, and blocks reintroduction of the contaminated comparisons.

## 1. What has independently passed

The existing 2020–2025 `data/trade_par_preview.json` matched asset starter fields were compared by year, week, manager's historical roster ID, player name/ID and fantasy score with six immutable `data/player_starts_YYYY.json` files. Every one of **611 starting-lineup observations** was found. The **110 asset-in-trade point totals** equal their component starter points within rounding tolerance. The same player start was not counted against two different trades. These 611 observations verify fantasy scoring only; **25 are confirmed 2020–2021 Week 14 postseason observations** and cannot be presented as regular-season-only. This source reconciliation is now reproduced by `scripts/verify-trade-par-start-ledger-parity.mjs` on Trade Museum CI.

This verifies **starter point attribution**, not the underlying PAR replacement deductions, causal wins from trading, or every historical league trade.

## 2. Coverage and scope

- Museum currently records 44 trades from completed Sleeper seasons 2020–2025, plus seven 2026 trades in the older preview. This is not necessarily the full league-history archive.
- 18 of those 44 transactions have complete, two-manager, name-matched received sides in the inherited PAR preview, but five contain confirmed postseason Week 14 starts and are withheld from the season-clean comparison. **Thirteen** are eligible for the conservative default research view.
- 23 additional completed-season two-manager trades are incompletely matched, with one completed-season three-manager and two one-sided recorded trades left out of bilateral PAR grading.
- Seven specific missing player assets now have complete, direct historical roster-source **zero-post-trade-start evidence**: Zach Ertz (2025 Kuhl); Raheem Mostert (2024 Mitch); Brandon Aiyuk (2024 Tom); Bhayshul Tuten (2025 Birch); Rico Dowdle (2024 Tom); Calvin Ridley (2024 JMid); Brian Thomas Jr. (2025 Stilly).
- Six of those seven are the only unresolved asset in their two-manager exchange, allowing a strictly opt-in **19-trade postseason-clean research comparison** (13 + six). Brian Thomas Jr. is NOT eligible for that preview because the opposing Stefon Diggs received side still lacks weekly replacement-level PAR for two verified starts.
- The two completed-season zero-point/low-score starter exceptions are **Mike Evans (Stover, 2025 Week 7: 0.0 points in a starting lineup slot)** and **Stefon Diggs (Stover, 2025 Weeks 12–13: 3.0 and 4.1 points in starting lineup slots)**. Neither should be treated as zero starts or automatically given zero PAR.
- ESPN-era 2016–2019 transactions and the unfinished 2026 season are outside current comparable PAR scope. Multi-manager transactions are excluded from bilateral PAR, not artificially allocated among pairs.

## 3. Research-only expanded comparison

| Acquiring manager with greater candidate observed PAR | Counterparty | Candidate advantage | Trade ID |
|---|---|---:|---|
| Kuhl | Stew | +2.10 | 1294724519813988352 |
| Kuhl | Mitch | +14.47 | 1159892809005076480 |
| Tony | Tom | +52.89 | 1152708228883660800 |
| Stew | Birch | +34.01 | 1276373761972527104 |
| Stew | Tom | +1.46 | 1146946436173623296 |
| JMid | Stew | +38.46 | 1141777905656143872 |

These differences use previously matched receiving-asset PAR plus a **zero additional credited starter contribution** for the independently source-checked, missing asset. They do not price a player's opportunity cost, playoff results, injury risk, keeper rights, FAAB or alternative trade choices. The inferred PAR model remains unvalidated, so do not publish as certified talent evaluation.

The new **13-trade season-boundary-clean default** net values are Kuhl +178.08; Mitch +116.44; Stilly +56.64; JMid −41.12; Stew −52.70; Tom −117.26; Tony −140.08. Birch has no eligible fully matched trade in this narrowed default set. The **opt-in 19-trade research** scenario produces Kuhl +194.65; Mitch +101.97; Stilly +56.64; JMid −2.66; Birch −34.01; Stew −57.79; Tony −87.19; Tom −171.61. Both are zero-sum research outcomes, not certified PAR skill measures. The original 18-trade and 24-trade legacy computations are preserved in research provenance but must not be displayed as strictly regular-season-only.

## 4. What the PAR model still cannot prove

The `data/trade_par_preview.json` dataset is marked **experimental, source coverage partial**. Its 110 matched asset entries have aggregate `points`, `par`, `starts`, and `sourceWeeks`, but no source-identified **weekly, slot-eligible replacement points** or benchmark-version receipts. Their implied deductions (`points − par`) cannot uniquely determine the week-specific model. The `FELLAS_WAR_METHOD.md` proposal discusses a different bench/lineup-based counterfactual and explicitly does not certify WAR results. **Do not mix those WAR substitutes with inherited PAR values.**

In particular, the 2025 Mike Evans and Stefon Diggs examples demonstrate why a zero or low-scoring starter can contribute *negative* position-relative value. A fixed zero for those missing starts would bias trade rankings. These cases remain blocked pending verified benchmark weeks.

## 5. Why the inherited PAR baseline cannot be reverse-engineered uniquely

A direct source-level constraint audit of all **110 matched asset groups** finds **205 distinct season × week × position replacement values** touched by their starter weeks. If we generously assume that every starter at the same position in the same season/week shared an identical baseline (a simpler assumption than the proposed slot-aware FLEX method), those 110 aggregate asset deductions supply only **102 linearly independent constraints**. That leaves **103 unconstrained baseline degrees of freedom**. The eight dependent equations are internally consistent within rounding, but that does not prove the assumed baseline model was used.

**Conclusion:** Published asset PAR values can be consistent with infinitely many distinct weekly replacement schedules. Back-solving a convenient value for Mike Evans's 2025 Week 7 start, or the Stefon Diggs Week 12–13 starts, would be a guess, not a replication. We must establish the original benchmark definition, pool, positional/slot treatment, and actual weekly values or adopt a transparent new method and recompute every relevant trade consistently. Do not mix an old PAR trade with scores from an unrelated WAR/bench method.

This result is enforced by `scripts/audit-trade-par-baseline-identifiability.mjs` and appended to the Trade Museum GitHub Actions summary whenever the research source changes.

---

## 6. Alternative benchmark source feasibility

An independent check of all **611** inherited matched starter-week records against local week-level *full roster/bench* source filenames finds:

- **598** observations with a standard archived Sleeper roster-snapshot source file.
- **6** observations in 2025 Week 7 with a separate WAR roster reconstruction source, not an ordinary Sleeper roster-snapshot file.
- **7** observations in **2020 Week 14** with no archived full weekly roster snapshot in the current repository. Their starter scores are nevertheless independently verified in the season's starter-only ledger.

The audit `scripts/audit-trade-par-bench-source-readiness.mjs` independently inspects available roster files and identifies receiving team starters/bench lists. A historical bench score is **not automatically a legal replacement** at fantasy lineup lock, a waiver/free agent, or a FLEX-eligible substitute. Before any new comparable PAR approach can be approved, establish which position/slot substitutes would actually have been eligible and available; prevent counting the same replacement twice.

### Targeted 2025 WR constraint check

Under the *hypothetical* simplified assumption of one common WR baseline for each year/week, the inherited aggregate PAR data cannot uniquely determine **2025 Week 7** (Mike Evans) or **Week 13** (Stefon Diggs) WR replacement values. Week 12 is **mathematically constrained to 3.88** by another asset with a single Week 12 WR start (the 0-point Jordan Addison appearance). **3.88 is an implied deduction conditional on the assumed model, not a verified or deployable source baseline**. It does not resolve Diggs's two-week total, Evans's Week 7 start, or whether the original model treated FLEX/WR starts differently.

No all-time trade skill or replacement-adjusted winner ranking should be certified from these aggregate deductions alone.

---

## 7. Requirements to promote or label an all-time ranking

1. Confirm the specific season's scoring rules and exact lineup slots including FLEX treatment; establish whether the baseline is league-wide, waiver replacement, actual same-roster bench, or another model.
2. For each started player and week, attach stable provider player ID, owner/roster ID, position and lineup slot, the fantasy points scored, specific replacement peer set, eligible substitute points, benchmark methodology/version, and source receipt.
3. Reproduce **per-week** player PAR, then aggregate it into trade-received assets; prove all starts occurred strictly after the relevant transaction week while credited to the receiving owner.
4. Preserve zero-start versus zero-point-start distinction, and retain negative PAR where the consistent methodology calls for it.
5. Reconcile both receiving sides, identify incomplete/three-manager/FAAB/keeper assets as excluded or separately modeled, and require the trade-level/matrix totals to remain zero-sum without duplicated starts.
6. Maintain source freshness, commissioner review and CI pass before any approved ranking changes. **Never automatically promote a research candidate because a trade-card review proof exists.**

## Automated checks

- `scripts/verify-trade-par-start-ledger-parity.mjs` — all 611 matched starters and 110 aggregate point groups, with no duplicate-start attribution.
- `scripts/verify-trade-par-roster-proofs.mjs` — seven zero-start received assets and complete week-by-week source trail.
- `scripts/audit-trade-par-promotion-candidates.mjs` — six optional research-only bilateral comparisons.
- `scripts/audit-trade-par-baseline-provenance.mjs` — explicit warning that no week-specific replacement benchmark is independently reproduced.
- `scripts/audit-trade-par-baseline-identifiability.mjs` — independent linear constraint audit: 205 position-week unknowns, rank 102, 103 not determined by inherited aggregate asset PAR.
- `scripts/audit-trade-par-bench-source-readiness.mjs` — counts 598 standard source snapshots, six WAR reconstructions and seven missing full-roster 2020 Week 14 observations, without treating hindsight bench points as automatically eligible replacements.
- `scripts/verify-trade-museum-2.mjs` and the Chromium/WebKit browser tests — source integrity, opt-in preview on/off and shareable pair navigation.

**Disposition:** Maintain PR #276 as a draft. The evidence is strong enough for a clearly labeled research preview, but not yet for a fully certified, all-time trading-skill leaderboard.
