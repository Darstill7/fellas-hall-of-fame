// A separate supported regular-season view. Do not mutate strict acquisition totals.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {verifyFinalHistory} from './verify-final-historical-acquisitions.mjs';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const final=read('historical-acquisition-final-review'),candidate=read('historical-acquisition-certification-candidate'),live=read('2026-evidence-supported-acquisition-preview'),strict=read('combined-career-acquisition-preview');
const approved=process.env.FELLAS_APPROVED_FINAL_HISTORY_SHA256||null;
if(process.env.FELLAS_REQUIRE_APPROVED_HISTORY==='1')assert(approved,'Explicit final history approval required');
const verified=verifyFinalHistory(final,candidate,approved);
assert.deepEqual(live.completedThrough,strict.completedThrough);
const key=r=>[r.year,Number(r.roster),String(r.player_id),r.week].join(':');
const seen=new Set(),managers={},players={},categories={},trades={},rounds={},acquisitions={};
const norm=n=>n==='Tom'?'Thommy':n;
const ak=a=>[a.year,Number(a.roster),String(a.player_id),String(a.id)].join(':');
const index=new Map([...final.acquisitions,...live.ledger].map(a=>[ak(a),a]));
const add=(table,k,r)=>{const t=table[k]??={strict_starts:0,strict_pf_cents:0,supported_starts:0,supported_pf_cents:0,additional_starts:0,additional_pf_cents:0};t.supported_starts++;t.supported_pf_cents+=r.pf_cents;if(r.confidence==='STRICT_OWNERSHIP'){t.strict_starts++;t.strict_pf_cents+=r.pf_cents;}else{t.additional_starts++;t.additional_pf_cents+=r.pf_cents;}};
const rows=[...final.receipts];
for(const a of live.ledger)for(const [receipts,confidence] of [[a.receipts,'STRICT_OWNERSHIP'],[a.timing_receipts,'SCHEDULE_SUPPORTED']])for(const r of receipts)if(r.week<=14)rows.push({year:a.year,week:r.week,roster:Number(a.roster),player_id:String(a.player_id),acquisition_id:a.id,manager:a.manager,category:a.category,pf_cents:Math.round(r.points*100),confidence});
for(const r of rows){
 const k=key(r);assert(!seen.has(k));seen.add(k);
 const a=index.get(ak({...r,id:r.acquisition_id}));assert(a,'Unknown acquisition '+k);
 const category=a.category==='DRAFT'&&a.year===2026&&a.cost?.keeper_flag===null?'DRAFT_KEEPER_UNKNOWN':a.category;
 const manager=norm(a.manager);assert.equal(manager,norm(r.manager));assert(Number.isSafeInteger(r.pf_cents));
 for(const [table,id] of [[managers,manager],[players,String(a.player_id)],[categories,category],[acquisitions,ak(a)]])add(table,id,r);
 if(category==='TRADE')add(trades,JSON.stringify([a.year,a.id,manager]),r);
 if(['DRAFT','ARCHIVED_KEEPER','DRAFT_KEEPER_UNKNOWN'].includes(category))add(rounds,String(a.cost?.round??'unknown'),r);
}
const sum=(t,k)=>Object.values(t).reduce((n,r)=>n+r[k],0);
for(const table of [managers,players,categories,acquisitions]){
 assert.equal(sum(table,'supported_starts'),rows.length);
 assert.equal(sum(table,'supported_pf_cents'),rows.reduce((n,r)=>n+r.pf_cents,0));
 assert.equal(sum(table,'strict_starts'),strict.coverage.regular_starts);
 assert.equal(sum(table,'strict_pf_cents'),strict.coverage.regular_pf_cents);
}
const playerReceipts={};
for(const r of rows){const a=index.get(ak({...r,id:r.acquisition_id}));const id=String(r.player_id);(playerReceipts[id]??=[]).push({year:r.year,week:r.week,manager:norm(r.manager),category:a.category,acquisition_id:r.acquisition_id,pf_cents:r.pf_cents,confidence:r.confidence});}
for(const [id,list] of Object.entries(playerReceipts)){list.sort((a,b)=>a.year-b.year||a.week-b.week||a.manager.localeCompare(b.manager));assert.equal(list.length,players[id].supported_starts);assert.equal(list.reduce((n,r)=>n+r.pf_cents,0),players[id].supported_pf_cents);}
const report={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:strict.completedThrough,historicalPackage:{sha256:verified.sha256,approved:verified.approved},coverage:{supported_starts:rows.length,strict_starts:strict.coverage.regular_starts,additional_starts:rows.length-strict.coverage.regular_starts,supported_pf_cents:sum(categories,'supported_pf_cents'),strict_pf_cents:strict.coverage.regular_pf_cents},managers,players,playerReceipts,categories,trades,rounds,acquisitions,limitations:['Supported receipts include schedule and opening-play evidence, not actual lineup-lock logs. Commissioner receipts are a separate category. Regular season only.']};
fs.writeFileSync(root+'combined-evidence-supported-career-preview.json',JSON.stringify(report,null,2)+'\n');
console.log('SUPPORTED CAREER RECONCILIATION PASS '+JSON.stringify(report.coverage));
