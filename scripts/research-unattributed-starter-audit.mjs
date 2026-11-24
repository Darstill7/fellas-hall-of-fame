// Reconcile all archived starter appearances against strict acquisition receipts.
// No inferred ownership or canonical writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read(dir+'/acquisition-hall-of-fame-research.json');
const key=(y,w,r,p)=>[y,w,r,String(p)].join(':');
const strict=new Map(),boundaries=new Map(),observed=new Map();
for(const a of ledger.ledger){
 for(const r of a.receipts){
 const k=key(a.year,r.week,a.roster,a.player_id);assert(!strict.has(k),'Duplicate strict '+k);
 strict.set(k,{acquisition_id:a.id,points:r.points,category:a.category});
 }
 for(const r of a.boundary){
 const k=key(a.year,r.week,a.roster,a.player_id);
 if(!boundaries.has(k))boundaries.set(k,[]);
 boundaries.get(k).push({id:a.id,category:a.category,manager:a.manager,acquired_week:a.week,acquired_ms:a.time,exit_transaction:a.exit_transaction,reason:r.reason,points:r.points});
 }
}
for(const year of [2020,2021,2022,2023,2024,2025]){
 const draft=read(dir+'/'+year+'-sleeper-draft-id-review.json');
 const starts=read('data/player_starts_'+year+'.json');
 const manager=new Map(draft.verified_picks.map(p=>[Number(p.original_roster),p.manager]));
 for(const w of starts.weeks.filter(x=>x.week<=draft.regular_season_completed_weeks))for(const t of w.teams)for(const [pid,name,position,points] of t.players){
 if(String(pid)==='0')continue;
 const k=key(year,w.week,t.roster,pid);assert(!observed.has(k));
 observed.set(k,{year,week:w.week,roster:t.roster,manager:manager.get(Number(t.roster)),player_id:String(pid),name,position,pf:Number(points)});
 }
}
const rows=[];
for(const [k,r] of observed){
 if(strict.has(k)){assert(Math.abs(strict.get(k).points-r.pf)<.011);continue;}
 const candidates=boundaries.get(k)||[];
 for(const c of candidates)assert(Math.abs(c.points-r.pf)<.011);
 const classification=candidates.length===0?'NO_BOUNDARY_CANDIDATE':candidates.length===1?'ONE_BOUNDARY_CANDIDATE':'MULTIPLE_BOUNDARY_CANDIDATES';
 rows.push({...r,classification,candidates});
}
for(const k of strict.keys())assert(observed.has(k),'Strict receipt missing from source '+k);
assert.equal(observed.size,7374);assert.equal(strict.size,6672);assert.equal(rows.length,702);
const summarize=rs=>({starts:rs.length,pf:Math.round(rs.reduce((n,r)=>n+r.pf,0)*100)/100});
const classes=['NO_BOUNDARY_CANDIDATE','ONE_BOUNDARY_CANDIDATE','MULTIPLE_BOUNDARY_CANDIDATES'];
const coverage={observed:observed.size,strict:strict.size,unattributed:rows.length,by_classification:Object.fromEntries(classes.map(c=>[c,summarize(rows.filter(r=>r.classification===c))])),by_year:[2020,2021,2022,2023,2024,2025].map(year=>({year,...summarize(rows.filter(r=>r.year===year)),classes:Object.fromEntries(classes.map(c=>[c,summarize(rows.filter(r=>r.year===year&&r.classification===c))]))}))};
fs.writeFileSync(dir+'/unattributed-starter-audit-research.json',JSON.stringify({status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',coverage,rows,limitations:['A single boundary candidate is not proof of ownership at kickoff','Multiple candidates require timestamp reconciliation','No candidate requires independent transaction or roster evidence','No additional points credited']},null,2)+'\n');
console.log('UNATTRIBUTED STARTER COVERAGE '+JSON.stringify(coverage));
