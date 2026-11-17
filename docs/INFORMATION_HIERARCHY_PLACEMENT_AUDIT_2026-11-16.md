# The Fellas — Information hierarchy & placement audit
Date: 2026-11-16
Branch: design/discovery-navigation-v1
Scope: source-level audit; visual browser testing and complete route-by-route content audit are still outstanding.

## Principle

Each page must answer its visitor's most likely question before presenting specialty analysis. The first major section should match the page title and incoming navigation link.

Order standard: **Identity / question → essential answer → choice of paths → primary data → historical context → advanced methodology / research → related stories / return links**.

## Audited page flows and findings

| Entry page | Visitor intent | Finding | Action / disposition |
| --- | --- | --- | --- |
| Homepage `index.html` | Find a section or current league update | New discovery cards exist, but additional large editorial/season sections remain below; density still needs visual review | Preserve discovery, audit later homepage sections for duplication (P1) |
| Managers directory `managers/index.html` | Find a manager | Search and manager list immediately follow intro | Keep (good) |
| Clean manager profiles `managers/*/index.html` | Identify manager; explore results, records, history | Advanced dynamically loaded record/postseason panels appeared in hero before franchise wayfinding | **Fixed:** moved dynamic panels into optional deeper research disclosure after navigation on 10/10 pages |
| Legacy profile HTML `managers/*.html` | Historical deep encyclopedia | Extremely long page with many sections and snapshots; coherent entry links added in prior phase, but historical material still dense | Retain as deep archival path; comprehensive content consolidation (P1) |
| Manager record books `managers/record-books.html` | Check personal career and records | Specialized panels appeared before career results | **Fixed:** career snapshot first, then league achievements, signature records, postseason |
| Record Holders `analytics/record-holders.html` | Pick manager or see league leaders | Specialty trade and schedule luck chapters preceded manager finder | **Fixed:** manager finder immediately after cover; advanced research moved after primary archive |
| Manager record finder script `assets/record-holders-page.mjs` | See selected manager's records | **Root cause of complaint:** rendering inserted schedule luck before actual records; Birch's luck record also prepended | **Fixed:** expanded/established records first, specialty categories third; schedule luck collapsible under advanced metric and moved to end |
| All-Time Record Book `analytics/records.html` | Explore basic records | Trade revenge and schedule-luck research came before highest/lowest-scoring matchup lists | **Fixed:** scoring matchups first, advanced research moved to annex |
| Expanded Records `analytics/expanded-records.html` | Choose a manager, see record portfolio | Manager selector precedes 44-category lab | Keep (good); data coverage text through Week 8 needs synchronization with verified update (P1) |
| Legendary Records `analytics/legendary-records.html` | Browse curated historical stories | Editorial introduction and exhibit collection match page purpose | Keep; consider topical filters for 19 exhibits (P2) |
| Seasons directory `seasons/index.html` | Choose a season | Selection immediately follows overview and current-season links | Keep (good) |
| Rivalry War Room `analytics/rivalry-war-room.html` | Compare two managers | Two-manager selectors immediately precede results | Keep; stale 'through Week 7' coverage disclaimer must be refreshed only after ledger validation (P1) |
| Trade Museum `analytics/trade-museum.html` | Search historical deals / trade outcomes | A featured Stilly trade appears before trade browsing tools; story vs archive may be out of balance | Move browse/search and core filters above featured story after validating search scripts (P1) |
| Hall of Fame `hall/index.html` | Explore title history and exhibits | Clear choose-your-exhibit grid soon after hero | Keep (good) |

## New mandatory placement questions

1. Does the page's first substantive section answer the question implied by its title?
2. Is this a universal/core metric, or an interesting specialty statistic that belongs deeper?
3. Can a first-time reader find the primary action in less than one screen on mobile?
4. Do a hero, a specialty article and a second hero repeat the same story?
5. Does each deep section have an in-page anchor, evidence context and a return path?
6. Does ordering privilege one manager unnecessarily without a clearly labeled featured story?
7. Are source coverage and freshness labels correct for 2026, and do incomplete weeks remain provisional?
8. If a metric is dynamically rendered, is its *actual DOM insertion order* consistent with the editorial hierarchy?
9. If an accordion or disclosure is introduced, can hash links and keyboard users still reach its content?
10. Do record/category titles distinguish league-leading marks from personal bests, and single-season from career?

## Remaining priorities

P0: Run real browser interaction tests for dynamic JS rendering, deep-link disclosure opening, keyboard focus, and iPhone 375px layouts. Verify that deferred modules load and no data panels are hidden indefinitely.

P1: Trade Museum: surface browse/filter/search before a specific editorial trade. Check current chronology and last verified week in analytics, rivals, and season pages against canonical dataset—not by editing unverified figures to match a date.

P1: Manager profiles: de-duplicate repeated archival sections and establish a single canonical career overview. Compare clean routes and legacy HTML before removing any historical material.

P1: Homepage: limit competing features and add truly clear transitions. Check the hero, weekly issue, manager lists, greatest seasons and season command center for redundancy and repeated statistics.

P2: Comprehensive record taxonomy and topical filtering (scoring, matchups, streaks, championship, drafting, trading, fortune, adversity); page-specific recommendations and related reading.

## Release gate

These are source changes in a draft PR. Do not call them live until browser automation, canonical validation, cross-browser screenshot review, and GitHub Pages deployment pass. Keep older data and research intact until migrated and source-verified.
