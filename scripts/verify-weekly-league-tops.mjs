// Source audit: node scripts/verify-weekly-league-tops.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const src=read('data/season_weekly_matchups_2016_2026_v1.json');
const archive=read('data/weekly_league_top_scorers_2016_2026w8_v1.json');
const verified=[];
for(const year of src.seasonYears){
 const n=year===2016?8:10,reg=src.bySeason[String(year)].games.filter(g=>g.stage==='regular');
 for(const week of [...new Set(reg.map(g=>g.week))]){
  const games=reg.filter(g=>g.week===week);if(games.length!==n/2)continue;
  const scores=games.flatMap(g=>[{name:g.home,points:g.homeScore},{name:g.away,points:g.awayScore}]);
  if(new Set(scores.map(s=>s.name)).size!==n)throw Error('Incomplete or duplicate league week');
  const max=Math.max(...scores.map(s=>s.points));
  const leaders=scores.filter(s=>s.points===max).map(s=>s.name);
  verified.push({year,week,leagueTeams:n,topScore:max,managers:leaders,tied:leaders.length>1});
 }
}
const historic=verified.filter(x=>x.year<=2025);
const recent=verified.filter(x=>x.year===2026);
if(historic.length!==133||recent.length!==8||
  archive.coverage.completedSeasonCompleteWeeks!==133||
  archive.coverage.provisional2026CompleteWeeks!==8)
 throw Error('Weekly-top coverage changed');
for(const row of historic){
 const original=archive.completedWeeklyReceipts.find(x=>x.year===row.year&&x.week===row.week);
 if(!original||JSON.stringify(original)!==JSON.stringify(row))
  throw Error('Historical weekly high score changed '+row.year+'/'+row.week);
}
const count={};
for(const row of historic)for(const manager of row.managers)count[manager]=(count[manager]||0)+1;
for(const rec of archive.completedLeaderboards.allTimeWeeklyTopFinishes){
 if(rec.totalWeeklyTopFinishes!==count[rec.manager])
  throw Error('Manager career weekly top count drift '+rec.manager);
}
const leader=archive.completedLeaderboards.topSingleSeasons[0];
if(leader.manager!=='Mitch'||leader.year!==2025||leader.count!==5||
   archive.completedLeaderboards.allTimeWeeklyTopFinishes[0].manager!=='Mitch'||
   archive.completedLeaderboards.allTimeWeeklyTopFinishes[0].totalWeeklyTopFinishes!==18)
 throw Error('Mitch historical weekly high-score headline requires review');
console.log('WEEKLY TOP SCORE RESEARCH VERIFIED: 133 completed weeks, 8 provisional 2026 weeks.');
