// Research-only cost-normalized FAAB cohort view. Not a manager skill grade.
// Joins confirmed identities, provider costs, observed starts and opposing bench evidence.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const a=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const i=read('data-integrity/faab-identity-attribution-v1.json');
const b=read('data-integrity/faab-opposing-bench-baseline-v1.json');
assert.equal(a.status,'research_only_not_causal_or_skill_grade');
assert.equal(i.status,'research_only_no_skill_grades');
assert.equal(b.status,'research_only_noncausal_not_free_agent_replacement');
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const ids=new Map(i.observations.map(x=>[key(x),x]));
const byBase=new Map();
for(const r of b.rows){
 const k=key(r);
 if(!byBase.has(k))byBase.set(k,[]);
 byBase.get(k).push(r);
}
const groups=new Map(),tx=new Map();
for(const x of a.observations){
 const mapped=ids.get(key(x));
 assert.ok(mapped,'Missing claim identity: '+key(x));
 if(!mapped.manager)continue;
 const k=x.year+'|'+mapped.manager;
 const g=groups.get(k)??{year:x.year,manager:mapped.manager,observedPlayerClaims:0,observedStartedWeeks:0,benchComparableStarts:0,benchMedianSurplus:0,startedPoints:0,verifiedTransactionSpend:0,uniqueMatchedTransactions:0};
 g.observedPlayerClaims++;
 g.observedStartedWeeks+=x.startedWeeks;
 g.startedPoints+=x.startedPoints;
 const comparisons=byBase.get(key(x))??[];
 g.benchComparableStarts+=comparisons.length;
 g.benchMedianSurplus+=comparisons.reduce((n,v)=>n+v.observedBenchMedianSurplus,0);
 groups.set(k,g);
 const transactionKey=x.year+'|'+x.transactionId;
 if(tx.has(transactionKey)){
  const before=tx.get(transactionKey);
  assert.equal(before.k,k,'Conflicting attribution for same spend');
  assert.equal(before.bid,x.bid,'Inconsistent bid for same transaction');
 }else tx.set(transactionKey,{k,bid:x.bid});
}
for(const {k,bid} of tx.values()){
 const g=groups.get(k);g.verifiedTransactionSpend+=bid;g.uniqueMatchedTransactions++;
}
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const rows=[...groups.values()].map(g=>{
 const coverage=g.observedStartedWeeks?g.benchComparableStarts/g.observedStartedWeeks:null;
 return {...g,startedPoints:round(g.startedPoints),benchMedianSurplus:round(g.benchMedianSurplus),
  comparisonCoveragePercent:coverage===null?null:round(100*coverage),
  // Cost-efficiency must not reward zero-dollar transactions via division-by-zero.
  descriptiveStartedPointsPerBidDollar:g.verifiedTransactionSpend>0?round(g.startedPoints/g.verifiedTransactionSpend):null,
  descriptiveBenchSurplusPerBidDollar:g.verifiedTransactionSpend>0&&g.benchComparableStarts>0?round(g.benchMedianSurplus/g.verifiedTransactionSpend):null,
  gradeStatus:'not_certified'};
}).sort((x,y)=>x.year-y.year||x.manager.localeCompare(y.manager));
const report={schema:'fellas-faab-cost-normalized-research-v1',status:'research_only_do_not_publish_as_grades',
 caveats:['Paid bids are deduplicated by transaction, not by acquired player',
 'Ratios use only archived, owner-attributed claims, not all season spending',
 'Bench surplus compares hindsight opposing-roster reserves, not actual free agents',
 'Missing starter comparisons are excluded rather than assumed equal to zero',
 'Do not compare incomplete or sparse seasons without documented coverage',
 'Negative marginal comparisons are preserved, and zero-dollar denominators are ungraded',
 'No direct link to matchup wins, playoffs or causality has been established'],rows};
fs.writeFileSync('data-integrity/faab-cost-normalized-research-v1.json',JSON.stringify(report,null,2)+'\n');
console.log('FAAB cost research:',rows.length,'verified-handle manager-seasons, grades withheld');
