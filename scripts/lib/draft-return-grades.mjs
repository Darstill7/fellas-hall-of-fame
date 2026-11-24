// Descriptive draft return grades, not retrospective claims of optimal decisions.
import assert from 'node:assert/strict';
export function gradeDraftReturns(ledger,supported){
 const cohorts=new Map(),rows=[],excluded=[];
 for(const a of ledger.filter(a=>['DRAFT','ARCHIVED_KEEPER','DRAFT_KEEPER_UNKNOWN'].includes(a.category))){
  const round=Number(a.cost?.round),key=[a.year,Number(a.roster),String(a.player_id),String(a.id)].join(':');
  const r={year:a.year,manager:a.manager,player_id:a.player_id,name:a.name,id:a.id,round,category:a.category,strict_pf_cents:a.regular_pf_cents,supported_pf_cents:supported[key]?.supported_pf_cents??0};
  assert.equal(supported[key]?.strict_pf_cents??0,r.strict_pf_cents);
  if(!Number.isInteger(round)||round<1||a.category!=='DRAFT'){excluded.push({...r,reason:'Uncertain or keeper classification; separate evaluation required'});continue;}
  const k=a.year+':'+round;const group=cohorts.get(k)??[];group.push(r);cohorts.set(k,group);
 }
 for(const group of cohorts.values()){
  for(const r of group){
   const peers=group.filter(x=>x!==r),n=peers.length;
   if(n<4){excluded.push({...r,reason:'Insufficient comparable selections'});continue;}
   const lower=peers.filter(x=>x.supported_pf_cents<r.supported_pf_cents).length,equal=peers.filter(x=>x.supported_pf_cents===r.supported_pf_cents).length;
   const percentile=(lower+equal/2)/n;
   const values=peers.map(x=>x.supported_pf_cents).sort((a,b)=>a-b),mid=Math.floor(n/2),median=n%2?values[mid]:(values[mid-1]+values[mid])/2;
   rows.push({...r,peer_count:n,percentile,peer_median_cents:median,surplus_cents:r.supported_pf_cents-median,grade:percentile>=.9?'A+':percentile>=.75?'A':percentile>=.6?'B':percentile>=.4?'C':percentile>=.2?'D':'F'});
  }
 }
 const managers={};
 for(const r of rows){const m=managers[r.manager]??={manager:r.manager,picks:0,percentile_sum:0,surplus_cents:0};m.picks++;m.percentile_sum+=r.percentile;m.surplus_cents+=r.surplus_cents;}
 const reportCards=[];
 const seasonKeys=new Set([...rows,...excluded].map(r=>JSON.stringify([r.year,r.manager])));
 const letter=p=>p>=.9?'A+':p>=.75?'A':p>=.6?'B':p>=.4?'C':p>=.2?'D':'F';
 for(const key of seasonKeys){
  const [year,manager]=JSON.parse(key),graded=rows.filter(r=>r.year===year&&r.manager===manager),ungraded=excluded.filter(r=>r.year===year&&r.manager===manager);
  const sorted=graded.slice().sort((a,b)=>b.surplus_cents-a.surplus_cents||b.percentile-a.percentile||String(a.id).localeCompare(String(b.id)));
  const mean=graded.length?graded.reduce((n,r)=>n+r.percentile,0)/graded.length:null;
  reportCards.push({year,manager,graded_picks:graded.length,excluded_picks:ungraded.length,total_picks:graded.length+ungraded.length,coverage:graded.length/(graded.length+ungraded.length),mean_percentile:mean,grade:mean===null?null:letter(mean),surplus_cents:graded.reduce((n,r)=>n+r.surplus_cents,0),graded_pf_cents:graded.reduce((n,r)=>n+r.supported_pf_cents,0),best_selection:sorted[0]??null,worst_selection:sorted.at(-1)??null,provisional:true,active_season:year===2026});
 }
 assert.equal(reportCards.reduce((n,r)=>n+r.graded_picks,0),rows.length);
 assert.equal(reportCards.reduce((n,r)=>n+r.excluded_picks,0),excluded.length);
 const historicalReportCards=reportCards.filter(r=>!r.active_season&&r.coverage>=.75&&r.graded_picks>=8);
 const records={best:historicalReportCards.slice().sort((a,b)=>b.mean_percentile-a.mean_percentile||b.surplus_cents-a.surplus_cents).slice(0,10),worst:historicalReportCards.slice().sort((a,b)=>a.mean_percentile-b.mean_percentile||a.surplus_cents-b.surplus_cents).slice(0,10),eligibility:'At least eight graded picks and 75% graded coverage; completed seasons only; provisional archive keeper classifications.'};
 return {picks:rows,excluded,reportCards,records,managers:Object.values(managers).map(m=>({...m,mean_percentile:m.percentile_sum/m.picks})).sort((a,b)=>b.mean_percentile-a.mean_percentile),method:'Same-season same-round received starter PF percentile; ties receive midrank; zero-return picks included; minimum four peers; uncertain keeper designations excluded where identified. Historical archive designations are provisional. Not a causal grade, positional adjustment, or keeper opportunity cost. Active-season grades provisional.'};
}
