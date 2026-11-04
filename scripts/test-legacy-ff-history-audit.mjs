import fs from 'node:fs';
const get=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=get('data-integrity/FF_HISTORY_SPREADSHEET_RECONCILIATION_2026-11-04.json');
const source=get('data/espn_history_2016_2019.json');
const verified=get('data/espn_final_placements_2016_2019_verified.json');
const sleeper=get('data/sleeper_postseason_placement_receipts_2020_2025.json');
const total=audit.scoreComparison.reduce((sum,y)=>sum+y.match+y.disagreements.length+y.absent.length,0);
const exact=audit.scoreComparison.reduce((sum,y)=>sum+y.match,0);
const discrep=audit.scoreComparison.flatMap(y=>y.disagreements);
if(total!==700||exact!==688||discrep.length!==12)
 throw Error('Source spreadsheet comparison coverage unexpectedly changed');
if(audit.scoreComparison.some(y=>y.absent.length))throw Error('Missing matched historical team score');
const corrected=audit.scoreComparison.find(y=>y.year===2023);
if(corrected.normalizedNames[7]!=='JMid'||corrected.sourceColumnNames[7]!=='Evans'||
   corrected.absent.length!==0)
 throw Error('2023 old worksheet Evans label must remain mapped to JMid, not the former Evans manager');
const historicalLast={2016:'Schermerhorn',2017:'Birch',2018:'Stilly',2019:'Evans'};
if(verified.seasons.length!==4)throw Error('Expected four original ESPN final-rank seasons');
let totalESPN=0;
for(const s of verified.seasons){
 const original=source.seasons.find(x=>x.year===s.year);
 if(!original||s.teamCount!==original.teams.length)throw Error('Wrong original ESPN season '+s.year);
 totalESPN+=s.teamCount;
 const ranked=[...s.finalStandings].sort((a,b)=>a.place-b.place);
 if(ranked.length!==s.teamCount||new Set(ranked.map(x=>x.manager)).size!==ranked.length)
  throw Error('ESPN unique final-place integrity issue '+s.year);
 for(let i=0;i<ranked.length;i++){
  const originalManager=original.teams.find(x=>x.manager===ranked[i].manager);
  if(ranked[i].place!==i+1||originalManager?.finalRank!==ranked[i].place)
   throw Error('Original ESPN finalRank diverged '+s.year);
 }
 if(s.lastPlaceManager!==historicalLast[s.year]||
    s.lastPlaceManager!==ranked.at(-1).manager||
    s.seasonChampion!==ranked[0].manager)
  throw Error('Verified ESPN title or last-place mismatch '+s.year);
 const last=original.teams.find(x=>x.manager===s.lastPlaceManager);
 const ninth=original.teams.find(x=>x.manager===ranked.at(-2).manager);
 const final=original.games.find(g=>g.period===s.lastPlaceFinal.period&&
  g.stage==='LOSERS_CONSOLATION_LADDER'&&[g.home,g.away].includes(last.id)&&
  [g.home,g.away].includes(ninth.id));
 if(!final)throw Error('Missing last-place ESPN final game '+s.year);
 const losingScore=final.home===last.id?final.hs:final.as;
 const winningScore=final.home===ninth.id?final.hs:final.as;
 if(losingScore!==s.lastPlaceFinal.loserPoints||
    winningScore!==s.lastPlaceFinal.winnerPoints||losingScore>=winningScore)
  throw Error('ESPN last-place game score mismatch '+s.year);
}
if(totalESPN!==38)throw Error('Expected 38 ESPN finishing placements');
for(const [year,manager] of [[2020,'Tony'],[2021,'Stilly']]){
 if(sleeper.seasons.find(x=>x.year===year)?.toiletBowl?.manager!==manager)
  throw Error('Do not revive incorrect legacy spreadsheet last-place claim '+year);
}
console.log('Historical spreadsheet audit checks: 700 team-week values, 12 isolated differences, 38 verified ESPN final ranks and last-place finals.');
