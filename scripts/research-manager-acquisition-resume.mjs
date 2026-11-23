// Research-only manager acquisition resumes; never merge incompatible scoring windows.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const ledger=read('acquisition-hall-of-fame-research'),boards=read('acquisition-leaderboards-research'),positions=read('acquisition-positional-records-research'),matrix=read('manager-trade-matrix-research');
const categories=['DRAFT','TRADE','WAIVER','FREE_AGENT','ARCHIVED_KEEPER'];
const round=n=>Math.round(n*100)/100||0;
const summarize=rows=>({acquisitions:rows.length,productive:rows.filter(r=>r.starts>0).length,starts:rows.reduce((n,r)=>n+r.starts,0),pf:round(rows.reduce((n,r)=>n+r.strict_pf,0)),starter_use_pct:rows.length?round(100*rows.filter(r=>r.starts>0).length/rows.length):null,pf_per_acquisition:rows.length?round(rows.reduce((n,r)=>n+r.strict_pf,0)/rows.length):null});
const profiles=boards.manager_profiles.map(p=>{
 const rows=ledger.ledger.filter(r=>r.manager===p.manager);
 const career=Object.fromEntries(categories.map(c=>[c,{...summarize(rows.filter(r=>r.category===c)),best:p.categories[c].best,top_five:p.categories[c].top_five}]));
 const seasons=[...new Set(rows.map(r=>r.year))].sort().map(year=>({year,categories:Object.fromEntries(categories.map(c=>[c,summarize(rows.filter(r=>r.year===year&&r.category===c))]))}));
 const honors=positions.positional_leaders.flatMap(pos=>Object.entries(pos.leaders).filter(([c,r])=>r?.manager===p.manager).map(([category,r])=>({position:pos.position,category,...r})));
 const waiver=rows.filter(r=>r.category==='WAIVER');
 const waiver_cost={known:waiver.filter(r=>Number.isFinite(r.cost?.faab)).length,unknown:waiver.filter(r=>!Number.isFinite(r.cost?.faab)).length,known_spend:round(waiver.filter(r=>Number.isFinite(r.cost?.faab)).reduce((n,r)=>n+r.cost.faab,0))};
 return {manager:p.manager,career,seasons,honors,waiver_cost};
});
assert.equal(profiles.length,12);
assert.equal(profiles.flatMap(p=>Object.values(p.career)).reduce((n,c)=>n+c.acquisitions,0),ledger.ledger.length);
assert.equal(profiles.flatMap(p=>Object.values(p.career)).reduce((n,c)=>n+c.starts,0),6672);
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:ledger.scope,profiles,limitations:['Strict acquisition ownership returns only; not all observed lineup points','Productive means at least one credited start, not a successful acquisition','Unknown cost not zero','No composite GM grade or causal wins','Keeper flags and manager identities remain provisional']};
fs.writeFileSync(dir+'/manager-acquisition-resumes-research.json',JSON.stringify(output,null,2)+'\n');
console.log('MANAGER ACQUISITION RESUME COVERAGE '+JSON.stringify({profiles:profiles.length,acquisitions:ledger.ledger.length,starts:6672}));
console.log('MANAGER ACQUISITION RESUME STILLY '+JSON.stringify(profiles.find(p=>p.manager==='Stilly')));
