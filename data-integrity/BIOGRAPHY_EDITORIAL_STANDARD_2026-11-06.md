# Fellas manager biographies — editorial standards and rewrite audit
**Approved direction:** Specific, story-driven, source-backed prose. Reader feedback on November 6, 2026 identified vague references like "2023 reshuffling" and "Chase Brown chapter" as confusing. A biography must explain *who did what, with whom, and why it mattered* rather than name-dropping players.

## Rules for published biography claims
1. **Begin with the manager's real tenure.** Historical account handles are not human ownership. Evans managed 2023; JMid's first season is 2024. Distinguish 2026 Week 8 career totals from Week 7-only research snapshots.
2. **Make trades legible.** State the date/season, named counterparties, receiving-side assets for each participant, and what roster composition changed. If a trade involved three managers, identify all three sides and explain that it is a multi-team exchange, not a two-team trade.
3. **Explain significance, not just roster movement.** Tie important trades to a verified keeper decision, season arc, or later usage *when there is documented evidence*; don't infer that a player or trade caused a title.
4. **Avoid empty shortcuts.** Forbidden writing patterns include "the Chase Brown chapter," "a reshuffling involving X/Y/Z," "moves involving several players," "part of the broader acquisition story," and "the portfolio of remembered moves" without a description of the exchange.
5. **Distinguish observations from judgments.** Recorded starter points after a trade or waiver pickup are observations, not full transaction value, positional WAR, an ex-ante process grade or championship causality.
6. **Don't invent missing deal components.** The trade museum lists player-receiving sides and may not capture FAAB transfers; current rules ban trading draft picks, FAAB can be traded and keeper eligibility follows traded players.
7. **Use named manager nicknames only** (Stilly, Stew, Thommy/Tom, Stover, Birch, Tony, Mitch, Kuhl, JMid, Scott), no personal surnames.
8. **Separate historical records from editorial interpretation.** Every title, season finish, W–L, starter point total, keeper selection and manager transfer needs a cited internal source or a documented commissioner ruling.
9. **No filler to reach a word count.** If a manager's transaction history is genuinely incomplete, emphasize verified championships, matchup patterns or season records instead of embellished trade stories.
10. **Designed for visitors.** The profile should lead with championship, regular-season record, and 2–3 defining moments. Deeper trade and player receipts belong behind direct links; a new visitor should not need to decode statistical jargon.

## Changes in this pass
- **Stilly:** October 26, 2023 Cooper Kupp → Tony for Mike Evans and Derrick Henry. September 24, 2024 three-for-three with Tom involving Christian McCaffrey and De'Von Achane; October 2 Jordan Love ↔ Chase Brown, 154.4 snapshot starter points in 10 starts. November 2025 three-team trade to Amon-Ra keeper, October 2026 Ja'Marr Chase reacquisition.
- **Stew:** 2022 receiver construction from named Evans and Birch trades replacing vague Justin Jefferson/Ja'Marr Chase wording.
- **Tony:** 2021 Joe Mixon exchange with Koble and 2023 Cooper Kupp exchange with Stilly replacing unconnected name lists.
- **Kuhl:** 2023 Stew trade involving De'Von Achane and Puka Nacua, plus documented 2021 trade with Evans, with explicit parties and assets.
- **JMid:** Real 2024 debut; source-backed September 17, 2024 Kyren Williams/Calvin Ridley acquisition from Stew for James Cook, no inherited 2023 Evans season.
- **Stover:** Documented September 12, 2024 trade with Stew for Davante Adams, alongside qualified Brian Thomas Jr. draft context.
- **Birch, Mitch, Tom, Scott:** Their current biographies mainly tell season-results narratives and were left substantially intact; avoid adding unverifiable transaction flourishes simply for equal length.

## Source / limitations
- `data/v9_trade_engine.json`: transaction IDs, dates, managers and modeled receiving-side assets.
- `data/trade_museum_stage66.json`: documented receiving-side assets and *snapshot* starter starts/points.
- `data/keeper_2026_website_research_v1.json`: Stilly's 2026 Amon-Ra keeper evidence through Week 8.
- `data/fellas_final_placements_2016_2025_verified.json`, `data/season_guide.json`: verified finishes and game outcomes.
- `data-integrity/COMMISSIONER_OWNERSHIP_AND_TRADE_RULES_2026-11-06.md`: historical tenure, FAAB, keeper and three-team transaction rules.
- The 2016–2019 ESPN trade archive remains incomplete. Biographies should never imply the absence of trades because receipts are missing.

## Outstanding editorial review
Review all 10 bios manager-by-manager against live pages, particularly player acquisition claims without a transaction receipt, how keeper rights affected strategic choices, playoff performance compared with regular-season dominance, and whether a contemporary manager would recognize the description as fair. The new `scripts/verify-biography-trade-narratives.mjs` blocks specifically verified claims from drifting but is *not* a substitute for human editorial review.
