# FF HISTORY historical spreadsheet — source investigation and reconciliation
**Date:** November 4, 2026  
**Source (read-only):** [FF HISTORY](https://docs.google.com/spreadsheets/d/1KxsiA_udGvgyZYuuolhS-Y_OOoR_8_7-Z4gzc2t6Kl0/edit)  
**Machine-readable evidence:** `data-integrity/FF_HISTORY_SPREADSHEET_RECONCILIATION_2026-11-04.json`  
**Verified ESPN ranks:** `data/espn_final_placements_2016_2019_verified.json`

## Executive findings

1. The workbook has eight tabs: SLEEPER HISTORY, 2025, 2024, 2023, 2022, 2021, 2020, and Outdated Info. It is an **older manually maintained historical snapshot**, not a modern canonical source.
2. **2016–2019 official ESPN final finishing places are already present** in the original ESPN export. All 38 placements (eight entrants in 2016; ten each in 2017–2019) are unique, consecutive, and internally consistent. The legacy workbook independently corroborates the old last-place names.
3. The 2016–2019 last-place *consolation final* can be corroborated in original ESPN `LOSERS_CONSOLATION_LADDER` matchup evidence, including the loser and winning opponent. The 2016–2017 ESPN post-season totals are multi-week aggregate scoring, not single-week records.
4. The legacy workbook's 2020 and 2021 Shitter labels are **false by later verified Sleeper screenshots**. Do not migrate these old claims.
5. The workbook's **2023 “Evans” score column is JMid**, not historical Evans. All 14 weekly points match JMid's canonical ledger exactly. The historical owner names must not be merged.
6. Cell-level comparison across 2020–2025 found **700 scored team-weeks** in this historical workbook: **688 exact matches, 12 score differences, zero missing archive scores** after correctly mapping the 2023 column.
7. The old 2025 tab only contains **Weeks 1–2**, and the 2020/2021 tabs each contain **Weeks 1–13**, while the canonical archives have additional Week 14 paired games. Avoid comparing their grand totals to completed modern seasons.
8. Current canonical results remain authoritative when this source differs. Preserve differences for investigation, not silent score rewrites.

## Historical 2016–2019 official ESPN finishing positions

| Season | Teams | Champion | Last place | Last-place final opponent | ESPN last-place final score (loser–winner) |
|---|---:|---|---|---|---|
| 2016 | 8 | Thommy | Schermerhorn | Stew | 184–193 (two-week aggregate) |
| 2017 | 10 | Thommy | Birch | Tony | 196–214 (two-week aggregate) |
| 2018 | 10 | Thommy | Stilly | Koble | 86.76–125.14 (ESPN matchup total) |
| 2019 | 10 | Birch | Evans | Stover | 264.76–328.56 (ESPN matchup total; verify week composition before any scoring record) |

These are derived from ESPN `teams[].finalRank` plus original losers-bracket games. Treat them as **official finishing places**, not proof that the old ESPN competition followed every rule of the Sleeper Toilet Bowl.

The full ranks for these four seasons are saved in `data/espn_final_placements_2016_2019_verified.json`. They unlock 2016–2025 finishing timelines (98 rank assignments) if the site explicitly differentiates eight-team 2016 from ten-team years. **Do not simply average raw 2016 placement against ten-team places without a league-size caveat or normalized metric.**

## Cross-era last-place context (not yet a public redesign)

| Year | Documented final last place | Source |
|---|---|---|
| 2016 | Schermerhorn | Official ESPN finalRank and loser final; old workbook agrees |
| 2017 | Birch | Official ESPN finalRank and loser final; old workbook agrees |
| 2018 | Stilly | Official ESPN finalRank and loser final; old workbook agrees |
| 2019 | Evans | Official ESPN finalRank and loser final; old workbook agrees |
| 2020 | Tony | Verified Sleeper Toilet Bowl; old workbook wrongly says Stew |
| 2021 | Stilly | Verified Sleeper Toilet Bowl; old workbook wrongly says Stew |
| 2022 | Birch | Verified Sleeper Toilet Bowl; old workbook agrees |
| 2023 | Stew | Verified Sleeper Toilet Bowl |
| 2024 | Kuhl | Verified Sleeper Toilet Bowl |
| 2025 | Stover | Verified Sleeper Toilet Bowl |

Birch and Stilly are each last twice across 2016–2025, with league-format differences disclosed. The workbook's older note claiming *Drew and Birch* each twice is not corroborated.

## Weekly score reconciliation

| Year | Scored values checked | Exact matches | Differences | Coverage |
|---|---:|---:|---:|---|
| 2020 | 130 | 124 | 6 | Weeks 1–13 |
| 2021 | 130 | 129 | 1 | Weeks 1–13 |
| 2022 | 140 | 139 | 1 | Weeks 1–14 |
| 2023 | 140 | 138 | 2 | Weeks 1–14; 2023 Evans label remapped to JMid |
| 2024 | 140 | 139 | 1 | Weeks 1–14 |
| 2025 | 20 | 19 | 1 | Weeks 1–2 only |
| **Total** | **700** | **688** | **12** | Historical spreadsheet snapshot |

Notable deviations: the 2020 six differences are all −2 points in the old sheet compared with canonical; in 2023 Stilly's Week 10 entry is **109.72 old versus 107.18 canonical** (+2.54), while Tony's Week 6 is **127.42 old versus 128.42 canonical** (−1). The 2025 Mitch Week 1 difference is only −0.03. All twelve precise fields, managers, weeks and deltas are stored in the structured audit.

An old score differing from the canonical record **does not on its own prove either one incorrect**. These may reflect manual entry errors, corrections, scoring adjustments, or the source snapshot date; provider receipts are needed before choosing a replacement. The 2020 third-place Birch score discrepancy previously noted in the bracket investigation is a separate game-score issue, not one of these old regular-season sheet row differences.

## Publication and data-quality decisions

**Safe to derive now:** official ESPN 2016–2019 final positions, era-specific finish histories, ESPN last-place finalists, league-size-aware historical placement research. The historical last-place results have original ESPN game evidence; apply the site's official naming rules before publicly labeling them “Shitter of the Year.”

**Research leads only:** older head-to-head margin tables and Sleeper all-time aggregate totals. Their reporting window and owner aliases are stale and not an appropriate replacement for canonical paired matchup games.

**Exclude from authoritative data:** old 2020 and 2021 Shitter claims, old 2025 partial season totals, unqualified league-wide best/worst raw weekly scores that mix early ESPN multiweek playoff aggregates with Sleeper weekly scores.

**Next implementation recommendation:** join the verified 2016–2019 ESPN ranks to the 2020–2025 Sleeper ranks, preserve each season's number of teams, and provide both actual placing and normalized finish percentile for cross-era exploration. Review the 12 score differences individually before changing any underlying regular-season ledger. Keep the legacy Google Sheet unchanged.
