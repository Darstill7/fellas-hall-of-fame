// Conservative transaction-time blocker evidence: known rostered players cannot be invented as free-agent alternatives.
// Event-bounded intervals are provisional, so this report labels observed conflicts rather than certifying ownership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const intervals=read('data-integrity/faab-event-bounded-ownership-intervals-v1.json');
const outcomes=read('data-integrity/faab-observed-acquisition-outcomes-v1.json');
assert.equal(intervals.status,'research_only_observed_event_bounds_not_continuous_ownership');
const byYear=new Map();
for(const i of intervals.rows){if(!byYear.has(i.year))byYear.set(i.year,[]);byYear.get(i.year).push(i);}
const rows=[],coverage=[];
for(let year=2020;year<=2026;year++){
 const original=[];
 for(let week=1;week<=(year===2026?8:18);week++)
  original.push(...read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json').transactions);
 const txById=new Map();
 for(const t of original){
  const id=String(t.transactionId);
  const previous=txById.get(id);
  if(previous&&previous.status==='complete'&&t.status!=='complete')continue;
  if(previous&&previous.status==='complete'&&t.status==='complete')
   assert.equal(previous.timestamp,t.timestamp,'Conflicting completed transaction timestamps '+year+'/'+id);
  txById.set(id,t);
 }
 let ambiguous=0,priorObserved=0,withoutBound=0;
 for(const claim of outcomes.observations.filter(x=>x.year===year)){
  const tx=txById.get(String(claim.transactionId));
  assert.ok(tx&&tx.status==='complete','Missing completed acquisition receipt: season='+year+' week='+claim.week+' transactionId='+claim.transactionId+' playerId='+claim.playerId+' teamId='+claim.teamId+' receiptFound='+Boolean(tx)+' receiptStatus='+(tx?.status??'missing'));
  const prior=(byYear.get(year)??[]).filter(i=>i.playerId===claim.playerId&&
   i.startTimestamp<tx.timestamp&&(i.endTimestamp===null||i.endTimestamp>=tx.timestamp));
  const other=prior.filter(i=>i.teamId!==claim.teamId);
  if(other.length)priorObserved++;
  if(prior.length>1)ambiguous++;
  if(!prior.length)withoutBound++;
  rows.push({year,transactionId:claim.transactionId,playerId:claim.playerId,teamId:claim.teamId,
   transactionTimestamp:tx.timestamp,
   earlierEventBoundedOwnerCandidates:other.map(i=>({teamId:i.teamId,startTransactionId:i.startTransactionId,
    endTimestamp:i.endTimestamp})),
   status:other.length?'prior_other_team_event_overlap_needs_review':'no_prior_other_team_event_overlap_observed',
   claimAcceptedByProvider:true,preclaimFreeAgentAvailabilityCertified:false,
   alternativeFreeAgentPoolCertified:false});
 }
 coverage.push({year,claims:outcomes.observations.filter(x=>x.year===year).length,
  claimsWithEarlierOtherTeamOverlap:priorObserved,claimsWithMultiplePriorIntervals:ambiguous,
  claimsWithoutPriorEventBound:withoutBound,certifiedFreeAgentAlternatives:0});
}
const report={schema:'fellas-faab-timestamp-ownership-conflict-screen-v1',
 status:'provisional_overlap_screen_not_certified_availability',
 limitations:['Provider completion establishes an accepted acquisition, not prior eligibility of other players.',
 'Event bounds are incomplete and do not prove continuous roster possession.',
 'An overlap is a review signal, not proof of illegal acquisition.',
 'Absence of overlap never confirms free-agent availability.'],
 coverage,rows};
const path='data-integrity/faab-timestamp-ownership-conflict-screen-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report,'Transaction-time overlap screen stale');
else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('Transaction-time FAAB screen:',rows.length,'claims;',coverage.reduce((n,x)=>n+x.claimsWithEarlierOtherTeamOverlap,0),'potential ownership overlaps');
