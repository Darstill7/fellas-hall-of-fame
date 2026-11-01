import fs from 'node:fs';
import assert from 'node:assert/strict';
const ranges=[[2020,18],[2021,18],[2022,18],[2023,18],[2024,18],[2025,18],[2026,8]];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const summary=[];
for(const [year,end] of ranges){
 let count=0,drops=0,failed=0,missing=[];
 const ids=new Set();
 for(let week=1;week<=end;week++){
  const path='data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
  if(!fs.existsSync(path)){missing.push(week);continue;}
  const r=read(path);
  assert.equal(r.schema,'fellas-provider-transaction-recovery-v1');
  assert.equal(r.year,year);assert.equal(r.week,week);
  assert.equal(r.reportedRows,r.transactions.length);
  assert.ok(r.transactions.length<100,'Potential truncation '+year+'/'+week);
  for(const t of r.transactions){
   const id=String(t.transactionId);
   assert.ok(!ids.has(id),'Repeated transaction across weeks '+year+'/'+id);ids.add(id);
   assert.equal(t.week,week);
   assert.ok(Number.isFinite(t.timestamp)&&t.timestamp>1e12,'Missing timestamp '+year+'/'+id);
   assert.ok(Array.isArray(t.added)&&Array.isArray(t.dropped));
   if(t.status==='failed')failed++;
   if(t.dropped.length)drops++;
   count++;
  }
 }
 summary.push({year,availableWeeks:end-missing.length,expectedWeeks:end,missingWeeks:missing,transactions:count,transactionsWithDrops:drops,failedClaims:failed});
}
for(const year of [2020,2021,2022,2023,2024,2025])assert.equal(summary.find(x=>x.year===year).missingWeeks.length,0,year+' archive incomplete');
assert.equal(summary.find(x=>x.year===2026).missingWeeks.length,0,'2026 through week eight incomplete');
console.log('Historical provider transaction audit',JSON.stringify(summary));

// The historical acquisition projection and certified FAAB receipt archive intentionally
// have different 2026 cutoffs. Make that divergence explicit until reconciled.
const acquisitionWeeks=read('data/acquisitions_2026.json').weeks.map(w=>w.week);
assert.deepEqual(acquisitionWeeks,[1,2,3,4,5,6],'2026 acquisition projection coverage changed: review and reconcile source');
const faabWeeks=read('data-integrity/faab-provider-receipts-2026.json').weeks.map(w=>w.week);
assert.deepEqual(faabWeeks,[1,2,3,4,5,6,7],'2026 certified FAAB coverage changed: review and reconcile source');
const week8=read('data-integrity/provider-recovered-transactions-2026-week8.json');
assert.equal(week8.coverageStatus,'provider_week_sample_not_crosschecked_for_completeness','Week 8 completeness status changed: reassess certification');
const week8Waivers=week8.transactions.filter(t=>t.type==='waiver'&&t.status==='complete');
assert.equal(week8Waivers.length,3,'Week 8 winning waiver count changed: reconcile receipts');
assert.equal(week8Waivers.reduce((sum,t)=>sum+t.faabBid,0),10,'Week 8 winning FAAB total changed: reconcile receipts');
console.log('2026 coverage divergence (research-only): acquisition weeks 1-6; certified FAAB weeks 1-7; recovered provider transactions weeks 1-8, Week 8 not completeness-certified');
