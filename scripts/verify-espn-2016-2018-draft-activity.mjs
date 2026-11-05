import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const history=read('data/espn_history_2016_2019.json');
const archive=read('data/espn_2016_2018_drafts_activity_verified.json');
const failures=[];const check=(ok,message)=>{if(!ok)failures.push(message)};
const sourceDraftHashes={2016:'e5d13726',2017:'58a36b96',2018:'b43eecdc'};
const fnv32=text=>{let n=2166136261;for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619)>>>0;return n.toString(16)};
let picks=0;
for(const year of [2016,2017,2018]){
 const o=history.seasons.find(x=>x.year===year),d=archive.years[String(year)],n=o.teams.length;
 check(!!d&&d.teamCount===n&&d.draft.picksCount===16*n,year+' incorrect draft size');
 if(!d)continue;
 check(d.draft.playerIdsByOverallPick.length===16*n&&
  new Set(d.draft.playerIdsByOverallPick).size===16*n,year+' draft IDs incomplete or repeated');
 check(d.teams.length===n&&d.draft.keeperCount===0&&d.draft.picksMarkedKeeper===false,year+' manager or keeper mismatch');
 check(d.waivers.isUsingAcquisitionBudget===false&&d.waivers.observedSpending===0,year+' incorrectly presented as FAAB season');
 check(d.sourceMatchupCount===o.games.length,year+' canonical schedule changed');
 check(d.draft.firstRoundTeamOrder.length===n&&
  new Set(d.draft.firstRoundTeamOrder).size===n,year+' draft order invalid');
 for(const t of d.teams){
  const m=o.teams.find(x=>x.id===t.espnTeamId);
  check(!!m&&m.manager===t.manager&&m.name===t.teamName,year+' identity mismatch '+t.manager);
  check(!!m&&m.finalRank===t.officialFinish&&
   JSON.stringify(m.record)===JSON.stringify([t.regularSeason.wins,t.regularSeason.losses,t.regularSeason.ties])&&
   Math.abs(m.pf-t.regularSeason.pointsFor)<.011,year+' standings mismatch '+t.manager);
  const c=t.transactionCounter;
  check([c.acquisitions,c.drops,c.trades,c.acquisitionBudgetSpent].every(Number.isInteger),year+' invalid activity counts');
  check(c.acquisitionBudgetSpent===0,year+' nonzero FAAB spend despite disabled budget');
 }
 const ids=d.draft.firstRoundTeamOrder;
 check(ids.every(id=>d.teams.some(t=>t.espnTeamId===id)),year+' unrecognized draft team');
 const r1={2016:[13934,16733,2977644,13982,3051392,10452,15795,2508176],2017:[2508176,15825,16733,13934,13982,12514,16737,16944,2576434,11270],2018:[2576980,14880,5536,8439,13994,3122840,14874,2330,2580,5529]}[year];
 check(JSON.stringify(d.draft.playerIdsByOverallPick.slice(0,n))===JSON.stringify(r1),year+' first-round picks differ from original ESPN');
 check(d.draft.playerIdsByOverallPick.every(Number.isInteger),year+' signed player IDs changed');
 check(fnv32(d.draft.playerIdsByOverallPick.join(','))===sourceDraftHashes[year],year+' full original draft sequence differs from authenticated ESPN export');
 if(year===2016)check(d.teams.some(t=>t.manager==='Schermerhorn')&&d.teams.some(t=>t.manager==='Thommy'),year+' former Schermerhorn merged with Thommy');
 picks+=d.draft.playerIdsByOverallPick.length;
}
check(picks===448,'2016–2018 total must be 448 draft picks');
check(archive.leagueId==='1313090','wrong league');
if(failures.length){console.error('ESPN 2016–2018 recovery FAILED ('+failures.length+')');for(const f of failures)console.error(' - '+f);process.exitCode=1}
else console.log('ESPN 2016–2018 draft/activity PASS: 448 draft picks, 28 manager seasons, historical identity, zero keepers and no FAAB.');
