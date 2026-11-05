// Preserve the official rank and field size; do not merge old workbook claims into provider receipts.
export function auditAllEraFinishes(master){
 const years=Array.from({length:10},(_,i)=>2016+i);
 if(!master||master.seasons?.length!==10||
    master.seasons.some((s,i)=>s.year!==years[i]||s.provider!==(s.year<=2019?'ESPN':'Sleeper')))
  throw Error('Complete chronologically ordered 2016–2025 authoritative finishes required');
 const entrants=new Map();
 let n=0;
 for(const s of master.seasons){
  if(s.teams!==(s.year===2016?8:10)||s.finishes.length!==s.teams)
   throw Error('Missing or wrong field size in '+s.year);
  if(new Set(s.finishes.map(f=>f.manager)).size!==s.teams)
   throw Error('Duplicate manager in '+s.year);
  for(let i=0;i<s.teams;i++){
   const p=s.finishes[i],score=100*(s.teams-(i+1))/(s.teams-1);
   if(p.rank!==i+1||Math.abs(p.finishScore-score)>0.00011)
    throw Error('Incorrect final rank or normalized finish score '+s.year);
   let history=entrants.get(p.manager)||[];
   history.push({year:s.year,rank:p.rank,teams:s.teams,
    provider:s.provider,finishScore:p.finishScore});
   entrants.set(p.manager,history);n++;
  }
  if(s.finishes[0].manager!==s.champion||s.finishes.at(-1).manager!==s.lastPlace)
   throw Error('Champion or last-place record mismatch in '+s.year);
 }
 if(n!==98||entrants.size!==14)throw Error('Historical final placements must cover 98 places and 14 managers');
 const managers=[...entrants].map(([manager,history])=>{
  const ranks=history.map(x=>x.rank).sort((a,b)=>a-b);
  const average=history.reduce((t,x)=>t+x.finishScore,0)/history.length;
  return {
   manager,seasonsPlayed:history.length,history,
   meanFinishScore:Number(average.toFixed(2)),
   topThree:history.filter(x=>x.rank<=3).length,
   topHalf:history.filter(x=>x.rank<=Math.floor(x.teams/2)).length,
   lastPlaceYears:history.filter(x=>x.rank===x.teams).map(x=>x.year),
   bestRank:ranks[0],worstRank:ranks.at(-1)
  };
 }).sort((a,b)=>b.meanFinishScore-a.meanFinishScore||
    b.seasonsPlayed-a.seasonsPlayed||a.manager.localeCompare(b.manager));
 const eligible=managers.filter(m=>m.seasonsPlayed>=6);
 const averageLeader=Math.max(...eligible.map(m=>m.meanFinishScore));
 const podiumLeader=Math.max(...managers.map(m=>m.topThree));
 return {
  seasons:10,totalPlaces:n,managerCount:managers.length,
  eligibleMinimumSeasons:6,eligibleCount:eligible.length,
  managers,leaders:{
   normalizedCareerAverage:{value:averageLeader,holders:eligible.filter(m=>m.meanFinishScore===averageLeader).map(m=>m.manager)},
   topThreeCareer:{value:podiumLeader,holders:managers.filter(m=>m.topThree===podiumLeader).map(m=>m.manager)}
  }
 };
}
