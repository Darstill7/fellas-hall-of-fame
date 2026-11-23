// Common strict-ownership career ledger; never mix timing-supported and strict returns.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const historical=read('acquisition-hall-of-fame-research'),live=read('2026-live-acquisition-preview'),trade=read('combined-trade-front-office-preview');
assert.deepEqual(live.completedThrough,trade.completedThrough);
assert.equal(historical.ledger.length,2542);
const cents=n=>{assert(Number.isFinite(n));return Math.round(n*100)};
const norm=n=>n==='Tom'?'Thommy':n;
const seen=new Set(),acqIds=new Set(),managers={},players={},categories={},draftRounds={};
let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
const zero=()=>({acquisitions:0,productive:0,starts:0,pf_cents:0,known_faab:0,known_faab_spend:0,unknown_faab:0});
const add=(r,a,pf,starts)=>{r.acquisitions++;r.productive+=Number(starts>0);r.starts+=starts;r.pf_cents+=pf;if(a.category==='WAIVER'){if(Number.isFinite(a.cost?.faab)){r.known_faab++;r.known_faab_spend+=a.cost.faab;}else r.unknown_faab++;}};
const rows=[...historical.ledger,...live.ledger].map(a=>{
 const manager=norm(a.manager),regular=a.receipts.filter(r=>r.phase!=='postseason_calendar'),post=a.receipts.filter(r=>r.phase==='postseason_calendar');
 const key=[a.year,a.roster,a.player_id,a.id].join('|');assert(!acqIds.has(key),'Duplicate acquisition '+key);acqIds.add(key);
 for(const r of a.receipts){const k=[a.year,a.roster,a.player_id,r.week].join('|');assert(!seen.has(k),'Duplicate starter '+k);seen.add(k);assert(r.week>=1);if(a.year===2026)assert(r.week<=live.completedThrough.week);}
 const pf=regular.reduce((n,r)=>n+cents(r.points),0),postPF=post.reduce((n,r)=>n+cents(r.points),0);
 eq(pf+postPF,cents(a.strict_pf),'Acquisition PF '+key);eq(a.receipts.length,a.starts,'Acquisition starts '+key);
 const category=a.category==='DRAFT'&&a.year===2026&&a.cost?.keeper_flag===null?'DRAFT_KEEPER_UNKNOWN':a.category;
 const row={...a,manager,category,regular_pf_cents:pf,regular_starts:regular.length,postseason_calendar_pf_cents:postPF,postseason_calendar_starts:post.length};
 const m=managers[manager]??={manager,categories:{},seasons:{}};
 const season=m.seasons[a.year]??={};
 const p=players[a.player_id]??={player_id:a.player_id,name:a.name??null,totals:zero(),ownership:[]};
 if(!p.name&&a.name)p.name=a.name;
 for(const target of [m.categories[category]??=zero(),season[category]??=zero(),categories[category]??=zero(),p.totals])add(target,row,pf,regular.length);
 p.ownership.push({year:a.year,manager,category,id:a.id,week:a.week,exit_week:a.exit_week??null,regular_pf_cents:pf,regular_starts:regular.length});
 if(['DRAFT','ARCHIVED_KEEPER','DRAFT_KEEPER_UNKNOWN'].includes(category)){const k=String(a.cost?.round??'unknown');add(draftRounds[k]??=zero(),row,pf,regular.length);}
 return row;
});
const regularStarts=rows.reduce((n,a)=>n+a.regular_starts,0),regularPF=rows.reduce((n,a)=>n+a.regular_pf_cents,0);
for(const totals of [Object.values(categories),Object.values(players).map(p=>p.totals),Object.values(managers).flatMap(m=>Object.values(m.categories))]){
 eq(totals.reduce((n,r)=>n+r.acquisitions,0),rows.length);eq(totals.reduce((n,r)=>n+r.starts,0),regularStarts);eq(totals.reduce((n,r)=>n+r.pf_cents,0),regularPF);
}
for(const t of trade.transaction_ledger.filter(t=>t.year===2026))for(const s of t.sides){
 const matching=rows.filter(a=>a.year===2026&&a.category==='TRADE'&&a.id===t.id&&a.manager===s.manager);
 eq(matching.reduce((n,a)=>n+a.regular_pf_cents,0),cents(s.regular));eq(matching.reduce((n,a)=>n+a.regular_starts,0),s.starts);
}
const rank=category=>rows.filter(a=>a.category===category&&a.regular_starts>0).sort((a,b)=>b.regular_pf_cents-a.regular_pf_cents||b.regular_starts-a.regular_starts||a.year-b.year||a.id.localeCompare(b.id)).map(({year,manager,player_id,name,id,regular_pf_cents,regular_starts,cost})=>({year,manager,player_id,name,id,regular_pf_cents,regular_starts,cost}));
const historicalHash=createHash('sha256').update(JSON.stringify(historical.ledger)).digest('hex');
const report={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:live.completedThrough,historical_source:{years:[2020,2025],sha256:historicalHash,status:'Fingerprint recorded; immutable source certification pending'},coverage:{historical_acquisitions:historical.ledger.length,live_acquisitions:live.ledger.length,regular_starts:regularStarts,regular_pf_cents:regularPF,live_unattributed_starts:live.coverage.unattributed_starts,keeper_flags:live.coverage.keeper_flags},categories,rankings:Object.fromEntries(Object.keys(categories).map(k=>[k,rank(k)])),draft_rounds:draftRounds,managers:Object.values(managers),players:Object.values(players),ledger:rows,limitations:['Strict ownership only; timing-supported historical boundary scenarios not merged.','Unknown active keeper flags separated from confirmed draft and keeper categories. Historical keeper classification remains archive-derived.','Postseason calendar receipts retained separately; not included in regular career totals.','No causal grades or replacement-value estimates.']};
fs.writeFileSync(root+'combined-career-acquisition-preview.json',JSON.stringify(report,null,2)+'\n');
console.log('COMBINED CAREER ACQUISITION PASS '+JSON.stringify({checks,completedThrough:report.completedThrough,coverage:report.coverage,managers:Object.keys(managers).length,players:Object.keys(players).length}));
