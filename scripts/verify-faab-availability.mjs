import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const d=read('data-integrity/faab-waiver-availability-evidence-v1.json');
assert.equal(d.status,'historical_snapshot_context_only_no_verified_alternative_free_agents');
assert.deepEqual(d.coverage.map(x=>x.year),[2020,2021,2022,2023,2024,2025,2026]);
const seen=new Set();
for(const x of d.rows){
 const id=x.year+'|'+x.transactionId+'|'+x.playerId;
 assert.ok(!seen.has(id),'Duplicate acquired-player evidence '+id);seen.add(id);
 assert.equal(x.providerStatus,'complete');
 assert.equal(x.exactPreclaimFreeAgentStatus,'not_reconstructed','Unverified free-agent conclusion '+id);
 assert.equal(x.claimAcceptanceEvidence,'provider_completed_waiver');
 assert.ok(Number.isSafeInteger(x.winningBid)&&x.winningBid>=0);
 assert.ok(x.precedingSnapshotWeek===null||x.precedingSnapshotWeek===x.week-1);
 assert.ok(['no_preclaim_snapshot','observed_on_roster_previous_week','not_observed_on_previous_week_rosters'].includes(x.precedingRosterObservation));
 assert.ok(x.precedingRosterObservation==='observed_on_roster_previous_week'?x.precedingTeamId!==null:x.precedingTeamId===null);
}
assert.equal(d.coverage.reduce((n,x)=>n+x.priorRostered+x.priorUnseen,0),d.rows.filter(x=>x.precedingSnapshotWeek!==null).length);
console.log('FAAB availability evidence PASS:',d.rows.length,'claims examined; no invented free-agent availability');
