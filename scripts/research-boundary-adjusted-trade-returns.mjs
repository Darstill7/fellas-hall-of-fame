// Research scenario only: compare strict and scheduled-kickoff-supported PF.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const evidence=JSON.parse(fs.readFileSync(dir+'/boundary-kickoff-evidence-research.json','utf8'));
const career=JSON.parse(fs.readFileSync(dir+'/career-trade-return-research.json','utf8'));
const round=n=>Math.round(n*100)/100;
const key=(year,id,roster,player,week)=>[year,id,roster,player,week].join(':');
const candidates=new Map();
for(const r of evidence.rows){const k=key(r.year,r.trade_id,r.roster,r.player_id,r.week);assert(!candidates.has(k));candidates.set(k,r);}
const consumed=new Set(),credited=new Set(),provisional=new Set(),rows=[],pairs=new Map(),managers=new Map(),conflicts=[];
for(const year of career.years){
 const own=JSON.parse(fs.readFileSync(dir+'/'+year+'-ownership-review.json','utf8'));
 for(const t of own.trade_results)for(const s of t.sides)for(const p of s.players)for(const r of p.receipts){
 const k=[year,s.roster,p.player_id,r.week].join(':');assert(!credited.has(k));credited.add(k);
 }
 for(const t of own.trade_results){
 const base=career.transaction_ledger.find(x=>x.year===year&&x.id===t.id);assert(base);
 const sides=t.sides.map(s=>{
 let reg=0,post=0;
 for(const p of s.players)for(const b of p.boundary){
 const k=key(year,t.id,s.roster,p.player_id,b.week),e=candidates.get(k);assert(e);assert(!consumed.has(k));consumed.add(k);assert.equal(e.points,b.points);
 if(e.status!=='TIMING_SUPPORTS_CREDIT')continue;
 const receipt=[year,s.roster,p.player_id,b.week].join(':');
 if(credited.has(receipt)||provisional.has(receipt)){conflicts.push({key:receipt,trade:t.id});continue;}
 provisional.add(receipt);if(b.week<=own.regular_season_end)reg+=b.points;else post+=b.points;
 }
 return {manager:s.manager,strict_regular:s.regular_pf,strict_postseason:s.postseason_calendar_pf,additional_regular:round(reg),additional_postseason:round(post),scenario_regular:round(s.regular_pf+reg),scenario_postseason:round(s.postseason_calendar_pf+post)};
 });
 rows.push({year,id:t.id,kind:base.kind,sides});
 for(const s of sides){if(!managers.has(s.manager))managers.set(s.manager,{manager:s.manager,additional_regular:0,additional_postseason:0,strict_delta:0,scenario_delta:0});const m=managers.get(s.manager);m.additional_regular+=s.additional_regular;m.additional_postseason+=s.additional_postseason;}
 if(base.kind!=='TWO_TEAM_PLAYER_EXCHANGE')continue;
 const [a,b]=[...sides].sort((x,y)=>x.manager.localeCompare(y.manager));
 const k=JSON.stringify([a.manager,b.manager]);if(!pairs.has(k))pairs.set(k,{a:a.manager,b:b.manager,trades:0,strict_delta:0,scenario_delta:0});
 const p=pairs.get(k),strict=a.strict_regular-b.strict_regular,scenario=a.scenario_regular-b.scenario_regular;
 p.trades++;p.strict_delta+=strict;p.scenario_delta+=scenario;
 managers.get(a.manager).strict_delta+=strict;managers.get(b.manager).strict_delta-=strict;managers.get(a.manager).scenario_delta+=scenario;managers.get(b.manager).scenario_delta-=scenario;
 }
}
assert.equal(consumed.size,candidates.size);
const normalize=x=>({...x,...Object.fromEntries(Object.entries(x).filter(([k,v])=>typeof v==='number').map(([k,v])=>[k,round(v)])),change:round(x.scenario_delta-x.strict_delta)});
const managerRows=[...managers.values()].map(normalize).sort((a,b)=>b.scenario_delta-a.scenario_delta);
assert.equal(round(managerRows.reduce((n,m)=>n+m.scenario_delta,0)),0);
const coverage={candidates:candidates.size,unique_additional_starts:provisional.size,conflicts:conflicts.length,additional_regular_pf:round(managerRows.reduce((n,m)=>n+m.additional_regular,0)),additional_postseason_pf:round(managerRows.reduce((n,m)=>n+m.additional_postseason,0))};
const report={status:'RESEARCH_ONLY_SCHEDULE_SUPPORTED_SCENARIO_NOT_LOCK_CERTIFIED',coverage,managers:managerRows,pairs:[...pairs.values()].map(normalize),transactions:rows,conflicts,limitations:['Scheduled kickoff proxy only','No canonical changes','Raw PF not replacement-adjusted value']};
fs.writeFileSync(dir+'/boundary-adjusted-trade-returns-research.json',JSON.stringify(report,null,2)+'\n');
console.log('BOUNDARY SCENARIO COVERAGE '+JSON.stringify(coverage));
console.log('BOUNDARY SCENARIO MANAGERS '+JSON.stringify(managerRows));
