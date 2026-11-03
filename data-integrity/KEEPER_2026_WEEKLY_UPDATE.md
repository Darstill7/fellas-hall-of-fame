# Fellas 2026 Keeper Research — weekly publication workflow

**Current verified through Week 8.** 2026 remains in progress; `researchScore`, public Keeper Decision grade, and postseason contribution are **null**.

## Source of truth

- Completed 2026 Sleeper team roster snapshots: `data/sleeper_roster_snapshots_2026_weekN.json` for each week from 1 through the latest completed regular-season week.
- Original keeper identities and draft rounds: `data/v9_draft_engine.json`. Its 2026 keeper started-points archive currently covers only Weeks **1–6**, so it is **not** the source for later weekly totals.
- Website data: `data/keeper_2026_website_research_v1.json`, deterministically built from the weekly roster sources.
- Published route: `analytics/keeper-decision-research.html?year=2026`; the page reads `throughWeek` from the generated data for headers, labels, and coverage.

## Ingest and update the next completed week

1. Fetch all **ten** Fellas Sleeper team rosters (league ID `1340027406009761792`) for the completed week. Preserve the starter and bench player IDs, positions, and scored points, with ten unique roster IDs and nine starters per team. Do not publish a week that has not fully scored.
2. Commit the snapshot at the next contiguous filename, e.g. `data/sleeper_roster_snapshots_2026_week9.json`. Do not skip weeks, synthesize missing point values, or treat a scheduled future matchup with zero points as a final result.
3. Run `node scripts/build-keeper-2026-website-research.mjs` to regenerate the website JSON. The builder discovers archived contiguous regular-season weeks, verifies all ten scored team totals and positional cohorts, keeps original-manager ownership attribution, and reconciles Weeks 1–6 against the historical draft engine.
4. Run `node scripts/build-keeper-2026-website-research.mjs --check` to confirm generated data parity. Commit the roster snapshot and regenerated website JSON together.
5. Check canonical CI and full Chromium/WebKit browser reports. The CI uses the same deterministic check and rejects any snapshot whose source does not match the published output.

**Failure is safer than publication of misleading scores.** If a team has no completed score, if a week is missing, if team scores and starter totals disagree, if an original keeper has an ambiguous player identity, or if partial-season grades become non-null, do **not** publish that update.

## Scoring and interpretation

- The 2026 page contains observed keeper starts and points **only while on the original keeper manager's roster**, with same-week positional-starter median context.
- The 2025 view remains a complete retrospective research index with championship-bracket-only contribution. Different seasons' scores are not directly comparable, especially while 2026 is incomplete.
- Never reassign later-owner player scoring to the original keeper manager after a trade or release.
- Do not assign a 2026 abandonment penalty before the complete release and injury/replacement evidence is reviewed. Do not infer a zero penalty from an empty list.
- No 2026 official Keeper Decision grade, manager OVR mutation, completed-season rating, or playoff result is authorized by the weekly update.

## Verification scripts

- `scripts/build-keeper-2026-website-research.mjs --check`
- `scripts/verify-keeper-2025-website-research.mjs` (runs after canonical 2025 research generation in CI)
- `scripts/build-keeper-weekly-ownership-ledger.mjs`
- `scripts/test-browser-release.mjs`

The website uses source-declared `throughWeek`, rather than requiring manual source edits in the page, its browser tests, or the keeper ownership ledger each week.
