// Source audit: node scripts/verify-all-play-schedule-variance.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data/season_weekly_matchups_2016_2026_v1.json');
const observed=read('data/all_play_schedule_variance_2016_2026w8_v1.json');
const abs=(a,b)=>Math.abs(a-b)<0.0011;
if(observed.allManagerSeasons.length!==108||observed.coverage.length!==11)
 throw Error('All-play seasons missing');
let validPairs=0;
for(const coverage of observed.coverage){
 const year=coverage.year,group=source.bySeason[String(year)].games.filter(g=>g.stage==='regular');
 const n=year===2016?8:10,weeks=[...new Set(group.map(g=>g.week))].sort((a,b)=>a-b);
 const complete=weeks.filter(week=>group.filter(g=>g.week===week).length===n/2);
 if(coverage.leagueSize!==n||coverage.pairedCompleteWeeks!==complete.length||
    coverage.excludedIncompleteWeeks.length!==weeks.length-complete.length)
  throw Error('Bad week and league-size coverage '+year);
 for(const week of complete){
  const games=group.filter(x=>x.week===week);
  const participants=games.flatMap(g=>[
   {name:g.home,score:g.homeScore,result:g.winner==='TIE'?'tie':g.winner==='HOME'?'win':'loss'},
   {name:g.away,score:g.awayScore,result:g.winner==='TIE'?'tie':g.winner==='AWAY'?'win':'loss'}
  ]);
  if(participants.length!==n||new Set(participants.map(x=>x.name)).size!==n)
   throw Error('Incomplete paired week '+year+' '+week);
  validPairs+=games.length;
  for(const p of participants){
   const beat=participants.filter(x=>x.name!==p.name&&x.score<p.score).length;
   const tied=participants.filter(x=>x.name!==p.name&&x.score===p.score).length;
   const season=observed.allManagerSeasons.find(x=>x.year===year&&x.manager===p.name);
   const receipt=season?.weeklyReceipts.find(x=>x.week===week);
   if(!receipt||receipt.points!==p.score||receipt.allPlayWins!==beat||
      receipt.allPlayTies!==tied||receipt.result!==p.result||
      !abs(receipt.pseudoExpectedWins,(beat+.5*tied)/(n-1)))
    throw Error('All-play receipt mismatch '+year+' '+week+' '+p.name);
  }
 }
 for(const row of observed.allManagerSeasons.filter(x=>x.year===year)){
  const expected=row.weeklyReceipts.reduce((sum,x)=>sum+x.pseudoExpectedWins,0);
  const actual=row.actualWins+row.actualTies*.5;
  if(row.completeWeeks!==complete.length||!abs(row.expectedWins,expected)||
     !abs(row.scheduleDrawSurplus,actual-expected))
   throw Error('Season expectation mismatch '+year+' '+row.manager);
 }
}
if(validPairs!==692)throw Error('Expected 692 fully paired comparison games');
const hi=observed.completedSeasonLeaders.mostAboveExpectation[0];
const lo=observed.completedSeasonLeaders.mostBelowExpectation[0];
if(hi.manager!=='Birch'||hi.year!==2021||hi.actualWins!==11||!abs(hi.expectedWins,7.444)||
   lo.manager!=='Thommy'||lo.year!==2020||lo.actualWins!==4||!abs(lo.expectedWins,6.556))
 throw Error('Historical opponent draw leaders require review');
if(observed.snapshot2026.some(x=>x.completeWeeks!==8))throw Error('Unverified 2026 score entered');
console.log('ALL-PLAY SCHEDULE ANALYSIS VERIFIED: 108 manager-seasons; 692 complete-week matchups; 2026 ends W8.');
