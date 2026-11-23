// Descriptive acquisition records, not causal grades or verified cost-adjusted keeper rankings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const source=JSON.parse(fs.readFileSync(dir+'/acquisition-hall-of-fame-research.json','utf8'));
assert.equal(source.status,'RESEARCH_ONLY_NOT_FOR_PUBLICATION');
const rows=source.ledger,round=n=>Math.round(n*100)/100;
const categories=['TRADE','WAIVER','FREE_AGENT','DRAFT','ARCHIVED_KEEPER'];
const receipt=r=>({year:r.year,manager:r.manager,category:r.category,player_id:r.player_id,name:r.name,id:r.id,week:r.week,strict_pf:r.strict_pf,starts:r.starts,points_per_start:r.points_per_start,cost:r.cost});
const rank=(a,key)=>a.sort((x,y)=>y[key]-x[key]||y.starts-x.starts||x.year-y.year||x.id.localeCompare(y.id));
const scored=rows.filter(r=>r.starts>0);
const boards={};
for(const category of categories){
 const a=scored.filter(r=>r.category===category);
 boards[category]={total:rank(a.map(receipt),'strict_pf'),per_start_min_three:rank(a.filter(r=>r.starts>=3).map(receipt),'points_per_start')};
}
const paid=scored.filter(r=>r.category==='WAIVER'&&Number.isFinite(r.cost?.faab)&&r.cost.faab>0);
const faab_efficiency=rank(paid.filter(r=>r.starts>=3).map(r=>({...receipt(r),points_per_faab:round(r.strict_pf/r.cost.faab)})),'points_per_faab');
const zero_cost=rank(scored.filter(r=>['WAIVER','FREE_AGENT'].includes(r.category)&&r.cost?.faab===0).map(receipt),'strict_pf');
const midseason=rank(scored.filter(r=>['TRADE','WAIVER','FREE_AGENT'].includes(r.category)&&r.week>=7).map(receipt),'strict_pf');
const manager_profiles=[...new Set(rows.map(r=>r.manager))].sort().map(manager=>{
 const own=rows.filter(r=>r.manager===manager);
 return {manager,categories:Object.fromEntries(categories.map(c=>{
 const a=own.filter(r=>r.category===c),b=a.filter(r=>r.starts>0),top=rank(b.map(receipt),'strict_pf');
 return [c,{acquisitions:a.length,productive_acquisitions:b.length,starts:a.reduce((n,r)=>n+r.starts,0),pf:round(a.reduce((n,r)=>n+r.strict_pf,0)),best:top[0]??null,top_five:top.slice(0,5),unknown_faab:c==='WAIVER'?a.filter(r=>!Number.isFinite(r.cost?.faab)).length:null}];
 }))};
});
const known=rows.filter(r=>r.category==='WAIVER'&&Number.isFinite(r.cost?.faab)).length;
const allWaivers=rows.filter(r=>r.category==='WAIVER').length;
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:source.scope,coverage:{acquisitions:rows.length,credited_starts:rows.reduce((n,r)=>n+r.starts,0),waivers:allWaivers,known_waiver_cost:known,unknown_waiver_cost:allWaivers-known},boards,combined:rank(scored.filter(r=>r.category!=='ARCHIVED_KEEPER').map(receipt),'strict_pf'),faab_efficiency,zero_cost,midseason,manager_profiles,limitations:['Strict ownership windows only; boundary points excluded','Per-start and FAAB efficiency rankings require three credited starts','Midseason defined as acquisition in week seven or later','Unknown bid never treated as zero','Raw draft production is not a draft steal grade; archived keeper flags are provisional','No ranking by overall manager skill or causal wins']};
fs.writeFileSync(dir+'/acquisition-leaderboards-research.json',JSON.stringify(output,null,2)+'\n');
console.log('ACQUISITION LEADERBOARD COVERAGE '+JSON.stringify(output.coverage));
console.log('ACQUISITION RECORD LEADERS '+JSON.stringify({categories:Object.fromEntries(categories.map(c=>[c,boards[c].total.slice(0,3)])),faab:faab_efficiency.slice(0,3),zero:zero_cost.slice(0,3),midseason:midseason.slice(0,3),combined:output.combined.slice(0,3)}));
