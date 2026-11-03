// Prioritize contemporaneous FAAB candidate evidence review without promoting
// recorded drops to certified free-agent availability or skill scores.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const triage=read('data-integrity/faab-recent-release-candidate-triage-v1.json');
const claims=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const identities=read('data-integrity/faab-identity-attribution-v1.json');
assert.equal(identities.status,'research_only_no_skill_grades');
assert.equal(triage.status,'historical_provider_event_review_not_free_agent_availability');
assert.equal(triage.rows.length,claims.observations.length);
const id=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const originals=new Map(claims.observations.map(c=>[id(c),c]));
assert.equal(originals.size,claims.observations.length);
const identityById=new Map();
for(const row of identities.observations){
 const k=id(row);
 assert.ok(!identityById.has(k),'Duplicate FAAB manager identity '+k);
 identityById.set(k,row);
}
assert.equal(identityById.size,originals.size,'FAAB manager identity coverage diverged');

const rows=triage.rows.map(row=>{
 const claim=originals.get(id(row));
 assert.ok(claim,'Missing acquisition cohort '+id(row));
 const attribution=identityById.get(id(row));
 assert.ok(attribution,'Missing verified identity receipt '+id(row));
 assert.ok(attribution.manager===null||attribution.identityStatus==='canonical_handle_verified',
  'Uncertified manager attribution '+id(row));
 const count=row.possibleRecentReleaseCount;
 let tier;
 let nextEvidence;
 if(row.reviewStatus==='missing_completed_timestamp'){
  tier='recover_claim_timestamp';
  nextEvidence='Retrieve source completed claim timestamp and original player-side receipt';
 }else if(count>0){
  tier='verify_release_waiver_clearance';
  nextEvidence='Check exact waiver-clearance timing, claimant roster legality, subsequent transactions, and full provider ownership history for each released alternative';
 }else if(!['QB','RB','WR','TE','DEF'].includes(row.position)){
  tier='resolve_position_identity';
  nextEvidence='Recover league-aligned player position and identity from source roster/provider receipt';
 }else{
  tier='no_recent_release_detected';
  nextEvidence='Seek opening roster, complete trade and waiver history; absence of a recent drop is not evidence of no eligible alternatives';
 }
 const elapsed=row.recentReleaseExamples[0]?.elapsedHours??null;
 return {year:row.year,manager:attribution.manager,
  managerIdentityStatus:attribution.identityStatus,
  transactionId:row.transactionId,teamId:row.teamId,
  playerId:row.playerId,playerName:claim.playerName??null,position:row.position,
  claimWeek:claim.claimWeek,winningBid:claim.bid,
  candidateCount:count,examples:row.recentReleaseExamples,
  tier,nextEvidence,
  mostRecentCandidateElapsedHours:elapsed,
  sourceReceipt:'data-integrity/provider-recovered-transactions-'+row.year+'-week'+claim.claimWeek+'.json',
  actualPreclaimFreeAgentAvailabilityVerified:false,
  replacementValue:null,managerDecisionScore:null,skillGrade:null};
});
const tierOrder={verify_release_waiver_clearance:0,recover_claim_timestamp:1,
 resolve_position_identity:2,no_recent_release_detected:3};
rows.sort((a,b)=>tierOrder[a.tier]-tierOrder[b.tier]||
 b.candidateCount-a.candidateCount||
 (a.mostRecentCandidateElapsedHours??Infinity)-(b.mostRecentCandidateElapsedHours??Infinity)||
 b.year-a.year||a.transactionId.localeCompare(b.transactionId)||a.playerId.localeCompare(b.playerId));
const summary=Object.keys(tierOrder).map(tier=>({
 tier,claims:rows.filter(r=>r.tier===tier).length,
 candidateLinks:rows.filter(r=>r.tier===tier).reduce((n,r)=>n+r.candidateCount,0)
}));
assert.equal(summary.reduce((s,x)=>s+x.claims,0),claims.observations.length);
assert.equal(summary.reduce((s,x)=>s+x.candidateLinks,0),
 triage.coverage.reduce((s,x)=>s+x.totalRecentReleaseCandidateLinks,0));
// Manager-season is an evidence coverage view, never a manager leaderboard.
const managerSeasonMap=new Map();
for(const row of rows){
 const key=row.year+'|'+(row.manager??'unresolved');
 if(!managerSeasonMap.has(key))managerSeasonMap.set(key,{
  year:row.year,manager:row.manager,
  identityStatus:row.manager===null?'unresolved':'canonical_handle_verified',
  claims:0,withRecentReleaseCandidates:0,candidateLinks:0,
  claimsWithMissingTimestamp:0,certifiedAvailabilityComparisons:0,
  decisionGradesIssued:0
 });
 const g=managerSeasonMap.get(key);
 g.claims++;
 g.candidateLinks+=row.candidateCount;
 if(row.candidateCount)g.withRecentReleaseCandidates++;
 if(row.tier==='recover_claim_timestamp')g.claimsWithMissingTimestamp++;
}
const managerSeasonCoverage=[...managerSeasonMap.values()].sort((a,b)=>
 a.year-b.year||(a.manager??'~').localeCompare(b.manager??'~'));
assert.equal(managerSeasonCoverage.reduce((n,g)=>n+g.claims,0),rows.length);
assert.equal(managerSeasonCoverage.reduce((n,g)=>n+g.candidateLinks,0),
 summary.reduce((n,g)=>n+g.candidateLinks,0));
assert.equal(managerSeasonCoverage.reduce((n,g)=>n+g.withRecentReleaseCandidates,0),
 rows.filter(r=>r.candidateCount>0).length);
assert.ok(managerSeasonCoverage.every(g=>g.certifiedAvailabilityComparisons===0&&
 g.decisionGradesIssued===0));
assert.ok(rows.every(r=>r.replacementValue===null&&r.managerDecisionScore===null&&
 r.skillGrade===null&&!r.actualPreclaimFreeAgentAvailabilityVerified));
const report={
 schema:'fellas-faab-alternative-review-priority-v1',
 status:'provider_release_evidence_review_queue_no_certified_free_agents',
 interpretation:'Ranks observed acquisition claims for additional contemporaneous eligibility research, not estimated replacement value or managerial skill.',
 scope:{lookbackDays:triage.lookbackDays,
  observedClaims:rows.length,
  seasons:triage.coverage.map(r=>r.year),
  certifiedFreeAgentAlternativeComparisons:0,skillGradesIssued:0},
 summary,managerSeasonCoverage,rows,
 limitations:[
  'Provider release events do not prove waiver clearance or roster eligibility.',
  'Recorded player event timelines omit some trade transfers and initial rosters.',
  'A missing recent release is not evidence that the free-agent pool was empty.',
  'Candidate ranking is for investigative workload; it cannot rank fantasy managers or their decision quality.',
  'Manager names come only from documented Sleeper handle mappings; unresolved claims are not assigned using team IDs.'
 ]
};
const target='data-integrity/faab-alternative-review-priority-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'FAAB candidate review report stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('FAAB alternative review:',JSON.stringify(summary),'manager-season evidence cohorts:',managerSeasonCoverage.length);
