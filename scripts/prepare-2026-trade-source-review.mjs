// Assemble the original Sleeper trade payloads for a source-only commissioner PR.
// Does NOT mark receipts approved or update the public Trade Museum.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const norm=JSON.parse(fs.readFileSync('data-integrity/trade-recovery/2026-weeks1-12-provider-review-20261123.json','utf8'));
const review=JSON.parse(fs.readFileSync('data-integrity/trade-recovery/2026-week11-precertification-20261123.json','utf8'));
assert.equal(norm.status,'RESEARCH_ONLY_NOT_CERTIFIED');
assert.equal(review.status,'PENDING_COMMISSIONER_REVIEW_NOT_PUBLISHABLE');
assert.equal(norm.league_id,'1340027406009761792');
const candidateWeek=11,league=norm.league_id;
const api=async week=>{
 const r=await fetch('https://api.sleeper.app/v1/league/'+league+'/transactions/'+week,{signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('Sleeper Week '+week+' HTTP '+r.status);
 const rows=await r.json();
 if(!Array.isArray(rows))throw Error('Week '+week+' must be a transaction array');
 return rows.filter(t=>t.type==='trade'&&t.status==='complete').map(t=>({
  week,transaction_id:String(t.transaction_id),roster_ids:t.roster_ids,
  adds:t.adds||{},drops:t.drops||{},draft_picks:t.draft_picks||[],
  waiver_budget:t.waiver_budget||[],created:t.created||null,status_updated:t.status_updated||null
 }));
};
const weeks=await Promise.all(Array.from({length:candidateWeek+1},(_,w)=>api(w)));
const trades=weeks.flat().sort((a,b)=>a.week-b.week||a.transaction_id.localeCompare(b.transaction_id));
const seen=new Set();
for(const t of trades){
 assert.match(t.transaction_id,/^\d+$/,'Invalid Sleeper ID');
 assert(!seen.has(t.transaction_id),'Duplicate provider ID: '+t.transaction_id);
 seen.add(t.transaction_id);
}
const snap=norm.trades.filter(t=>t.week<=candidateWeek);
assert.equal(trades.length,snap.length,'New or missing provider trade: re-review normalized source first');
const byId=new Map(trades.map(t=>[t.transaction_id,t]));
for(const t of snap){
 const raw=byId.get(t.id);assert(raw,'Missing normalized ID '+t.id);
 assert.equal(t.week,raw.week);
 assert.deepEqual(new Set(t.participants.map(s=>s.roster_id)),new Set(raw.roster_ids.map(Number)));
 const recordedReceived=new Map(),recordedSent=new Map();
 for(const side of t.participants){
  for(const p of side.received)recordedReceived.set(p.player_id,side.roster_id);
  for(const p of side.sent)recordedSent.set(p.player_id,side.roster_id);
 }
 assert.deepEqual(Object.keys(raw.adds).sort(),[...recordedReceived.keys()].sort());
 assert.deepEqual(Object.keys(raw.drops).sort(),[...recordedSent.keys()].sort());
 for(const [player,to] of recordedReceived)assert.equal(Number(raw.adds[player]),to,'Recipient mismatch '+player);
 for(const [player,from] of recordedSent)assert.equal(Number(raw.drops[player]),from,'Sender mismatch '+player);
 const budgets=raw.waiver_budget;
 for(const side of t.participants){
  const got=budgets.filter(b=>Number(b.receiver)===side.roster_id).reduce((s,b)=>s+Number(b.amount),0);
  const gave=budgets.filter(b=>Number(b.sender)===side.roster_id).reduce((s,b)=>s+Number(b.amount),0);
  if(side.faab_acquired!==null)assert.equal(got,side.faab_acquired,'FAAB received mismatch '+t.id);
  if(side.faab_gave_up!==null)assert.equal(gave,side.faab_gave_up,'FAAB given mismatch '+t.id);
 }
}
assert.equal(review.trades.length,6,'Six reviewed missing transactions expected');
for(const cert of review.trades){
 const original=byId.get(cert.transaction_id);assert(original,'Missing commissioner review ID '+cert.transaction_id);
 assert.equal(cert.week,original.week);
 assert.equal(original.draft_picks.length,0,'Draft-pick component requires separate review '+cert.transaction_id);
 assert.deepEqual(new Set(cert.sides.map(s=>s.roster_id)),new Set(original.roster_ids.map(Number)));
 const covered=new Set();
 for(const side of cert.sides){
  for(const asset of side.assets){
   assert.equal(Number(original.adds[asset.player_id]),side.roster_id,'Wrong receiving side '+cert.transaction_id);
   assert(!covered.has(asset.player_id));covered.add(asset.player_id);
  }
 }
 assert.deepEqual([...covered].sort(),Object.keys(original.adds).sort(),'Missing received asset '+cert.transaction_id);
}
const rawPath='data-integrity/sleeper-sync-candidates/2026-trades-through-week11.json';
const certPath='data-integrity/trade-certifications/2026-week11.json';
fs.mkdirSync('data-integrity/sleeper-sync-candidates',{recursive:true});
fs.mkdirSync('data-integrity/trade-certifications',{recursive:true});
fs.writeFileSync(rawPath,JSON.stringify({
 schema:'fellas-sleeper-raw-trade-review-v1',
 status:'REVIEW_REQUIRED',year:2026,league,through_week:candidateWeek,
 source:'Original Sleeper public API complete transaction payloads, weeks 0-11, re-checked against normalized reviewed IDs',
 collected_at:new Date().toISOString(),
 caveats:['This is a raw source review, not commissioner-approved publication','2026 Week 12 and future trades not included','Player display names and FAAB/keeper implications require commissioner signoff'],
 trades
},null,2)+'\n');
const approvalDraft={
 schema:'fellas-trade-museum-certification-v1',
 status:'REVIEW_REQUIRED',year:2026,through_week:candidateWeek,raw_candidate:rawPath,
 reviewed_receipts_source:'data-integrity/trade-recovery/2026-week11-precertification-20261123.json',
 commissioner_comment:'Commissioner confirmed six displayed exchanges match understanding on November 23, 2026; official trade release not yet authorized',
 trades:review.trades.map(c=>{
  const raw=byId.get(c.transaction_id);
  const budget=raw.waiver_budget;
  return {transaction_id:c.transaction_id,week:c.week,date:c.date,
   faab_reviewed:false,
   faab_receipt:budget,
   faab_transfers:budget.map(x=>({sender:x.sender,receiver:x.receiver,amount:x.amount})),
   sides:c.sides.map(s=>({
    roster_id:s.roster_id,manager:s.manager,
    assets:s.assets.map(a=>({player_id:a.player_id,name:a.name}))
   }))
  };
 })
};
fs.writeFileSync(certPath,JSON.stringify(approvalDraft,null,2)+'\n');
console.log('PREPARED SOURCE-ONLY REVIEW: '+trades.length+' complete raw IDs, 6 missing-trade certificates (status REVIEW_REQUIRED), raw FAAB entries: '+trades.reduce((s,t)=>s+t.waiver_budget.length,0)+'. No public changes.');
