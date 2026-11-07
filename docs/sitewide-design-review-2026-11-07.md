# The Fellas — Sitewide Design Audit & Tomorrow's Roadmap
Date: November 7, 2026
Purpose: Evidence-based review of the current website, with prioritized fixes. Notes only: this PR is not a visual redesign or a production release.

## Review scope and confidence
Reviewed current main source for the homepage, Hall of Fame, Hall of Shame, Player Hall, all ten manager-profile HTML templates, directory, Record Books, title anthology, 2020–25 season pages, 2026 season, older ESPN history, trade and draft analytics, FAAB, lineup, keeper, report card, GOAT and legacy rankings, rivalries, search and supporting labs. Consulted the 85+-route canonical browser suite, the 320/390/768/1280 Chromium + Safari/WebKit visual suite, and actual GitHub CI logs. This is a code/structure and test-evidence audit, NOT a claim that a graphical browser displayed every released page to me. The public Pages site could not be directly opened in the web reader. Screenshots and device-by-device aesthetic verification remain necessary.

## Design vision
Build a prestigious sports museum: championship storytelling as the emotional centerpiece, manager identities as personal exhibits, Records as the factual backbone, and research as optional depth. A new visitor should immediately understand who won, which performances mattered, what makes a manager unique, and where to explore next. The best improvement is often reducing simultaneous choices, not adding more widgets.

Three-level pattern for all pages:
1. The story: title, defining accomplishment, concise context, one unmistakable primary action.
2. Explore: 3–6 labeled paths, a year/manager switch where helpful, a featured result.
3. Evidence: source provenance, full logs, analysis, archived tools, methodology in disclosures or dedicated research pages.

Global interface: deep navy and warm off-white, champagne gold ONLY for actual championship honors, restrained rust/💩 for verified Shitter of the Year outcomes. Maintain legible 16–18px mobile paragraphs, 1.6+ line height, 60–72 character editorial measure, tabular score numerals, 44px or taller targets, visible keyboard focus, no mobile horizontal overflow, and understandable back/next paths.

## Actual release findings — fix before claiming live
- **P0 PR #124 has failed Chromium and Safari canonical browser validation.** CI logged multiple manager profiles with “hero has duplicate or misleading navigation links” and timed out on an invisible “Other sections” disclosure at scripts/test-browser-release.mjs:2196. This confirms a navigation contract mismatch; repair the UI and update the test for intentional visible controls, not merely suppress the test.
- **P0 Homepage earlier PR #121 failed at 390px:** the first actual manager card began around 705–711px below the screen top. PR #126 is a new clean-main branch that should be retested at exactly 390px and Safari.
- **Championship stories:** original ten season articles merged. PR #125 contains long-form rewritten sports features and archived 2020–25 semifinal/final player box scores. Dedicated journalism fact-check green; require full browser/visual checks before merging.
- **Championship trophy cases:** PR #123 verified independently; release integration with the new profile branch must not duplicate the gallery or overwrite the anthology.
- **Hall of Shame:** polished design merged. Protect its separate identity, correct final-consolation award rules and rust aesthetic.
- **Maintainability signals, not proven performance failures:** current homepage has 19 embedded style blocks. Manager profile HTML loads 17 scripts on each template. Main Records HTML is ~86KB, Trade Engine ~72KB and global Search ~176KB. Measure before asserting slow runtime, but consolidate these after the release baseline is reliable.

## Page-by-page notes: entry, Hall and managers

| Route | Designer's input | Priority |
|---|---|---|
| / | Clear first screen: Hall of Fame, Record Book, Find a Manager. One strong editorial headline, not competing hero and “start here” CTAs. Featured championship moment. Preserve reliable 390px first manager card from PR #126. | P0 |
| /hall/ | Transform into museum foyer: gold historical trophy timeline, champion, final opponent/score, season and direct story for each year. More gravitas than a basic link grid. | P1 |
| /hall/championship-stories.html | Magazine reading width, true four-act stories, featured title-game score and champions. Visible verified MVP box-score feature for 2020–25, semifinal difference makers, actual trade receipts. Clear Prev/Next championship. No invented 2016–19 player MVPs. | P0 |
| /hall/shame.html | Preserve polished rust style, group real fails by outcome, trade regret and lineup misfortune; use the 💩 icon ONLY for the confirmed last-place consolation-bracket finisher, never simply a bad season. Readable and playful. | P1 |
| /hall/players.html | Clearly define why a player belongs: which franchise, which years, actual starter points and signature games. Separate NFL fame from verified league contribution. Add career manager/season deep links. | P1 |
| /managers/ | Nickname-first Hall of Fame plaques: championships, career record, playoff trips and defining identity, with a one-tap profile action. Stack cards on mobile rather than a cluttered mini-dashboard. | P0 |
| /managers/stilly/ | Lead with 2023 ring, 0–4-to-champion narrative and Kupp for Evans/Henry impact; 2023 title-game MVPs from verified player boxes. Keep franchise record and legacy before advanced stats. | P0 |
| /managers/tom/ | Four verified rings presented as a dynasty; the three-peat and 2024 fourth title have separate editorial chapters. Title count and trophy-gallery gold only here and on actual champions. Public nickname should remain consistent with route. | P0 |
| /managers/birch/ | 2019 league-best 11–2 and 4.72-point championship deserve a hero moment; contextualize 2018 title loss and repeat third-place finishes as history, not random stats. | P0 |
| /managers/tony/ | Present 2021 title, regular-season Jonathan Taylor cornerstone, and championship-week Mixon/Adams impact. Link to the specific verified trade receipts rather than generic “active trader” prose. | P0 |
| /managers/stover/ | 2022 championship, its decisive Stew rematch, and 2021 near-miss should be the narrative lead. Keep verified Gurt owner identity despite changing historical team names. | P0 |
| /managers/scott/ | 2025 champion in second season; show debut-to-title leap, Bijan/Purdy championship score contributions and no fabricated pre-2024 membership. | P0 |
| /managers/stew/ | Nonchampion profile still deserves a hero: verified high-win seasons, playoff trips, rivalry/record portfolio. Do not convey “no titles” as a blank or failed identity. | P0 |
| /managers/mitch/ | Showcase verified 2025 13–1 regular-season prominence and championship appearances, while distinguishing best regular season from title ownership. | P0 |
| /managers/kuhl/ | Spotlight real close games, playoff appearances and meaningful records rather than generic vanity rankings. Championship gold prohibited absent evidence. | P0 |
| /managers/jmid/ | First league season 2024, not 2023; 2024 scoring leader and 2.30-point semifinal loss are strong earned story anchors. Never attribute 2023 Evans data to JMid. | P0 |
| /managers/record-books.html | One visible manager context and “Records held / Peak games / Postseason / Source evidence.” Integrate with canonical Records; quick manager switch; avoid duplicated official numbers. | P1 |

**Shared manager-profile technical contract:** identity/championships/career record first, direct manager switch, champion-only title gallery after résumé, readable biography, six destinations, only then deep archive. Remove duplicate navigation layers only after preserving every old hash/permalink and proving that “Every season,” “Rivals,” “Records,” and advanced features actually open. This is the biggest quality investment.

## Records, ratings and comparison pages

| Route | Designer's input | Priority |
|---|---|---|
| /analytics/records.html | THE canonical Record Book front door. Search/filter Career, Single Game, Postseason, Season and Shame; each record shows title, holder, value, date, eligibility and evidence. Start with best records not full dense data wall. | P0 |
| /analytics/record-holders.html | Currently 44 expanded categories. Make an alternate holder view inside the canonical Record Book, not another ambiguous “official” book. | P0 |
| /analytics/records-archive.html | Rename clearly Archived Record Book 2.0; one prominent link to current records and a historical-scope explanation. | P1 |
| /seasons/unified-record-book.html | Historical methodology/era view of the canonical book, not separate rival source of truth. | P1 |
| /seasons/espn-records.html | Explicit old ESPN-era labels, pre-2019 scoring/rounding, verified years and missing data; don't imply old comparisons use the modern rules. | P1 |
| /analytics/expanded-records.html | Record-specific proof page: leaderboard, sample, calculations, year/source, return to category; rename “Lab” if it is actually the evidence source. | P1 |
| /analytics/goat-debate.html | Make the argument editorial: rings vs peak vs longevity vs playoffs. Distinguish user-adjustable opinion weights from computed verified values. | P1 |
| /analytics/legacy.html | Currently labeled ARCHIVED PROTOTYPE. Remove from normal “current” navigation after canonical OVR is stable; don't mistake a proposed model for the official score. | P1 |
| /analytics/power-ratings.html | Label current-season Power and all-time Legacy separately; weights, update date, record and years eligible visible. | P1 |
| /analytics/manager-madden-cards.html | Fun optional exhibit, not primary page design. Season OVR and career OVR need different labels and scope; cards must not dominate on phones. | P2 |
| /analytics/manager-report-cards.html | One powerful report card above the fold, then explanation and category sections. 2-manager compare without repeated controls. Don't lead individual profiles with Start/Sit. | P0 |
| /analytics/manager-performance-timeline.html | Actual career graph and title/playoff/awards annotations, year filter and links to manager profile. | P2 |
| /analytics/manager-league-benchmarks.html | “Compared to whom, when, and how many weeks?” must be answered beside every benchmark. | P2 |
| /analytics/franchise-encyclopedia.html | “Players who defined this franchise” with credited starts/points/year, clear pre-2020 gaps and link to player hall. | P1 |
| /analytics/historical-spreads.html | Clearly hypothetical, era-adjusted comparison, not authentic historic sports betting lines. Put teams/result before methodology on mobile. | P2 |

## Trades, drafts and decision labs

| Route | Designer's input | Priority |
|---|---|---|
| /analytics/trades.html | 48 button elements and 53 disclosures in current source suggest high discovery cost. Lead with featured historic trade, then year/manager filters and compact ledger. Show both sides, who sent what, when, credited starts, and gaps; not unearned trade “winners.” | P0 |
| /analytics/trade-museum.html | Editorial trade exhibit with genuinely consequential moves such as the 2023 Stilly/Tony exchange and 2025 three-manager Amon-Ra lineage; link actual transaction IDs and follow-on seasons. | P1 |
| /analytics/trade-lineage.html | About 40 disclosures. Start with searchable player, then single vertical chronological chain and asset provenance. Expand the full archive only by choice. | P1 |
| /analytics/trades/index.html | Trade ROI is one model view under Trade Museum/Engine, not a third canonical trade page. Show calculation scope, sample limitations and uncertainty. | P1 |
| /analytics/manager-trade-intelligence.html | Manager-specific deals as dates/counterparties/acquired/given/points; clear return to profile and confidence tags. | P1 |
| /analytics/manager-decision-audit.html | Use as detailed report-card evidence for drafting/trading/waivers, not another competing starting hub. | P2 |
| /analytics/drafts/index.html | Draft hits/misses in context, sorted by draft slot and later lineup outcomes; keep early ESPN gaps visible. | P1 |
| /labs/faab/index.html | Keep fun “FAAB Casino” voice, but distinguish $0 bids, free agents and awarded waivers; partial source coverage cannot become false official efficiency grades. | P2 |
| /labs/lineups/index.html | Result-changing starts and start/sit accuracy have different definitions; explain sample and availability. Advanced research, not a lead profile metric. | P2 |
| /analytics/manager-lineup-research.html | Source coverage, excluded data, methodology and official/research distinctions made clear before rankings. | P2 |
| /analytics/keeper-decision-research.html | Completed 2025 score vs provisional 2026 analysis; precise keeper history; avoid applying final-season grades to eight-week samples. | P2 |

## Seasons, yearbooks and weekly newsroom

| Route | Designer's input | Priority |
|---|---|---|
| /seasons/ | Every season as a chapter cover (champion, runner-up, most memorable result). Note that /seasons/2016.html through /seasons/2019.html were not found on main. Route the earlier years to actual ESPN origins/season chapters rather than implied 404 pages. | P0 |
| /seasons/2020.html | No. 6 Koble champion story, bracket, winner and score first; distinguish 7–7 regular season from playoff record. | P1 |
| /seasons/2021.html | Tony’s 4–10-to-10–3 change and trade-built roster plus 4.30-point final; easy cross-links to player MVP and transaction receipts. | P1 |
| /seasons/2022.html | Stover-Stew matchup/history, core four stars and 51.06 final margin; concise yearbook presentation. | P1 |
| /seasons/2023.html | Stilly 0–4 comeback, verified trade and 2023 Evans identity correction; not 2023 JMid. | P1 |
| /seasons/2024.html | 2.30 semifinal escape then 90.42 final blowout, title story CTA; preserve changing lineup context. | P1 |
| /seasons/2025.html | Scott’s second-year breakthrough vs four-time winner Thommy, Bijan/Purdy title-game contributions. | P1 |
| /seasons/2026.html | CURRENT/IN PROGRESS header with exact last verified week. All live playoff race and standings views should change together on the next ingestion, never suggest final placements. | P0 |
| /seasons/weekly-matchup-archive.html | Search by season/manager/week, narrow to one matchup, one permalink and evidence. Default full ledger scrolling is not inviting. | P1 |
| /seasons/espn-origins.html | Founding era as a historical exhibition: original founders, three-peat, scoring rule changes and per-year archive navigation. | P1 |
| /seasons/espn-draft-history.html | Recovered drafts with coverage and original team identity confidence; never convert missing pick info into a definite player claim. | P2 |
| /seasons/historical-awards.html | Year picker and recipient/rule/source; Shitter as final consolation loser; no final 2026 award yet. | P1 |
| /analytics/awards-show.html | A real Awards Room with memorable named plaques; “2016–2026 complete” must be carefully qualified while current season incomplete. | P1 |
| /analytics/this-week-history.html | Tie a given week to real past score dates, most dramatic close games, source links; mark refresh date. | P2 |
| /analytics/sportscenter.html | 2026 completed-week coverage, timestamp, headline recap, scoreboard and archive. “Latest” should mean truly latest imported week. | P1 |
| /seasons/all-time-schedule-swap.html | Fun hypothetical schedule explorer with explicit period, rules and no false historical record framing. | P2 |

## Rivalries and global discovery

| Route | Designer's input | Priority |
|---|---|---|
| /analytics/rivalries.html | Easy manager A vs B chooser, all-time record, closest game, most recent, signature chapter; no intimidating first-screen chart. | P1 |
| /analytics/rivalry-war-room.html | Deep matchup chronology and source receipts after user chooses a specific rivalry; clear return path. | P1 |
| /rivalries/stilly-vs-jmid.html | The rivalry must start in 2024; exclude Evans’s 2023 franchise-slot games from JMid historical head-to-head. | P1 |
| /analytics/search.html | Huge ~176KB HTML source merits performance measurement. Group results into Managers, Championships, Records, Trades and Seasons. Results should explain why they match, not flood with archive duplicates. | P1 |

## Design-system issues: specific cross-page work

1. **Consolidate redundant destinations.** Records / Recordholders / Record Book 2.0 / Unified / ESPN / Expanded should have one canonical front door. Similarly Trades / Trade Museum / ROI / Lineage / Manager intelligence, and overlapping Rivalries pages.
2. **Unify page CSS/components.** Audit homepage's 19 style blocks and profile 17 scripts; share headers, badges, trophy-year cells, source chips, filters, and article layouts. Consolidate only against saved visual baselines; no rushed sitewide cascade that breaks styles.
3. **Make every apparent navigation action functional.** PR #124's missing “Other sections” control is a measurable failure. One owner of active panel, URL hash, tab aria state and visible content.
4. **Prevent async layout jumps.** Trophy gallery and biography loads must not move Safari visitors away from anchored Seasons/Rivalries content.
5. **Differentiate confidence.** Verified, reconstructed, research-only, provisional and unavailable data need simple accessible labels wherever they occur.
6. **Add intentional exit paths.** Return to manager/year/exhibit and Prev/Next manager/season. No abandoned research pages.
7. **Honor accessibility.** Keyboard operation, reduced motion, contrast, touch size, 200% font zoom, and 320/390px overflow checks.

## Prioritized implementation tomorrow

**P0 — Release reliability before visual expansion.**
A. Repair PR #124 Chromium/Safari findings on duplicate hero navigation and invisible advanced disclosure. Do not mute tests. Restore direct links, full bibliography, authentic trophy stories.
B. Verify championship PR #125 on Chromium/Safari and all final story-year paths, then merge if clean; fact-check is already green. Cross-check all 12 player box scores.
C. Verify homepage PR #126, especially first real manager card placement, then merge if clean.
D. Confirm Pages publication on exact latest main SHA and final browser screenshot captures.

**P1 — Cohesive premium experience.**
E. Canonical Record Book information architecture, with 44 expanded categories intact.
F. Standardized profile and story visual components across Hall and Seasons.
G. Trades/lineage discovery redesign.
H. Rivalry and report-card first-visit simplification.

**P2 — Research and differentiation.**
I. Player Hall franchise credits, all-time career visualization, searchable archive.
J. Labs and GOAT debates as fun optional exhibits with transparent methodology.
K. Comprehensive accessibility/200% text QA and page speed measurement.

## Measurable acceptance gates

- [ ] Find any champion, final score and authentic championship story within two taps from Home.
- [ ] On every manager, visitor understands championships, career record and career story within 15 seconds; no data flood.
- [ ] Next/Previous manager works across all ten, including Thommy/Tom slug.
- [ ] No dead or duplicate controls; all six curated destinations actually open in Chromium and Safari.
- [ ] Every champion has actual trophy years; nonchampions have unique accolades but no fake gold.
- [ ] 44 expanded Record Book categories work, with postseason records/source receipts.
- [ ] 2023 belongs to Evans rather than JMid; Shitter rules based on last consolation result.
- [ ] Modern semifinal/final player box scores reconcile, and 2016–19 ESPN scores are not fabricated into player MVPs.
- [ ] 2026 current sections agree on last verified complete week; no false final outcomes.
- [ ] 320/390/768/1280 + Safari/WebKit have no horizontal scroll, unreachable control, cropped text or missing deep link.
- [ ] All check runs passed for actual merged commit and Pages truly updated before “published” claim.

## Review note

This report separates observed source structure and CI failures from proposed design judgments. It does not certify live browser rendering or every dynamic state. Final QA should annotate screenshots per route, viewport and browser and turn every finding into a reproducible issue. Preserve the foundation: **titles and records make it prestigious, biographies make it human, verified receipts make it credible, and clear navigation makes all of that enjoyable.**
