// Single-source 2020–2025 final-placement audit. No inferred ESPN places or active 2026 season.
export function auditPlacementStatistics(master,receipts){
 if(!Array.isArray(master?.seasons)||!Array.isArray(receipts?.seasons))
  throw Error('Both verified placement archives are required');
 const years=[2020,2021,2022,2023,2024,2025];
 if(master.seasons.length!==6||receipts.seasons.length!==6||
   years.some(y=>!master.seasons.some(s=>s.year===y)||!receipts.seasons.some(s=>s.year===y)))
  throw Error('Final placement history is not complete for 2020–2025');
 const byManager=new Map();
 const findings=[];
 for(const year of years){
  const season=master.seasons.find(s=>s.year===year);
  const receipt=receipts.seasons.find(s=>s.year===year);
  if(!Array.isArray(season.finishers)||season.finishers.length!==10||
     !Array.isArray(receipt.finalPlacements)||receipt.finalPlacements.length!==10)
   throw Error('A season must have exactly ten final places: '+year);
  const placed=[...season.finishers].sort((a,b)=>a.rank-b.rank);
  const source=[...receipt.finalPlacements].sort((a,b)=>a.place-b.place);
  if(new Set(placed.map(x=>x.manager)).size!==10)
   throw Error('Duplicate manager in '+year+' finishing standings');
  for(let i=0;i<10;i++){
   const row=placed[i],original=source[i];
   if(row.rank!==i+1||original.place!==i+1||row.manager!==original.manager||
      row.scoreVerified!==original.scoreVerified)
    throw Error('Final placement conflicts with verified bracket '+year+' position '+(i+1));
   if(row.rank===1&&(row.manager!==season.champion||row.manager!==receipt.championship.winner))
    throw Error('Champion conflict '+year);
   if(row.rank===2&&row.manager!==receipt.championship.runnerUp)
    throw Error('Runner-up conflict '+year);
   if(row.rank===10&&(row.manager!==season.shitterOfTheYear||row.manager!==receipt.toiletBowl.manager))
    throw Error('Toilet Bowl final conflict '+year);
   if(row.scoreVerified===false)findings.push({year,place:row.rank,type:'score-reconciliation',
    message:'Placement verified; final game score differs between screenshot and archived matchup ledger'});
   const list=byManager.get(row.manager)||[];
   list.push({year,rank:row.rank});byManager.set(row.manager,list);
  }
 }
 const stats=[...byManager.entries()].map(([manager,finishes])=>{
  finishes.sort((a,b)=>a.year-b.year);
  const ranks=finishes.map(x=>x.rank).sort((a,b)=>a-b);
  const n=finishes.length;
  const average=Number((ranks.reduce((sum,n)=>sum+n,0)/n).toFixed(3));
  const median=Number(((ranks[Math.floor((n-1)/2)]+ranks[Math.ceil((n-1)/2)])/2).toFixed(2));
  return {manager,seasonsPlayed:n,years:finishes.map(x=>x.year),
   placements:finishes,averageFinish:average,medianFinish:median,
   bestFinish:ranks[0],worstFinish:ranks.at(-1),
   championships:ranks.filter(n=>n===1).length,runnerUpFinishes:ranks.filter(n=>n===2).length,
   topThree:ranks.filter(n=>n<=3).length,topFive:ranks.filter(n=>n<=5).length,
   bottomThree:ranks.filter(n=>n>=8).length,
   shitterOfTheYear:finishes.filter(f=>f.rank===10).map(f=>f.year)};
 }).sort((a,b)=>a.averageFinish-b.averageFinish||b.seasonsPlayed-a.seasonsPlayed||a.manager.localeCompare(b.manager));
 if(stats.reduce((sum,m)=>sum+m.seasonsPlayed,0)!==60)
  throw Error('Final placement coverage does not total sixty starts');
 const eligibleSix=stats.filter(m=>m.seasonsPlayed===6);
 const leaders=(id,label,values,kind,lower=false)=>{
  const best=lower?Math.min(...values.map(x=>x.value)):Math.max(...values.map(x=>x.value));
  return {id,label,kind,value:best,holders:values.filter(x=>x.value===best).map(x=>x.manager),
    eligibleManagers:values.length,qualifiedMinSeasons:id==='best_average_six'?6:1};
 };
 const records=[
  leaders('best_average_six','Best average finish (all six Sleeper seasons)',
   eligibleSix.map(m=>({manager:m.manager,value:Number(m.averageFinish.toFixed(2))})),'achievement',true),
  leaders('most_top_three','Most top-three final finishes (2020–2025)',
   stats.map(m=>({manager:m.manager,value:m.topThree})),'achievement'),
  leaders('most_top_five','Most top-five final finishes (2020–2025)',
   stats.map(m=>({manager:m.manager,value:m.topFive})),'achievement'),
  leaders('most_runner_up','Most championship runner-up finishes (2020–2025)',
   stats.map(m=>({manager:m.manager,value:m.runnerUpFinishes})),'achievement'),
  leaders('most_bottom_three','Most bottom-three finishes (2020–2025)',
   stats.map(m=>({manager:m.manager,value:m.bottomThree})),'shame'),
  leaders('most_shitter','Most Shitter of the Year finishes (2020–2025)',
   stats.map(m=>({manager:m.manager,value:m.shitterOfTheYear.length})),'shame')
 ];
 return {version:1,scope:'Final postseason standings, Sleeper 2020–2025',
  years,completedSeasons:6,verifiedPlaces:60,managerCount:stats.length,
  sixSeasonEligible:eligibleSix.length,stats,records,findings};
}
