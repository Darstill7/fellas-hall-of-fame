// Classify FAAB replacement comparisons by evidence level, never equating rostered opponents with free agents.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const outcome=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const bench=read('data-integrity/faab-opposing-bench-baseline-v1.json');
const review=read('data-integrity/faab-outcome-ownership-review-v1.json');
assert.equal(bench.status,'research_only_noncausal_not_free_agent_replacement');
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const byReview=new Map();
for(const x of review.rows){
 const k=key(x);
 assert.ok(!byReview.has(k),'Duplicate independent ownership review '+k);
 byReview.set(k,x);
}
assert.equal(review.status,'research_only_no_certified_faab_skill');
assert.equal(outcome.status,'research_only_not_causal_or_skill_grade');
const byBench=new Map();
for(const x of bench.rows){
 const k=key(x)+'|'+x.week;
 assert.ok(!byBench.has(k),'Duplicate bench comparison '+k);
 byBench.set(k,x);
}
const coverage=[];
const rows=[];
for(let year=2020;year<=2026;year++){
 let started=0,observedBench=0,ownershipFlagged=0,withoutBench=0,ownershipSupportedBench=0,flaggedBench=0;
 for(const claim of outcome.observations.filter(x=>x.year===year)){
  const r=byReview.get(key(claim));
  assert.ok(r,'Missing ownership review '+key(claim));
  const flagged=new Set(r.flaggedWeeks.map(x=>x.week));
  for(const w of claim.weeks.filter(x=>x.started)){
   started++;
   const benchmark=byBench.get(key(claim)+'|'+w.week);
   const ownershipConsistent=r.intervalMatch&&!flagged.has(w.week);
   if(!ownershipConsistent)ownershipFlagged++;
   if(benchmark){
    assert.equal(benchmark.position,claim.position,'Mismatched opposing-bench position '+key(claim));
    assert.ok(benchmark.comparisonSampleSize>=3,'Insufficient opposing-bench sample '+key(claim));
    assert.ok(Math.abs(benchmark.actualStartedPoints-w.points)<.011,'Opposing-bench actual points mismatch '+key(claim));
    observedBench++;
    if(ownershipConsistent)ownershipSupportedBench++;else flaggedBench++;
   }else withoutBench++;
   rows.push({year,transactionId:claim.transactionId,teamId:claim.teamId,
    playerId:claim.playerId,week:w.week,ownershipConsistencyObserved:ownershipConsistent,
    opposingRosteredBenchComparison:!!benchmark,comparisonSampleSize:benchmark?.comparisonSampleSize??null,
    comparisonKind:benchmark?'same_position_other_teams_rostered_bench':'none',
    comparisonEvidenceTier:!benchmark?'no_opposing_bench_sample':
     !ownershipConsistent?'opposing_bench_sample_ownership_review_required':
     'ownership_supported_opposing_rostered_bench_only',
    descriptiveComparisonEligible:!!benchmark&&ownershipConsistent,
    actualPreclaimFreeAgentAlternativeVerified:false,
    exAnteAlternativeEligibilityVerified:false,
    gradeEligible:false});
  }
 }
 coverage.push({year,startedAcquisitionPlayerWeeks:started,
  withOpposingRosteredBenchComparison:observedBench,withoutBenchComparison:withoutBench,
  ownershipConsistentOpposingBenchComparisons:ownershipSupportedBench,
  ownershipFlaggedOpposingBenchComparisons:flaggedBench,
  ownershipConsistencyFlagged:ownershipFlagged,certifiedAvailableReplacementComparisons:0,
  gradeEligiblePlayerWeeks:0});
}
assert.equal(rows.length,coverage.reduce((n,x)=>n+x.startedAcquisitionPlayerWeeks,0));
for(const c of coverage){
 assert.equal(c.withOpposingRosteredBenchComparison+c.withoutBenchComparison,
  c.startedAcquisitionPlayerWeeks,'Opposing-bench cohort coverage mismatch '+c.year);
 assert.equal(c.ownershipConsistentOpposingBenchComparisons+c.ownershipFlaggedOpposingBenchComparisons,
  c.withOpposingRosteredBenchComparison,'Ownership tier coverage mismatch '+c.year);
}
assert.ok(rows.every(r=>r.gradeEligible===false&&!r.actualPreclaimFreeAgentAlternativeVerified&&
 !r.exAnteAlternativeEligibilityVerified),'Descriptive FAAB comparisons cannot become certified skill grades');
const result={schema:'fellas-faab-replacement-evidence-readiness-v1',
 status:'research_only_zero_certified_replacement_candidates',
 explanation:'Other teams bench players were owned and are never treated as waiver options. Ownership-supported roster observations are descriptive and do not prove uninterrupted possession, free-agent eligibility, or alternative value.',
 coverage,rows};
const target='data-integrity/faab-replacement-evidence-readiness-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),result,'Replacement readiness stale');
else fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log('Replacement evidence readiness:',rows.length,'started player-weeks; zero certified available alternatives');
