// Aggregate observed FAAB production by season/team, without inferring manager identity or causality.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const d=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(d.status,'research_only_not_causal_or_skill_grade');
const map=new Map();
for(const x of d.observations){
 const key=x.year+'|'+x.teamId;
 if(!map.has(key))map.set(key,{year:x.year,teamId:x.teamId,observedPlayerClaims:0,claimsWithObservedPoints:0,reportedBidSpendOnMatchedClaims:0,observedRosteredPoints:0,observedStartedPoints:0,observedStarterWeeks:0});
 const y=map.get(key);
 y.observedPlayerClaims++;
 y.reportedBidSpendOnMatchedClaims+=x.bid;
 if(x.observedWeeks)y.claimsWithObservedPoints++;
 y.observedRosteredPoints+=x.rosteredPoints;
 y.observedStartedPoints+=x.startedPoints;
 y.observedStarterWeeks+=x.startedWeeks;
 assert.ok(x.startedWeeks<=x.observedWeeks,'Started without roster presence');
 assert.ok(Math.abs(x.weeks.reduce((n,w)=>n+(w.started?w.points:0),0)-x.startedPoints)<.011,'Started points mismatch');
}
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
const rows=[...map.values()].sort((a,b)=>a.year-b.year||Number(a.teamId)-Number(b.teamId)).map(x=>({
 ...x,observedRosteredPoints:round(x.observedRosteredPoints),observedStartedPoints:round(x.observedStartedPoints),
 coverageRate:x.observedPlayerClaims?round(100*x.claimsWithObservedPoints/x.observedPlayerClaims):null
}));
const report={schema:'fellas-faab-observed-team-season-summary-v1',
 status:'descriptive_only_not_manager_grade',
 caveat:'Team IDs are season-local, not durable manager identities. Production is observed post-claim roster points; it is not incremental points above replacement. Bid spend on matched claims can undercount season spend and can double-count multi-player receipts.',
 coverage:d.coverage,rows};
fs.writeFileSync('data-integrity/faab-observed-team-season-summary-v1.json',JSON.stringify(report,null,2)+'\n');
console.log('FAAB descriptive team-season summaries:',rows.length);
