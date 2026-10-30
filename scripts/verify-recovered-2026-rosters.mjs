import fs from 'node:fs';
const unified=JSON.parse(fs.readFileSync('data/season_weekly_matchups_2016_2026_v1.json','utf8'));
const allGames=unified.bySeason?.['2026']?.games||[];
const ownership=new Map();let checked=0;const discrepancies=[];
for(let week=1;week<=7;week++){
 const raw=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2026_week'+week+'.json','utf8'));
 if(raw.year!==2026||raw.week!==week||raw.rosters?.length!==10)throw Error('2026 incomplete week '+week);
 const games=allGames.filter(g=>g.week===week&&g.stage==='regular');
 if(games.length!==5)throw Error('Missing five 2026 H2H games '+week);
 const scores=games.flatMap(g=>[{name:g.home,points:g.homeScore},{name:g.away,points:g.awayScore}]);
 for(const row of raw.rosters){
  if(!row.success||row.starters?.length!==9||!Array.isArray(row.bench))throw Error('Malformed 2026 roster '+week+' '+row.owner);
  if(Math.abs(row.starters.reduce((s,p)=>s+Number(p.points||0),0)-row.points)>.07)throw Error('2026 starter total mismatch '+week+' '+row.owner);
  const candidates=new Set(scores.filter(s=>Math.abs(s.points-row.points)<=.02).map(s=>s.name));
  if(!candidates.size){
   if(week===7&&row.owner==='Sheffla'&&Math.abs(row.points-105.22)<.001&&scores.some(x=>x.name==='Scott'&&Math.abs(x.points-106.22)<.001)){
    discrepancies.push({year:2026,week,owner:row.owner,canonicalManager:'Scott',rosterPoints:row.points,matchupPoints:106.22,delta:1,classification:'unresolved_provider_vs_canonical_score_discrepancy'});
    checked++;continue;
   }
   throw Error('No canonical score match '+week+' '+row.owner);
  }
  const old=ownership.get(row.owner);
  ownership.set(row.owner,old?new Set([...old].filter(x=>candidates.has(x))):candidates);checked++;
 }
}
if(checked!==70||ownership.size!==10||[...ownership.values()].some(s=>s.size!==1))throw Error('2026 source-to-manager mapping is ambiguous');
const mapping=Object.fromEntries([...ownership].map(([key,names])=>[key,[...names][0]]));
if(new Set(Object.values(mapping)).size!==10)throw Error('Nonunique canonical manager assignments');
const documented=JSON.parse(fs.readFileSync('data-integrity/2026-week7-scott-score-discrepancy.json','utf8'));
if(discrepancies.length!==1||documented.status!=='provider_confirmed_canonical_reconciliation_pending'||documented.rosterPoints!==discrepancies[0].rosterPoints||documented.canonicalMatchupPoints!==discrepancies[0].matchupPoints)throw Error('2026 score discrepancy unresolved or documentation inconsistent');
console.log('2026 roster and matchup reconciliation PASS WITH FLAGGED SOURCE DISCREPANCY',JSON.stringify({checked,mapping,discrepancies}));
