# Record Book 2.0 — Deep Research Batch 2 (November 13, 2026)

**Status:** Reproduced against repository-level canonical ledgers and archived playoff receipts; not independent re-fetch of historical ESPN/Sleeper API. Research-only; zero public record mutations.

## Scope and verification approach

Inputs: `data/unified_record_book_2016_2026.json` (705 distinct regular-season pairings; 1,410 paired manager outcomes), `data/verified_espn_playoff_brackets_2016_2019.json`, `data/verified_sleeper_playoff_brackets_2020_2025.json`, `data/fellas_final_placements_2016_2025_verified.json`, `data/postseason_winners_bracket_record_receipts_2016_2025_v1.json`, and `data/all_time_luck_ratings_v1.json`.

Run `node scripts/verify-record-book-2-deep-research.mjs`. Unlike the earlier catalog, this batch independently recomputes targeted published/proposed record values from source game rows (not prose summaries), verifies completed champion ownership across 3 internally maintained datasets, checks close rivalry events and reproduces luck deltas. It does **not** fetch original archival provider APIs or replace the official registry.

Full weekly-rank eligibility: 142 fully scored league weeks (eight teams in 2016; ten later). 2020 Week 14 and 2021 Week 14 have 8 scored team entries apiece, so are excluded from league-wide rank categories; the actual paired matches still count in career, score and rivalry records.

## Championship receipts: repository cross-dataset agreement 10/10

| Year | Champion | Final score |
|---|---|---|
| 2016 | Thommy | 223–175 vs Halderman (two-week aggregate) |
| 2017 | Thommy | 241–212 vs Schermerhorn (two-week aggregate) |
| 2018 | Thommy | 111.58–106.62 vs Birch |
| 2019 | Birch | 114.14–109.42 vs Stew |
| 2020 | Koble | 117.48–99.42 vs Mitch |
| 2021 | Tony | 138.28–133.98 vs Evans |
| 2022 | Stover | 99.22–48.16 vs Stew |
| 2023 | Stilly | 104.96–90.18 vs Mitch |
| 2024 | Thommy | 205.30–114.88 vs Stilly |
| 2025 | Scott | 156.32–86.00 vs Thommy |

**Finding:** The 2022–24 champion identities are consistent between bracket and final placement files and supported by matching final-score receipts: Stover 2022, Stilly 2023, Thommy 2024. Prior conversational summaries naming different winners conflict with these provider-derived archived records. No reason exists to override the repository results on those summaries alone. Original screenshots/provider response retrieval would still strengthen *independence* of certification.

### Phase 2 scoring categories independently recomputed from game rows

| Category | Leader(s) | Value | Coverage note |
|---|---|---:|---|
| Weekly league-high scores, career | Mitch | 22 | fully covered scored weeks |
| Weekly league-low scores, career | Stilly | 20 | fully covered scored weeks |
| Top-three weekly scores, career | Mitch | 50 | tied ranks share placement |
| Bottom-three weekly scores, career | Stew | 50 | negative exhibit |
| Runner-up weekly scores, career | Tony | 19 | unique-high definition |
| Runner-up weekly score **despite loss**, career | Stilly | 4 | 2017 W3, 2019 W4/W8, 2022 W14 |
| Second-lowest weekly score **despite win**, career | Thommy | 3 | 2022 W9, 2024 W9, 2025 W3 |
| Top-three-scoring losses, career | Stilly | 8 | already a proposal |
| Bottom-three-scoring wins, career | Stover | 8 | already a proposal |
| Weekly league-high scores, completed season | Mitch, 2025 | 5 | Weeks 3, 5, 7, 10, 12 |
| Weekly league-low scores, completed season | Thommy, 2019 | 6 | Weeks 1, 2, 6, 10, 11, 13 |
| Games scoring 150+, career | Mitch | 15 | 2026 W9 included |
| Games scoring 150+, completed season | Mitch, 2025; Tony, 2021 | 4 each | co-holders |
| Games scoring under 80, career | Stover | 20 | negative exhibit; era caveat |
| Games scoring under 80, completed season | Halderman, 2017 | 7 | ESPN era; negative exhibit |

Note: 2016 used 8 teams; scoring formats changed over time. Rankings at 150 and 80 are literal historical threshold records, *not* era-adjusted skill measures. All proposed Phase 2 categories retain provisional publication status pending cross-batch deduplication and proof gates.

## Luck records: a separate schedule-driven statistical family

Expected wins are computed each week from the manager's scoring percentile relative to other active scorers, with peer ties receiving half credit. Not a reflection of skill or effort.

**Career raw luck record (through 2026 W9):** Birch +6.67 wins above expected in 129 recorded games (72 actual vs 65.33 expected). Career raw luck records should not be interchanged with per-14-game rates without a games threshold.

**Single completed-season extremes:**
- Most favorable: Birch 2021, 11 actual wins versus 7.444 expected, **+3.556** luck wins.
- Least favorable: Tony 2020, 4 actual wins versus 6.714 expected, **–2.714** luck wins.
- Other positive seasons: Thommy 2024 +2.500; Koble 2023 +2.444; Birch 2019 +2.333.
- Other negative seasons: Thommy 2020 –2.556; Koble 2019 –2.333.

Present these as `luck wins` or `schedule advantage`, never actual standings corrections or trophies.

## Rivalry: historically repeated one-point finishes

**Stover vs Tony** had **three distinct regular-season games decided by one point or less**:
- 2020 W8 (0.92 points)
- 2024 W11 (0.24 points)
- 2026 W7 (0.92 points)

**Stew vs Thommy** had two such games: 2018 W7 (0.16 points), 2026 W9 (0.76 points).

A three-point-or-less **rivalry** measure has multiple teams tied at three games (e.g. Stew–Thommy, Stover–Tony, Mitch–Stew, Birch–Mitch); do not report any sole winner without full tie-aware enumeration.

## Scope and quality findings

1. **Single-week combined score, all eligible stages:** largest 332.62, Mitch–Stew, 2025 W10. Lowest eligible **all-stage** total is 114.56, 2018 W15 consolation Kuhl–Stew. Lowest **regular season only** total 119, 2017 W1 Thommy–Tony. These are independent category definitions.
2. The expanded record JSON is dated through Week 9 but one descriptive rules line still refers to Week 8; fix in the data publishing sprint.
3. New weekly-rank findings are ready for review as verified **repository derivations**, but original ESPN and Sleeper provider evidence should be sampled before final all-time public certification.
4. 2026 current-season results must not compete for completed-season records.
5. Thommy/older `Tom` aliases must remain distinct from Schermerhorn, and Evans owns the entire 2023 roster.
6. Do not count a one-point **tie** as a game **decided** by one point; exact margin zero belongs to separate tie analysis.
7. These records are not additive to the 77 proposal appearances without canonical ID reconciliation.

## Next strongest work

- Finalize `record_id` aliases and full tie policy; derive every manager's best event and rank from one universal registry, including historical owners.
- Reconcile category-specific original-provider receipts for weekly extrema (especially ESPN-era 2016–2019), 2020–21 bye weeks, and 2018 consolation.
- Build manager-linked detailed evidence views and record badges, keeping negative and luck markers out of positive league-trophy counts.
- Gate deployment on canonical scripts, mobile Chromium/WebKit verification and Pages checks.

**This work is a reproducible deep-research addendum, not a production release.**
