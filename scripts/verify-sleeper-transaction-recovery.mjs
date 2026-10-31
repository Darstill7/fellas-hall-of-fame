// Verify the first connected Sleeper add/drop recovery against archived claims.
// Do not infer transaction ordering from identical timestamps or player availability.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const d=JSON.parse(fs.readFileSync('data-integrity/provider-recovered-transactions-2025-week8.json','utf8'));
const a=JSON.parse(fs.readFileSync('data/acquisitions_2025.json','utf8'));
assert.equal(d.schema,'fellas-provider-transaction-recovery-v1');
assert.equal(d.year,2025);assert.equal(d.week,8);
assert.equal(d.normalizedRows,d.transactions.length);
assert.equal(d.reportedRows,d.normalizedRows,'Provider page count changed');
const seen=new Set();let drops=0;
for(const x of d.transactions){
 assert.ok(!seen.has(x.transactionId),'Duplicate provider transaction');seen.add(x.transactionId);
 assert.equal(x.week,8);
 assert.ok(['complete','failed'].includes(x.status),'Unexpected transaction status');
 assert.ok(Number.isFinite(x.timestamp)&&x.timestamp>1e12,'Not an epoch millisecond timestamp');
 assert.ok(Array.isArray(x.added)&&Array.isArray(x.dropped));
 if(x.dropped.length)drops++;
 if(x.status==='failed')assert.ok(x.faabBid===null||x.faabBid>=0,'Invalid unsuccessful bid');
}
assert.ok(drops>0,'Drop evidence missing');
const archive=new Map(a.weeks.flatMap(w=>w.tx).map(x=>[String(x.id),x]));
let compared=0;
for(const x of d.transactions){
 const old=archive.get(x.transactionId);
 if(!old||x.status!=='complete')continue;
 for(const p of old.players??[])assert.ok(x.added.some(v=>v.id===String(p.id)),'Provider add differs from archive '+x.transactionId);
 compared++;
}
assert.ok(compared>0,'No transactions cross-checked with archival history');
console.log('Sleeper provider Week 8 recovery PASS:',d.normalizedRows,'receipts,',drops,'with drops,',compared,'archival crosschecks');
