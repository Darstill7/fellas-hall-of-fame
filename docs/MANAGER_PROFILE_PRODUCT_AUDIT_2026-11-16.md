# The Fellas — Manager Profile Product Audit & North-Star Blueprint
Date: 2026-11-16
Branch: `design/discovery-navigation-v1`
Scope: Ten clean manager profiles at `managers/<slug>/index.html`, the shared `assets/manager-profile-tabs.mjs`, UI CSS, and canonical research sources. This is a source/architecture audit; a browser-verified screenshot comparison is still required. Do not merge merely because this document exists.

## Product diagnosis
The archive is stronger than the page experience. Each standard profile has roughly 13 static sections and references 17 scripts. The shared profile script (~100 KB) assembles additional navigation, a manager switcher, career highlights, biography, nickname, defining-moment, feature directory, ratings, and optional research panels. Several components use overlapping controls and injected CSS. The page should feel like a franchise homepage, not a pile of modules.

**P0 critical placement defect:** `mountManagerScheduleLuck(profileName,profileHero)` and `mountManagerLuckPerformance(profileName,profileHero)` insert two analytical panels directly *into the hero*. Move these to Advanced Analytics. The first screen must privilege identity, current-season context, career wins, titles, and an exceptional moment.

## What currently exists
- Static hero: manager nickname, short intro, titles and years, career W–L, verified-source note, Explore profile and All managers links
- Static chapter links: career story, seasons, rivalries, personal record book
- Dynamic: nickname explanation, manager switcher, career snapshot and selected headline cards, verified defining moment, optional Hall-of-Fame editorial narrative
- Dynamic: OVR/Madden rating card and historical rating progression
- Dynamic: six-tile manager hub (career, records, every season, rivalries, report card, trades and pickups)
- Dynamic: eleven research features in five accordion groups: championships/results, ratings, drafting/trading, rivalries, lineups/keepers
- Static and dynamic: long-form biography, trophy cases, titles/finishes, legacy résumé, franchise legends and notable players
- Static and dynamic: year-by-year results, regular-season and postseason history, weekly logs, head-to-head explorer, score/season comparisons
- Static and dynamic: roster acquisition, picks, trade receipts, waiver summaries, ESPN drafting, trade utility, keeper research, Start/Sit accuracy
- Static: source-qualified full legacy historical dossier preserved separately
- Advanced analytical modules currently in hero: career schedule luck; luck versus performance
- Coverage: `data/season_guide.json` verified 2026 through Week 9; current standings are available but not a prominent first-screen manager snapshot; career core and postseason books are available separately

## Primary problems
1. First-screen priorities are inverted by schedule-luck and luck/performance analytic panels.
2. 13 static sections, many injected components, and six CSS files plus runtime style fragments create unpredictable vertical rhythm and visual hierarchy.
3. Multiple competing navigation systems: global nav, legacy chapter nav, generated profile tabs, hero CTAs, manager switcher, six-tile hub, five accordion groups, focused feature back buttons, and separate dossier links.
4. Career information is splintered between hero, legacy résumé, record-books, playoff résumé, verified-history section, and ratings pages.
5. Career accomplishments are detached from comparative context: no conspicuous career rank, win percentage, PF, playoff record, years active, best finish and next historical peer side by side.
6. Current-season 2026 identity is underrepresented in the opening panel, even though the verified season guide has manager W–L, PF, PA, and Week 9 coverage.
7. Storytelling is distributed across the franchise intro, defining moment, career exhibit, biography, legends, featured deals and old dossier, sometimes repeating the same anecdote.
8. No distinctive portrait, crest or editorial franchise artwork in inspected static profile or main profile script; all ten largely share the same visual language.
9. Deeper data is sometimes not truly absent but hard to discover via hidden/tabbed/focused sections.
10. Incomplete-source notes are important, but occupy prominent real estate and may overshadow the numbers; attach concise inline confidence labels with detailed methodology under disclosure.
11. Fragment and browser-back behavior require testing where scripts move modules, open accordions and hide all but a selected section.
12. Avoid false cross-era comparisons: some ESPN postseason scores represent two-week aggregates; 2018 ESPN draft order remains unverified; no 2026 Week 10 games should be called final until canonical ingestion passes.

## North-star manager profile structure

### First viewport: Franchise identity and meaningful facts
- Brand/nav and small breadcrumb: The Fellas › Managers › [manager]
- Manager identity: name, meaningful one-line moniker, years active, 1 distinctive franchise crest/cover motif, championship emblem (only if earned)
- Five core figures with ranked context: career W–L and win %, verified titles, playoff W–L / berths if verified, 2026 W–L and placement (label provisional until resolved), one career milestone/league record
- Coverage line: '2026 through Week 9 · Archived regular-season results' and explicit season status
- Single main action 'Explore career' and secondary action 'Compare rival'; do not stack six equivalent buttons above content
- One short two-sentence evidence-backed 'Why this manager matters' narrative with 'Read career story'

### Section 2: This Season
- 2026 record, PF/PA, rank (only if reliable), completed results and current playoff picture
- last confirmed matchup and next scheduled matchup only with verified data and correct in-progress label; do not invent
- optional current roster/keeper impact link if source-backed, not necessarily a full live roster before integrations

### Section 3: Career at a Glance
- primary career numbers, win %, titles, finals, playoff record, weekly high, best/worst completed season
- tiny year-by-year W/L chart or chips that link to full season pages
- concise ranked context: e.g. '7th of 10 among eligible managers' only if calculated from shared canonical scope

### Section 4: Defining Moments
- 1 featured editorial story, 2 related moments with actual date/season and score
- title path, comeback, heartbreak or iconic trade depending on manager; avoid generic same-for-all copy
- link to original matchup, transaction, or verified season

### Section 5: Career Seasons
- completed-year cards/table (years, W/L, seed/finish, points, verified title) with one 2026 provisional card
- interactive year selection changes same page; never require another huge navigation page to know a finish

### Section 6: Rivalries & Games
- strongest rival based on qualified matchups, most frequently played opponent, closest/highest-scoring game with evidence
- choose opponent; series verdict; link to full Rivalry War Room
- tie-aware and alias-safe; historical former managers stay separate

### Section 7: Records & Honors
- championships, runner-ups, historical league records actually held, season records and record-book highlights
- prominently separate verified league records from personal highs and specialty analytics
- 'View full personal record book' leads to career-first book

### Section 8: Front Office
- signature trades, best documented draft, waiver/pickup, keeper; impact scores source-qualified and not represented as causal certainty
- expandable deep research for the complete 2016–2019 ESPN draft recovery and 2020+ Sleeper-era analyses
- honest no-data states for source gaps

### Section 9: Advanced Analytics & Research
- career Schedule Luck, Luck vs Performance, OVR history, lineup efficiency, model grades
- consistent analysis methodology drawer, accessible tables and source labels
- collapse by default and deep-linkable

### Appendix
- Original franchise dossier and raw game log, source registry, confidence, old era caveats

## Responsive interaction
- Mobile (375–430px): one-column semantic hero; 2×2 responsive core stats; segmented sticky anchor row with 4 essentials (Overview, Seasons, Rivalries, Records) and an 'All sections' drawer. No stacked overflow horizontal navigation. Top controls usable with >=44px touch targets.
- Desktop: 2-column hero editorial art/identity + scoreboard, sticky compact sidebar 'On this page', reading column; records and evidence may use wider tables.
- Use a single navigation implementation; do not create all legacy tabs and then hide them. One active location, clear Back-to-profile context, predictable browser history and focus.
- No scripts should unexpectedly move fundamental hero metrics below advanced sections when data finishes loading; reserve layout space and treat failed fetches explicitly.
- Number tabular, consistent thousands separators, year/era labels, source confidence where material; keyboard/aria and reduced motion.

## Competitive reference principles
- Sports Reference: quick, discoverable in-page navigation, fixed hierarchy and fast supplemental stat access.
- ESPN: identity first, short ranked summary metrics, separate overview/stats/bio/game-log functions.
- The Athletic: one strong lead story, contextual editorial prose and follow-on related reading.
- Avoid copying proprietary layouts/artwork. Make original Fellas identities and a cohesive visual system.

## Implementation plan, in order
P0:
- Remove `mountManagerScheduleLuck` and `mountManagerLuckPerformance` from hero; reparent them into one Advanced Analytics section with deep-link anchors, without removing data.
- Introduce one intentional profile information hierarchy shared across ten managers, based on semantic sections with stable IDs.
- Consolidate career summary and current-season scorecard; ensure clear cutoff labeling and user-facing rank rules.
- Remove competing navigation controls and runtime-hiding of duplicate menus, keeping one desktop/mobile scheme.

P1:
- Add a manager-specific 'career in numbers' summary and accessible season visual.
- Pull one curated 'franchise defining moment' above the fold with receipt link.
- Add verified rivalry verdict and best/closest/highest game cards.
- Reorganize front-office analyses into a small overview and expandable evidence chapters.
- Develop unique manager crests/cover art from original assets; apply without sacrificing data access.

P2:
- Add peer comparison, qualified rank and historical era toggles.
- Add current roster/recent matchup modules only after automated source freshness rules are defined.
- Build personalized related-articles links and an internal visit path score.
- Consider season-to-season grade/OVR comparison.

## Release criteria
1. Key information understandable within first phone viewport: identity, career record, titles, season status, primary route.
2. 5-second test: new visitor can name manager's record and achievement without clicking.
3. Three clicks or fewer: any manager -> every year; manager -> rivalry record; manager -> personal records.
4. Source verified: historical championship, record category, season cutoff, scoring era and aliases consistent across all sections.
5. No mixed-case broken anchors or hidden focus destinations; loading failures do not maroon the visitor.
6. Test all ten profiles in Chromium and WebKit at 390px, 768px, 1440px, with touch, keyboard and direct deep links.
7. Run independent visual review and canonical CI before merge/deploy. Source audit is not a live browser pass.

## Decisions to make before page redesign
- Art direction: athletic illustration/crest system vs typography-only badge system; distinct from real-person portraits unless supplied/licensed.
- Hero metrics exact 4–5 priority fields: career W-L, titles, playoff history, 2026, record.
- Whether manager profile includes verified live roster as a top-level tab; source coverage and refresh requirement first.
- Manager-specific editorial standout criteria and championship/record tie-breaking rules.
