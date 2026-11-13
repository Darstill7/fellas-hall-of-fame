# Fellas Record Book 2.0 — source audit and certification decision register

**Research snapshot:** November 13, 2026. **Branch status:** research-only; no public stat replacement or implicit certification.

## Executive finding

The site already contains 44 expanded regular-season/final-placement record IDs (`data/expanded_records_verified_v1.json`), plus a separate 19-category Legendary dataset (`data/legendary_records_2016_2025_v1.json`), postseason archive (`data/postseason_records_verified_v1.json`) and weekly/aggregate matchup charts. Research taxonomy describes 77 *proposal appearances*, not 77 independently new records. Existing canonical baseline is 705 paired regular-season games (2016–2025 plus 2026 W1–9), 1,410 team contributions. The provisional Phase 2 generator evaluates 142 fully scored league weeks and excludes the incomplete league-ranking weeks (2020/2021 Week 14).

**Disposition:** Complete a scoped, evidence-linked research inventory and maintain candidate/gate statuses; DO NOT mark new research categories certified on the strength of this review alone.

## 1. Current published expanded-category baseline (44)

Single-game (9): `highest-score`, `lowest-score`, `highest-score-loss`, `lowest-score-win`, `biggest-win`, `narrowest-win`, `biggest-defeat`, `narrowest-defeat`, `giant-slayer-win`.

Career and scoring (19): `most-wins`, `most-games`, `win-rate`, `career-points`, `career-ppg`, `points-against`, `hundred-club`, `one-twenty-club`, `one-forty-club`, `one-sixty-club`, `wins-vs-130`, `wins-below-100`, `high-score-losses`, `nailbiters`, `one-score-drama`, `thirty-plus-wins`, `winning-streak`, `scoring-streak-100`, `scoring-streak-120`.

Completed season (6): `season-points`, `season-average`, `season-wins`, `season-win-rate`, `season-point-diff`, `season-140-club`.

Rivalry (5): `rival-wins`, `rival-games`, `rival-percentage`, `rival-margin`, `rival-scoring`.

Final-placement/longevity (5): `seasons-played`, `top-three-finishes`, `top-half-finishes`, `average-finish`, `bounceback`.

Representative existing data-driven record marks:
- Mitch: 180.86 one-game points (2025 W7 vs Scott), 1,894.88 season points and 135.35 PPG (2025); 23 career 140+ scores through 2026 W9.
- Stew: 164.80 in a loss (2025 W10 against Mitch 167.82); Mitch–Stew combined 332.62.
- Scott: 101.38-point regular-season victory (2025 W11 against JMid).
- Thommy/Tom–Stew: 0.16-point narrowest game (2018 W7), subject to original-provider identity confirmation.
- Tony: 44 points, lowest recovered regular-season game (2017 W1).
- Stilly: 64-point winning score (2017 W9 over Tony's 63).
- Stover: 76 regular-season career wins through 2026 W9.
- Birch: +345.12 season point differential (2019).

These are explicitly **existing source-file values**, not a new independent original-provider certification.

## 2. Other existing record exhibits (not additive blindly)

**Legendary (19):** includes champion/comeback stories, seeds, finalist losses, lowest qualifying win percentage, 2025 best record without a title, narrow playoff eliminations, final margins and runners-up. Some are *identical* to or closely related to proposed turnaround/playoff categories. Preserve independently existing IDs pending an editorial reconciliation.

**Postseason evidence:** `data/postseason_records_verified_v1.json` currently ranks playoff berths Birch and Thommy/Tom 7 each; finals Thommy/Tom 5; byes Birch, Stover and Tony 3 each; consecutive postseason appearances Mitch 5. Scope completed 2016–2025 only. Cross-check each original bracket before turning those into additional record-ownership badges.

**Single-week combined matchup extremes:** `data/highest_scoring_matchups_2016_2026w9_v1.json` ranks Mitch 167.82 over Stew 164.80 in 2025 W10 as the largest eligible combined total (332.62). `data/lowest_scoring_matchups_2016_2026w9_v1.json` ranks **2018 W15 consolation Kuhl 66.42 vs Stew 48.14 = 114.56** lowest eligible all-stages single-week game; **2017 W1 regular season Thommy 75 vs Tony 44 = 119** lowest regular-season matchup. Do not combine these two scopes or label the latter as all-stage record.

## 3. Twenty-three source-derived Phase 2 proposals (provisional)

Read and run from `scripts/build-record-book-phase2.mjs`; source methodology described in `data-integrity/PHASE2_RECORD_BOOK_23_CATEGORY_RESEARCH_2026-11-11.md`. The 23 ID definitions are:

- Weekly position/awards (9): `weekly-highs`, `weekly-lows`, `weekly-runnerups`, `weekly-top-three`, `weekly-bottom-three`, `top-three-losses`, `bottom-three-wins`, `runnerup-losses`, `second-lowest-wins`.
- Completed season (4): `season-top-three`, `season-bottom-three`, `season-weekly-highs`, `season-weekly-lows`.
- Scoring thresholds (4): `career-150-plus`, `career-sub-80`, `season-150-plus`, `season-sub-80`.
- Consecutive league-rank streaks (2): `high-streak`, `low-streak`.
- Combined game scoring (2): `combined-high`, `combined-low`.
- Rivalries (2): `rival-win-run`, `rival-one-point`.

**Preliminary results explicitly flagged by original research as not independently source-certified:**
- Mitch 22 league-high weekly scores; Stilly 20 league-low scores; Tony 19 second-highest weeks.
- Stilly 8 top-three-scoring losses; Stover 8 bottom-three-scoring wins.
- Mitch 2025 five weekly scoring titles; Thommy 2019 six lowest-scoring weeks.
- Evans 2016 three straight highest weeks (W7–9); Stew 2023 four straight lowest weeks (W11–14).
- Six rival-pair winner runs tied at six consecutive **meetings** rather than weeks.

Do not surface these as certified just because the script deterministically returns them.

## 4. Across-batch deduplication (a publication blocker)

Use `scripts/build-record-taxonomy-crosswalk.mjs` and `data-integrity/UNIFIED_RECORD_TAXONOMY_CONSOLIDATION_2026-11-11.md`. Its input groups are PRs #202–206 plus a research-only Phase 3 postseason group. It lists 77 proposal appearances and direct aliases such as:
- `weekly-highs` => `weekly-highs-career`
- `weekly-runnerups` => `weekly-seconds-career`
- `season-weekly-highs` => `weekly-highs-season`
- `rival-win-run` => `rivalry-consecutive-meeting-wins`
- `turnaround-deepest-hole-champion` => Legendary `deepest-champion-hole`
- `highest-score-in-loss` (Legendary) related to expanded `highest-score-loss`.

Critically, `playoff-upset-largest-seed-gap` (any playoff round) and `biggest-final-seed-upset` (final only) are **not aliases**. Likewise, the narrowest any-round elimination is not automatically the narrowest first-round elimination. Do not add "44 + 19 + 77" as a category count. Require final ID crosswalk and explicit membership/source status.

## 5. Luck records: measured, not coach skill

`data/all_time_luck_ratings_v1.json` measures expected wins = share of other active teams outscored each week (ties count half); luck wins = actual wins – expected wins. Current source ranking through 2026 W9:
- Birch: 129 paired games, 72 wins, 65.33 expected, **+6.67 lucky wins** (+0.72/14-game pace).
- Stover: 144 games, 76 wins, 73.06 expected, **+2.94**.
- Stew: 144 games, 68 wins, 66.29 expected, **+1.71**.
- Kuhl: 119 games, 51 wins, 53.78 expected, **–2.78**.
- JMid: 37 games, 17 wins, 19.28 expected, **–2.28** (–0.86/14-game pace, a distinct rate leaderboard).
- Evans: 107 games, 52 wins, 54.23 expected, **–2.23**.

Different lifetime sample lengths require separate **raw luck wins** and **normalized per-14-game** rankings with disclosed minimum games. Do not call a team's schedule-driven luck 'manager ability'; do not equate fantasy points against with defensive performance. 2020/2021 W14 byes and 2016 eight-team peer pool require explicit denominators.

## 6. Historical integrity checks needed before promotion

**High-priority championship ownership reconciliation:** The repository's `data/fellas_final_placements_2016_2025_verified.json` says 2022 Stover, 2023 Stilly, 2024 Thommy; a previously recorded commissioner-facing project history described 2022 Birch, 2023 Stover, 2024 Mitch. This is a **material conflict in cross-session notes vs current repository**. Do **not** silently overwrite the provider-verified file based on notes, nor certify contradictory championship stories or trophy counts without reviewing the original Sleeper playoff brackets and confirming with the commissioner if necessary. This document does not decide the conflict.

Other rules:
1. ESPN 2016–2018 whole-number / pre-half-PPR scoring, 2019 half-PPR adoption, and 2016 eight-player field; raw cross-era points are not normalized.
2. 2016–2017 two-week playoff aggregate rounds are never single-week scores.
3. 2020/2021 W14 actual played games count for H2H/scoring; partially populated weeks are excluded from full-league weekly scoring ranks.
4. Preserve Evans's ownership of the 2023 roster; JMid joins 2024. `Tom` normalizes to Thommy, **not** historical Schermerhorn.
5. 2026 is active through verified W9, excluded from completed-season, title and postseason records.
6. Former managers are eligible for historical records. All tied holders stay rank 1.
7. Rank negative/shame measures separately from positive title counts.
8. Correct misleading retained source wording: `data/expanded_records_verified_v1.json` contains a scope update to W9 but a rules paragraph still calls the 2026 season "Week 8". Fix only in an explicitly reviewed data-publication PR.

## 7. Recommended canonical data model / manager portfolios

Each record must have: `record_id`, `family`, `title`, `definition`, `direction`, `unit`, `stage`, `eligibility`, `eraPolicy`, `sourceManifest`, `coverageAsOf`, `status`, `rankedEntries`, `allTiedHolders`, `managerBestIndex`, and `evidence` with original match/season/round ID and scores.

Manager portfolio contract: emit from identical canonical record objects, no independent copying. For every current or former manager show their best category result (even when outside top 10), league-wide position with ties, record-year/season, qualifying opponents and exact supporting receipt; separate positive trophies, negative records, and research-only categories.

## 8. Prioritized certification gates and release decisions

**Gate A — original receipt audit:** Confirm historical ESPN top/bottom extrema, championship ownership, 2018 consolation status, 2020/2021 W14 eligibility. Verify highest/lowest combined leaderboard against the main ledger's stage filters. No promotion until this is done.

**Gate B — deterministic registry:** Run `node scripts/build-record-book-phase2.mjs`, `node scripts/verify-record-book-phase2.mjs`, `node scripts/build-record-taxonomy-crosswalk.mjs`, `node scripts/verify-record-taxonomy-crosswalk.mjs`; reconcile aliases plus related-but-distinct records; emit canonical generated candidate rankings and tie-aware manager index.

**Gate C — evidence:** Compare top 5 and all co-holders against the single source ledger and original receipts, enforce coverage eligibility, collision-free ID mapping and 2026 W9 baseline. Categorize `certified`, `provisional`, `blocked`.

**Gate D — publication UX:** Present one Record Book with tabs for League, Seasons, Rivalries, Postseason, Hall of Shame, Advanced; full manager portfolio deep links; search, sorting, date/source badges, all-ties display; readable at 320px and 390px. Show "updated through 2026 Week 9" only where true.

**Gate E — release:** canonical validation + independent Chromium and WebKit/mobile visual QA + Pages deployment on exact merged commit. Keep candidate numbers labeled provisional until these conditions pass.

## 9. Result of this research delivery

- Inventory assembled across the 44 expanded, 19 Legendary, 23 Phase 2, 77-proposal taxonomy, all-stage matchup, postseason and luck data sources.
- Source-backed existing marks and **provisional** Phase 2 findings preserved with precisely labeled scope.
- One important championship discrepancy and two coverage/scope pitfalls isolated.
- A concrete certification and rendering contract defined.

**This is a complete research *audit*, not completion of original-provider independent verification or a Record Book 2.0 public release.** Do not represent it as newly published records or all-green CI.
