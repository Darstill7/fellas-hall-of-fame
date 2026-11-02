// Explain why completed acquisition receipts fail to form a clean ownership interval.
// Preserve exact provider references and avoid promoting observation to verified ownership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ownershipTimestampConflicts,ambiguousPlayerIds} from './faab-timestamp-conflicts.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const queue=read('data-integrity/faab-claim-investigation-queue-v1.json');
assert.equal(queue.status,'source_backed_claim_triage_no_certified_skill');
const byYear=new Map(),results=[],coverage=[];
for(let year=2020;year<=2026;year++){
 const tx=[];
 for(let week=1;week<=(year===2026?8:18);week++){
  const path='data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
  tx.push(...read(path).transactions);
 }
 const counts=ownershipTimestampConflicts(tx);
 const ids=new Map();
 for(const t of tx){
  const k=String(t.transactionId);
  assert.ok(!ids.has(k),'Duplicate provider transaction: '+year+'/'+k);
  ids.set(k,t);
 }
 byYear.set(year,{ids,counts,tx});
}
for(const row of queue.rows){
 const context=byYear.get(row.year);
 const t=context.ids.get(row.transactionId);
 assert.ok(t,'Missing provider receipt '+row.year+'/'+row.transactionId);
 assert.equal(t.status,'complete');
 assert.ok((t.added??[]).some(p=>String(p.id)===row.playerId));
 const conflicts=ambiguousPlayerIds(t,context.counts);
 const added=(t.added??[]).some(p=>String(p.id)===row.playerId);
 const dropped=(t.dropped??[]).some(p=>String(p.id)===row.playerId);
 const ids=(t.teamIds??[]).map(String);
 const blockers=[];
 if(t.type==='trade')blockers.push('trade_player_destination_unverified');
 if(ids.length!==1)blockers.push('claim_team_not_unique');
 if(added&&dropped)blockers.push('same_transaction_add_drop');
 if(conflicts.has(row.playerId))blockers.push('same_timestamp_same_player_conflict');
 const intervalShouldExist=t.type!=='trade'&&ids.length===1&&added&&!dropped&&!conflicts.has(row.playerId);
 if(row.issues.includes('missing_event_bounded_interval')&&intervalShouldExist)
  blockers.push('interval_join_requires_review');
 const nextEvents=context.tx.filter(x=>x.status==='complete'&&String(x.transactionId)!==row.transactionId&&
   [...(x.added??[]),...(x.dropped??[])].some(p=>String(p.id)===row.playerId)&&
   Number.isFinite(x.timestamp)&&Number.isFinite(t.timestamp)&&x.timestamp>=t.timestamp)
  .sort((a,b)=>a.timestamp-b.timestamp||String(a.transactionId).localeCompare(String(b.transactionId)));
 results.push({...row,providerType:t.type,providerTimestamp:t.timestamp,
  ownerIntervalStartCandidate:intervalShouldExist,sourceBlockers:blockers,
  nextObservedPlayerEvent:nextEvents.length?{transactionId:String(nextEvents[0].transactionId),
   week:nextEvents[0].week,type:nextEvents[0].type,timestamp:nextEvents[0].timestamp}:null,
  ownershipContinuousCertified:false,preclaimAvailabilityCertified:false});
}
for(let year=2020;year<=2026;year++){
 const items=results.filter(r=>r.year===year);
 coverage.push({year,investigations:items.length,missingInterval:items.filter(r=>r.issues.includes('missing_event_bounded_interval')).length,
  sameTimestampSamePlayerConflicts:items.filter(r=>r.sourceBlockers.includes('same_timestamp_same_player_conflict')).length,
  intervalJoinReview:items.filter(r=>r.sourceBlockers.includes('interval_join_requires_review')).length,
  unresolvedManager:items.filter(r=>r.manager===null).length});
}
const report={schema:'fellas-faab-provider-investigation-diagnostics-v1',
 status:'provider_diagnostics_research_only_not_certified_ownership',
 limitations:['Only completed recovered player events establish potential boundaries; missing draft and trade-side evidence remains unknown.',
  'The weekly roster crosscheck reuses scored roster evidence from acquisition outcomes; it is a consistency check, not an independent validation.',
  'Source blockers never prove that an unobserved alternative was claimable.'],
 coverage,rows:results};
const path='data-integrity/faab-provider-investigation-diagnostics-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),report,'Provider investigation report stale');
else fs.writeFileSync(path,JSON.stringify(report,null,2)+'\n');
console.log('Provider FAAB investigations:',results.length,'claim reviews; interval join flags',coverage.reduce((n,x)=>n+x.intervalJoinReview,0));
