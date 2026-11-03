// Review queue for possible FAAB alternatives based on the last recorded
// provider ownership event. A release is not proof of waiver clearance, actual
// free-agent availability, or legal roster eligibility at bid processing time.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const years=[2020,2021,2022,2023,2024,2025,2026];
const windowMs=14*24*60*60*1000; // search horizon, NOT an availability rule
const key=x=>[x.year,x.transactionId,x.teamId,x.playerId].join('|');
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(outcomes.status,'research_only_not_causal_or_skill_grade');
const rows=[],coverage=[];
for(const year of years){
 const events=[],txById=new Map();
 for(let week=1;week<=(year===2026?8:18);week++){
  const file='data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
  const transactions=read(file).transactions;
  for(const t of transactions){
   if(t.status!=='complete')continue;
   const prior=txById.get(String(t.transactionId));
   assert.ok(!prior,'Duplicate completed provider transaction '+year+'/'+t.transactionId);
   assert.ok(Number.isFinite(t.timestamp),'Missing provider timestamp '+year+'/'+t.transactionId);
   txById.set(String(t.transactionId),t);
   const changed=new Map();
   for(const p of t.dropped??[]){
    if(p.id==null)continue;
    changed.set(String(p.id),{playerId:String(p.id),name:p.name??null,position:p.position??null,action:'drop'});
   }
   for(const p of t.added??[]){
    if(p.id==null)continue;
    const id=String(p.id);
    // A same-transaction add/drop cannot be inferred to be a clean release.
    changed.set(id,{playerId:id,name:p.name??null,position:p.position??null,
     action:changed.has(id)?'ambiguous':'add'});
   }
   for(const p of changed.values())events.push({...p,timestamp:t.timestamp,
    transactionId:String(t.transactionId),transactionType:t.type,source:file});
  }
 }
 events.sort((a,b)=>a.timestamp-b.timestamp||a.transactionId.localeCompare(b.transactionId));
 const lastByPlayer=new Map(),eventIndex=new Map();
 // Group all events per player before evaluating a claim, rather than
 // inventing an order within the same millisecond.
 for(const event of events){
  if(!eventIndex.has(event.playerId))eventIndex.set(event.playerId,[]);
  eventIndex.get(event.playerId).push(event);
 }
 const claims=outcomes.observations.filter(x=>x.year===year);
 let withCandidate=0,totalCandidates=0,missingClaim=0,unsupportedPosition=0;
 for(const claim of claims){
  const source=txById.get(String(claim.transactionId));
  if(!source||!Number.isFinite(source.timestamp)){
   missingClaim++;
   rows.push({year,transactionId:claim.transactionId,teamId:claim.teamId,
    playerId:claim.playerId,position:claim.position??null,claimTimestamp:null,
    reviewStatus:'missing_completed_timestamp',possibleRecentReleaseCount:0,
    recentReleaseExamples:[],certifiedFreeAgentAlternatives:0,gradeEligible:false});
   continue;
  }
  const position=claim.position;
  if(!['QB','RB','WR','TE','DEF'].includes(position))unsupportedPosition++;
  const candidates=[];
  if(['QB','RB','WR','TE','DEF'].includes(position)){
   for(const [playerId,history] of eventIndex){
    if(playerId===claim.playerId)continue;
    // Only events before the claim are relevant; simultaneous timestamps are
    // excluded since the provider cannot establish an ordering.
    let latest=null,atLatest=0;
    for(const e of history){
     if(e.timestamp>=source.timestamp)break;
     if(!latest||e.timestamp>latest.timestamp){latest=e;atLatest=1;}
     else if(e.timestamp===latest.timestamp)atLatest++;
    }
    if(!latest||atLatest!==1||latest.transactionType==='trade'||
       latest.action!=='drop'||latest.position!==position||
       latest.timestamp<source.timestamp-windowMs)continue;
    candidates.push({playerId,name:latest.name,position,
     releaseTransactionId:latest.transactionId,
     releaseTimestamp:latest.timestamp,releaseSource:latest.source,
     elapsedHours:Math.round((source.timestamp-latest.timestamp)/3600000*10)/10,
     availabilityStatus:'recent_release_observed_eligibility_unverified'});
   }
  }
  candidates.sort((a,b)=>b.releaseTimestamp-a.releaseTimestamp||a.playerId.localeCompare(b.playerId));
  if(candidates.length)withCandidate++;
  totalCandidates+=candidates.length;
  rows.push({year,transactionId:String(claim.transactionId),
   teamId:claim.teamId,playerId:claim.playerId,position:position??null,
   claimTimestamp:source.timestamp,
   reviewStatus:'completed_claim_with_partial_event_context',
   possibleRecentReleaseCount:candidates.length,
   recentReleaseExamples:candidates.slice(0,10),
   candidateListTruncated:candidates.length>10,
   certifiedFreeAgentAlternatives:0,gradeEligible:false});
 }
 coverage.push({year,observedAcquisitionClaims:claims.length,
  withRecentRecordedSamePositionRelease:withCandidate,
  totalRecentReleaseCandidateLinks:totalCandidates,
  missingCompletedClaimTimestamp:missingClaim,
  claimsWithUnsupportedPosition:unsupportedPosition,
  certifiedAvailableFreeAgentAlternatives:0,
  managerSkillGrades:0});
}
assert.equal(rows.length,outcomes.observations.length);
assert.equal(new Set(rows.map(key)).size,rows.length,'Duplicate acquisition keys in release review');
assert.ok(rows.every(r=>r.certifiedFreeAgentAlternatives===0&&r.gradeEligible===false));
const report={schema:'fellas-faab-recent-release-candidate-triage-v1',
 status:'historical_provider_event_review_not_free_agent_availability',
 lookbackDays:14,
 methodology:'At each completed acquisition timestamp, locate a different same-position player whose last strictly earlier recorded provider action within 14 days is a nontrade drop, with no later recorded action before the claim. Exclude equal-timestamp ambiguities. Rank examples by release recency.',
 limitations:[
  'This is a capped review queue, not a complete rostered/unrostered player universe.',
  'Observed drop does not establish waiver clearance, exact processing order, availability or eligibility.',
  'Missing trade-side actions, initial rosters, trades, waivers, and unrecorded transitions may invalidate candidates.',
  'A 14-day lookback is a research prioritization window, not an eligibility rule.',
  'No recent release is NOT evidence that no free agent alternatives existed.',
  'Player scores after acquisition are hindsight and do not certify causal FAAB value or decision skill.'
 ],coverage,rows};
const dest='data-integrity/faab-recent-release-candidate-triage-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(dest),report,'Release candidate triage stale');
else fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');
console.log('FAAB recent-release triage:',rows.length,'observed claims;',
 coverage.reduce((s,c)=>s+c.withRecentRecordedSamePositionRelease,0),
 'with at least one recent recorded release; zero certified availability or grades');
