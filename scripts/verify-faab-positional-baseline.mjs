// Validate FAAB opposing-bench comparison rows against observed starting performances.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const baseline=read('data-integrity/faab-opposing-bench-baseline-v1.json');
assert.equal(baseline.status,'research_only_noncausal_not_free_agent_replacement');
const id=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const acquisitions=new Map(source.observations.map(x=>[id(x),x]));
assert.equal(acquisitions.size,source.observations.length,'Duplicate source acquisition');
const keys=new Set();
for(const x of baseline.rows){
 const claim=acquisitions.get(id(x));
 assert.ok(claim,'Unmatched baseline acquisition '+id(x));
 const found=claim.weeks.find(w=>w.week===x.week&&w.started);
 assert.ok(found,'Baseline references unstarted or absent week '+id(x)+'/'+x.week);
 assert.ok(Math.abs(found.points-x.actualStartedPoints)<.011,'Actual player points mismatch');
 assert.ok(x.comparisonSampleSize>=3,'Insufficient comparison cohort');
 assert.ok(Number.isFinite(x.opposingBenchMedian),'Missing benchmark');
 assert.ok(Math.abs((x.actualStartedPoints-x.opposingBenchMedian)-x.observedBenchMedianSurplus)<.011,'Incorrect difference');
 const unique=id(x)+'|'+x.week;
 assert.ok(!keys.has(unique),'Duplicate baseline observation '+unique);keys.add(unique);
}
assert.equal(baseline.coverage.comparedStarterWeeks,baseline.rows.length,'Stale comparison coverage');
console.log('FAAB positional baseline PASS:',baseline.rows.length,'verified comparisons; research only');
