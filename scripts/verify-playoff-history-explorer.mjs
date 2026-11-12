import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const weekly=read('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const espn=read('data/verified_espn_playoff_brackets_2016_2019.json').seasons;
const sleeper=read('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const archive=read('data/playoff_explorer_verified_2016_2025_v1.json');
const restored=read('data/recovered_winners_bracket_2020_2021_v1.json').records;
const norm=x=>x==='Tom'?'Thommy':x;
const brackets=[...espn,...sleeper];
assert.equal(archive.seasons.length,10);
assert.deepEqual(archive.seasons.map(x=>x.year),Array.from({length:10},(_,i)=>2016+i));
let counted=0,missing=0;
for(const year of Array.from({length:10},(_,i)=>2016+i)){
 const s=archive.seasons.find(z=>z.year===year),b=brackets.find(z=>z.year===year);
 assert.equal(s.champion,norm(b.champion),'champion '+year);
 const seeds=b.seedByManager,participants=(b.participants||b.seeds).map(norm);
 const byes=(b.byes||[]).map(norm),semis=(b.semifinalists||[]).map(norm),finalists=b.finalists.map(norm);
 assert.deepEqual(s.participants,participants.map(manager=>({manager,seed:seeds[manager],bye:byes.includes(manager)})).sort((a,b)=>a.seed-b.seed),'seeds '+year);
 const raw=weekly[year].games.filter(x=>x.stage!=='regular');
 const maxWeek=Math.max(...raw.map(x=>x.week)),matches=[];
 for(const g of raw){
  const home=norm(g.home),away=norm(g.away);
  let round=null;
  if(year<=2019){
   if(g.stage!=='championship_bracket')continue;
   round=g.week===maxWeek?'final':g.week===maxWeek-1?'semifinal':'opening';
  }else if(g.week===maxWeek&&finalists.includes(home)&&finalists.includes(away))round='final';
  else if(g.week===maxWeek-1&&semis.includes(home)&&semis.includes(away))round='semifinal';
  else if(year>=2022&&g.week===maxWeek-2&&participants.includes(home)&&participants.includes(away)&&!byes.includes(home)&&!byes.includes(away))round='opening';
  if(!round)continue;
  assert.ok(g.winner==='HOME'||g.winner==='AWAY','unresolved playoff score '+year+' W'+g.week);
  const winner=norm(g[g.winner==='HOME'?'home':'away']),loser=winner===home?away:home;
  matches.push({round,week:g.week,weeksCovered:g.weeksCovered||[g.week],home,away,homeSeed:seeds[home],awaySeed:seeds[away],homeScore:g.homeScore,awayScore:g.awayScore,winner,loser,margin:Math.round(Math.abs(g.homeScore-g.awayScore)*100)/100,aggregate:!!g.twoWeekAggregate,seedUpset:seeds[winner]>seeds[loser]});
 }
 // The Week 14 2020–21 opening-round fixtures were mislabeled regular in the raw ledger.
 // Recover only receipt-backed winners-bracket games; retain raw classifications pending standings audit.
 if(year===2020||year===2021){
  const recoveredYear=restored.filter(x=>x.year===year);
  assert.equal(recoveredYear.length,year===2020?3:2,'restored receipt count '+year);
  for(const fixture of recoveredYear){
   const game=weekly[year].games.find(g=>g.week===fixture.week&&
    ((g.home===fixture.winner&&g.away===fixture.loser)||(g.home===fixture.loser&&g.away===fixture.winner))&&
    Math.abs(Math.max(g.homeScore,g.awayScore)-fixture.winnerScore)<.02);
   assert.ok(game,'Missing independent Sleeper fixture in weekly ledger '+year+' '+fixture.winner);
   const home=norm(game.home),away=norm(game.away);
   if(matches.some(m=>m.week===fixture.week&&m.winner===fixture.winner&&m.loser===fixture.loser))continue;
   matches.push({round:fixture.round,week:fixture.week,weeksCovered:[fixture.week],home,away,
    homeSeed:seeds[home],awaySeed:seeds[away],homeScore:game.homeScore,awayScore:game.awayScore,
    winner:fixture.winner,loser:fixture.loser,margin:fixture.winningMargin,aggregate:false,
    seedUpset:seeds[fixture.winner]>seeds[fixture.loser]});
  }
 }
  const order={opening:0,semifinal:1,final:2};matches.sort((a,b)=>order[a.round]-order[b.round]||a.week-b.week||a.homeSeed-b.homeSeed);
 assert.deepEqual(s.matches,matches,'winners bracket scores '+year);
 const championship=matches.filter(x=>x.round==='final');
 assert.equal(championship.length,1,'championship game count '+year);
 assert.equal(championship[0].winner,s.champion,'championship outcome '+year);
 assert.equal(s.runnerUp,finalists.find(x=>x!==s.champion),'runner-up '+year);
 assert.equal(s.coverage.verifiedMatches,matches.length,'coverage count '+year);
 for(const round of ['opening','semifinal','final'])assert.equal(s.coverage.verifiedRounds[round],matches.filter(x=>x.round===round).length,'round coverage '+year+' '+round);
 if(year<=2017){
  assert.equal(s.coverage.scoreFormat,'Two-NFL-week aggregate for semifinals and final');
  assert.ok(matches.every(x=>x.aggregate),'2016–17 dual week scores '+year);
 }
 if(year===2022)assert.ok(s.coverage.specialNote.includes('canceled'),'2022 scoring caveat must be preserved');
 if(year===2020||year===2021){assert.deepEqual(s.coverage.missing,[],'Recovered early Sleeper fixtures must be complete');assert.equal(matches.length,5,'Recovered winners bracket size '+year)}
 if(year>=2023)assert.ok(matches.length>=5,'later Sleeper winner-bracket recovery '+year);
 counted+=matches.length;missing+=s.coverage.missing.length;
}
const html=fs.readFileSync('analytics/playoff-history.html','utf8');
const recordPage=fs.readFileSync('analytics/postseason-records.html','utf8');
const storiesPage=fs.readFileSync('hall/championship-stories.html','utf8');
assert.ok(html.includes('playoff_explorer_verified_2016_2025_v1.json'));
assert.ok(html.includes('new URLSearchParams(location.search).get('));
assert.ok(html.includes('championship-stories.html?year='));
assert.ok(html.includes('Some Sleeper')===false || html.includes('verified'));
assert.ok(recordPage.includes('href="playoff-history.html"'),'postseason record book link absent');
assert.ok(storiesPage.includes('playoff-history.html?year=\'+active'),'championship journalism does not link the matching bracket year');
assert.ok(!archive.seasons.some(x=>x.year===2026),'unfinished season cannot join verified playoffs');
console.log('PLAYOFF HISTORY VERIFIED: 10 completed seasons, '+counted+' independently sourced winners-bracket scores; '+missing+' remaining missing-score notices; ESPN aggregates retained.');
