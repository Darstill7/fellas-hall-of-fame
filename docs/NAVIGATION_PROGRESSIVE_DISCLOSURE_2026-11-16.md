# The Fellas — Navigation & Progressive Disclosure Redesign (2026-11-16)

Status: design specification; not a deployed UI change. Grounded in the existing `index.html` and `DESIGN_SYSTEM_v8.md`.

## Product promise

**Explore the league in 10 seconds; investigate anything in three taps; return home in one.**

Keep the historical depth, but never present the full database as an undifferentiated wall of content. The homepage is a concierge, not a sitemap or entire encyclopedia.

## Information architecture

Primary navigation (maximum six destinations):
1. **Home** — latest completed week, current standings and concise feature story; in-progress NFL games clearly marked as provisional.
2. **Managers** — 10 franchise hubs and manager comparison entry point.
3. **History** — seasons, championships, playoffs, draft museum and franchise timelines.
4. **Records** — record book, leaderboards, all-time analytics, Hall of Fame / Hall of Shame.
5. **Trades** — trade archive, verified greatest/worst trades, trade ROI and keeper context.
6. **Rivalries** — head-to-head results, signature games, manager-to-manager timelines.

Secondary navigation from contextual subnav rather than global menu: Weeks, Drafts, Awards, Shitter of the Year, Power Rankings, Analytics Labs, Player Halls.

## Three-depth rule

L1 Landing / discovery: descriptive section title, 2–4 headline facts, ONE featured card, 3–6 categorized entry cards. No long prose.
L2 Explore / compare: filters, searchable ranked tables, decade/season or manager selectors, compact cards and simple charts.
L3 Deep dive / evidence: complete ledger, narrative analysis, season-by-season trends, source provenance and corrections; dedicated URL.

Every L1 item links to a real L2 URL. Every L2 row links to a real L3 URL where underlying data exists. When data is incomplete, show an explicit provenance/coverage flag rather than invent a detail.

## Homepage wireframe — mobile first

1. Sticky compact header: F crest links to /; current section indicator; Menu. Height approximately 56–64px. Avoid oversized nav.
2. Single-line status strip: '2026 Season • Week 10 in progress' (only while games remain), update timestamp and next refresh scope. Never label a partially played week as final.
3. Hero: ONE big sports headline plus compact two-line synopsis and one CTA, linking to full story.
4. Scoreboard rail: swipeable week matchups or latest finalized week, with selected week and explicit live/final status.
5. 'Choose your path': six destination tiles, each with one-line explanation. This is the main homepage utility.
6. Current standings: top preview with 'Full standings' CTA. Avoid all metric columns on home.
7. Featured league moments: maximum three diverse cards (record, rivalry, trade/championship) with distinct content types and visible labels.
8. Managers: horizontal or condensed searchable manager list, with one row per manager and direct profile CTA; avoid ten giant full-bio cards on mobile.
9. Archive search / deep explorer: year selector and search button.
10. Footer: data coverage, last verified refresh, About, Back to top.

On desktop use a 12-column grid: 8-column main editorial flow with 4-column compact standings/scoreboard sidebar; break into one-column/mobile surfaces at <= 768px. Do not force sidebar content below dozens of paragraphs.

## Page templates

**Manager hub**
- Identity masthead with manager name, franchise, championships, seasons and all-time record.
- Immediately below: anchor tabs Overview | Results | Records | Trades | Drafts | Rivalries. Active-state underline and accessible overflow on mobile.
- Overview: 4 fact tiles, most notable season, featured rivalry, best/worst trade links.
- Results: season summaries, trend plot, full game logs only in deeper view.
- Records: verified record portfolio with category filters and rank.
- Trades: transactional summaries; separate true performance outcomes from voided-pick policy sanctions.
- Each deep record/trade links back to the manager and season.

**Records landing**
- Categories: Scoring, Streaks, Matchups, Championships, Luck, Drafting, Trading, Shitter.
- Featured record + three leaderboard previews; 'See all' goes to filterable category pages.
- Record detail includes ranking, plain-language metric definition, eligible date range, historical coverage status and source evidence.

**Season / championship**
- Season landing shows champion, standings, top score and turning point.
- Championship story is an article with section-jump anchors (Road, Turning point, Title game, Legacy), not a series of indistinguishable prose sections.

**Trades**
- Landing: most consequential, most lopsided, best keeper outcome and full verified ledger.
- L2: managers, season, players, trade type filters, confidence/coverage.
- L3: trade assets, immediate context, subsequent outcome, keeper implications and evidence.
- Never rank trades as poor solely because a pick was voided; policy history separate from on-field ROI.

**Rivalries**
- Select manager A and manager B; summary win-loss and scoring; rivalry chronology.
- Link to matchup box scores, season context and manager profiles.

## Navigation invariants

- Home crest is always visible/clickable.
- Sticky header does not take > 64px on mobile.
- Breadcrumbs below page header on deep pages: Home > Records > Scoring > [Record].
- On lengthy pages, compact 'On this page' links plus a floating **Back to top** control after scrolling (not covering content).
- Direct-entry pages work: page title, context and related pages show without homepage visit.
- In-site links preserve reasonable back path through native browser Back; avoid JS-only routing that breaks history.
- At end of any deep page, 'Related reads' offers 2–3 *different* paths and an obvious return to the section overview.
- Search finds manager aliases (e.g. Gurt = Stover; Tom/Thommy = Zach), record labels, seasons, major trades.
- All sections use consistent headings, cards, table patterns and CTA placement.

## Visual system

Retain existing dark navy, championship gold and restrained manager-specific accent. Gold indicates importance, not every clickable element. Use 3 typographic levels per card at most. Lead with numbers or headlines, not repeated multi-sentence intros. Use section eyebrow, clear H2, whitespace, divider and background change to make section boundaries unmistakable. Mix scorebug, leaderboard, chart, article, timeline, and manager card components. Dense data belongs behind 'View complete table' links.

## Acceptance tests

- Five-second test: new viewer can identify the league, current season status and six exploration options without scrolling extensively.
- Path test: homepage to any manager's verified record in <= 3 meaningful taps.
- Recovery test: from any record detail, Home in 1 tap, category overview in 1 tap.
- Mobile 375px: no horizontal page overflow; all primary controls >=44px tap targets; menus keyboard-operable; active state evident.
- No more than one long editorial paragraph in any homepage content section; articles can be long on L3.
- No hidden important action behind hover.
- Reduced-motion support; semantic headings; focus indicators; table captions; accessible tab labels.
- Scores reflect only completed football games as final, and provisional totals are visibly labeled.
- No broken links, duplicate IDs, empty tabs, or filter controls that don't function.
- Browser QA in Chromium and WebKit + independent mobile visual review before deployment.
- Existing canonical data validation must pass; redesign must not change statistical truth.

## Implementation order

1. Extract unified header, breadcrumb, section title, destination card and return navigation patterns.
2. Rebuild homepage content order and restrict text density; preserve existing canonical links.
3. Apply reusable template to Managers and Records first (highest navigation leverage).
4. Extend to History, Trades, Rivalries and related long-form pages.
5. Add sitewide cross-links, alias-aware search and completeness flags.
6. Run canonical data checks, link audit, keyboard/375px mobile tests and screenshot-based cross-browser review before merging or deployment.

Benchmark inspirations: ESPN's sport-focused navigational hierarchy, Sports Reference Hub's customizable discovery and deeper reference links, and editorial storytelling with strong article segmentation. No external site's proprietary design elements are to be copied.
