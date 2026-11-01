// Audit current-year source parity without upgrading partial provider samples to certified data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const archive=read('data/acquisitions_2026.json');
const receipts=read('data-integrity/faab-provider-receipts-2026.json');
const archived=new Map(archive.weeks.flatMap(w=>w.tx.map(t=>[String(t.id),t])));
const certifiedBids=new Map(receipts.receipts.map(t=>[String(t.id),t]));
const coveredAcquisitionWeeks=new Set(archive.weeks.map(w=>w.week));
const certifiedWeeks=new Set(receipts.weeks.map(w=>w.week));
assert.deepEqual([...coveredAcquisitionWeeks],[1,2,3,4,5,6]);
assert.deepEqual([...certifiedWeeks],[1,2,3,4,5,6,7]);
let missingAdditions=0,matchedAdditions=0,winningWaivers=0,unverifiedWinningBids=0;
const results=[];
for(const week of [6,7,8]){
 const source=read('data-integrity/provider-recovered-transactions-2026-week'+week+'.json');
 assert.equal(source.week,week);
 assert.equal(source.coverageStatus,'provider_week_sample_not_crosschecked_for_completeness');
 assert.equal(source.reportedRows,source.transactions.length);
 const seen=new Set();
 let matched=0,missing=0,waiverSpend=0,waiverWins=0;
 for(const t of source.transactions){
  const id=String(t.transactionId);
  assert.ok(!seen.has(id),'Repeated provider transaction '+week+'/'+id);seen.add(id);
  assert.equal(t.week,week);
  assert.ok(['add','waiver','drop','trade'].includes(t.type),'Unknown transaction type '+id);
  const stored=archived.get(id);
  const receipt=certifiedBids.get(id);
  if(t.type==='waiver'&&certifiedWeeks.has(week)){
   assert.ok(receipt,'Missing certified waiver receipt '+week+'/'+id);
   assert.equal(receipt.status,t.status,'Waiver status mismatch '+id);
   assert.equal(receipt.bid,t.faabBid,'Waiver bid mismatch '+id);
   assert.deepEqual(receipt.rosterIds.map(String).sort(),t.teamIds.map(String).sort(),'Waiver roster mismatch '+id);
   assert.deepEqual(receipt.playerIds.map(String).sort(),t.added.map(p=>String(p.id)).sort(),'Waiver player mismatch '+id);
  }
  if(t.type==='waiver'&&t.status==='complete'){
   waiverWins++;winningWaivers++;
   assert.ok(Number.isSafeInteger(t.faabBid)&&t.faabBid>=0,'Unverified successful waiver bid '+id);
   waiverSpend+=t.faabBid;
   if(!certifiedWeeks.has(week))unverifiedWinningBids+=t.faabBid;
  }
  if(t.status==='complete'&&['add','waiver'].includes(t.type)){
   if(stored){
    assert.equal(stored.week,week,'Acquisition week mismatch '+id);
    assert.equal(stored.type,t.type,'Acquisition type mismatch '+id);
    assert.deepEqual(stored.teamIds.map(String).sort(),t.teamIds.map(String).sort(),'Acquisition roster mismatch '+id);
    assert.deepEqual(stored.players.map(p=>String(p.id)).sort(),t.added.map(p=>String(p.id)).sort(),'Acquisition player mismatch '+id);
    matched++;matchedAdditions++;
   }else{missing++;missingAdditions++;}
  }else assert.ok(!stored,'Non-acquisition transaction in completed archive '+id);
 }
 if(coveredAcquisitionWeeks.has(week))assert.equal(missing,0,'Completed archived week has missing provider acquisitions '+week);
 else assert.equal(matched,0,'Newer acquisitions require explicit archive and verification gate update '+week);
 results.push({week,providerRows:source.transactions.length,archivedCompletedAdds:matched,unarchivedCompletedAdds:missing,winningWaivers:waiverWins,winningBids:waiverSpend,certifiedWaiverReceipts:certifiedWeeks.has(week),providerCompletenessVerified:false});
}
assert.equal(matchedAdditions,20,'Week 6 archive baseline changed');
assert.equal(missingAdditions,20,'Weeks 7-8 acquisition gap changed; reconcile before changing cutoff');
assert.equal(winningWaivers,21,'Weeks 6-8 winning waiver count changed');
assert.equal(unverifiedWinningBids,10,'Week 8 unverified receipt total changed');
console.log('2026 ACQUISITION SOURCE PARITY (research-only): '+JSON.stringify(results));
console.log('2026 source gate: 20 archived Week 6 additions verified; 20 Week 7-8 provider additions absent from archive; $10 in Week 8 winning bids excluded from certified spend.');
