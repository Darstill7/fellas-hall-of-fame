// End-to-end 2026 provider/archive parity. Research-only; never certifies provider completeness.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/acquisitions_2026.json');
const receipts=read('data-integrity/faab-provider-receipts-2026.json');
const archived=new Map(archive.weeks.flatMap(w=>w.tx.map(t=>[String(t.id),t])));
const certifiedBids=new Map(receipts.receipts.map(t=>[String(t.id),t]));
const canonical=read('data/unified_record_book_2016_2026.json');
const latestWeek=Math.max(...canonical.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
const currentWeeks=Array.from({length:latestWeek},(_,i)=>i+1);
assert.deepEqual(archive.weeks.map(w=>w.week),currentWeeks,'Acquisition ledger must cover all finalized weeks');
assert.deepEqual(receipts.weeks.map(w=>w.week),currentWeeks,'Certified FAAB receipts must cover all finalized weeks');
assert.equal(archived.size,archive.weeks.reduce((n,w)=>n+w.tx.length,0),'Duplicate archived acquisition IDs');
assert.equal(certifiedBids.size,receipts.receipts.length,'Duplicate certified receipt IDs');
const ids=new Set(),visitedArchived=new Set(),visitedReceipts=new Set(),rows=[];
let allMatched=0,allMissing=0,uncertifiedSpend=0;
for(let week=1;week<=8;week++){
 const s=read('data-integrity/provider-recovered-transactions-2026-week'+week+'.json');
 assert.equal(s.year,2026);assert.equal(s.week,week);
 assert.equal(s.reportedRows,s.transactions.length);
 assert.equal(s.normalizedRows,s.transactions.length);
 assert.equal(s.coverageStatus,'provider_week_sample_not_crosschecked_for_completeness','Provider completeness state changed; manual review required');
 let completedAdds=0,matched=0,missing=0,winningWaivers=0,winningSpend=0;
 for(const t of s.transactions){
  const id=String(t.transactionId);
  assert.ok(!ids.has(id),'Duplicate cross-week provider transaction '+id);ids.add(id);
  assert.equal(t.week,week,'Wrong provider event week '+id);
  assert.ok(['add','waiver','drop','trade'].includes(t.type),'Unexpected provider type '+id);
  assert.ok(['complete','failed'].includes(t.status),'Unexpected provider status '+id);
  assert.ok(Array.isArray(t.teamIds)&&Array.isArray(t.added)&&Array.isArray(t.dropped),'Incomplete player/roster arrays '+id);
  if(t.type==='waiver'){
   const receipt=certifiedBids.get(id);
   assert.ok(receipt,'Missing certified waiver receipt '+week+'/'+id);
   visitedReceipts.add(id);
   assert.equal(receipt.week,week,'Wrong receipt week '+id);
   assert.equal(receipt.status,t.status,'Waiver outcome mismatch '+id);
   assert.equal(receipt.bid,t.faabBid,'Waiver bid mismatch '+id);
   assert.deepEqual(receipt.rosterIds.map(String).sort(),t.teamIds.map(String).sort(),'Waiver manager roster mismatch '+id);
   assert.deepEqual(receipt.playerIds.map(String).sort(),t.added.map(p=>String(p.id)).sort(),'Waiver player mismatch '+id);
  }
  if(t.type==='waiver'&&t.status==='complete'){
   assert.ok(Number.isSafeInteger(t.faabBid)&&t.faabBid>=0,'Invalid winning bid '+id);
   winningWaivers++;winningSpend+=t.faabBid;
   if(week===8)uncertifiedSpend+=t.faabBid; // the standalone recovery SAMPLE remains independently uncertified
  }
  const stored=archived.get(id);
  if(t.status==='complete'&&['add','waiver'].includes(t.type)){
   completedAdds++;
   if(stored){
    visitedArchived.add(id);
    assert.equal(stored.week,week,'Acquisition week mismatch '+id);
    assert.equal(stored.type,t.type,'Acquisition type mismatch '+id);
    assert.deepEqual(stored.teamIds.map(String).sort(),t.teamIds.map(String).sort(),'Acquisition roster mismatch '+id);
    assert.deepEqual(stored.players.map(p=>String(p.id)).sort(),t.added.map(p=>String(p.id)).sort(),'Acquisition player mismatch '+id);
    matched++;allMatched++;
   }else{missing++;allMissing++;}
  }else assert.ok(!stored,'Non-completed acquisition is in archived results '+id);
 }
 assert.equal(missing,0,'Every recovered completed add must appear in the current archive for week '+week);
 rows.push({week,providerTransactions:s.transactions.length,completedAcquisitions:completedAdds,archivedAcquisitions:matched,missingArchiveAcquisitions:missing,winningWaivers,winningBidTotal:winningSpend,faabReceiptCoverage:'reconciled_source_receipts',providerCompleteness:'not_verified'});
}
assert.equal(allMissing,0,'Recovered provider receipts must not be missing from current acquisition archive');
assert.ok(visitedArchived.size<=archived.size,'Provider sample cannot exceed current acquisition archive');
assert.ok(visitedReceipts.size<=certifiedBids.size,'Provider sample cannot exceed full certified receipt universe');
assert.equal(uncertifiedSpend,10,'Week 8 winning bid sample changed; do not silently certify');
// Staged Week 7 event identities are immutable source observations, not public acquisition grades.
const staging=read('data-integrity/2026-week7-acquisition-staging-v1.json');
assert.equal(staging.status,'original_provider_receipts_reconciled_projection_not_published');
assert.equal(staging.publicAcquisitionArchiveUpdated,false);
assert.equal(staging.providerCompleteness,'not_independently_certified');
const provider7=read('data-integrity/provider-recovered-transactions-2026-week7.json');
const expected7=provider7.transactions.filter(t=>t.status==='complete'&&['add','waiver'].includes(t.type));
assert.equal(staging.events.length,expected7.length,'Staged Week 7 event count mismatch');
assert.equal(staging.events.length,11,'Week 7 source baseline changed');
const source7=new Map(expected7.map(t=>[String(t.transactionId),t]));
const staged7=new Set();
for(const e of staging.events){
 const id=String(e.transactionId);assert.ok(!staged7.has(id),'Duplicate staged Week 7 transaction '+id);staged7.add(id);
 const t=source7.get(id);assert.ok(t,'Staged Week 7 event has no provider receipt '+id);
 assert.equal(e.providerWeek,7);assert.equal(e.date,t.date);assert.equal(e.timestamp,t.timestamp);
 assert.equal(e.eventType,t.type);assert.deepEqual(e.teamIds,t.teamIds);
 assert.deepEqual(e.players,t.added);assert.deepEqual(e.dropEvidence,t.dropped);
 assert.equal(e.certifiedWinningBid,t.type==='waiver'?certifiedBids.get(id)?.bid:null,'Staged bid mismatch '+id);
 assert.ok(archived.has(id),'Former Week 7 staging evidence must now match the published candidate acquisition archive '+id);
}
assert.equal(staging.events.filter(e=>e.eventType==='waiver').length,6,'Six certified winning claims expected');
assert.equal(staging.events.filter(e=>e.eventType==='waiver').reduce((n,e)=>n+e.certifiedWinningBid,0),18,'Staged Week 7 certified winning spend mismatch');
console.log('2026 ACQUISITION SOURCE PARITY (research-only): '+JSON.stringify(rows));
console.log('Source coverage gate: '+allMatched+' recovered provider sample acquisitions match current archive; '+allMissing+' missing; Week 8 standalone recovery sample is not completeness-certified, while independent current FAAB receipts extend through Week '+latestWeek+'.');
