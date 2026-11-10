// Resolve apparent overlap flags using exact completed provider actions.
// Resolution means chronology is explained, NOT that a preclaim free-agent pool is certified.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const intervals=read('data-integrity/faab-event-bounded-ownership-intervals-v1.json');
const claims=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
const byYear=new Map();
for(const row of intervals.rows){if(!byYear.has(row.year))byYear.set(row.year,[]);byYear.get(row.year).push(row);}
const rows=[],coverage=[];
for(let year=2020;year<=2026;year++){
 const tx=[];
 for(let week=1;week<=(year===2026?8:18);week++)tx.push(...read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json').transactions);
 const byId=new Map(tx.map(t=>[String(t.transactionId),t]));
 let resolvedByEvent=0,needsReview=0,notFlagged=0,unresolvedClaimTiming=0;
 for(const claim of claims.observations.filter(x=>x.year===year)){
  const current=byId.get(String(claim.transactionId));
  if(!current){
   // The completed waiver is certified by its receipt, but the older
   // provider-recovery sample lacks event timestamp and ownership boundaries.
   // Do not infer a legal free-agent pool or a resolved overlap from this gap.
   unresolvedClaimTiming++;
   rows.push({year,transactionId:String(claim.transactionId),claimWeek:claim.claimWeek,
    playerId:claim.playerId,acquiringTeamId:claim.teamId,
    classification:'completed_claim_timestamp_not_in_recovery_sample',evidence:[],
    transactionCompleted:true,priorFreeAgentEligibilityVerified:false,
    replacementAlternativeAvailabilityVerified:false});
   continue;
  }
  assert.equal(current.status,'complete','Recovered event disagrees with completed claim '+year+'/'+claim.transactionId);
  const overlaps=(byYear.get(year)??[]).filter(i=>i.playerId===claim.playerId&&i.teamId!==claim.teamId&&
    i.startTimestamp<current.timestamp&&(i.endTimestamp===null||i.endTimestamp>=current.timestamp));
  const evidence=[];
  for(const interval of overlaps){
   const endIds=interval.endTransactionIds??[];
   const endedByCurrent=interval.endTimestamp===current.timestamp&&endIds.includes(String(current.transactionId));
   const end=endedByCurrent?'ended_at_current_completed_acquisition':'not_explained_by_current_acquisition';
   evidence.push({priorTeamId:interval.teamId,priorStartTransactionId:interval.startTransactionId,
    priorEndTransactionIds:endIds,priorEndTimestamp:interval.endTimestamp,resolution:end});
  }
  const classification=!overlaps.length?'no_apparent_overlap':
    evidence.every(e=>e.resolution==='ended_at_current_completed_acquisition')?
    'resolved_as_event_boundary_not_prior_eligibility':'unresolved_ownership_overlap';
  if(classification==='resolved_as_event_boundary_not_prior_eligibility')resolvedByEvent++;
  else if(classification==='unresolved_ownership_overlap')needsReview++;
  else notFlagged++;
  rows.push({year,transactionId:String(claim.transactionId),claimWeek:claim.claimWeek,
    playerId:claim.playerId,acquiringTeamId:claim.teamId,classification,evidence,
    transactionCompleted:true,priorFreeAgentEligibilityVerified:false,
    replacementAlternativeAvailabilityVerified:false});
 }
 coverage.push({year,totalClaims:resolvedByEvent+needsReview+notFlagged+unresolvedClaimTiming,
  apparentOverlapResolvedByCurrentEvent:resolvedByEvent,
  unresolvedOwnershipOverlaps:needsReview,noApparentOverlap:notFlagged,
  claimsWithoutRecoveredEventTimestamp:unresolvedClaimTiming,
  preclaimAvailabilityCertified:0});
}
const result={schema:'fellas-faab-overlap-resolution-v1',
 status:'event_boundary_explanations_not_free_agent_certification',
 interpretation:'The exact completed acquisition can terminate a previous event-bounded interval; treating its inclusive endpoint as conflicting ownership is a boundary artifact, not proof of a simultaneous illegal owner.',
 limitations:['Provider transaction completeness is not independently certified.','Trade transfers and opening roster ownership remain incomplete.','No overlapping interval cannot establish a free-agent pool.','Even explained event boundaries do not certify preclaim eligibility.'],
 coverage,rows};
const target='data-integrity/faab-overlap-resolution-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),result,'FAAB overlap resolution stale');
else fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log('FAAB overlap resolution:',coverage.reduce((a,x)=>a+x.apparentOverlapResolvedByCurrentEvent,0),
 'explained by same completed transaction;',coverage.reduce((a,x)=>a+x.unresolvedOwnershipOverlaps,0),'unresolved');
