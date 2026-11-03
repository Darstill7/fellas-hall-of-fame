// KISS contract: observable FAAB usage and spending, not replacement value
// or an official decision-skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const report=read('data-integrity/faab-manager-observed-production-v1.json');
const source=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const identities=read('data-integrity/faab-identity-attribution-v1.json');
assert.equal(report.status,'descriptive_verified_handle_only_not_skill_grade');
assert.equal(identities.status,'research_only_no_skill_grades');
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const ids=new Map(identities.observations.map(i=>[key(i),i]));
assert.equal(ids.size,source.observations.length);
const actual=new Map(),transactions=new Map();
for(const x of source.observations){
 const who=ids.get(key(x));assert.ok(who);
 if(!who.manager)continue;
 const k=x.year+'|'+who.manager;
 const row=actual.get(k)??{claims:0,used:0,starts:0,points:0,seen:0};
 row.claims++;
 if(x.observedWeeks>0)row.seen++;
 if(x.startedWeeks>0)row.used++;
 row.starts+=x.startedWeeks;
 row.points+=x.startedPoints;
 actual.set(k,row);
 const txkey=x.year+'|'+x.transactionId;
 if(!transactions.has(txkey))transactions.set(txkey,{k,bid:x.bid});
 else{
  assert.equal(transactions.get(txkey).k,k,'Mixed ownership in one transaction');
  assert.equal(transactions.get(txkey).bid,x.bid,'Duplicate transaction bid conflict');
 }
}
const spend=new Map();
for(const t of transactions.values()){
 const row=spend.get(t.k)??{total:0,paid:0,free:0,tx:0};
 row.total+=t.bid;row.tx++;if(t.bid>0)row.paid++;else row.free++;
 spend.set(t.k,row);
}
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
assert.equal(report.rows.length,actual.size);
for(const r of report.rows){
 const k=r.year+'|'+r.manager,a=actual.get(k),b=spend.get(k);
 assert.ok(a&&b,'Unknown manager/season '+k);
 assert.equal(r.playerClaims,a.claims);
 assert.equal(r.playerClaimsWithObservedProduction,a.seen);
 assert.equal(r.playerClaimsWithLaterStart,a.used);
 assert.equal(r.observedPickupStartRatePercent,round(100*a.used/a.claims));
 assert.equal(r.startedWeeks,a.starts);
 assert.ok(Math.abs(r.observedStartedPoints-a.points)<.011);
 assert.equal(r.observedPointsPerStart,a.starts?round(a.points/a.starts):null);
 assert.equal(r.matchedTransactionSpend,b.total);
 assert.equal(r.verifiedMatchedTransactions,b.tx);
 assert.equal(r.paidMatchedTransactions,b.paid);
 assert.equal(r.zeroDollarMatchedTransactions,b.free);
 assert.equal(r.scopeStatus,r.year===2026?'partial_2026_through_week7':'archived_postclaim_observations');
 assert.ok(!('managerGrade' in r)&&!('faabSkillScore' in r),'Uncertified grade leaked');
}
assert.equal(report.coverage.unattributedPlayerClaims,identities.unmapped);
console.log('KISS FAAB manager usage PASS:',report.rows.length,'manager-seasons, no comparison or skill grade');
