// Actionable claim-level triage with exact provider source references.
// Research only. No managerial skill is inferred from missing evidence.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const reviews=read('data-integrity/faab-outcome-ownership-review-v1.json');
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const identity=read('data-integrity/faab-identity-attribution-v1.json');
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const outcomeByKey=new Map(outcomes.observations.map(x=>[key(x),x]));
const identityByKey=new Map(identity.observations.map(x=>[key(x),x]));
assert.equal(outcomeByKey.size,outcomes.observations.length);
assert.equal(identityByKey.size,identity.observations.length);
const rows=[];
for(const review of reviews.rows){
 if(!review.reviewRequired)continue;
 const k=key(review),claim=outcomeByKey.get(k),who=identityByKey.get(k);
 assert.ok(claim&&who,'Unlinked review receipt: '+k);
 const source='data-integrity/provider-recovered-transactions-'+review.year+'-week'+claim.claimWeek+'.json';
 const matching=fs.existsSync(source)?read(source).transactions.filter(t=>String(t.transactionId)===review.transactionId):[];
 const issues=[];
 if(matching.length===1){
  const tx=matching[0];
  assert.equal(tx.status,'complete','Failed claim treated as owned '+k);
  assert.ok((tx.added??[]).some(p=>String(p.id)===review.playerId),'Player absent from original add '+k);
 }else{
  // Week 8–9 completed claims may be verified by provider FAAB receipts
  // while absent from the separate timestamp-recovery sample.
  assert.equal(matching.length,0,'Duplicated original transaction '+k);
  assert.equal(review.year,2026,'Historical source transaction missing '+k);
  const receipt=read('data-integrity/faab-provider-receipts-2026.json').receipts.find(x=>String(x.id)===review.transactionId);
  assert.ok(receipt&&receipt.status==='complete'&&receipt.rosterIds.map(String).includes(String(review.teamId))&&receipt.playerIds.map(String).includes(String(review.playerId)),
   'Missing certified provider waiver claim '+k);
  issues.push('original_timestamp_recovery_missing');
 }
 if(!who.manager)issues.push('unresolved_manager_handle');
 if(!review.intervalMatch)issues.push('missing_event_bounded_interval');
 for(const f of review.flaggedWeeks)issues.push(f.reason);
 rows.push({year:review.year,claimWeek:claim.claimWeek,transactionId:review.transactionId,
  manager:who.manager??null,playerId:review.playerId,playerName:claim.playerName??null,
  teamId:review.teamId,sourceFile:matching.length?source:null,certifiedSourceFile:review.year===2026?'data-integrity/faab-provider-receipts-2026.json':null,
  issues:[...new Set(issues)].sort(),
  flaggedWeeks:review.flaggedWeeks.map(x=>({week:x.week,reason:x.reason})),
  startedWeeks:claim.startedWeeks,observedScoringWeeks:review.observedScoringWeeks,
  priority:review.flaggedWeeks.some(x=>x.reason==='another_team_observed')?'ownership_conflict':
   !review.intervalMatch?'missing_interval':'observation_gap',
  gradeEligible:false});
}
rows.sort((a,b)=>({ownership_conflict:0,missing_interval:1,observation_gap:2}[a.priority]-
 {ownership_conflict:0,missing_interval:1,observation_gap:2}[b.priority])||
 b.flaggedWeeks.length-a.flaggedWeeks.length||a.year-b.year||a.transactionId.localeCompare(b.transactionId));
const report={schema:'fellas-faab-claim-investigation-queue-v1',
 status:'source_backed_claim_triage_no_certified_skill',
 warning:'Verified provider acquisition receipt confirms completed add, not uninterrupted ownership, original transaction timestamp, preclaim availability, or grade.',
 totalClaimsForReview:rows.length,rows};
const dest='data-integrity/faab-claim-investigation-queue-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(dest),report,'Claim triage queue stale');
else fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log('Source-backed FAAB claim investigation queue:',rows.length,'claims');
