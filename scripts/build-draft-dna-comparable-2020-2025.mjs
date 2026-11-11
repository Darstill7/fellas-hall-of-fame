// Unified DRAFT RETURN VALUE model for the six completed Sleeper seasons.
// Same-year position and nearby-round peers, source-verifiable starter receipts.
// Do not turn realized outcomes into claims of skill/intent, and don't use for
// in-progress 2026 or ESPN 2018 unsequenced picks.
// node scripts/build-draft-dna-comparable-2020-2025.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const raw=load('data/research_draft_dna_2020_2025_starter_receipts_v1.json');
assert.equal(raw.picks.length,900);
const pts=x=>Math.round(Number(x)*100)/100;
const median=arr=>{const sorted=[...arr].sort((a,b)=>a-b);
 if(!sorted.length)return null;
 const m=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[m]:pts((sorted[m-1]+sorted[m])/2);
};
const valid=raw.picks.filter(p=>!p.keeper);
assert.equal(valid.length,880,'Exactly twenty kept slots in 2025 excluded');
const valued=valid.map(p=>{
 const group=valid.filter(peer=>peer.year===p.year&&peer.position===p.position&&
  peer.originalOverall!==p.originalOverall);
 let peer=null,window=null;
 for(const distance of [2,3,5,Infinity]){
  const filtered=group.filter(other=>Math.abs(other.round-p.round)<=distance);
  if(filtered.length>=4||(distance===Infinity&&filtered.length>0)){
   peer=filtered;window=Number.isFinite(distance)?distance:'all-position';break;
  }
 }
 const center=peer?median(peer.map(q=>q.observedOriginalManagerStarterPoints)):null;
 const surplus=center===null?null:pts(p.observedOriginalManagerStarterPoints-center);
 return {year:p.year,manager:p.manager,originalOverall:p.originalOverall,round:p.round,
  player:p.player,playerId:p.playerId,position:p.position,
  observedOriginalManagerStarterPoints:p.observedOriginalManagerStarterPoints,
  observedOriginalManagerStarts:p.observedStarts,peerMedian:center,
  pointsAboveSameYearPositionRoundPeers:surplus,
  peerWindow:window,peerCount:peer?.length??0,
  sourceConfidence:p.playerIdConfidence,
  interpretation:'Realized original-manager starter return, not pre-draft forecast or manager skill'};
});
const years=[];
for(let year=2020;year<=2025;year++){
 const picks=valued.filter(x=>x.year===year);
 const managers=[...new Set(picks.map(x=>x.manager))].sort();
 assert.equal(managers.length,10);
 const rows=managers.map(manager=>{
  const personal=picks.filter(p=>p.manager===manager);
  const valid=personal.filter(x=>x.pointsAboveSameYearPositionRoundPeers!==null);
  const originalPoints=pts(personal.reduce((a,x)=>a+x.observedOriginalManagerStarterPoints,0));
  const totalSurplus=pts(valid.reduce((a,x)=>a+x.pointsAboveSameYearPositionRoundPeers,0));
  return {manager,nonkeeperSelections:personal.length,comparableSelections:valid.length,
   starts:personal.reduce((a,x)=>a+x.observedOriginalManagerStarts,0),
   startedPoints:originalPoints,
   realizedPeerSurplus:totalSurplus,
   peerSurplusPerComparablePick:valid.length?pts(totalSurplus/valid.length):null,
   roundReturns:[...new Set(personal.map(x=>x.round))].sort((a,b)=>a-b).map(round=>{
    const same=personal.filter(x=>x.round===round);
    return {round,picks:same.length,starterPoints:pts(same.reduce((a,x)=>a+x.observedOriginalManagerStarterPoints,0)),
     peerSurplus:pts(same.reduce((a,x)=>a+x.pointsAboveSameYearPositionRoundPeers??0,0))};
   })};
 });
 rows.sort((a,b)=>b.realizedPeerSurplus-a.realizedPeerSurplus||a.manager.localeCompare(b.manager));
 let rank=0,last=null;
 rows.forEach((x,i)=>{
  if(i===0||x.realizedPeerSurplus!==last){rank=i+1;last=x.realizedPeerSurplus}
  x.seasonRank=rank;
  x.observedReturnTier=x.seasonRank<=2?'A':x.seasonRank<=4?'B':
   x.seasonRank<=6?'C':x.seasonRank<=8?'D':'F';
  x.normalizedSeasonRankPercentile=pts(100*(10-x.seasonRank)/9);
 });
 years.push({year,status:'completed-source-recovered',
  completedSeasonCalendarWeeks:year<=2021?13:14,
  nonkeeperPicks:picks.length,managerRows:rows});
}
const managers=[...new Set(valued.map(p=>p.manager))].sort().map(manager=>{
 const seasons=years.flatMap(y=>y.managerRows.filter(x=>x.manager===manager).map(x=>({
  year:y.year,rank:x.seasonRank,normalizedSeasonRankPercentile:x.normalizedSeasonRankPercentile,
  observedReturnTier:x.observedReturnTier,nonkeeperSelections:x.nonkeeperSelections,
  peerSurplus:x.realizedPeerSurplus})));
 return {manager,seasons,
  comparableSeasons:seasons.length,
  meanSeasonRankPercentile:seasons.length?pts(seasons.reduce((a,x)=>a+x.normalizedSeasonRankPercentile,0)/seasons.length):null,
  draftYearsIncluded:seasons.map(s=>s.year),
  sourceCaution:'Historical participation count and current membership differ; not an ex-ante manager skill rating'};
});
const bestLate=valued.filter(p=>p.round>=10&&p.observedOriginalManagerStarts>=5&&
 p.pointsAboveSameYearPositionRoundPeers!==null)
 .sort((a,b)=>b.pointsAboveSameYearPositionRoundPeers-a.pointsAboveSameYearPositionRoundPeers||
 b.observedOriginalManagerStarterPoints-a.observedOriginalManagerStarterPoints).slice(0,30);
const result={schema:'fellas-draft-dna-same-method-return-2020-2025-v1',
 status:'research-comparable-within-season-not-manager-skill',
 sourcePaths:['data/research_draft_dna_2020_2025_starter_receipts_v1.json'],
 coverage:{years:6,totalOriginalSelections:900,
  nonkeeperSelections:valued.length,keeperSelectionsExcluded:20,
  valuedSelections:valued.filter(x=>x.pointsAboveSameYearPositionRoundPeers!==null).length,
  historicalManagerSeasons:years.reduce((a,y)=>a+y.managerRows.length,0)},
 rules:['Compare originally drafted nonkeeper players only to other nonkeeper picks in same year and same recorded position',
  'Peer window ±2 rounds, widen to ±3 then ±5, then all same position; exclude the target pick; require at least four peers when available',
  'Zero started points is an observed outcome and remains in peer medians; missing individual scored player IDs are null, not fabricated',
  'Each manager season sums realized per-pick points above the peer median; ties share rank and categorical return tier',
  'Normalized season rank permits descriptive comparisons across different 13/14 week years without pooling raw points',
  'Manager tenure matters; 2023 Evans is distinct from 2024+ JMid. Tom is Thommy, not Schermerhorn',
  'This is not causality or skill: trades, injuries, roster usage, and keeper availability affect realized returns',
  'This is an independent common-method research model, not a replacement of previous v9 or 2025 pilot findings until reviewed',
  '2026 is excluded entirely until completion'],years,managers,bestLateRoundByPeerSurplus:bestLate,picks:valued};
console.log(JSON.stringify(result,null,2));
