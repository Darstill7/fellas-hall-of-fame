// Read-only validation of 2020–21 true 13-week regular-season standings.
// This does not mutate source ledger, career summaries or official seed order.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const weekly=load('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const brackets=load('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const allPlay=load('data/all_play_schedule_variance_2016_2026w8_v1.json').allManagerSeasons;
const study=load('data/corrected_2020_2021_regular_standings_projection_v1.json');
const stories=load('data/championship_season_stories_2016_2025_v1.json').seasons;
const tonyFeature=fs.readFileSync('analytics/tony-2021-four-trades-one-ring.html','utf8');
const round=n=>Number(n.toFixed(2));
assert.equal(study.schema,'fellas-2020-2021-corrected-regular-season-standings-projection-v1');
assert.equal(study.status,'verified_projection_not_applied_to_legacy_regular_season_ledger');
const changed=[];
for(const year of [2020,2021]){
 const s=weekly[year],original=s.standings,prior=study.years.find(x=>x.year===year);
 const games=s.games.filter(x=>x.week<=13&&x.stage==='regular');
 assert.equal(games.length,65);
 assert.equal(prior.regularSeasonGames,65);
 assert.equal(s.games.filter(x=>x.week===14&&x.stage==='regular').length,4);
 assert.equal(prior.archivedRegularLabeledGames,69);
 assert.equal(prior.rows.length,10);
 const map=new Map();
 for(const g of games){
  for(const [manager,pf,pa] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
   const x=map.get(manager)||{manager,games:0,w:0,l:0,t:0,pf:0,pa:0};
   x.games++;x.w+=Number(pf>pa);x.l+=Number(pf<pa);x.t+=Number(pf===pa);x.pf+=pf;x.pa+=pa;
   map.set(manager,x);
  }
 }
 for(const [manager,x] of map){
  const corrected={...x,pf:round(x.pf),pa:round(x.pa)};
  const projected=prior.rows.find(p=>p.manager===manager);
  const archived=original.find(p=>p.manager===manager);
  const ap=allPlay.find(p=>p.year===year&&p.manager===manager);
  const seed=brackets.find(p=>p.year===year).seedByManager[manager];
  assert(projected&&archived&&ap);
  assert.deepEqual(projected.corrected,corrected,'True standings '+year+' '+manager);
  assert.deepEqual(projected.archived,{games:archived.games,w:archived.w,l:archived.l,t:archived.t,pf:archived.pf,pa:archived.pa});
  assert.equal(projected.officialSeed??null,seed??null,'Verified seed '+year+' '+manager);
  assert.equal(ap.completeWeeks,13);
  assert.equal(ap.actualWinCredits,x.w+.5*x.t,'All-play weekly results should already be correct');
  if(archived.games!==13)changed.push({year,manager});
 }
 assert.equal(map.size,10);
}
assert.equal(changed.length,16);
assert.equal(study.impact.affectedManagerSeasons,changed.length);
assert.equal(study.impact.removedWins,8);
assert.equal(study.impact.removedLosses,8);
assert.equal(study.impact.reclassifiedWeek14Games,8);
assert.equal(study.impact.completeRegularSeasonMatchups,130);
assert(study.impact.allPlayWeeksAlreadyCorrect);
const tony=study.years.find(x=>x.year===2020).rows.find(x=>x.manager==='Tony');
assert.equal(tony.corrected.w,4);assert.equal(tony.corrected.l,9);
assert(tonyFeature.includes('4–9 regular season')&&!tonyFeature.includes('4–10 season'));
assert(!JSON.stringify(stories.find(x=>x.year===2021)).includes('4–10'));
assert(JSON.stringify(stories.find(x=>x.year===2021)).includes('4–9'));
console.log('PASS 2020–21 regular-season reconciliation: 130 true games; 16 affected manager-seasons; 8 wins and 8 losses moved out of regular season; all-play already 13-week correct.');
