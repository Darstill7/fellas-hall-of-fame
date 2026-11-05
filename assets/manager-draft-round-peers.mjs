// Research-only round-peer comparison from original drafting manager's lineup starts.
// This is a descriptive opportunity snapshot, NOT an ex-ante draft value, skill grade,
// points above replacement, player-season production or cross-position adjustment.
const completed=p=>p&&p.year>=2020&&p.year<=2025&&p.keeper===false;
const median=values=>{
 const x=[...values].sort((a,b)=>a-b);
 if(!x.length)throw Error('Empty peer cohort');
 return x.length%2?x[(x.length-1)/2]:(x[x.length/2-1]+x[x.length/2])/2;
};
const rounded=n=>Math.round((n+Number.EPSILON)*100)/100;
export function buildDraftRoundPeers(drafts, manager){
 if(!Array.isArray(drafts)||typeof manager!=='string'||!manager.trim())throw Error('Invalid round-peer input');
 const rows=drafts.filter(completed);
 const keys=new Set();
 const cohorts=new Map();
 for(const p of rows){
  const key=p.year+':'+p.overall, group=p.year+':'+p.round;
  if(keys.has(key)||!Number.isInteger(p.year)||!Number.isInteger(p.overall)||p.overall<1||
     !Number.isInteger(p.round)||p.round<1||!p.manager||!p.player||
     !Number.isInteger(p.reg_starts)||p.reg_starts<0||!Number.isFinite(p.reg_starter_points))
   throw Error('Invalid or duplicate original draft record '+key);
  keys.add(key);
  if(!cohorts.has(group))cohorts.set(group,[]);
  cohorts.get(group).push(p);
 }
 const canonical=manager==='Thommy'?'Tom':manager;
 const candidates=rows.filter(p=>p.manager===canonical);
 const comparisons=[];
 const uncomparable=[];
 for(const p of candidates){
  const peers=cohorts.get(p.year+':'+p.round).filter(x=>x!==p);
  if(peers.length<5){uncomparable.push({year:p.year,round:p.round,player:p.player,peerCount:peers.length});continue;}
  const reference=median(peers.map(x=>x.reg_starter_points));
  comparisons.push({year:p.year,round:p.round,overall:p.overall,player:p.player,
   starts:p.reg_starts,points:rounded(p.reg_starter_points),peerCount:peers.length,
   peerMedian:rounded(reference),difference:rounded(p.reg_starter_points-reference)});
 }
 const years=[...new Set(candidates.map(p=>p.year))].sort((a,b)=>b-a);
 const byYear=years.map(year=>{
  const selected=comparisons.filter(x=>x.year===year);
  return {year,eligiblePicks:candidates.filter(p=>p.year===year).length,
   comparablePicks:selected.length,
   aboveMedian:selected.filter(x=>x.difference>0).length,
   atMedian:selected.filter(x=>x.difference===0).length,
   belowMedian:selected.filter(x=>x.difference<0).length,
   unavailable:candidates.filter(p=>p.year===year).length-selected.length};
 });
 const examples=comparisons.filter(x=>x.difference>0).sort((a,b)=>b.difference-a.difference||a.year-b.year||a.overall-b.overall).slice(0,3);
 return {manager,method:'leave_one_out_same_year_round_original_manager_starter_points_median',
  status:'descriptive_peer_comparison_not_draft_skill',
  selectedPicks:candidates.length,comparablePicks:comparisons.length,uncomparablePicks:uncomparable.length,
  byYear,examples,uncomparable};
}
