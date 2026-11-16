# Trade Explorer — Visual Flow and Provenance Context Upgrade
**Research checkpoint:** 2026-11-16. **Release:** draft PR #234 only; not deployed.

## Implemented in the website
- `managers/trade-explorer.html`: a responsive multi-lane trade-flow exhibit, keeping each participant's sent and received assets distinct. Bilateral player-for-player trades derive the outgoing package from the counterparty's known receiving package. Three-party cases show explicit outgoing details only where supported; otherwise the page visibly says that source mapping is unavailable. FAAB-only transfers do not invent player returns, and the October 25, 2020 two-direction $1 transfer ambiguity remains.
- Four verified context panels: 2021 Thommy–Birch Jacobs transaction chain, 2023 Birch–Stew CeeDee/Pollard chain, 2025 three-manager Chase/Amon-Ra keeper linkage, and October 2026 Chase acquisition. Each includes literal transaction ID, source-related receipts, and clear limits. **2026 keepers are specifically Round 1 pick 8 for Stilly's Amon-Ra and Round 1 pick 4 for JMid's Chase**; no other historical keeper costs inferred.
- Manager names link to manager Trading Portfolios; each trade participant panel also links to `managers/record-books.html?manager=...`. The record-book page uses this exact query parameter to select a manager. Portfolio hero actions now include a Career record book link for the selected manager.
- Existing player journey and mobile back-to-results remain in place. Case file sharing, deep-link transaction IDs, historical/current-year separation and unanswered causal ratings are preserved.

## Evidence sources
- `data-integrity/trade-case-context-verified-v1.json` (four footnoted context entries).
- `data-integrity/trade-asset-chain-jacobs-chase-2026-11-16.json` (exact transaction chain; two 2026 first-round keeper receipts).
- `data-integrity/trade-2021-2023-playoff-extension-v1.json` (postseason-week credited starter points; Week 15 loss matters).
- `data-integrity/trade-2026-current-receipts-week9-final-v1.json` (current-year transactions; Week 10 unfinished).
- `data-integrity/trade-receipts-2020-2025-48-events-v2.json` (48 historical provider event IDs).

## Remaining strict boundaries
- The flow is a **receipt illustration**, not a proof of cumulative trade value, net improvement, keeper profit or championship causation.
- Completed Sleeper player-for-player exchanges may have FAAB components not shown in their provider summary; do not assert the absence of other considerations.
- Three-manager source ownership cannot be inferred from receiving sides alone unless explicitly verified.
- Earlier league 2016–2019 ESPN trade coverage is not in this explorer.
- 2026 Week 10 matchup/player production is not finalized; the site only uses strictly later, completed Week 1–9 scoring.
- Source parsing and internal file checks are not equivalent to actual Chromium/WebKit and visual acceptance.

## QA / release
- Inline Trade Explorer and Portfolio JavaScript parsed after each change.
- Source checks confirm flow panel, four distinct context cases, keeper badges, related-receipt links, career record book links and the browser regression coverage.
- `scripts/test-browser-release.mjs` now checks Lamb/Pollard receiving flow, 2025 three-manager flow, keeper receipts, record-book links, player journeys, deep links, and mobile overflow in Chromium and WebKit.
- **Do not merge** until a completed fresh CI run on the latest head proves canonical consumers, the new browser assertions, and the mobile visual screenshot artifacts pass.
