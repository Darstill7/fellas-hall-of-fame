// Validate how sensitive the 2025 keeper research ranking is to proposed weights
// and hypothetical abandonment adjustments. This does NOT certify decision skill.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const index=read('data-integrity/keeper-2025-decision-research-index-v1.json');
const round=n=>Math.round(n*10)/10;
assert.equal(index.rows.length,10);
const candidates=[
 {id:'baseline',weights:[.55,.30,.15]},
 {id:'production_emphasis',weights:[.65,.25,.10]},
 {id:'draft_capital_emphasis',weights:[.45,.40,.15]},
 {id:'playoff_emphasis',weights:[.50,.25,.25]},
 {id:'balanced_components',weights:[.40,.35,.25]},
];
const input=index.rows;
const scenarios=candidates.map(c=>{
 assert.ok(Math.abs(c.weights.reduce((s,n)=>s+n,0)-1)<1e-9);
 const rows=input.map(r=>{
  const components=[r.observedProductionComponent,r.nominalKeeperCapitalComponent,r.observedPostseasonContributionComponent];
  const score=round(components.reduce((s,v,i)=>s+v*c.weights[i],0));
  return {manager:r.manager,score,verifiedDropCount:r.verifiedDropCount};
 }).sort((a,b)=>b.score-a.score||a.manager.localeCompare(b.manager))
 .map((r,i)=>({...r,rank:i+1}));
 return {id:c.id,weights:{production:c.weights[0],draftCapital:c.weights[1],postseason:c.weights[2]},rows};
});
const baseline=scenarios[0];
for(const b of baseline.rows){
 const original=input.find(r=>r.manager===b.manager);
 assert.equal(b.score,original.observedResearchIndex,'Base scoring parity broken '+b.manager);
}
const stability=input.map(r=>{
 const ranks=scenarios.map(s=>s.rows.find(x=>x.manager===r.manager).rank);
 return {manager:r.manager,baselineRank:baseline.rows.find(x=>x.manager===r.manager).rank,
  bestRank:Math.min(...ranks),worstRank:Math.max(...ranks),rankRange:Math.max(...ranks)-Math.min(...ranks)};
}).sort((a,b)=>a.baselineRank-b.baselineRank);
const penalties=[0,3,6,10,12];
const abandonmentScenarios=penalties.map(penalty=>{
 const ranked=baseline.rows.map(r=>({manager:r.manager,
  hypotheticalScore:round(Math.max(0,r.score-(r.verifiedDropCount?penalty:0))),
  hypotheticalPenalty:r.verifiedDropCount?penalty:0
 })).sort((a,b)=>b.hypotheticalScore-a.hypotheticalScore||a.manager.localeCompare(b.manager))
 .map((r,i)=>({...r,rank:i+1}));
 return {hypotheticalPenaltyPerManagerWithVerifiedDrop:penalty,rows:ranked};
});
assert.deepEqual(input.filter(r=>r.verifiedDropCount>0).map(r=>r.manager).sort(),['Birch','Kuhl']);
assert.ok(input.every(r=>r.abandonmentPenalty===null&&r.certifiedKeeperDecisionScore===null&&r.publicReportCardKeeperGrade===null));
const report={schema:'fellas-2025-keeper-score-sensitivity-v1',status:'research_scenarios_only_not_official',
 notes:['Five plausible weighting scenarios test robustness; they are not independent validation of predictive accuracy.',
 'Abandonment scenarios apply a hypothetical flat 0–12 point deduction only to managers with verified 2025 drops.',
 'Hypothetical deduction is not an approved penalty and does not assert wrongdoing or causal points lost.',
 'All calculated values use the existing rounded component inputs, matching the committed baseline index.',
 '2025 keeper deadline alternatives, injuries, and candidate availability are not fully verified.'],
 scenarios,stability,abandonmentScenarios,
 officialKeeperDecisionScore:null,publicOvrAdjustment:null};
const target='data-integrity/keeper-2025-score-sensitivity-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report);
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Keeper score sensitivity PASS: '+scenarios.length+' component-weight scenarios, '+penalties.length+' hypothetical drop cases; public ratings null');
