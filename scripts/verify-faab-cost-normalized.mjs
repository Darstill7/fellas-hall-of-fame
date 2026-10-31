// Fail closed if research ratios are promoted to certified FAAB grades.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const r=read('data-integrity/faab-cost-normalized-research-v1.json');
const d=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const i=read('data-integrity/faab-identity-attribution-v1.json');
const b=read('data-integrity/faab-opposing-bench-baseline-v1.json');
assert.equal(r.status,'research_only_do_not_publish_as_grades');
const id=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const matches=new Map(i.observations.map(x=>[id(x),x]));
const cohorts=new Map(),ids=new Set();
for(const row of d.observations){
 const owner=matches.get(id(row));
 assert.ok(owner,'Missing attributed acquisition');
 if(!owner.manager)continue;
 const cohort=row.year+'|'+owner.manager;
 const item=cohorts.get(cohort)??{claims:0,starts:0};
 item.claims++;item.starts+=row.startedWeeks;cohorts.set(cohort,item);
}
const unique=new Set();
for(const row of r.rows){
 const k=row.year+'|'+row.manager;
 assert.ok(!unique.has(k),'Duplicate cost-normalized cohort '+k);unique.add(k);
 const cohort=cohorts.get(k);
 assert.ok(cohort,'Unknown cohort '+k);
 assert.equal(row.observedPlayerClaims,cohort.claims,'Claim count mismatch '+k);
 assert.equal(row.observedStartedWeeks,cohort.starts,'Starter count mismatch '+k);
 assert.equal(row.gradeStatus,'not_certified','Uncertified FAAB score leaked '+k);
 assert.ok(row.benchComparableStarts<=row.observedStartedWeeks,'Over-counted bench comparisons '+k);
 assert.ok(row.verifiedTransactionSpend>=0&&Number.isSafeInteger(row.verifiedTransactionSpend),'Invalid spend '+k);
 assert.ok(row.uniqueMatchedTransactions<=row.observedPlayerClaims,'Invalid transaction count '+k);
 if(row.verifiedTransactionSpend===0)assert.equal(row.descriptiveStartedPointsPerBidDollar,null,'Divide-by-zero score must be null');
 if(row.benchComparableStarts===0)assert.equal(row.descriptiveBenchSurplusPerBidDollar,null,'No sample cannot imply surplus');
 assert.ok(row.comparisonCoveragePercent===null||row.comparisonCoveragePercent>=0&&row.comparisonCoveragePercent<=100,'Invalid coverage '+k);
}
assert.equal(unique.size,cohorts.size,'Some manager seasons missing from cost report');
console.log('FAAB cost research PASS:',r.rows.length,'cohorts; no certified grades');
