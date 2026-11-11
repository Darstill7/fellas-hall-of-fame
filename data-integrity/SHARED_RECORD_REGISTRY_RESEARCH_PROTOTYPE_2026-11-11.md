# Shared record registry — research prototype (November 11, 2026)

This is a **read-only, explicitly provisional** bridge between the existing 44-category Record Book and a future automatically generated manager record portfolio. It is not a production replacement and contains no unreviewed website changes.

## How to run
```sh
node scripts/build-record-candidate-registry.mjs > /tmp/fellas-record-candidates.json
node scripts/verify-record-candidate-registry.mjs
```

The generator reads `data/unified_record_book_2016_2026.json`, computes 11 researched candidate categories and an index of category leaders by manager, and emits one JSON object to stdout. It does **not** overwrite the legacy 44-category dataset, manager profiles, standings, or official history. A separate five-minute, no-browser GitHub Actions workflow validates the expected leaderboards. It is deliberately not tied to Playwright installation.

## Prototype registry categories (11)
- Career weekly highs and lows.
- Career second-highest weekly scores.
- Career top-three-scoring losses and bottom-three-scoring wins.
- Weekly highs and lows in a completed season.
- Longest consecutive calendar-week league-high and league-low scoring streak in a season.
- Longest consecutive head-to-head **meeting** winning streak against one rival.
- Highest combined raw-score regular-season matchup.

Each category has an immutable ID, explicit scope, unit, competition-ranked leaders, **every tied number-one holder**, and source-specific evidence. `managerIndex` is derived from **the same category leaderboard records**, so individual portfolio claims cannot drift from the Record Book's claims.

## Design decisions
1. All 705 reconstructed regular-season matchups are eligible for pair-based records. ESPN postseason aggregate matches never count as single regular-season games.
2. Whole-league weekly rank categories use 142 scored-team-complete regular-season weeks: eight paired score performances in 2016, ten in ordinary 2017–2026 weeks. Excludes 2020 and 2021 Week 14 until the scoring-crown eligibility rule is formally decided (their original stored matchups and verified bye managers are preserved separately).
3. A tie for first shares rank 1. Next competition rank after two tied firsts is 3. All tied holders remain visible; first-ten *rank* values are included rather than truncating in the middle of a tie.
4. Completed-season categories exclude 2026. Consecutive weekly scoring titles require adjacent weeks within one season, not just consecutive appearances or rivalry meetings.
5. The canonical `Thommy` is the site manager labeled `Tom`; former `Schermerhorn` is never merged with him. Evans's 2023 records remain Evans's, not JMid's.
6. Raw ESPN and Sleeper scores have differing scoring systems. The combined-points record is a *raw* historical mark, **not** era-normalized.
7. Status remains `provisional-not-published` until cross-provider verification, source coverage, bye-week policy, owner identity, and future current-season increment rules are independently approved.

## Verified baseline expectations used by fast regression gate
- Mitch: 22 weekly high scores.
- Stilly: 20 weekly low scores.
- Tony: 19 second-highest weeks.
- Mitch: 5 weekly highs in completed 2025.
- Evans: 3 consecutive high-score weeks in 2016.
- Stew: 4 consecutive low-score weeks in 2023.
- Six different rivalry sides tied with six consecutive head-to-head meeting wins.
- Stew–Mitch 2025 Week 10 combined 332.62 raw fantasy points.

These claims are internally reproduced from the canonical ledger, **not independently certified historical provider records**.

## Release sequencing
Do not merge the research-only candidate registry into the official published Record Book without a source certification pass. First run the fast registry gate; second review the rank semantics and eligibility policy; third add signed source/coverage metadata and update the existing 44-category registry generator to share the common model; fourth render the same category objects and managerIndex in both the global Record Book and manager portfolios; finally add mobile Chromium/WebKit route and anchor tests. No current start/sit or keeper advice is included.
