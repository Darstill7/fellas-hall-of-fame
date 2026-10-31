// Validate FAAB aggregate arithmetic while raw receipt-level reconciliation is still in progress.
// Intentionally does not grade acquisition skill.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync('data-integrity/faab-manager-spend-research-v1.json','utf8'));
assert.equal(data.status,'provider_observed_no_skill_grade');
assert.ok(data.scope.includes('2026 weeks 1-7 (partial)'),'Partial 2026 coverage must be explicit');
const metrics=['completedClaims','failedClaims','paidWins','zeroDollarWins','completedBidSpend','failedAttemptedBidTotal','completedNotInOldArchive'];
const ids=new Set();
const totals=new Map();
for(const row of data.managerSeasons){
 const id=row.year+'|'+row.manager;
 assert.ok(!ids.has(id),'Duplicate manager-season: '+id);
 ids.add(id);
 for(const metric of metrics)assert.ok(Number.isSafeInteger(row[metric])&&row[metric]>=0,id+' invalid '+metric);
 assert.equal(row.completedClaims,row.paidWins+row.zeroDollarWins,id+' paid/zero reconciliation');
 assert.ok(row.completedNotInOldArchive<=row.completedClaims,id+' archive discrepancy exceeds completed claims');
 assert.ok(row.year>=2020&&row.year<=2026,id+' year outside observed window');
 const sum=totals.get(row.manager)??Object.fromEntries(metrics.map(k=>[k,0]));
 sum.seasons=(sum.seasons??0)+1;
 for(const metric of metrics)sum[metric]+=row[metric];
 totals.set(row.manager,sum);
}
assert.equal(data.managerTotals.length,totals.size,'Manager total count mismatch');
const seen=new Set();
for(const row of data.managerTotals){
 assert.ok(!seen.has(row.manager),'Duplicate manager total '+row.manager);
 seen.add(row.manager);
 const expected=totals.get(row.manager);
 assert.ok(expected,'No manager-season evidence for '+row.manager);
 assert.equal(row.seasons,expected.seasons,row.manager+' season count mismatch');
 for(const metric of metrics)assert.equal(row[metric],expected[metric],row.manager+' '+metric+' mismatches manager-seasons');
}
const bidKeys=new Set();
for(const bid of data.largestCompletedBids??[]){
 const id=bid.year+'|'+bid.manager;
 assert.ok(Number.isSafeInteger(bid.bid)&&bid.bid>=0,'Invalid large bid amount');
 assert.ok(ids.has(id),'Large bid has no manager-season');
 assert.ok(typeof bid.transactionId==='string'&&/^\d+$/.test(bid.transactionId),'Large bid lacks numeric transaction provenance');
 assert.ok(Number.isSafeInteger(bid.week)&&bid.week>=1&&bid.week<=18,'Large bid week outside coverage');
 const key=bid.year+'|'+bid.transactionId;
 assert.ok(!bidKeys.has(key),'Repeated winning transaction '+key);
 bidKeys.add(key);
 const season=data.managerSeasons.find(row=>row.year===bid.year&&row.manager===bid.manager);
 assert.ok(bid.bid<=season.completedBidSpend,'Winning bid exceeds reported season spend: '+id);
 assert.ok(Array.isArray(bid.playerIds)&&bid.playerIds.length>0,'Winning bid lacks player reference: '+id);
 assert.equal(typeof bid.archiveMatch,'boolean','Missing archive provenance flag: '+id);
}
console.log('FAAB aggregate arithmetic OK: '+ids.size+' manager-seasons, '+totals.size+' managers. Skill rating remains N/A pending receipt-level and value analysis.');
