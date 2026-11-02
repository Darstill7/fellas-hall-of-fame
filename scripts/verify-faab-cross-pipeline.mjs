// Cross-pipeline safety gate: ownership receipts, acquisition outcomes and waiver context.
// Run after all three research generators. This does not certify manager skill.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const dir='data-integrity/';
const ownership=read(dir+'faab-observed-ownership-events-v1.json');
const availability=read(dir+'faab-waiver-availability-evidence-v1.json');
const outcomes=read(dir+'faab-observed-acquisition-outcomes-v1.json');
assert.equal(ownership.status,'partial_event_ledger_not_certified_availability');
assert.equal(availability.status,'historical_snapshot_context_only_no_verified_alternative_free_agents');
assert.equal(outcomes.status,'research_only_not_causal_or_skill_grade');
const years=[2020,2021,2022,2023,2024,2025,2026];
for(const [label,report] of [['ownership',ownership],['availability',availability],['outcomes',outcomes]]){
 assert.deepEqual(report.coverage.map(x=>x.year),years,label+' season coverage');
}
const actionIds=new Map();
for(const row of ownership.rows){
 assert.ok(['add','drop'].includes(row.action));
 assert.ok(years.includes(row.year) && row.playerId && row.transactionId);
 assert.ok(Number.isFinite(row.timestamp));
 const key=[row.year,row.transactionId,row.playerId,row.action,row.teamId].join('|');
 assert.ok(!actionIds.has(key),'Duplicate ownership action '+key);
 actionIds.set(key,row);
 if(row.status==='simultaneous_processing_uncertain')
   assert.ok(row.action==='add'||row.action==='drop');
}
const availabilityKeys=new Set();
for(const row of availability.rows){
 assert.equal(row.exactPreclaimFreeAgentStatus,'not_reconstructed',
  'Do not promote historical snapshot context into confirmed free agents');
 assert.equal(row.claimAcceptanceEvidence,'provider_completed_waiver');
 assert.ok(['observed_on_roster_previous_week','not_observed_on_previous_week_rosters','no_preclaim_snapshot'].includes(row.precedingRosterObservation));
 const key=[row.year,row.transactionId,row.playerId].join('|');
 assert.ok(!availabilityKeys.has(key),'Duplicate availability observation '+key);
 availabilityKeys.add(key);
}
const outcomeKeys=new Set();
for(const row of outcomes.observations){
 assert.equal(row.scope,'post_claim_week_conservative');
 assert.ok(row.observedWeeks>=0 && row.startedWeeks>=0 && row.startedWeeks<=row.observedWeeks);
 assert.ok(row.weeks.every(w=>w.week>row.claimWeek),'Acquisition-week leakage');
 assert.equal(row.observedWeeks,row.weeks.length,'Observed weeks disagree');
 assert.equal(row.startedWeeks,row.weeks.filter(w=>w.started).length,'Started weeks disagree');
 assert.equal(new Set(row.weeks.map(w=>w.week)).size,row.weeks.length,'Duplicate player week');
 const key=[row.year,row.transactionId,row.teamId,row.playerId].join('|');
 assert.ok(!outcomeKeys.has(key),'Duplicate acquisition value outcome '+key);
 outcomeKeys.add(key);
 // A player-level outcome must be backed by the completed receipt-based availability research.
 assert.ok(availabilityKeys.has([row.year,row.transactionId,row.playerId].join('|')),
  'Acquisition outcome without completed-claim availability receipt '+key);
}
for(const [i,year] of years.entries()){
 const a=availability.coverage[i],o=outcomes.coverage[i];
 assert.equal(a.successfulClaimTransactions,o.completedClaims,'Receipt cohorts diverge: '+year);
 if(year===2026){
  assert.equal(o.regularSeasonWeekLimit,7,'2026 outcome must not silently include unverified Week 8');
  assert.equal(a.expectedRegularWeeks,7,'2026 snapshot context cutoff changed unexpectedly');
 }
}
console.log('Cross-pipeline FAAB evidence gate PASSED:',ownership.rows.length,
 'ownership actions,',availability.rows.length,'accepted player receipts,',
 outcomes.observations.length,'conservative outcome observations; no skill/availability certification');
