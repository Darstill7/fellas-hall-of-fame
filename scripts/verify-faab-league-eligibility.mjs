import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const r=read('data-integrity/league-eligibility-evidence-2026.json');
assert.equal(r.season,2026);
assert.equal(r.leagueId,'1340027406009761792');
assert.deepEqual(r.rosterPositions,['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF','BN','BN','BN','BN','BN','BN']);
assert.equal(r.scoring.receptionPoints,0.5);
assert.equal(r.observedConfiguration.maxKeepers,2);
assert.equal(r.observedConfiguration.reserveSlots,1);
assert.equal(r.observedConfiguration.tradeDeadlineWeek,11);
assert.equal(r.eligibility.playerClaimableAtTransactionTimestamp,null);
assert.equal(r.eligibility.faabStartingBudget,null);
assert.equal(r.historicalSeasons.length,6);
assert.ok(r.historicalSeasons.every(x=>!x.sourceVerifiedSeasonRules&&x.rosterPositions===null&&x.waiverRules===null));
const overlap=read('data-integrity/faab-overlap-resolution-v1.json');
assert.equal(overlap.status,'event_boundary_explanations_not_free_agent_certification');
for(const row of overlap.rows){
 assert.equal(row.priorFreeAgentEligibilityVerified,false);
 assert.equal(row.replacementAlternativeAvailabilityVerified,false);
 if(row.classification==='resolved_as_event_boundary_not_prior_eligibility'){
  assert.ok(row.evidence.length>0);
  assert.ok(row.evidence.every(x=>x.resolution==='ended_at_current_completed_acquisition'));
 }
}
console.log('League eligibility & ownership-overlap provenance gate PASS',overlap.rows.length,'claims');
