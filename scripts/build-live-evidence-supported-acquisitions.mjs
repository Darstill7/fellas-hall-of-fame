// Preserve strict totals and attach independently reconciled timing-supported returns.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const live=read('2026-live-acquisition-preview'),evidence=read('2026-live-acquisition-kickoff-evidence');
assert.deepEqual(live.completedThrough,evidence.completedThrough);
const key=r=>[Number(r.roster),String(r.player_id),r.week].join(':');
const ak=r=>[Number(r.roster),String(r.player_id),String(r.id)].join(':');
const cents=n=>{assert(Number.isFinite(n));return Math.round(n*100)};
const ledger=structuredClone(live.ledger),index=new Map(ledger.map(a=>[ak(a),a])),seen=new Set(),missing=new Map(live.unresolved.map(r=>[key(r),r]));
assert.equal(index.size,ledger.length);assert.equal(missing.size,live.coverage.unattributed_starts);
for(const a of ledger){a.timing_receipts=[];for(const r of a.receipts){const k=key({...a,week:r.week});assert(!seen.has(k));seen.add(k);}}
assert.equal(seen.size,live.coverage.strict_starts);
const reviewed=new Set(),exceptions=[];
for(const r of evidence.rows){
 const k=key(r),original=missing.get(k);assert(original&&!seen.has(k)&&!reviewed.has(k));reviewed.add(k);assert.equal(cents(r.points),cents(original.points));
 if(!r.credit){exceptions.push(r);continue;}
 assert.equal(r.status,'SCHEDULE_TIMING_SUPPORTS_CREDIT');
 const a=index.get(ak({...r,id:r.credit.id}));assert(a);assert.equal(a.category,r.credit.category);
 assert(a.boundary.some(b=>b.week===r.week&&cents(b.points)===cents(r.points)));
 const km=Date.parse(r.scheduled_kickoff_utc);assert(Number.isFinite(km)&&a.time<km&&(!a.exit_ms||a.exit_ms>km));
 assert(r.evaluations.filter(e=>e.verdict==='SUPPORTS').length===1);
 a.timing_receipts.push({...original,confidence:'SCHEDULE_SUPPORTED',scheduled_kickoff_utc:r.scheduled_kickoff_utc,evidence:r.credit});
 seen.add(k);
}
assert.equal(reviewed.size,missing.size);assert.equal(seen.size+exceptions.length,live.coverage.observed_starts);
for(const a of ledger){a.supported_starts=a.starts+a.timing_receipts.length;a.supported_pf_cents=[...a.receipts,...a.timing_receipts].reduce((n,r)=>n+cents(r.points),0);}
const byCategory={},byManager={},tradeSides={};
for(const a of ledger){
 for(const [index,k] of [[byCategory,a.category],[byManager,a.manager]]){
 const t=index[k]??={strict_starts:0,strict_pf_cents:0,additional_starts:0,additional_pf_cents:0};
 t.strict_starts+=a.starts;t.strict_pf_cents+=cents(a.strict_pf);t.additional_starts+=a.timing_receipts.length;t.additional_pf_cents+=a.timing_receipts.reduce((n,r)=>n+cents(r.points),0);
 }
 if(a.category==='TRADE'){const k=JSON.stringify([a.id,a.manager]),t=tradeSides[k]??={id:a.id,manager:a.manager,strict_regular_pf_cents:0,supported_regular_pf_cents:0,strict_regular_starts:0,supported_regular_starts:0};const strict=a.receipts.filter(r=>r.week<=14),extra=a.timing_receipts.filter(r=>r.week<=14);t.strict_regular_pf_cents+=strict.reduce((n,r)=>n+cents(r.points),0);t.supported_regular_pf_cents+=[...strict,...extra].reduce((n,r)=>n+cents(r.points),0);t.strict_regular_starts+=strict.length;t.supported_regular_starts+=strict.length+extra.length;}
}
const coverage={observed:live.coverage.observed_starts,strict:live.coverage.strict_starts,schedule_supported:seen.size-live.coverage.strict_starts,unresolved:exceptions.length};
const report={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:live.completedThrough,coverage,ledger,exceptions,byCategory,byManager,tradeSides:Object.values(tradeSides),limitations:['Schedule-supported production is a separate evidence tier, not confirmed lineup lock. Strict totals unchanged.']};
fs.writeFileSync(root+'2026-evidence-supported-acquisition-preview.json',JSON.stringify(report,null,2)+'\n');
console.log('LIVE EVIDENCE SUPPORTED RECONCILIATION PASS '+JSON.stringify(coverage));
