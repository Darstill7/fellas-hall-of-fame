# ESPN era and Week 9 dependency audit — November 11, 2026
**Research-only, not a production release.**

## ESPN historical record-list cross-check
Compared the recovered 2016–2019 ESPN-only record file `data/espn_record_book_2016_2019.json` to the regular-season games in `data/unified_record_book_2016_2026.json` using year/week, both manager identities, and scores.

- Recovered regular-season games: **242**, corresponding to **484** team-game scores.
- The file's **30 high-score records, 30 low-score records, 30 biggest-win records, and 30 closest-game records** all matched the corresponding canonical entries with no score or pairing errors in this cross-artifact comparison.
- Highest ESPN-era regular-season team score in the reconstructed ledger: **Halderman 170, 2016 Week 5 against Koble**.
- Lowest ESPN-era team score: **Tony 44, 2017 Week 1 against Thommy**.
- Important restriction: both sources originate from reconstructed ESPN history. **This comparison does not constitute fresh verification from ESPN's original website/API.** Early scoring settings, two-week postseason structures, and current Thommy vs historical Schermerhorn identity must remain explicit.

## Current 2026 Week 9 rivalry changes
The site has a separate `data/regular_season_rivalry_receipts_2016_2026w8_v1.json` last authored for Weeks 1–8. The canonical/connected Sleeper verified Week 9 scores update the following pairs:

| Rivalry | W8 archive count | New count | Winner, Week 9 | New record across recovered regular-season meetings |
|---|---:|---:|---|---|
| Kuhl–Stilly | 11 | 12 | Stilly 116.66–77.54 | Stilly 7–5 |
| JMid–Scott | 4 | 5 | JMid 148.74–109.94 | JMid 3–2 |
| Stew–Thommy | 16 | 17 | Stew 87.36–86.60 | Thommy 9–8 |
| Mitch–Stover | 10 | 11 | Stover 102.58–97.76 | Mitch 7–4 |
| Birch–Tony | 15 | 16 | Tony 116.30–87.06 | Birch 10–6 |

## Dramatic Week 9 close game
Stew's 87.36–86.60 victory over Thommy (**0.76**) ranks **sixth closest non-tied recovered regular-season decision** in the 2016–2026 Week 9 canonical archive. The all-time narrowest non-tied result in that archive is also this pairing: Thommy over Stew, **142.92–142.76 (0.16), 2018 Week 7**. Exact margins should be computed with a cent-based integer conversion, not floating-point comparisons, in the eventual registry.

## Freshness dependency warnings
- `data/regular_season_rivalry_receipts_2016_2026w8_v1.json` remains a Week 8-labeled snapshot.
- `data/second_highest_weekly_score_losses_2016_2026w8_v1.json` remains Week 8-labeled and lists 141 fully paired weeks; Week 9 expands full weekly coverage to 142. The 2026 Week 9 second-highest scorer was **Stilly (116.66)** and **won** his matchup, so that week's score does **not** add a second-highest-score loss; however metadata and any derived current-year views require refresh.
- `data/expanded_records_verified_v1.json` is labeled as updated Nov 10 but contains an outdated rules sentence saying 2026 is incomplete at Week 8, despite the recovered games through Week 9. Replace stale prose without silently upgrading source certainty.
- `data/unified_record_book_2016_2026.json` stores Week 9 as `sleeper_api_staged_week_9`. A separate direct Sleeper read on Nov 11 returned `final` for all Week 9 matchups. Preserve ingest provenance and attach a separate finality verification ledger rather than rewriting history.

## Release priorities
1. Introduce a single versioned data-freshness manifest for season source cutoff, upstream-final confirmation and derived artifact as-of week, with automated detection of stale consumers.
2. Refresh rivalry receipts and second-highest-loss summaries from verified Week 9 canonical input. Maintain read-model compatibility with current manager and rivalry pages.
3. Validate manager identity and ties in all derived records, make historical scope labels visible, and certify original ESPN provenance.
4. Keep Phase 1 proposed records in research until deterministic tests and provider-source corroboration pass. Do not reintroduce voided-pick trade examples as performance records.
