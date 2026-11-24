# Version 5.1 — Personal experience
Status: proposed development specification; production 5.0 remains unchanged.

## Current implementation audit
Production index.html has a native manager select, local preference, personal statistics, separate next-game and playoff cards, history links, activity, league pulse, standings, median disclosure, latest results, editorial feed, four explore shortcuts and a flat archive disclosure. Shared app-shell-v34 routes Team/League/Managers/News/More, with opt-in app=1 secondary routes. Manager profiles are historical franchise hubs. home-current-season-v1 is a compact completed-game projection, not a player roster. Preserve the canonical ledger, all archive URLs, legacy hash redirects, publication boundary and existing preference key.

## Proposed information architecture
Mobile primary navigation: Home, My Team, Scores, League, More.
Home: compact selected-team snapshot and matchup, latest published editorial, league headlines, weekly milestones.
My Team: persistent franchise switcher, roster, current matchup, performance, transactions, then franchise history.
Scores: current/archived week selection, five matchups, completed scoring; never infer live scores or projections from completed ledger.
League: official standings, playoff race, hypothetical median standings, managers, schedule, recent moves.
More: categorized news, records/Hall of Fame, trades/drafts/keepers, seasons, analytics/search, preferences and classic archive.
Desktop: same destinations with desktop header/sidebar; no overlay on content.
Historical profiles remain intact and independently accessible.

## Delivery sequence
1. 5.1.1 persistent accessible team switcher, no login, same preference key; support all ten canonical identities and league overview; keyboard, storage blocked, mobile touch and URL compatibility.
2. 5.1.2 read-only roster evidence adapter: verify current provider league, owner/roster mapping, player metadata, roster positions and slots. Distinguish current assignment from archived weekly starters. Timestamp UTC and display local freshness; missing or stale data explicitly labeled; never synthesize names, lineup, injuries, projections or ownership. Fetch lazily and avoid shipping full player catalog. Verify source/license and CORS before deciding between direct read-only provider requests and existing scheduled static projection. No credentials or paid infrastructure.
3. 5.1.3 navigation reordering and dedicated destinations; preserve existing routes and current hash bookmarks. Personal vs historical identity distinct.
4. 5.1.4 desktop and mobile density polish; editorial earlier on Home, consolidate odds/next matchup, label Avg. Points accurately.
5. 5.1.5 full canonical and visual certification, all 10 selections, keyboard, 320/390/430/1280 Chromium and WebKit, stale/offline data, current vs archived semantics, no regression to weekly updates, independent screenshots and commissioner release approval.

## Acceptance criteria
A visitor can choose a manager in two deliberate taps from home; returning visitor preference restored. Roster accessible in one tap from selected team; changing team never displays previous team data. Scores and standings within one tap of main navigation. Current data and historical archive clearly distinct. No unsupported player or ownership inference. All existing features remain reachable. No production change until approved and certified.

## Commissioner clarification — Sleeper remains the main platform
Roster management, live scoring, injury updates and transactions remain in Sleeper. The Fellas differentiates through personalized matchup context, playoff scenarios, comparative performance, front-office history, records and editorial entertainment. Keep roster as a secondary read-only snapshot with explicit timestamp; defer continuous roster synchronization and player-level live scoring. Prioritize navigation and analytical insights; no paid infrastructure or duplicated lineup management. Existing current roster evidence remains available but is not a prerequisite for the main personal dashboard.
