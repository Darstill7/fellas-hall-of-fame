// Compare strict and schedule-supported acquisition returns without changing canonical data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const ledger=read('acquisition-hall-of-fame-research');
const timing=read('acquisition-kickoff-evidence-research');
assert.equal(timing.status,'RESEARCH_ONLY_SCHEDULE_PROXY_NOT_ACTUAL_LOCK_PROOF');
const round=n=>Math.round(n*100)/100||0;
const acqKey=(year,roster,pid,id)=>[year,roster,pid,id].join(':');
const receiptKey=(year,week,roster,pid)=>[year,week,roster,pid].join(':');
const used=new Set(), map=new Map();
for(const a of ledger.ledger){
 const k=acqKey(a.year,a.roster,a.player_id,a.id);assert(!map.has(k));
 map.set(k,{...a,added_receipts:[],added_pf:0,scenario_pf:a.strict_pf,scenario_starts:a.starts});
 for(const r of a.receipts){const k=receiptKey(a.year,r.week,a.roster,a.player_id);assert(!used.has(k));used.add(k);}
}
assert.equal(used.size,6672);
for(const r of timing.rows){
 if(!r.credit)continue;
 assert.equal(r.status,'SCHEDULE_TIMING_SUPPORTS_CREDIT');
 const k=receiptKey(r.year,r.week,r.roster,r.player_id);
 assert(!used.has(k),'Duplicate scenario credit '+k);used.add(k);
 const a=map.get(acqKey(r.year,r.roster,r.player_id,r.credit.id));assert(a);
 assert.equal(a.category,r.credit.category);
 assert(a.boundary.some(b=>b.week===r.week&&Math.abs(b.points-r.pf)<.011));
 a.added_receipts.push({week:r.week,pf:r.pf,game_ids:r.game_ids,scheduled_kickoff_utc:r.scheduled_kickoff_utc,acquisition_ms:r.credit.start_ms,exit_ms:r.credit.exit_ms});
}
const rows=[...map.values()].map(a=>{
 a.added_pf=round(a.added_receipts.reduce((n,r)=>n+r.pf,0));
 a.scenario_pf=round(a.strict_pf+a.added_pf);
 a.scenario_starts=a.starts+a.added_receipts.length;
 return a;
});
const rank=(rs,scenario)=>rs.filter(a=>scenario?a.scenario_starts>0:a.starts>0).sort((a,b)=>(scenario?b.scenario_pf-a.scenario_pf:b.strict_pf-a.strict_pf)||(scenario?b.scenario_starts-a.scenario_starts:b.starts-a.starts)||a.year-b.year||a.id.localeCompare(b.id)||a.player_id.localeCompare(b.player_id));
const summary=a=>({year:a.year,manager:a.manager,id:a.id,player_id:a.player_id,name:a.name,category:a.category,cost:a.cost,strict_pf:a.strict_pf,strict_starts:a.starts,added_pf:a.added_pf,added_starts:a.added_receipts.length,scenario_pf:a.scenario_pf,scenario_starts:a.scenario_starts});
function board(rs){
 const strict=rank(rs,false),scenario=rank(rs,true);
 const k=a=>acqKey(a.year,a.roster,a.player_id,a.id);
 const ranks=new Map(strict.map((a,i)=>[k(a),i+1]));
 return {strict_top:strict.slice(0,25).map(summary),scenario_top:scenario.slice(0,25).map((a,i)=>({...summary(a),strict_rank:ranks.get(k(a))??null,scenario_rank:i+1})),leader_changed:strict.length&&scenario.length?k(strict[0])!==k(scenario[0]):strict.length!==scenario.length};
}
const categories=['DRAFT','ARCHIVED_KEEPER','TRADE','WAIVER','FREE_AGENT'];
const boards=Object.fromEntries(categories.map(c=>[c,board(rows.filter(a=>a.category===c))]));
const combined=board(rows.filter(a=>a.category!=='ARCHIVED_KEEPER'));
const managers=[...new Set(rows.map(a=>a.manager))].sort().map(manager=>{
 const rs=rows.filter(a=>a.manager===manager);
 return {manager,strict_pf:round(rs.reduce((n,a)=>n+a.strict_pf,0)),added_pf:round(rs.reduce((n,a)=>n+a.added_pf,0)),scenario_pf:round(rs.reduce((n,a)=>n+a.scenario_pf,0)),strict_starts:rs.reduce((n,a)=>n+a.starts,0),added_starts:rs.reduce((n,a)=>n+a.added_receipts.length,0),scenario_starts:rs.reduce((n,a)=>n+a.scenario_starts,0)};
});
const extra=timing.rows.filter(r=>r.credit);
const coverage={observed_starts:7374,strict_starts:6672,additional_supported_starts:extra.length,scenario_starts:used.size,remaining_unresolved:7374-used.size,additional_pf:round(extra.reduce((n,r)=>n+r.pf,0))};
assert.equal(coverage.scenario_starts,6672+extra.length);
assert.equal(rows.reduce((n,a)=>n+a.scenario_starts,0),used.size);
assert(Math.abs(rows.reduce((n,a)=>n+a.added_pf,0)-coverage.additional_pf)<.011);
const output={status:'RESEARCH_ONLY_SCHEDULE_SUPPORTED_NOT_LOCK_CERTIFIED',coverage,boards,combined,managers,changed_acquisitions:rows.filter(a=>a.added_receipts.length).map(a=>({...summary(a),receipts:a.added_receipts})),limitations:['Scheduled kickoff is not actual lineup lock proof','No canonical updates','Historical keeper classifications before 2025 remain unresolved','Observed production is not causal manager skill']};
fs.writeFileSync(dir+'/acquisition-ranking-sensitivity-research.json',JSON.stringify(output,null,2)+'\n');
console.log('ACQUISITION RANKING COVERAGE '+JSON.stringify(coverage));
console.log('ACQUISITION RANKING LEADERS '+JSON.stringify(Object.fromEntries(categories.map(c=>[c,{changed:boards[c].leader_changed,strict:boards[c].strict_top[0],scenario:boards[c].scenario_top[0]}]))));
console.log('ACQUISITION RANKING MANAGERS '+JSON.stringify(managers));
