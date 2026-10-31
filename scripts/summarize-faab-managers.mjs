// Safe descriptive manager-level FAAB summary: only verified owner handles, with
// bid spending deduplicated by transaction and missing attribution explicit.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const attribution=read('data-integrity/faab-identity-attribution-v1.json');
assert.equal(attribution.status,'research_only_no_skill_grades');
const id=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const identities=new Map(attribution.observations.map(x=>[id(x),x]));
assert.equal(identities.size,attribution.observations.length,'Duplicate identity rows');
const groups=new Map(),allTransactions=new Map();
for(const x of outcomes.observations){
 const identity=identities.get(id(x));
 assert.ok(identity,'No identity evidence for acquisition '+id(x));
 const manager=identity.manager;
 if(!manager)continue;
 const groupKey=x.year+'|'+manager;
 const g=groups.get(groupKey)??{year:x.year,manager,playerClaims:0,playerClaimsWithObservedProduction:0,observedWeeks:0,startedWeeks:0,observedRosteredPoints:0,observedStartedPoints:0,verifiedMatchedTransactions:0,matchedTransactionSpend:0};
 g.playerClaims++;
 if(x.observedWeeks)g.playerClaimsWithObservedProduction++;
 g.observedWeeks+=x.observedWeeks;g.startedWeeks+=x.startedWeeks;
 g.observedRosteredPoints+=x.rosteredPoints;g.observedStartedPoints+=x.startedPoints;
 groups.set(groupKey,g);
 const txKey=x.year+'|'+x.transactionId;
 const previous=allTransactions.get(txKey);
 if(previous)assert.ok(previous.groupKey===groupKey&&previous.bid===x.bid,'Contradictory multi-player claim attribution '+txKey);
 else allTransactions.set(txKey,{groupKey,bid:x.bid});
}
for(const tx of allTransactions.values()){
 const g=groups.get(tx.groupKey);g.verifiedMatchedTransactions++;g.matchedTransactionSpend+=tx.bid;
}
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const rows=[...groups.values()].map(x=>({
 ...x,
 observedRosteredPoints:round(x.observedRosteredPoints),
 observedStartedPoints:round(x.observedStartedPoints),
 productionObservationPercent:round(x.playerClaimsWithObservedProduction/x.playerClaims*100)
})).sort((a,b)=>a.year-b.year||a.manager.localeCompare(b.manager));
const report={
 schema:'fellas-faab-manager-observed-production-v1',
 status:'descriptive_verified_handle_only_not_skill_grade',
 method:'Owner-handle-verified claim cohorts; production only while present on recovered roster after claim week. Count bid once per unique transaction, even for multi-player additions.',
 caveats:['Not the manager full-season spend or acquisition efficiency','Missing weeks and not-held players are not zeroes','Not waiver-wire replacement value, causal WAR, or a certified manager grade','Only acquisitions with matching archived metadata and observed owner handle are included'],
 coverage:{attributedPlayerClaims:rows.reduce((n,r)=>n+r.playerClaims,0),unattributedPlayerClaims:attribution.unmapped,attributedTransactions:allTransactions.size},
 rows
};
const target='data-integrity/faab-manager-observed-production-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Manager FAAB production research stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('FAAB manager production evidence',JSON.stringify(report.coverage),'manager seasons',rows.length);
