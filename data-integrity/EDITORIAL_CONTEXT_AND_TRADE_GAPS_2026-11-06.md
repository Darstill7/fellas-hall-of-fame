# Fellas — Reader comprehension and missing-context audit
**Review date:** November 6, 2026. **Source scope:** main-branch 2016–2026 Week 8 archive and archived trade model. Changes are an editorial presentation pass, not a regrading of trades.

## Critical observation
The site often presents a sourced *number* without enough context to tell the story. In particular, manager profile trade highlights displayed a player list and observed starter-point edge without the counterparty, opposite side or whether the exchange was complete. The deeper research panel did show a counterparty for three fully represented nonprovisional trades, but required multiple disclosures and excluded partial evidence.

## Recovered evidence / coverage
- `data/v9_trade_engine.json` contains **101 modeled manager trade sides across 51 trade IDs** (2020–2026).
- Only **40** transactions have at least one qualifying nonprovisional source-verified side and numeric direct edge in `tradeEvents`; some of these contain only one certified side.
- All 10 active managers have qualifying historical draft records, but **Scott has no qualifying nonprovisional positive trade-side candidate** in this model. His missing trade highlight must not hide his verified waiver highlight or suggest he made no trades.
- The trade-side `assets` arrays are modeled receiving-side assets, **not** full original order receipts. The complete-side flag means two qualifying sides were identified, *not* that picks, FAAB, keeper implications, or all assets were independently recovered.
- The expanded profile trade list now uses up to 10 recent qualifying pre-2026 events, with date, counterparty (or explicit unknown), both recorded receiving sides when present, source-completeness warning and archive link. It doesn't invent 2026 certified marks.
- The profile's compact trade-highlight renderer now handles waiver and trade evidence independently, shows confirmed counterparties where present, and labels the observed starter-point edge as **not** a trade decision grade.

## Example narratives supported by archival sides
- **2025-09-23, Stilly ↔ Stew:** Stilly's modeled receiving side lists Ja'Marr Chase and Chase Brown; Stew's lists Jahmyr Gibbs and RJ Harvey.
- **2025-11-12, Stilly ↔ Stover:** Stilly's side lists Brian Thomas Jr.; Stover's lists Stefon Diggs.
- **2024-09-17, JMid ↔ Stew:** JMid's side lists Calvin Ridley and Kyren Williams; Stew's lists James Cook III.
These examples do not prove the list is the *entire* exchange.

## Content questions for the commissioner (priority ordered)
1. **Trade receipts:** Can the league export provider transactions from all available Sleeper seasons with original `adds`, `drops`, draft picks and FAAB movement? This distinguishes complete exchanges from scored receiving-side fragments.
2. **2016–2019 trade/waiver archive:** Is there an ESPN transaction history export, league emails, screenshots or old trade messages? Missing evidence should stay `unavailable`, not `0 trades`.
3. **Multi-team/pick-only/FAAB-only trades:** Were any completed as actual exchanges? Some historical transactions have blank player assets; their classification is unresolved. Confirm before adding them to trade leaderboards.
4. **Trade results:** Should the default say **“received / sent”** using provider-confirmed asset direction, or retain **“recorded receiving sides”** until every relevant trade's direction and all components are certified?
5. **2026 current season:** Should in-progress trades be shown under a clearly labeled **Current-season transactions (ungraded)** area, separate from retrospective complete-season comparisons?
6. **Keeper transfer details:** Which trades carried keeper rights, draft-pick cost obligations, or keeper restrictions? Starter points do not capture those costs.
7. **Historical schedule:** The audit contains two Week 14 2020/2021 unpaired roster-score cases while a previous commissioner note says they were playoff byes. Preserve the confirmed bye interpretation for W–L but make the game-vs-bye scope explicit beside any seasonal counts.
8. **Drafts:** Do visitors want each draft player's original selection, round, overall pick, keeper designation, and **eventual franchise impact** displayed together? Some older ESPN records identify players but not reliable 2018 pick order.
9. **Waiver records:** Do we have dates/bids and whether each acquisition was a paid FAAB claim, $0 waiver, or free agent? Highlight observed starts without implying it was necessarily a waiver win.
10. **Rivalries and playoffs:** Is a matchup regular-season, playoff championship bracket, or consolation? All-play standings and combined head-to-head totals should not silently mix these.
11. **Historical ownership:** A manager may inherit a team mid-season. Distinguish franchise slot vs actual owner; JMid's 2023 draft was not originally his.
12. **Reader navigation:** On every key page, is it obvious how to (a) find another manager, (b) see who a trade was with, (c) return from a research drilldown and (d) find evidence sources?

## Editorial minimum for future profile trade cards
**Required:** date/season, manager, counterparty or explicitly unverified, separately labeled receiving and opposing assets, trade-ID-linked source, and a caveat about missing components. **Optional when source-certified:** original sent assets, draft picks, FAAB, keeper implications, start dates, outcome window, games played. Never use observed points alone to label a “winner.”

## Release and audit gates
- Keep the source ledger immutable. No award/winner, transaction type, player direction, trade-grade or 2026 final claim is invented.
- Check all ten profile trade sections, particularly Scott's unavailable trade candidate with intact waiver evidence; validate JMid and Stilly counterparty examples.
- Fault-inject unavailable/corrupt trade and waiver sources independently. A missing trade source must not hide an otherwise good waiver record and vice versa.
- Preserve 2016–2019 ESPN scoring and identity caveats and 2026 incomplete-season labels.
- Full GitHub canonical browser + visual tests must pass on the same SHA before release.
