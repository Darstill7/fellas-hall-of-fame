// Readiness gate for public keeper-decision ratings. Refuse to mistake retrospective
// output for a keeper-deadline decision or to double-charge an abandoned keeper.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const score=read('data-integrity/keeper-2025-decision-research-index-v1.json');
const scenarios=read('data-integrity/keeper-2025-score-sensitivity-v1.json');
const roster=read('data-integrity/keeper-2025-predeadline-roster-recovery-v1.json');
const keeperDrops=read('data-integrity/keeper-2025-abandonment-receipts-v1.json');
const direct=read('data-integrity/keeper-2025-abandonment-direct-replacements-v1.json');
const downstream=read('data-integrity/keeper-2025-abandonment-downstream-evidence-v1.json');
const composite=read('data-integrity/keeper-2025-composite-evidence-v1.json');
assert.equal(score.rows.length,10);
assert.equal(scenarios.stability.length,10);
assert.equal(composite.players.length,20);
assert.equal(keeperDrops.rows.length,2);
assert.equal(direct.rows.length,2);
assert.equal(downstream.rows.length,2);
const rosterProof=roster.checks.find(x=>x.week===17);
assert.equal(rosterProof.keepersFoundOnOriginalManagerRoster,20);
assert.equal(roster.keeperDeadlineRosterVerified,false);
assert.equal(roster.eligibleAlternativePoolVerified,false);
const managers=score.rows.map(m=>{
 const baseline=scenarios.scenarios.find(x=>x.id==='baseline').rows.find(x=>x.manager===m.manager);
 const stability=scenarios.stability.find(x=>x.manager===m.manager);
 assert.ok(baseline&&stability);
 assert.equal(m.observedResearchIndex,baseline.score);
 const drops=keeperDrops.rows.filter(x=>x.manager===m.manager);
 assert.equal(drops.length,m.verifiedDropCount);
 for(const d of drops){
  const observed=downstream.rows.find(x=>x.manager===m.manager&&x.player===d.keeper);
  const replacement=direct.rows.find(x=>x.manager===m.manager&&x.droppedKeeper===d.keeper);
  assert.ok(observed&&replacement,'Drop evidence incomplete: '+d.keeper);
  assert.equal(observed.abandonmentPenalty,null);
  assert.equal(replacement.abandonmentPenalty,null);
 }
 assert.equal(m.abandonmentPenalty,null);
 assert.equal(m.certifiedKeeperDecisionScore,null);
 assert.equal(m.publicReportCardKeeperGrade,null);
 return {manager:m.manager,researchIndex:m.observedResearchIndex,
  bestRankAcrossWeights:stability.bestRank,worstRankAcrossWeights:stability.worstRank,
  verifiedAbandonmentEvents:drops.map(d=>({keeper:d.keeper,providerWeek:d.providerWeek,
   transactionId:d.transactionId,penaltyCertified:false})),
  gates:{retrospectiveStartedProductionVerified:true,postseasonStartedProductionVerified:true,
   originalManagerDropReceiptsVerified:true,keeperDeadlineEligibilityVerified:false,
   decisionTimeAlternativePoolVerified:false,causalReplacementValueVerified:false,
   abandonmentNecessityVerified:drops.length===0?null:false,
   doubleCountingCleared:false},
  publicKeeperDecisionGrade:null,publicOvrAdjustment:null};
});
const report={schema:'fellas-2025-keeper-publication-readiness-v1',
 status:'do_not_publish_research_score_as_decision_skill',
 decisionRules:[
  'The research index may be displayed only with a research-only label and component provenance.',
  'A public Keeper Decision score requires verified keeper-deadline eligibility and an actual alternative set.',
  'Do not add a generic early-drop penalty to an outcome score already reduced by the missing player starts.',
  'Any abandonment adjustment must be justified by evidence of timing, contemporaneous necessity, and replacement choices; cap once per season.',
  'Downstream production by other managers is hindsight, not lost opportunity assigned to the original manager.',
  'Verified playoff points are observed contribution, not proven leverage or incremental fantasy wins.',
  'No public OVR mutation or manager report-card rating is permitted by this report.'
 ],
 blockers:['No certified deadline roster/keeper eligibility','No contemporaneous eligible player alternative pool',
  'Drop justification and direct replacement utility are not yet causally established',
  'Proposed weighting not prospectively calibrated; overlapping production and abandonment mechanisms need de-duplication'],
 managers,publicKeeperDecisionScoresCertified:0,ovrUpdatesAuthorized:false};
const target='data-integrity/keeper-2025-publication-readiness-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report);
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Keeper publication readiness PASS: 10/10 research-only, 0 OVR updates; all original-manager drops flagged');
