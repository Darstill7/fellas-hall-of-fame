# Fellas Hall of Fame — Page-by-page usability audit and implementation

**Date:** November 9, 2026  
**Scope:** Public site information architecture, source-backed interactive journey checks, desktop/tablet/mobile layouts and the all-ten championship reading experience. This is a **source inspection and CI regression plan**. Do not describe it as a manual live browser audit or a verified public deployment until Chromium/WebKit and Pages checks finish.

## Landing priorities and navigation

| Destination | Visitor need | Source-checked observation | Action / status |
| --- | --- | --- | --- |
| `index.html` | Reach Championships and Records quickly | Site already exposes Hall of Fame, Record Book, Managers and Explore; mobile manager directory is first-screen aware | Keep this editorial order. Existing visual test checks 390px home-to-Hall and home-to-Manager journey; no additional homepage buttons added |
| `hall/index.html` | Understand the hall and select a title | Championship Stories and Records are primary tiles; 2016–2025 trophy links have year queries | Preserve prominence; ten story URLs source-checked |
| `hall/championship-stories.html` | Read one excellent championship story, then browse others | A 10-tile archive formerly appeared **above** the selected feature, competing with the actual article | **Fixed:** one compact picker above article; decade archive relocated below the full story; all-ten season URL/score browser checks added |
| `managers/index.html` | Find a manager quickly | Ten named directory cards with search and minimum card-size regression checks | Preserve cards and simple search; verify Home → Managers → selected profile in browser |
| `managers/{slug}/index.html` (all 10) | Learn the manager identity, championships, important records | All ten have h1, main, skip link and nine internal chapter anchors; profile HTML linked directly to mid-page Draft Report Card hashes | **Fixed:** all ten profile-to-draft-report links now use a manager query rather than a forced anchor scroll |
| `analytics/manager-draft-report-cards.html` | Open a specific manager’s draft report | Destination previously invoked `scrollIntoView()` on the `#manager` hash, landing halfway down the page | **Fixed:** `?manager=...` presents that manager’s report **first** and highlights it without autoscrolling. Old hash/bookmark links stay valid |
| `analytics/records.html` | Browse career/season/postseason records | Existing category shortcuts and independent visual regression for one sticky header | Retain concise category labels and source-based records; avoid fixed double headers |
| `analytics/manager-madden-cards.html` | Browse manager OVR and compare eras | Existing OVR clipping/fit checks and season-record input; historical data guarded | Keep advanced data behind its own route rather than manager profile front screen |
| `analytics/draft-intelligence.html` and `analytics/draft-legends.html` | Understand draft receipts versus highlights | Separate research and gallery destinations; 2026 figures provisional through Week 8 | No speculative manager skill claims; no redundant homepage navigation |
| `analytics/keeper-tracker.html` | Quickly know what round a keeper costs | Released separately with just names/rounds and 2027 conditional round | Preserve simplicity; no starter points, grades or keep recommendations |
| `hall/playoff-heroes.html` | View championship contributor source receipts | Two-round 2020–25 starter samples only | Keep clearly labeled; not a substitute for the main championship story |
| `seasons/` and season pages | Verify standings and playoffs by season | Year links and season chronology already have dedicated gates | Preserve source-specific coverage limitations and championship outcome rules |

## High-impact defects resolved in this PR

1. **Article priority:** Ten-year championship directory no longer separates year selection from the article; the full feature is the main content.
2. **Halfway-down landings:** All 10 manager profile Draft Report Card destinations use a clean `?manager=` query. Requested manager is shown at the beginning of the report list instead of a forced native hash scroll. Deliberate legacy `#anchor` sharing remains available.
3. **Madden-style season-card navigation:** The manager profile rating module previously linked to the league-wide season cards with `#records-heading`, causing a new page to open far below its header. The link now keeps `?manager=` but removes the forced anchor jump, allowing the receiving page to start at the top.
4. **Accessible year switches:** Selected championship feature receives programmatic focus (without a sudden keyboard scroll), then scrolls to its masthead; respects reduced-motion preference.
5. **Regression coverage:** Browsers check article-before-archive, all ten distinct shareable championship year URLs, four feature chapters and official final scores, focused draft-report landing for Stilly and Thommy, and top-of-page manager navigation.

## What the current QA does—and does not—prove

- Existing visual suite covers Chromium phone/tablet/desktop and WebKit phone, profile touch targets, navigation headers, directory card dimensions, championship story readability and record entry points. Newly added checks must pass on latest commit before merge.
- Historical chronology and scorer counts are audited independently under the separate editorial PR. A visual pass cannot validate claims about trades, winners or game-by-game scoring.
- A green CI does **not** alone confirm that the public GitHub Pages website has deployed; that requires separate Pages deployment evidence and ideally an independent public-URL browser check.
- Not manually reproduced in this pass: every possible mobile-browser Back/Forward scroll restoration variant, all external outgoing links, and individualized 2016–2019 transaction histories without sources. These are remaining checks, not green claims.

## Required release gates

1. Story archive still exposes all ten seasons and remains swipeable on a 390px screen, but is positioned after the article.
2. Each year `2016…2025` renders the matching source-backed final score, four story chapters, exactly one selected year and `?year=YYYY` URL.
3. All ten manager profiles have unique accessible headings and clean links to `?manager=slug` report-card destinations. A fresh navigation starts at the page top.
4. Source-backed ESPN and Sleeper playoff scoring scope remains intact; no article rewrites can invent player points for ESPN years.
5. Canonical, journalism and visual workflows pass for the latest head SHA; then the site may be merged. Public deployment remains a separate confirmation.
