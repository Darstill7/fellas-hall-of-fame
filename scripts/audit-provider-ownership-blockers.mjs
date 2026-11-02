// Audit historical ownership blockers directly from recovered provider transactions.
// Research inventory; never infer a free-agent pool from an absent owner.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const seasons=[2020,2021,2022,2023,2024,2025,2026];
const rows=[];
for(const year of seasons){
 const expected=year===2026?8:18;
 let recovered=0,transactions=0,complete=0,trades=0,tradesWithoutExplicitSides=0,tiedTransactions=0;
 let bidKnown=0,bidUnknown=0,waiverWins=0;
 const seenIds=new Set(),all=[];
 for(let week=1;week<=expected;week++){
  const path='data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json';
  if(!fs.existsSync(path))continue;
  recovered++;
  const payload=read(path);
  assert.equal(payload.year,year);
  assert.equal(payload.week,week);
  for(const tx of payload.transactions??[]){
   assert.ok(!seenIds.has(tx.transactionId),'Duplicate provider transaction '+year+'/'+tx.transactionId);
   seenIds.add(tx.transactionId);
   transactions++;
   if(tx.status!=='complete')continue;
   complete++;
   if(tx.type==='trade'){
    trades++;
    // A list of participating roster IDs does not identify each player's destination.
    if(!(tx.added??[]).every(p=>p.recipientRosterId!=null) || !(tx.dropped??[]).every(p=>p.recipientRosterId!=null))tradesWithoutExplicitSides++;
   }
   if(tx.type==='waiver'){
    waiverWins++;
    if(Number.isInteger(tx.faabBid)&&tx.faabBid>=0)bidKnown++;
    else bidUnknown++;
   }
   all.push(tx);
  }
 }
 const counts=new Map();
 for(const tx of all)if(Number.isFinite(tx.timestamp))counts.set(tx.timestamp,(counts.get(tx.timestamp)||0)+1);
 tiedTransactions=all.filter(tx=>counts.get(tx.timestamp)>1).length;
 rows.push({year,expectedWeeks:expected,recoveredWeeks:recovered,providerTransactions:transactions,
  completedTransactions:complete,completedTrades:trades,tradesWithoutVerifiedPlayerDestinations:tradesWithoutExplicitSides,
  completedTransactionsAtTiedTimestamp:tiedTransactions,completedWaivers:waiverWins,
  completedWaiversWithKnownBid:bidKnown,completedWaiversWithoutKnownBid:bidUnknown,
  draftBaselineCertified:false,fullFreeAgentAvailabilityCertified:false});
}
assert.equal(rows.length,7);
for(const x of rows){
 assert.ok(x.recoveredWeeks<=x.expectedWeeks);
 assert.equal(x.completedWaivers,x.completedWaiversWithKnownBid+x.completedWaiversWithoutKnownBid);
 assert.ok(x.tradesWithoutVerifiedPlayerDestinations<=x.completedTrades);
}
console.log('Provider ownership blockers (research-only):');
console.log(JSON.stringify(rows,null,2));
