# Fellas historical record discovery audit — 2026-11-04

**Status:** Research backlog, not an authorized publication of new records. The public holder leaderboard currently uses 11 documented categories. This audit is for the next certified batch. No ranked record should be published merely because it appears here.

## Research comparison

External fantasy football record libraries commonly separate:
- Career / longevity (titles, games, wins, total points, averages)
- Regular-season scoring and matchups (highest and lowest, lowest winning score, highest losing score, combined matchup score, margins)
- Seasons, streaks and droughts (winning and losing streaks, playoff streaks, starts to seasons, repeated first-place finishes)
- Postseason (qualification, championship games, playoff wins, scoring, seed versus finish)
- Rivalries (head-to-head wins, longest rivalry streak, most-played opponents)
- Transactions, draft, FAAB, player starts and bench decisions
- Luck, schedule effects and all-play

Examples surveyed:
- https://www.keepersfantasyfootball.com/regular-season.html
- https://gameofjones.com/records
- https://www.alamocityfantasy.com/records
- https://leaguelegacy.io/features/fantasy-league-record-book
- https://www.goodfellasfantasyfootball.com/records/
- https://www.twocentsports.com/
- https://fantasybossesinc.com/analytics/

## Repository inventory and coverage

- **Canonical matchup baseline:** `data/unified_record_book_2016_2026.json`: 700 archived regular-season pairings, 1,400 paired team-results, 2016–2025 plus 2026 through Week 8; 14 historical managers; zero duplicate games reported.
- **Season and weekly aggregate:** `data/season_weekly_matchups_2016_2026_v1.json`, `data/season_guide.json`. Completed seasons through 2025, 2026 is partial.
- **Manager extrema:** `data/manager_record_books_2016_2026.json`.
- **Verified championship brackets:** `data/verified_espn_playoff_brackets_2016_2019.json` and `data/verified_sleeper_playoff_brackets_2020_2025.json`.
- **Luck / schedule:** `data/all_time_luck_ratings_v1.json`, `data/all_time_schedule_matrix_v2.json`.
- **Roster/draft/transaction evidence:** `data/espn_*_draft_recovered_v1.json`, `data/v9_draft_engine.json`, `data/acquisitions_2020.json` through `acquisitions_2026.json`, `data/manager_acquisition_coverage_v1.json`, `data/player_starts_2020.json` through `player_starts_2026.json`, `data-integrity/faab-provider-receipts-20*.json`, and keeper evidence files.
- **Older non-authoritative presentation sources:** `data/record_book_v2.json` is **only 2026 Weeks 1–7**. `data/all_time_league_superlatives_v1.json` warns about incomplete 2020/2021 pairings and 2026 Week 6. Do not feed either directly into new all-time rankings.

**Critical historical caveats:**
1. The unified ledger records 69 regular pairings each in 2020 and 2021, versus 70 in several later seasons; two scored but unpaired roster results in those years are not evidence of a matchup win or loss.
2. ESPN 2016–2017 two-week playoff totals must **never** be labeled individual weekly scores.
3. Scoring formats/roster settings differ by era. Raw historical point records are valid with an era scope, but raw-scoring cross-era claims are not a normalized measure of manager skill.
4. Ties, byes, incomplete 2026, manager identities (Tom versus Thommy), and former-manager inclusion all require explicit rules.
5. Championship bracket only for postseason honors; consolation must not count as playoff wins/berths.
6. `Hall of Shame` and unlucky outcomes should not inflate positive 'records owned' totals; publish separately.

## Newly discovered record candidates

### Priority A — easiest to validate from existing ledger (do these first)

| Proposed record | Candidate source | Certification requirement |
|---|---|---|
| Highest score in a loss | Unified regular games | Opponent, year, week, final margin; both paired scores available |
| Lowest score in a win | Unified regular games | Same as above |
| Lowest single-week regular-season score | Unified regular games | Scored team-week (not a bye); cross-era raw-score caveat |
| Highest combined-score regular-season matchup | Unified regular games | Sum both paired teams, avoid double counting |
| Longest single-season winning streak | Unified weekly regular games | Consecutive scheduled game weeks, no missing/bye week counted as a win |
| Longest single-season losing streak | Unified weekly regular games | Same qualification; Hall of Shame |
| Most points against in a completed season | Season guide / weekly log | Reconcile schedule and unpaired games, mark era |
| Most regular-season scoring titles | Season guide | Verified annual PF leaders, completed seasons only |
| Most regular-season first-place finishes | Season guide | Define standings tiebreakers and year-by-year champions |
| Most first-round playoff byes | Verified bracket files | 2016–2025 full comparison, format caveat |
| Most consecutive playoff appearances | Verified bracket files | Count consecutive **played** seasons; join and departure boundaries explicit |
| Most-played rivalry | Unified regular game pairings | One unordered pair, former managers included; do not count mirrors |

### Priority B — compelling, with additional method or coverage checks

| Proposed record | Data readiness / issue |
|---|---|
| Most playoff wins | Rebuild only from verified championship-bracket game-level receipts, excluding byes and consolation |
| Largest playoff upset by seed | Verified bracket seeds plus confirmed advancement/match result |
| Highest **single-week** playoff score | Requires actual one-week player/team results; never use 2016–2017 aggregate finals |
| Longest championship drought | Distinguish active streak from completed streak and seasons absent from league |
| Longest rivalry winning streak | Sort head-to-head results chronologically and certify missing pairing boundaries |
| Best all-play season | Weekly peer comparisons; denominator and tie rules stated |
| Luckiest / unluckiest season | Schedule expected wins vs actual; season comparability and weekly sample documented |
| Most weeks as league high scorer | Count all scored teams including unpaired team-weeks with provenance gates |
| Best season scoring average | Min complete season and point-per-game / scoring-format scope |
| Highest career average margin | Minimum 50 completed paired games and era caution |
| Most Top-3/Top-half weekly scoring finishes | Include only weeks where scored-team coverage is complete |
| Biggest playoff comeback / underdog championship | Requires reliable *pregame* odds or forecast; final-season standings are hindsight, not probabilities |

### Priority C — compelling advanced records, not yet certified across eras

- Most successful FAAB claims, most $0 successful FAAB claims, and most free-agent additions: classify transaction type accurately; exclude failed bids.
- Largest single winning FAAB bid and most FAAB spent in a completed season: use verified original-provider receipts, handle refunds/season budgets.
- Most trades completed and biggest trade asset haul: bilateral completed trade events only, not copied legs or a combined activity count.
- Draft steals / misses: exact slots and scoring context, keeper exclusions, correct draft year and league roster settings.
- Best single-week bench output, highest started-player performance, most points left on bench: verified roster and lineup slots by historical format; **not** equivalent to start/sit skill.
- Most productive keeper season and best keeper decision: 2024+ explicitly established keeper era, only original-manager starts, source-qualified draft costs; transfers and releases matter.
- Most WAR or positional value in an acquisition: research-only until the WAR/FAAB methodology and evidence denominators meet the publication gate.

## Preliminary examples from this scan — NOT final published records

These are deterministic extrema from the currently archived **700 paired regular-season games**, **not independently reconciled new certified league records**:

| Candidate | Provisional holder | Archived value | Receipt |
|---|---|---:|---|
| Highest losing score | Stew | 164.80 | 2025 W10, lost 164.80–167.82 vs Mitch |
| Lowest winning score | Stilly | 64.00 | 2017 W9, beat Tony 64–63 |
| Lowest single-week score | Tony | 44.00 | 2017 W1, lost 44–75 vs Thommy |
| Highest combined-score game | Stew & Mitch | 332.62 | 2025 W10, 164.80–167.82 |
| Longest single-season winning streak | Mitch | 12 straight | 2025 W3–14, pending chronological integrity audit |
| Longest single-season losing streak | Stew | 11 straight | 2021 W2–12, pending 2021 source-coverage audit |
| Most season points against | Thommy | 1,766.00 | 2021, pending season ledger reconciliation |

These are internal candidates. For strongest accuracy, verify every candidate against weekly data, archive caveats, alternate canonical projections, and (where possible) original provider receipts.

## Publication and UX gates

1. Define one canonical `records.registry` with stable `record_id`, display title, statistic, unit, direction, stage, season/career scope, eligibility, evidence source, archive cutoff, winner(s), ties, and runner-up.
2. Enumerate all eligible historical candidates **including retired managers**; compute the full ranked top 5 and verify exact scores/years/opponents with deterministic tests.
3. Require explicit uncertainty/coverage: `verified`, `provisional`, or `unavailable`. Do not display provisional as an all-time certified holder.
4. Audit duplicate categories and redundant methods; do not add 70 tiny records simply to make the site look deeper.
5. Separate **League Records**, **Season Records**, **Rivalries & Playoffs**, **Hall of Shame**, and **Advanced Research** under a *single* record-book interface with simple category filters; keep the first screen fast and mobile-first.
6. Manager profiles show the number of positive verified *category titles*, with ties counting once per manager/category. Negative and luck-based superlatives must appear as context, not positive trophies.
7. New records must be reproducible by both canonical CI and Chromium/WebKit mobile controls, with no stale hardcoded '11 category' counts.
8. After certification, publish approximately **20–30 high-value distinct records**, then expand by evidence quality, not arbitrary target volume.
