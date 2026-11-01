// End-to-end 2026 provider/archive parity. Research-only; never certifies provider completeness.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/acquisitions_2026.json');
const receipts=read('data-integrity/faab-provider-receipts-2026.json');
const archived=new Map(archive.weeks.flatMap(w=>w.tx.map(t=>[String(t.id),t])));
const certifiedBids=new Map(receipts.receipts.map(t=>[String(t.id),t]));
assert.deepEqual(archive.weeks.map(w=>w.week),[1,2,3,4,5,6],'Acquisition coverage changed; re-review historical gate');
assert.deepEqual(receipts.weeks.map(w=>w.week),[1,2,3,4,5,6,7],'Certified receipt coverage changed; re-review historical gate');
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
  if(t.type==='waiver'&&week<=7){
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
   if(week===8)uncertifiedSpend+=t.faabBid;
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
 if(week<=6)assert.equal(missing,0,'Archived historical week missing provider acquisitions '+week);
 else assert.equal(matched,0,'Weeks 7-8 archive cutoff changed without source-gate re-review '+week);
 rows.push({week,providerTransactions:s.transactions.length,completedAcquisitions:completedAdds,archivedAcquisitions:matched,missingArchiveAcquisitions:missing,winningWaivers,winningBidTotal:winningSpend,faabReceiptCoverage:week<=7?'reconciled_source_receipts':'recovered_sample_not_certified',providerCompleteness:'not_verified'});
}
assert.equal(visitedArchived.size,archived.size,'Archived 2026 acquisition lacking matching recovered provider transaction');
assert.equal(visitedReceipts.size,certifiedBids.size,'Certified 2026 waiver receipt lacking matching provider transaction');
assert.equal(allMatched,112,'Verified 2026 acquisition baseline changed; review source coverage');
assert.equal(allMissing,20,'Week 7-8 missing acquisition count changed; reconcile before import');
assert.equal(uncertifiedSpend,10,'Week 8 winning bid sample changed; do not silently certify');
console.log('2026 ACQUISITION SOURCE PARITY (research-only): '+JSON.stringify(rows));
console.log('Source coverage gate: '+allMatched+' archived acquisitions reconciled; '+allMissing+' Week 7-8 acquisitions not yet imported; $'+uncertifiedSpend+' Week 8 winning bids excluded from certified FAAB totals.');
