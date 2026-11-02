// Measure post-release observed starter production, without hindsight grading.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data-integrity/keeper-weekly-ownership-ledger-v1.json');
const drops=read('data-integrity/keeper-2025-abandonment-receipts-v1.json');
const round=n=>Math.round(n*100)/100;
assert.equal(drops.rows.length,2);
const rows=drops.rows.map(d=>{
 const k=ledger.rows.find(r=>r.year===2025&&r.manager===d.manager&&r.player===d.keeper);
 assert.ok(k,'Missing owner ledger '+d.manager+'/'+d.keeper);
 const observedPostDrop=k.observations.filter(o=>o.week>d.providerWeek);
 const startedElsewhere=observedPostDrop.filter(o=>o.teamId&&o.teamId!==k.originalTeamId&&o.started);
 const stillOriginal=observedPostDrop.filter(o=>o.onOriginalTeam);
 assert.equal(stillOriginal.length,0,'Original manager rostered dropped keeper after release: '+d.keeper);
 return {manager:d.manager,player:d.keeper,keeperRound:d.forfeitedKeeperRound,dropProviderWeek:d.providerWeek,
  completedDropTransactionId:d.transactionId,observedWeeksFollowingDrop:observedPostDrop.length,
  otherManagerStartedWeeks:startedElsewhere.map(o=>({week:o.week,teamId:o.teamId,points:o.startedPoints,source:o.source})),
  otherManagerStartedPoints:round(startedElsewhere.reduce((s,o)=>s+o.startedPoints,0)),
  rosterNotObservedWeeks:observedPostDrop.filter(o=>!o.teamId).map(o=>o.week),
  replacementAcquisition:d.replacementAdded,
  replacementStartedPointsCertified:false,injuryNecessityReviewed:false,
  abandonmentPenalty:null,keeperDecisionGrade:null};
});
const report={schema:'fellas-2025-keeper-abandonment-downstream-evidence-v1',
 status:'observed_hindsight_after_drop_not_decision_time_quality',
 caveats:['Later-owner starters are observed hindsight, not points automatically foregone by the releasing manager.',
 'Weekly not-observed is not evidence of nonownership at every moment in the period.',
 'A waiver replacement acquisition is not proof of starter usage; replacement utility remains unverified.',
 'Keeper Decision penalties and Overall manager ratings remain null until a bounded documented rubric is certified.'],rows};
const path='data-integrity/keeper-2025-abandonment-downstream-evidence-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report);else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('Keeper abandonment downstream receipts PASS: '+rows.map(r=>r.manager+': '+r.otherManagerStartedPoints+' observed later-owner starting points').join('; '));
