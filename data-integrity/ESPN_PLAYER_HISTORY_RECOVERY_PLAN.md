# ESPN player, draft and transaction recovery plan (2016–2019)

## Current evidence
- League ID: **1313090** (The Fellas, original ESPN league).
- Already archived: original team owners and franchise names, standings and weekly opponent team scores, 2016–2019.
- **Not present in the imported files:** complete individual player rosters, weekly starters, original draft board, waiver/FAAB activity and trades.
- Existing player legends and player starts files begin in the **Sleeper era (2020 onward)** and cannot be extrapolated backwards.
- New on-site history: `data/espn_franchise_roster_provenance_2016_2019.json`.

## Next authorized recovery sequence
1. In ESPN, sign in as an owner/commissioner with authorized access to league **1313090**. Check season history for each year 2016, 2017, 2018, 2019.
2. Request/export 2018–2019 league views: `mRoster`, `mDraftDetail`, and, where supported, `mTransactions2` and box scores. Verify that each response actually contains entries; a 200 HTTP response alone does not prove coverage.
3. For 2016–2017, try ESPN's older `leagueHistory` endpoint and inspect whether roster/draft-detail fields are present. Historical responses can have final rosters only, limited weekly data or no transaction history.
4. Historical endpoints may require ESPN account authentication. **Do not publish or paste `espn_s2`, `SWID`, cookies, tokens or session credentials into the site, repository, or a public chat.** Use an authorized local session to export sanitized JSON/CSV; strip tokens, emails, contact details and unrelated private data before importing.
5. Save each raw export under a clearly labeled evidence manifest: year, ESPN view, date, response scope, number of roster/draft/transaction entries and owner ID mapping. Never infer missing starters from a final roster.
6. Normalize manager ownership with `data/manager_identity_map_v1.json`. Preserve Tom Schermerhorn separately from Zach Prescott/Thommy; keep all former managers' historical roster rights with the owner responsible that season.
7. Only publish ESPN player seasons and Mount Rushmore appearances once a roster or matchup source confirms the player belonged to that manager. Require the original transaction for an ESPN-era waiver or trade award.
8. Extend WAR only after checking week, player ID, position, starter-slot and league scoring-rule coverage.

## Public endpoint patterns (unofficial, may change)
- 2018–2019: `/apis/v3/games/ffl/seasons/{year}/segments/0/leagues/1313090?view=mRoster&view=mDraftDetail`.
- 2016–2017: `/apis/v3/games/ffl/leagueHistory/1313090?seasonId={year}&view=mRoster&view=mDraftDetail`.
- Some historical APIs now require authorized session cookies. Do not assume access without testing.

## Data integrity
The ESPN 2016–2019 scoreboard archive is *complete enough for matchup awards and rivalries*, but cannot supply individual player-award facts by itself. Existing Sleeper player accolades remain limited to their demonstrated source coverage.
