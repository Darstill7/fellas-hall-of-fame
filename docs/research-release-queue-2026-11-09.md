# Fellas Release Queue — One Validated Release at a Time

**Updated:** November 9, 2026. Maintained in staging; this file is **not** part of the deployed website until its branch is reviewed and merged.

## Operating cadence requested by the league commissioner

1. **Check existing release gates first:** confirm the current head SHA of each open PR and canonical, journalism, Chromium/WebKit visual outcomes. Never infer health from previous commits or green checks on another head.
2. **Release one ready package at a time:** mark draft ready and squash merge only if current-head required checks are completed/success and GitHub reports the PR mergeable. Recheck remaining PRs after each merge for conflicts.
3. **Keep research in staging:** while long browser jobs run, gather league evidence and prepare the **next one** research/exhibit package on an isolated branch. **Do not open another PR** or introduce more browser CI jobs until the current queue is reconciled.
4. **Source discipline:** keep 2016–17 two-week ESPN final scores separate from single-week records, respect 2020/21 missing Week 14 team scores, keep Evans in the historical 2023 seat, and treat 2026 as through Week 8 until the canonical snapshot is refreshed.
5. **When anything is red:** read the failing step and job log, make only the targeted correction, rerun the latest head, and keep that PR unmerged; don't change research and production UI on the same PR without necessity.
6. **Upon green:** merge and verify the SHA. Open at most **one** next staged PR after the previous package clears and check its gates before moving to another. Do not claim a GitHub Pages deployment is live unless independently verified by an authoritative Pages result or public URL check.
7. **Research stays distinct from awards:** a recovered bracket scoring record, draft outcome or provisional scoring streak is not a manager skill award or counterfactual MVP.

## Current workstreams (states must always be read live)

| Workstream | Reference | Intended next action |
| --- | --- | --- |
| Manager navigation / story-first championship reading | PR #171 | Finish canonical and visual gates; merge only green |
| Championship seeds and title paths | PR #175 | Finish canonical/visual checks; merge only green |
| Recovered winner-bracket result dataset | PR #173 | Merged into main, use as source for staged exhibit |
| Scoring consistency (2016–2026 W8) | PR #174 | Merged into main, cite in next record-book editorial pass |
| **Next staged package** | `stage/record-book-postseason-moments-2026w8` | New `analytics/postseason-moments.html`, modest link from existing Record Book postseason section, Chromium/WebKit tests. No pull request yet |

## Staged feature scope: Postseason Moments

- **Close games:** recovered championship-bracket games, the closest established 2025 Birch 120.52–119.80 Tony result (0.72).
- **Largest margins:** headline 2024 Thommy 205.30–114.88 Stilly final (90.42).
- **Closest finals:** single-week finals only; 2016 and 2017 aggregates clearly separate.
- **Manager view:** one observed closest bracket result per current manager, with recovered count labeled as a limited sample.
- **Source:** `data/postseason_winners_bracket_record_receipts_2016_2025_v1.json`; no hardcoded per-row speculative records.
- **QA:** desktop/phone, Safari WebKit, category switch, manager filter, 390px horizontal overflow, and nearest-score source validation.

## After that package

**Next evidence preparation (no separate PR yet):** a restrained Record Book `Scoring Consistency` feature fed by `data/scoring_streak_research_2016_2026w8_v1.json`. Show JMid 2024's 13 straight regular-season games above 100, Mitch 2025's 12 straight games at 105+, and Stew 2026's verified 8/8 at 105+ as a provisional snapshot. Respect four missing 2020–21 team-week scores. Do not turn this into keeper or lineup advice.

**Next editorial pass:** manager-by-manager historical episodes from these receipts (Tony 2024–25 narrow playoff exits, JMid 2024 two-game swing, Stew 2019 semifinal/final contrast) only after the manager-profile source contract is reconciled.

**Scheduled monitoring:** An existing daily Fellas GitHub sync is part of the project; this staging plan does not alter its schedule or assert that an unattended process will perform unlimited continuous merges between conversations.
