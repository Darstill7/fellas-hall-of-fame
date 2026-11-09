# Fellas Hall of Fame — Navigation & Editorial Quality Audit
**Date:** November 9, 2026  
**Evidence:** Source inspection on the `main` branch; this is an implementation backlog, **not** a claim that every responsive journey was manually tested.

## Existing strengths to preserve
- The homepage prioritizes **Championships/Hall of Fame** and **Records** rather than burying them behind advanced analytics.
- The championship anthology has its own reading style, year permalinks, verified-score presentation and editorial navigation.
- Current manager directory and all ten current manager profile pages are distinct from the archival manager source.
- Recent releases have source-backed 2025 draft return tiers and a **provisional** 2026 Week 8 dataset; do not treat either as a general scouting skill grade.
- Current CI provides Chromium and WebKit visual/canonical checks. Changes to routes or mobile interactions must be added to that check suite.

## Findings and ordered delivery plan

### P0 — Historical and editorial integrity
**Source evidence:** `docs/draft-intelligence-research-2026w8.md` identifies incompatible draft surplus baselines (2020–2024 versus 2025–2026); it also flags unavailable ESPN-era original-drafter starter credit. The championship anthology maintains season-specific stories.  
**Action:** Keep all player-value, keeper, playoff and championship claims sourced to named, dated receipts. Record the claim, source path, season, owner and verification status before rewriting each article. Never credit JMid with Evans's 2023 season. Never publish hypothetical keeper decision alternatives as facts.  
**Acceptance:** A ten-season checklist asserts winner, runner-up, exact final score, scoring-period format, MVP evidence, chronology, cited transactions and playoff margins. Claims without source receipts are softened or removed; no invented motives, quotes, trades or causality.

### P1 — Manager-to-history navigation
**Source evidence:** Every current manager page has an `Explore [manager]'s franchise` section and an archive. Draft Report Cards / Draft Legends were added on PR #161 (pending merge at the time this audit was created).  
**Action:** Preserve the profile's short career résumé above the detailed analytics. One recognizable `Draft Report Card` link should deep-link to that manager; `Draft Legends` should be discoverable once but not repeated in each sub-navigation. Keep current-manager identity and older ESPN history separate.  
**Acceptance:** On phone Chromium + WebKit, all ten profile → draft card deep-links land at the right manager, with heading visible below any sticky header; browser Back restores reading position, fresh navigation starts at the page top.

### P1 — Championship reading journey
**Source evidence:** `hall/championship-stories.html` has year-specific story controls, deep links to the trade museum and playoff history, and dedicated editorial CSS.  
**Action:** Keep the article as the primary reading experience. Show one compact year selector, one clear winner/score masthead, followed by the story. Move secondary research links after or within appropriate chapters, not above the narrative.  
**Acceptance:** Each of 10 story links opens the intended championship, displays a confirmed year/winner/final score, and permits copying/sharing that specific year URL; 320px and 390px mobile widths do not clip names, scores or article text.

### P1 — Homepage comprehension
**Source evidence:** `index.html` contains dedicated primary navigation and a homepage feature/discovery hierarchy. Source shows a broader collection of destination links; multiple navigation elements can be intentional in responsive layouts.  
**Action:** Maintain Championships and Records as the two most prominent destination cards. Keep Managers and Seasons immediately discoverable. Make advanced analytical tools available behind an optional `Explore more` section rather than filling the first screen with equally weighted actions.  
**Acceptance:** A first-time visitor can reach championship features, full Record Book, and any manager in at most two deliberate taps from the home screen. Navigation has touch targets at least 44px high; there is no horizontal overflow in supported phone widths.

### P2 — Record Book and manager record context
**Source evidence:** `analytics/records.html` contains expanded record and postseason sections; the manager directory links to Records.  
**Action:** Pair each relevant record with the owner and exact season, and deep-link to the manager or season where source evidence permits. Make postseason and `Shitter of the Year` labels unambiguous. Never equate finishing last in regular-season standings with the final losers-bracket placement.  
**Acceptance:** All record link targets exist and display the appropriate owner; postseason/regular-season category scopes are explicit. Historical absences do not appear as zeroes, and non-participating managers are not credited with results.

### P2 — Avoid visual debt while expanding Draft Legends
**Source evidence:** `analytics/draft-intelligence.html` and `analytics/manager-draft-report-cards.html` render source-backed data; PR #161 proposes a third dedicated Draft Legends experience.  
**Action:** Give each of the three destinations a single purpose: Draft Intelligence = methodology/league tables; Manager Draft Report Cards = individual receipts; Draft Legends = memorable, tightly edited gallery. Avoid duplicating the same full tables across all three pages. Use existing typography tokens instead of new decorative cover themes.  
**Acceptance:** Reader can identify the difference between the three pages from their first screen. The 2026 data is labeled W8/provisional on every page; older eras are not ranked against the new peer model.

## Editorial verification register template
| Year | Champion / finalist / score and format | Season-changing transactions (source) | Playoff turning point (source) | MVP (evidence) | Unverified or ambiguous claim | Action |
| --- | --- | --- | --- | --- | --- | --- |
| 2016–2025, one row per season | Check playoff ledger + full title score | Validate transaction IDs and dates | Confirm bracket and margin | Cite credited weekly points | Never fill gaps with narrative invention | Keep, qualify, revise |

## Release protocol
1. Prefer a small page-family PR over a site-wide cosmetic overwrite.
2. Expand canonical tests for each changed year/manager/record, and Chromium + WebKit tests for each new navigation or interface.
3. Require green checks on the **latest head commit** and no failed independent visual gate before merge.
4. Verify published Pages content separately from GitHub merge, including the correct live URL.
5. The draft release of PR #161 must remain isolated until its own gates pass; this audit does not overwrite it.

## Open research dependencies
- Exact 2026 keeper-lock date, keeper eligibility rosters, round-cost escalation and traded-pick ownership. These are required before true keeper decision grades.
- 2016–2019 verified weekly original-drafter starter credits. Do not assign all-time cross-era draft-return grades yet.
- Any championship anecdotes without dated transaction and matchup evidence remain editorial leads, not verified facts.
