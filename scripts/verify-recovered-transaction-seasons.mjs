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

// The historical per-week provider-recovery sample currently ends at Week 8;
// this does NOT imply the separate current acquisition and certified FAAB
// receipt ledgers should stop at that archival research horizon.
const canonical=read('data/unified_record_book_2016_2026.json');
const latest=Math.max(...canonical.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
const acquisitionWeeks=read('data/acquisitions_2026.json').weeks.map(w=>w.week);
const faabWeeks=read('data-integrity/faab-provider-receipts-2026.json').weeks.map(w=>w.week);
for(const [label,weeks] of [['Acquisition',acquisitionWeeks],['FAAB provider',faabWeeks]]){
 assert.ok(weeks.length>=8&&weeks.length<=latest,label+' evidence exceeds canonical game coverage or loses recovered Week 8 receipts');
 assert.deepEqual(weeks,Array.from({length:weeks.length},(_,i)=>i+1),label+' receipt coverage must be contiguous and source-backed');
 if(weeks.length<latest)
  console.warn(label+' SOURCE REVIEW REQUIRED: verified through Week '+weeks.length+' only; Week '+(weeks.length+1)+'–'+latest+' receipts have not been collected.');
}
const week8=read('data-integrity/provider-recovered-transactions-2026-week8.json');
assert.equal(week8.coverageStatus,'provider_week_sample_not_crosschecked_for_completeness','Preserve Week 8 archived research coverage caveat');
const week8Waivers=week8.transactions.filter(t=>t.type==='waiver'&&t.status==='complete');
assert.equal(week8Waivers.length,3,'Archived Week 8 winning waiver sample changed');
assert.equal(week8Waivers.reduce((sum,t)=>sum+t.faabBid,0),10,'Archived Week 8 winning FAAB sample changed');
console.log('2026 coverage: game scores through Week '+latest+', acquisitions through Week '+acquisitionWeeks.length+', FAAB receipts through Week '+faabWeeks.length+'; separate provider-recovery research sample through Week 8 only. Uncollected transactions are not certified.');
