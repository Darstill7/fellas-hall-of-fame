// Cross-week validation of original Sleeper receipts; no inferred exact free-agent pool.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const weeks=[[2024,7],[2024,8],[2025,7],[2025,8],[2025,9]];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const seen=new Set(),stats=[];
for(const [year,week] of weeks){
 const d=read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json');
 assert.equal(d.schema,'fellas-provider-transaction-recovery-v1');
 assert.equal(d.year,year);assert.equal(d.week,week);
 assert.equal(d.normalizedRows,d.transactions.length);
 assert.equal(d.reportedRows,d.normalizedRows);
 assert.ok(d.normalizedRows<100,'Provider page might be truncated '+year+'/'+week);
 let drops=0,failed=0;
 for(const t of d.transactions){
  const key=year+'|'+t.transactionId;
  assert.ok(!seen.has(key),'Duplicate historical transaction '+key);seen.add(key);
  assert.equal(t.week,week);
  assert.ok(Number.isFinite(t.timestamp)&&t.timestamp>1e12,'Missing millisecond timestamp '+key);
  assert.ok(Array.isArray(t.added)&&Array.isArray(t.dropped),'Missing player arrays '+key);
  assert.ok(['complete','failed'].includes(t.status),'Unexpected status '+key);
  if(t.status==='failed')failed++;
  if(t.dropped.length)drops++;
  if(t.faabBid!==null)assert.ok(Number.isSafeInteger(t.faabBid)&&t.faabBid>=0,'Bad FAAB bid '+key);
 }
 stats.push({year,week,transactions:d.normalizedRows,transactionsWithDrops:drops,failed});
}
assert.ok(stats.every(x=>x.transactions>0),'Empty recovery window');
console.log('Sleeper five-week recovery validation PASS:',JSON.stringify(stats));
