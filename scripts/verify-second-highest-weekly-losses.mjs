// Source audit: node scripts/verify-second-highest-weekly-losses.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data/season_weekly_matchups_2016_2026_v1.json');
const research=read('data/second_highest_weekly_score_losses_2016_2026w8_v1.json');
let receipts=[],eligibleWeeks=0;
for(const year of source.seasonYears){
 const N=year===2016?8:10;
 const games=source.bySeason[String(year)].games.filter(g=>g.stage==='regular');
 for(const week of [...new Set(games.map(g=>g.week))]){
  const today=games.filter(g=>g.week===week);
  if(today.length!==N/2)continue;
  const teams=today.flatMap(g=>[
   {manager:g.home,points:g.homeScore,opp:g.away,oppPoints:g.awayScore,
    lost:g.winner==='AWAY'},
   {manager:g.away,points:g.awayScore,opp:g.home,oppPoints:g.homeScore,
    lost:g.winner==='HOME'}
  ]);
  if(new Set(teams.map(x=>x.manager)).size!==N)throw Error('Duplicate team score');
  eligibleWeeks++;
  for(const row of teams){
   if(!row.lost||1+teams.filter(x=>x.points>row.points).length!==2)continue;
   receipts.push({year,week,manager:row.manager,managerPoints:row.points,
    opponent:row.opp,opponentPoints:row.oppPoints,
    margin:Math.round((row.oppPoints-row.points)*100)/100});
  }
 }
}
const completed=receipts.filter(x=>x.year<=2025);
if(eligibleWeeks!==141||completed.length!==16||receipts.filter(x=>x.year===2026).length!==0||
  research.completedSeasons.total!==16||research.completedSeasons.allReceipts.length!==16)
 throw Error('Source weekly loss coverage drift');
for(const row of completed){
 const match=research.completedSeasons.allReceipts.find(x=>x.year===row.year&&x.week===row.week&&x.manager===row.manager);
 if(!match||match.managerPoints!==row.managerPoints||match.opponentPoints!==row.opponentPoints||
    Math.abs(match.margin-row.margin)>.005)
  throw Error('Second-highest losing score receipt mismatch');
}
const most=[...research.completedSeasons.byManager].sort((a,b)=>b.secondHighestScoreLosses-a.secondHighestScoreLosses)[0];
if(most.manager!=='Stilly'||most.secondHighestScoreLosses!==4||
  research.completedSeasons.highestLosingPoints[0].manager!=='Stew'||
  research.completedSeasons.highestLosingPoints[0].managerPoints!==164.8)
 throw Error('Headline weekly runner-up losses no longer supported');
console.log('SECOND-HIGHEST-LOSS AUDIT PASSED: 16 completed-season losing weekly runners-up, 141 complete league weeks.');
