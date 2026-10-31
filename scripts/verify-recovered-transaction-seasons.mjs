import fs from 'node:fs';
import assert from 'node:assert/strict';
const ranges=[[2020,18],[2021,18],[2022,18],[2023,18],[2024,17],[2025,18],[2026,8]];
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
for(const year of [2020,2021,2022,2023,2025])assert.equal(summary.find(x=>x.year===year).missingWeeks.length,0,year+' archive incomplete');
assert.equal(summary.find(x=>x.year===2026).missingWeeks.length,0,'2026 through week eight incomplete');
console.log('Historical provider transaction audit',JSON.stringify(summary));
