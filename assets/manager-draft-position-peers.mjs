// Position-aware research on original-manager regular-season starter points.
// Compares same-year, same-position picks at exact round first; if fewer than
// five other picks, expands to the adjacent rounds only. No extrapolation.
// Descriptive opportunity evidence, not draft value above replacement or skill.
const round2=n=>Math.round((n+Number.EPSILON)*100)/100;
function median(values){
 const v=[...values].sort((a,b)=>a-b);
 if(!v.length)throw Error('Missing draft peer values');
 return v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2;
}
export function buildDraftPositionPeers(drafts,manager){
 if(!Array.isArray(drafts)||typeof manager!=='string'||!manager.trim())throw Error('Invalid position-peer source');
 const rows=drafts.filter(p=>p&&p.keeper===false&&p.year>=2020&&p.year<=2025);
 const idKeys=new Set();
 for(const p of rows){
  const key=p.year+':'+p.overall;
  if(idKeys.has(key)||!Number.isInteger(p.year)||!Number.isInteger(p.overall)||p.overall<1||
   !Number.isInteger(p.round)||p.round<1||typeof p.position!=='string'||!p.position.trim()||
   typeof p.manager!=='string'||!p.manager.trim()||typeof p.player!=='string'||!p.player.trim()||
   !Number.isInteger(p.reg_starts)||p.reg_starts<0||!Number.isFinite(p.reg_starter_points))
   throw Error('Invalid or duplicate position-peer draft receipt '+key);
  idKeys.add(key);
 }
 const sourceManager=manager==='Thommy'?'Tom':manager;
 const own=rows.filter(p=>p.manager===sourceManager);
 const observations=[],unavailable=[];
 for(const p of own){
  // Do not let a manager's selection contribute to its own benchmark.
  const other=rows.filter(x=>x!==p&&x.year===p.year&&x.position===p.position);
  const exact=other.filter(x=>x.round===p.round);
  const nearby=other.filter(x=>Math.abs(x.round-p.round)<=1);
  const tier=exact.length>=5?'exact_round':nearby.length>=5?'adjacent_rounds':null;
  if(!tier){
   unavailable.push({year:p.year,round:p.round,position:p.position,player:p.player,
    exactPeers:exact.length,adjacentPeers:nearby.length,reason:'insufficient_position_round_peers'});
   continue;
  }
  const peers=tier==='exact_round'?exact:nearby;
  const reference=median(peers.map(x=>x.reg_starter_points));
  const difference=p.reg_starter_points-reference;
  observations.push({year:p.year,round:p.round,overall:p.overall,position:p.position,
   player:p.player,points:round2(p.reg_starter_points),starts:p.reg_starts,
   comparisonTier:tier,peerCount:peers.length,peerMedian:round2(reference),
   difference:round2(difference)});
 }
 const exactCount=observations.filter(o=>o.comparisonTier==='exact_round').length;
 const adjacentCount=observations.length-exactCount;
 const years=[...new Set(own.map(p=>p.year))].sort((a,b)=>b-a);
 const byYear=years.map(year=>{
  const items=observations.filter(x=>x.year===year);
  return {year,eligible:own.filter(p=>p.year===year).length,
   exact:items.filter(p=>p.comparisonTier==='exact_round').length,
   adjacent:items.filter(p=>p.comparisonTier==='adjacent_rounds').length,
   unavailable:unavailable.filter(p=>p.year===year).length,
   above:items.filter(p=>p.difference>0).length,
   tied:items.filter(p=>p.difference===0).length,
   below:items.filter(p=>p.difference<0).length};
 });
 const examples=observations.filter(p=>p.difference>0)
  .sort((a,b)=>(a.comparisonTier===b.comparisonTier?0:a.comparisonTier==='exact_round'?-1:1)||
   b.difference-a.difference||a.year-b.year||a.overall-b.overall).slice(0,3);
 return {manager,status:'position_aware_observed_starter_points_not_skill',
  method:'leave_one_out_same_year_position_exact_round_then_adjacent_one_round_min_five',
  selectedPicks:own.length,comparablePicks:observations.length,
  exactCount,adjacentCount,unavailableCount:unavailable.length,
  byYear,examples,unavailable};
}
