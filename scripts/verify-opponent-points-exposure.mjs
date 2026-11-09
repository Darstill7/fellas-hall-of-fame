// Source audit: node scripts/verify-opponent-points-exposure.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const raw=read('data/season_weekly_matchups_2016_2026_v1.json');
const output=read('data/opponent_points_exposure_2016_2026w8_v1.json');
const near=(a,b,tol=.0011)=>Math.abs(a-b)<tol;
if(output.rows.length!==108)throw Error('Missing manager-season exposure rows');
let completeWeekCount=0;
for(const year of raw.seasonYears){
 const N=year===2016?8:10;
 const games=raw.bySeason[String(year)].games.filter(g=>g.stage==='regular');
 for(const week of [...new Set(games.map(g=>g.week))]){
  const w=games.filter(g=>g.week===week);if(w.length!==N/2)continue;
  const teams=w.flatMap(g=>[
    {name:g.home,own:g.homeScore,opp:g.away,oppScore:g.awayScore},
    {name:g.away,own:g.awayScore,opp:g.home,oppScore:g.homeScore}
  ]);
  if(new Set(teams.map(x=>x.name)).size!==N)throw Error('Incomplete week');
  completeWeekCount++;
  const leaguePts=teams.reduce((s,x)=>s+x.own,0);
  for(const team of teams){
   const rec=output.rows.find(x=>x.year===year&&x.manager===team.name)?.receipts.find(x=>x.week===week);
   if(!rec)throw Error('Missing weekly opponent receipt '+year+'/'+week+'/'+team.name);
   const otherMean=(leaguePts-team.own)/(N-1);
   if(rec.opponent!==team.opp||rec.opponentScore!==team.oppScore||
     !near(rec.weeklyOtherTeamsMean,otherMean,.00001)||
     !near(rec.excessPoints,team.oppScore-otherMean,.00001))
    throw Error('Bad weekly opponent score/benchmark '+year+'/'+week+'/'+team.name);
  }
 }
}
for(const r of output.rows){
 const meanOpp=r.receipts.reduce((s,x)=>s+x.opponentScore,0)/r.pairedWeeks;
 const meanRef=r.receipts.reduce((s,x)=>s+x.weeklyOtherTeamsMean,0)/r.pairedWeeks;
 if(r.receipts.length!==r.pairedWeeks||!near(r.opponentAverage,meanOpp,.006)||
   !near(r.benchmarkAverage,meanRef,.006)||!near(r.excessPerWeek,meanOpp-meanRef))
  throw Error('Bad manager-season opponent points average '+r.year+'/'+r.manager);
}
const hard=output.leaderboards.mostOpponentPointsAboveWeeklyBenchmark[0];
const easy=output.leaderboards.mostOpponentPointsBelowWeeklyBenchmark[0];
if(completeWeekCount!==141||hard.manager!=='Stover'||hard.year!==2019||
   !near(hard.excessPerWeek,13.389)||easy.manager!=='Thommy'||easy.year!==2024||
   !near(easy.excessPerWeek,-13.347))
 throw Error('Opponent-scoring exposure headline changed');
console.log('OPPONENT POINTS EXPOSURE AUDIT PASSED: 141 fully paired league weeks, 108 season rows.');
