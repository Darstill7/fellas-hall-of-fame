// Retrospective slot alternatives; never assume a later player would have scored identically on another roster.
import assert from 'node:assert/strict';
export function draftSlotAlternatives(ledger,supported){
 const seasons=new Map(),results=[],excluded=[];
 for(const a of ledger.filter(a=>['DRAFT','ARCHIVED_KEEPER','DRAFT_KEEPER_UNKNOWN'].includes(a.category))){
  const pick=Number(a.cost?.pick),round=Number(a.cost?.round);
  const key=[a.year,Number(a.roster),String(a.player_id),String(a.id)].join(':');
  const v=supported[key];
  const r={year:a.year,manager:a.manager,player_id:a.player_id,name:a.name,id:a.id,category:a.category,pick,round,position:a.position??null,observed_pf_cents:v?.supported_pf_cents??0,strict_pf_cents:a.regular_pf_cents};
  assert.equal(v?.strict_pf_cents??0,r.strict_pf_cents);
  if(!Number.isInteger(pick)||pick<1||!Number.isInteger(round)||round<1){excluded.push({...r,reason:'Unverified exact slot'});continue;}
  const group=seasons.get(a.year)??[];group.push(r);seasons.set(a.year,group);
 }
 for(const group of seasons.values()){
  group.sort((a,b)=>a.pick-b.pick);assert.equal(new Set(group.map(x=>x.pick)).size,group.length);
  for(const r of group){
   // Only ordinary selections observed after the slot, before or at the end of the next round.
   // Archive classifications remain provisional; unknown keeper flags cannot establish availability.
   const pool=group.filter(x=>x.category==='DRAFT'&&x.pick>r.pick&&x.round<=r.round+1);
   const comparable=pool.filter(x=>r.position&&x.position===r.position);
   const summarize=p=>{if(!p.length)return null;const ordered=p.slice().sort((a,b)=>b.observed_pf_cents-a.observed_pf_cents||a.pick-b.pick);const best=ordered[0];const asc=ordered.map(x=>x.observed_pf_cents).reverse(),i=Math.floor(asc.length/2),median=asc.length%2?asc[i]:(asc[i-1]+asc[i])/2;return {count:p.length,median_pf_cents:median,observed_surplus_cents:r.observed_pf_cents-median,best_later_selection:{player_id:best.player_id,name:best.name,pick:best.pick,manager:best.manager,pf_cents:best.observed_pf_cents},observed_gap_to_best_cents:best.observed_pf_cents-r.observed_pf_cents};};
   if(r.category==='DRAFT_KEEPER_UNKNOWN'){excluded.push({...r,reason:'Unknown keeper status'});continue;}
   results.push({...r,ordinary_alternatives:summarize(pool),same_position_alternatives:summarize(comparable),evaluation:r.category==='ARCHIVED_KEEPER'?'PROVISIONAL_KEEPER_SLOT_COMPARISON':'OBSERVED_DRAFT_SLOT_COMPARISON'});
  }
 }
 return {results,excluded,method:'Compare actual received starter PF to later ordinary selections through the next round. Does not estimate counterfactual lineup production or prove keeper availability; historical keeper flags provisional. Current-season values provisional. No alternative is invented where the observed pool is empty.'};
}
