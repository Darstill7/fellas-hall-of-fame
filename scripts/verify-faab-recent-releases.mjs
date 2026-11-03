// Independent guard against treating recently dropped rostered players as
// certified available free-agent alternatives or manager decision grades.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const report=read('data-integrity/faab-recent-release-candidate-triage-v1.json');
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(report.schema,'fellas-faab-recent-release-candidate-triage-v1');
assert.equal(report.status,'historical_provider_event_review_not_free_agent_availability');
assert.equal(report.lookbackDays,14);
assert.ok(report.limitations.some(s=>s.includes('waiver clearance')));
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const original=new Map(outcomes.observations.map(x=>[key(x),x]));
assert.equal(original.size,outcomes.observations.length);
assert.equal(report.rows.length,original.size);
const seen=new Set();
for(const row of report.rows){
 const k=key(row);
 assert.ok(!seen.has(k),'Repeated acquisition '+k);seen.add(k);
 const originalRow=original.get(k);
 assert.ok(originalRow,'Unknown claim in release screen '+k);
 assert.equal(row.position,originalRow.position??null);
 assert.equal(row.certifiedFreeAgentAlternatives,0);
 assert.equal(row.gradeEligible,false);
 assert.ok(row.recentReleaseExamples.length<=10);
 if(row.reviewStatus==='missing_completed_timestamp'){
  assert.equal(row.claimTimestamp,null);
  assert.equal(row.possibleRecentReleaseCount,0);
  continue;
 }
 assert.equal(row.reviewStatus,'completed_claim_with_partial_event_context');
 assert.ok(Number.isFinite(row.claimTimestamp));
 assert.equal(row.candidateListTruncated,row.possibleRecentReleaseCount>10);
 assert.ok(row.possibleRecentReleaseCount>=row.recentReleaseExamples.length);
 let lastTimestamp=Infinity;
 const candidates=new Set();
 for(const example of row.recentReleaseExamples){
  assert.ok(!candidates.has(example.playerId),'Duplicate example '+k);candidates.add(example.playerId);
  assert.notEqual(example.playerId,row.playerId);
  assert.equal(example.position,row.position);
  assert.ok(example.releaseTimestamp<row.claimTimestamp);
  assert.ok(row.claimTimestamp-example.releaseTimestamp<=14*86400000);
  assert.ok(example.releaseTimestamp<=lastTimestamp);
  lastTimestamp=example.releaseTimestamp;
  assert.equal(example.availabilityStatus,'recent_release_observed_eligibility_unverified');
  assert.ok(/^data-integrity\/provider-recovered-transactions-20\d\d-week\d+\.json$/.test(example.releaseSource));
  const tx=read(example.releaseSource).transactions.find(t=>t.transactionId===example.releaseTransactionId);
  assert.ok(tx&&tx.status==='complete'&&tx.type!=='trade',
   'Candidate release lacks completed nontrade provider receipt '+k+'/'+example.playerId);
  assert.equal(tx.timestamp,example.releaseTimestamp);
  assert.ok(tx.dropped.some(p=>String(p.id)===example.playerId),
   'Candidate not actually dropped '+k+'/'+example.playerId);
 }
}
const coverage=report.coverage;
assert.deepEqual(coverage.map(x=>x.year),[2020,2021,2022,2023,2024,2025,2026]);
assert.equal(coverage.reduce((n,x)=>n+x.observedAcquisitionClaims,0),report.rows.length);
for(const c of coverage){
 const rows=report.rows.filter(x=>x.year===c.year);
 assert.equal(c.withRecentRecordedSamePositionRelease,rows.filter(x=>x.possibleRecentReleaseCount>0).length);
 assert.equal(c.totalRecentReleaseCandidateLinks,rows.reduce((n,x)=>n+x.possibleRecentReleaseCount,0));
 assert.equal(c.certifiedAvailableFreeAgentAlternatives,0);
 assert.equal(c.managerSkillGrades,0);
}
console.log('FAAB release candidate review PASS:',report.rows.length,'claims, no assumed waiver eligibility or certified grades');
