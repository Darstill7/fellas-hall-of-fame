# 2026 Weeks 8–9 — direct provider-final matchup reconciliation
**Checked November 11, 2026 against the connected Sleeper league (The Fellas; league 1340027406009761792, 2026).**
**Evidence type:** Direct connected provider read at audit time, compared to the existing canonical ledger. Does not certify older ESPN data or every other 2026 week.

## Provider finality result
Sleeper returns 5 paired head-to-head matchups, 0 unpaired rosters, and `status=final` with an explicit winner for **all five Week 8 matchups and all five Week 9 matchups**. Score reconciliation found no discrepancy in the values displayed below.

### Week 8
| Matchup | Final |
|---|---|
| Stilly over Birch | 113.58–96.90 |
| JMid over Kuhl | 141.68–82.38 |
| Scott over Thommy | 112.56–106.34 |
| Stew over Stover | 134.16–79.10 |
| Mitch over Tony | 123.16–99.30 |

**Week 8 highest score:** JMid 141.68.

### Week 9
| Matchup | Final |
|---|---|
| Stilly over Kuhl | 116.66–77.54 |
| JMid over Scott | 148.74–109.94 |
| Stew over Thommy | 87.36–86.60 |
| Stover over Mitch | 102.58–97.76 |
| Tony over Birch | 116.30–87.06 |

**Week 9 highest score:** JMid 148.74.

## Canonical provenance caveat
`data/unified_record_book_2016_2026.json` still contains the source tag `sleeper_api_staged_week_9` on all Week 9 rows, which was appropriate at the time of staging but is now superseded by this separate provider-final cross-check. **Do not edit raw lineage tags retroactively.** Add a second provenance field or a versioned finality evidence register on the future canonical rebuild, carrying date of check, score, provider state, paired-matchup count, and current-league identity mapping.

## Research implications
- JMid's consecutive 2026 Weeks 8 and 9 weekly high scores are verified against direct Sleeper final scores; the current provisional league record is Evans's three consecutive league-high weeks in 2016, still awaiting original ESPN receipt verification.
- These provider final scores support release of Week 9 freshness for current 2026 team-score analyses. Any historical all-time leaderboard still requires consistent treatment of 2016's eight-team league and the 2020/2021 bye weeks.
- Historical owner mapping used in this check: `JMidd → JMid`, `Sheffla → Scott`, `DillionPanthers15 → Stover`, `thommy → Thommy`, `Darstill → Stilly`, and other existing canonical mappings.
- This read does not verify individual starter lineup correctness, stat-correction history, or original transaction timestamps.
