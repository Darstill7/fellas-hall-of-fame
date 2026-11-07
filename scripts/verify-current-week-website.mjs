// Guard current-season site-wide freshness; intentionally frozen Week 7 artifacts
// live under explicit -archive.html names and must not replace current-week pages.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const canonical=read('data/unified_record_book_2016_2026.json');
const mirror=read('data/season_weekly_matchups_2016_2026_v1.json');
const race=read('data/playoff_race_v1.json');
const guide=read('data/season_guide.json');
const luck=read('data/all_time_luck_ratings_v1.json');
const games=canonical.games.filter(x=>x.year===2026&&x.stage==='regular');
const week=Math.max(...games.map(g=>g.week));
if(!Number.isInteger(week)||week<1)throw Error('No current completed season week');
for(let w=1;w<=week;w++)if(games.filter(g=>g.week===w).length!==5)
 throw Error('Canonical league Week '+w+' is not finalized with five matchups');
if(race.verified_through_week!==week)throw Error('Playoff forecast out of date: '+race.verified_through_week+' vs '+week);
const scope=mirror.bySeason['2026'];
if(scope.regularGames!==games.length||scope.standings.length!==10)throw Error('Season mirror has stale matchup count or fewer than 10 managers');
if(guide['2026'].games!==games.length||!guide['2026'].summary.includes('Week '+week))
 throw Error('Season guide did not refresh to latest week');
if(!String(luck.scope).includes('Week '+week))throw Error('All-play/luck ratings still use an older current-week sample');
for(const [manager,row] of Object.entries(race.teams)){
 const name=manager==='Tom'?'Thommy':manager;
 const found=scope.standings.find(x=>x.manager===name);
 if(!found||row.w!==found.w||row.l!==found.l||Math.abs(row.pf-found.pf)>.01)
  throw Error('Cross-page source record mismatch for '+name);
 const annual=mirror.managerAnnual?.[name]?.find(x=>x.year===2026);
 if(!annual||annual.games!==week||annual.w!==found.w||Math.abs(annual.pf-found.pf)>.01)
  throw Error('Manager profile annual stats not updated through Week '+week+' for '+name);
}
const sourceRoutes={
 'analytics/playoff-race.html':'../data/playoff_race_v1.json',
 'analytics/sportscenter.html':'../data/season_weekly_matchups_2016_2026_v1.json',
 'seasons/2026.html':'../data/season_weekly_matchups_2016_2026_v1.json'
};
for(const [path,source] of Object.entries(sourceRoutes)){
 const html=fs.readFileSync(path,'utf8');
 if(!html.includes(source))throw Error('Current page relies on stale embedded snapshot: '+path);
 if(html.includes('ARCHIVED OCTOBER 27, 2026'))throw Error('Current page displays obsolete Week 7 as current: '+path);
}
const homepage=fs.readFileSync('index.html','utf8');
if(homepage.includes('Both linked features are archived at Week 7')||
 !homepage.includes('Both views now read the verified season ledger'))
 throw Error('Homepage still points visitors to stale weekly media or descriptions');
for(const archive of ['seasons/2026-week7-archive.html','analytics/sportscenter-week7-archive.html'])
 if(!fs.existsSync(archive))throw Error('Historical Week 7 snapshots must remain available');
const update=fs.readFileSync('scripts/apply-reviewed-sleeper-week.mjs','utf8');
if(!update.includes('rebuild-playoff-race.mjs'))throw Error('Weekly pipeline lacks playoff model refresh');
console.log('WEEKLY WEBSITE PARITY PASS: Week '+week+', '+games.length+' completed games, 10 profiles, standings, luck, season guide, race, homepage, season page and SportsCenter aligned.');
